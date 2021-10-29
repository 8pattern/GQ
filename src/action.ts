import { FieldType, } from './factory';
import { parse, } from './parse';

type IScale = any;
type IScaleCollection = IScale[];
type Request = (graphql: string) => Promise<any>;

enum ExtractMode {
  ignore, scalar, collection,
}

interface ScaleObject {
  type: string;
  name: string;
  argument: string;
  from: number;
  mode?: ExtractMode;
}

enum ScaleMatchStatus {
  different, conflict, same,
}

type ScaleObjectTree = (ScaleObject | ScaleObjectTree[])[];
type ScaleObjectChain = ScaleObject[];

type QueryObject = {
  str?: string;
  source: ScaleObjectChain[];
  data?: any;
}

function getScaleObject(scale: any, from: number, mode: ExtractMode) {
  const { type, name, argument, } = scale['#'];
  return { type, name, argument, from, mode, };
}

function scale2Tree(scale: IScale | IScaleCollection, from: number, mode: ExtractMode | null = null, endCondition: ((scale: any) => boolean) | null = null): ScaleObjectTree {
  let linkList: ScaleObjectTree = [];
  let current = scale['#link'];
  while (current && (!endCondition || !endCondition(current))) {
    linkList.push(getScaleObject(current, from, mode ?? ExtractMode.ignore, ));
    current = current['#link'];
  }
  linkList = linkList.reverse();
  if (scale['#type'] === FieldType.ScaleCollection) {
    const currentTree = (scale as IScaleCollection).map(item => scale2Tree(item, from, mode ?? ExtractMode.collection, (target) => target?.['#link'] === scale['#link']?.['#link']));
    linkList.push(currentTree as ScaleObjectTree[]);
  } else {
    linkList.push(getScaleObject(scale, from, mode ?? ExtractMode.scalar));
  }
  return linkList;
}

function scaleList2Trees(scales: (IScale | IScaleCollection)[]): ScaleObjectTree[] {
  const res = scales.map((item, index) => scale2Tree(item, index, null));
  return res;
}

function tree2ChainList(tree: ScaleObjectTree): ScaleObjectChain[] {
  const chainList: ScaleObjectChain[] = [];
  const parent = tree.slice(0, -1) as ScaleObjectChain;
  const last = tree.slice(-1)[0] as ScaleObject | ScaleObjectTree[];
  if (last instanceof Array) {
    const subChainList = (last as ScaleObjectTree[]).flatMap(tree2ChainList);
    subChainList.forEach(item => {
      chainList.push([...parent, ...item]);
    })
  } else {
    chainList.push([...parent, last]);
  }
  return chainList;
}

function checkScaleMatchStatus(obj: ScaleObject, target: ScaleObject | undefined): ScaleMatchStatus {
  if (!target) return ScaleMatchStatus.different;
  if (obj.name !== target.name) return ScaleMatchStatus.different;
  if (obj.type !== target.type || JSON.stringify(obj.argument) !== JSON.stringify(target.argument)) return ScaleMatchStatus.conflict;
  return ScaleMatchStatus.same;
}

function haveConflictObject(current: ScaleObjectChain, target: ScaleObjectChain) {
  for(let i=0; i < current.length; i++) {
    const status = checkScaleMatchStatus(current[i], target?.[i]);
    if (status === ScaleMatchStatus.conflict) return true;
    if (status === ScaleMatchStatus.different) return false;
  }
  return false;
}

