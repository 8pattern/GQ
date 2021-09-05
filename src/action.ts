import { Entity, Scale, } from './factory';
import { parse, } from './parse';

function converToScaleObjectList(scale: typeof Scale) {
  const linkList: any[] = [];
  let current = scale;

  while (current) {
    linkList.push(current);
    current = current['#link'];
  }
  return linkList.reverse() as (typeof Entity | typeof Scale)[];
}

function encodeScaleObjectToString(scaleObjectList: any[]) {
  const parseBody = {
    type: 'Entity',
    name: '',
    argument: null,
    children: [],
  }
  const scaleObjectMap = new Map();
  scaleObjectList.forEach(list => {
    let current: any = parseBody;
    list.forEach((item: any) => {
      if (scaleObjectMap.has(item)) {
        current = scaleObjectMap.get(item);
      } else {
        const { type, name, argument, } = item['#'];
        const obj = {
          type,
          name,
          argument,
          children: [],
        };
        current.children.push(obj);
        scaleObjectMap.set(item, obj);
        current = obj;
      }
    });
  });
  return parse(parseBody as any);
}

export function encode(...scales: any[]) {
  const scaleObjectList = scales.flatMap(v => v).map(converToScaleObjectList);
  return encodeScaleObjectToString(scaleObjectList);
}

export function extract(data: Record<string, any>, ...scales: any[]) {
  return scales
    .map(scale => {
      const dir: any[] = [];
      let current = scale;
      if (scale instanceof Array) {
        dir.push(scale.map(item => item['#'].name));
        current = scale[0]['#link'];
      }
      while (current) {
        dir.push(current['#'].name);
        current = current['#link'];
      }
      return dir.reverse();
    })
    .map(dir => (
      dir.reduce((pre, cur) => {
        if (cur instanceof Array) {
          return Object.fromEntries(
            cur.map(item => [item, pre?.[item]])
          );
        }
        return pre?.[cur];
      }, data)
    ));
}

type RequestHandle = (graphql: string) => Promise<any>;
let requestHandle: RequestHandle | null = null;
export function registerRequest(handle: RequestHandle) {
  requestHandle = handle
}

export async function Action(actionName: string, ...scales: any[]) {
  const graphqlStr = [
    actionName,
    encode(...scales),
  ].filter(Boolean).join(' ');

  if (!requestHandle) {
    console.warn('No request handle found, please call "registerRequest" firstly.');
    return [];
  }

  const data = await requestHandle(graphqlStr);
  const res = extract(data, ...scales);
  return res;
}

export const Query = Action.bind(null, 'query');
export const Mutation = Action.bind(null, 'mutation');
