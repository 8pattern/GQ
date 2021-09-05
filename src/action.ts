import { Scale, } from './factory';
import { parse, } from './parse';

interface ScaleObject {
  type: string;
  name: string;
  argument: string;
}

enum ScaleMatchStatus {
  different, conflict, same,
}

type ScaleObjectCollection = ScaleObject[]
type ScaleObjectChain = [...ScaleObject[], ScaleObject | ScaleObjectCollection];

function scale2ScaleObject(scale: typeof Scale): ScaleObject {
  const { type, name, argument, } = scale['#'];
  return { type, name, argument, };
}

function scale2ScaleObjectChain(scale: any): ScaleObjectChain {
  const linkList: any[] = [];
  let current = scale;
  if (current instanceof Array) {
    linkList.push(current.map(scale2ScaleObject));
    current = current[0]['#link'];
  }
  while (current) {
    linkList.push(scale2ScaleObject(current));
    current = current['#link'];
  }
  return linkList.reverse() as ScaleObjectChain;
}

function checkScaleMatchStatus(obj: ScaleObject | ScaleObjectCollection, target: ScaleObject | ScaleObjectCollection | undefined): ScaleMatchStatus {
  if (!target) return ScaleMatchStatus.different;
  if (obj instanceof Array) {
    if (target instanceof Array) {
      for(const oItem of obj) {
        for(const tItem of target) {
          const status = checkScaleMatchStatus(oItem, tItem);
          if ([ScaleMatchStatus.different, ScaleMatchStatus.conflict].includes(status)) return ScaleMatchStatus.conflict;
        }
      }
      return ScaleMatchStatus.same;
    }
    return obj.some(oItem => [ScaleMatchStatus.conflict, ScaleMatchStatus.same].includes(checkScaleMatchStatus(oItem, target))) ? ScaleMatchStatus.conflict : ScaleMatchStatus.different;
  }
  if (target instanceof Array) {
    return target.some(tItem => [ScaleMatchStatus.conflict, ScaleMatchStatus.same].includes(checkScaleMatchStatus(obj, tItem))) ? ScaleMatchStatus.conflict : ScaleMatchStatus.different;
  }

  if (obj?.name !== target?.name) return ScaleMatchStatus.different;
  if (obj?.type !== target?.type || JSON.stringify(obj?.argument) !== JSON.stringify(target?.argument)) return ScaleMatchStatus.conflict;
  return ScaleMatchStatus.same;
}

function haveConflictObject(scaleObjectChain: ScaleObjectChain, group: ScaleObjectChain[]) {
  return group.some(targetChain => {
    for(let i=0; i < scaleObjectChain.length; i++) {
      const obj = scaleObjectChain[i];
      const target = targetChain?.[i];
      const status = checkScaleMatchStatus(obj, target);
      if (status === ScaleMatchStatus.conflict) return true;
      if (status === ScaleMatchStatus.different) return false;
    }
    return false;
  })
}

function encodeScaleObjectChainToString(chainGroup: ScaleObjectChain[]) {
  const parseBody = {
    type: 'Entity',
    name: '',
    argument: null,
    children: [],
  }
  chainGroup.forEach(chain => {
    let current: any = parseBody;
    chain.forEach((item) => {
      if (!(item instanceof Array)) {
        const { type, name, argument, } = item;
        const target = current.children.find((item: any) => item.name === name);
        if (target) {
          current = target;
        } else {
          const obj = {
            type,
            name,
            argument,
            children: [],
          };
          current.children.push(obj);
          current = obj;
        }
      } else {
        // Array only exist end of the chain, and won't be conflicted dut to the check before
        item.forEach(iitem => {
          const { type, name, argument, } = iitem;
          current.children.push({
            type,
            name,
            argument,
            children: [],
          });
        });
      }
    });
  });
  return parse(parseBody as any);
}

function encode(scaleObjectChainList: ScaleObjectChain[]): [string[], number[]] {
  const groups: ScaleObjectChain[][] = [];
  const matchGropIndex: number[] = []
  scaleObjectChainList.forEach(chain => {
    let targetGroupIndex = -1;
    groups.some((group, index) => {
      if (targetGroupIndex < 0 && !haveConflictObject(chain, group)) {
        group.push(chain);
        targetGroupIndex = index;
        return true;
      }
      return false;
    });
    if (targetGroupIndex < 0) {
      groups.push([chain]);
      targetGroupIndex = groups.length - 1;
    }
    matchGropIndex.push(targetGroupIndex);
  });
  return [groups.map(encodeScaleObjectChainToString), matchGropIndex];
}

function extract(data: Record<string, any>[], scaleObjectChainList: ScaleObjectChain[], matchGroupItem: number[]) {
  return scaleObjectChainList
    .map((chain, index) => {
      const targetData = data[matchGroupItem[index]];
      return chain.reduce((pre, cur) => {
        if (cur instanceof Array) {
          return Object.fromEntries(
            cur.map(item => [item.name, pre?.[item.name]])
          );
        }
        return pre?.[cur.name];
      }, targetData)
    });
}

type RequestHandle = (graphql: string) => Promise<any>;
let requestHandle: RequestHandle | null = null;
export function registerRequest(handle: RequestHandle | null): void {
  requestHandle = handle
}

export async function Action(actionName: string, ...scales: any[]): Promise<any[]> {
  if (!requestHandle) {
    console.warn('No request handle found, please call "registerRequest" firstly.');
    return [];
  }

  const scaleObjectChainList = scales.map(scale2ScaleObjectChain);
  const [fieldStrList, matchGropIndex] = encode(scaleObjectChainList);
  const graphqlStrList = fieldStrList.map(item => [actionName, item,].filter(Boolean).join(' '));
  const data = await Promise.all(graphqlStrList.map(graphqlStr => (requestHandle as RequestHandle)(graphqlStr)))
  const res = extract(data, scaleObjectChainList, matchGropIndex);
  return res;
}

export const Query = Action.bind(null, 'query');
export const Mutation = Action.bind(null, 'mutation');