function encode(chains: ScaleObjectChain[], action: string): string {
  const parseBody = {
    type: 'Entity',
    name: '',
    argument: null,
    children: [],
  }
  chains.forEach(chain => {
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
  const queryStr = parse(parseBody as any);
  return [action, queryStr,].filter(Boolean).join(' ');
}

function chainList2QueryObjectList(chains: ScaleObjectChain[], action: string): QueryObject[] {
  const groups: QueryObject[] = [];
  chains.forEach(chain => {
    let isMatched = false;
    for (const group of groups) {
      const isConflict = group.source.some(item => haveConflictObject(chain, item));
      if (!isConflict) {
        isMatched = true;
        group.source.push(chain);
        break;
      }
    }
    if (!isMatched) {
      groups.push({
        source: [ chain, ],
      })
    }
  });
  return groups.map(item => ({
    str: encode(item.source, action),
    source: item.source,
  }));
}

async function fillData(queryObjects: QueryObject[], request: Request): Promise<QueryObject[]> {
  return Promise.all(
    queryObjects.map(item => (
      new Promise<QueryObject>(resolve => {
        if (item.str) {
          const handle = request(item.str);
          if (typeof handle?.then === 'function') {
            handle.then(data => resolve({ ...item, data }));
          } else {
            resolve({ ...item, data: handle })
          }
        } else {
          resolve({ ...item, data: null })
        }
      })
    ))
  );
}

function extractData(data: any, fields: string[], returnObj: boolean): any {
  if (fields.length < 1) return data;
  const [field, ...rest] = fields;
  if (data instanceof Array) {
    return data.map(item => extractData(item, fields, returnObj))
  }
  if (rest.length > 0) {
    if (data && field in data) {
      const res = extractData(data[field], rest, returnObj);
      return returnObj ? { [field]: res } : res;
    } 
  }
  if (data && field in data) {
    const res = data[field] ?? null;
    return returnObj ? { [field]: res } : res;
  }
  return null;
}

function mergeResult(results: any[]): any {
  return results.reduce((pre, cur) => {
    if (cur === undefined) return pre;
    if (pre === undefined) return cur;
    if (pre instanceof Object && cur instanceof Object) {
      Object.entries(cur).forEach(([key, value]) => {
        if (key in pre) {
          pre[key] = mergeResult([pre[key], value]);
        } else {
          pre[key] = value;
        }
      })
      return pre;
    }
    throw new Error(`(GQ) Extract Error: ${JSON.stringify(pre)} and ${JSON.stringify(cur)} can't be merged.`);
  }, undefined);
}

function extract(queryObjectList: QueryObject[]): any[] {
  const resultCollection: any[][] = [];
  for (const queryObject of queryObjectList) {
    queryObject.source.forEach(chain => {
      const resultNo = chain.slice(-1)[0].from;
      const fieldMode = chain.slice(-1)[0].mode;
      resultCollection[resultNo] = resultCollection[resultNo] ?? [];
      if (fieldMode === ExtractMode.scalar) {
        const res = extractData(queryObject.data, chain.map(item => item.name), false);
        resultCollection[resultNo].push(res);
      } else if (fieldMode === ExtractMode.collection) {
        const startFieldIndex = chain.findIndex(item => item.mode === ExtractMode.collection);
        const ignoreFields = chain.slice(0, startFieldIndex).map(item => item.name);
        const res = extractData(
          extractData(queryObject.data, ignoreFields, false),
          chain.slice(startFieldIndex).map(item => item.name),
          true,
        )
        resultCollection[resultNo].push(res);
      }
    });
  }
  const result = resultCollection.map(item => {
    if (item.length === 0) return null; 
    if (item.length === 1) return item[0];
    if (item.every(iitem => iitem === null)) return null;
    if (item.some(iitem => iitem instanceof Array)) {
      const maxLen = Math.max(...item.map(iitem => iitem.length));
      if (maxLen < 1) return null;
      return Array(maxLen).fill('').map((_, index) => mergeResult(item.map(iitem => iitem[index])))
    }
    return mergeResult(item);
  });
  return result;
}

export function register(request: Request): any {
  async function Action(actionName: string, ...scales: (IScale | IScaleCollection)[]): Promise<any[]> {
    const trees = scaleList2Trees(scales);
    const chainList = trees.flatMap(tree2ChainList);
    const queryObjectList = chainList2QueryObjectList(chainList, actionName);
    const queryObjectListWithData = await fillData(queryObjectList, request);
    const res = extract(queryObjectListWithData);
    return res;
  }
  
  const Query = Action.bind(null, 'query');
  const Mutation = Action.bind(null, 'mutation');
  const Excute = request;

  return {
    Query, Mutation, Action, Excute,
  }
}
