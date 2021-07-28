import { Entity, Field, } from './factory';
import { parse, } from './parse';

function converToFieldObjectList(field: typeof Field) {
  const linkList: any[] = [];
  let current = field;

  while (current) {
    linkList.push(current);
    current = current['#link'];
  }
  return linkList.reverse() as (typeof Entity | typeof Field)[];
}

function encodeFieldObjectToString(fieldObjectList: any[]) {
  const parseBody = {
    type: 'entity',
    name: '',
    argument: null,
    children: [],
  }
  const fieldObjectMap = new Map();
  fieldObjectList.forEach(list => {
    let current: any = parseBody;
    list.forEach((item: any) => {
      if (fieldObjectMap.has(item)) {
        current = fieldObjectMap.get(item);
      } else {
        const { type, name, argument, } = item['#'];
        const obj = {
          type,
          name,
          argument,
          children: [],
        };
        current.children.push(obj);
        fieldObjectMap.set(item, obj);
        current = obj;
      }
    });
  });
  return parse(parseBody as any);
}

export function encode(...fields: any[]) {
  const fieldObjectList = fields.flatMap(v => v).map(converToFieldObjectList);
  return encodeFieldObjectToString(fieldObjectList);
}

export function extract(data: Record<string, any>, ...fields: any[]) {
  return fields
    .map(field => {
      const dir: any[] = [];
      let current = field;
      if (field instanceof Array) {
        dir.push(field.map(item => item['#'].name));
        current = field[0]['#link'];
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

export async function Action(actionName: string, ...fields: any[]) {
  const graphqlStr = [
    actionName,
    encode(...fields),
  ].filter(Boolean).join(' ');

  if (!requestHandle) {
    console.warn('No request handle found, please call "registerRequest" firstly.');
    return [];
  }

  const data = await requestHandle(graphqlStr);
  const res = extract(data, ...fields);
  return res;
}

export const Query = Action.bind(null, 'query');
export const Mutation = Action.bind(null, 'mutation');
