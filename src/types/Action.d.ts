import { IScale, IScaleCollection, IScaleObject, } from './Factory'

type ExactResult<T extends ValidActionTarget[]> = {
  [K in keyof T]:
    T[K] extends IScale<infer F> ? F :
    T[K] extends IScaleCollection<infer C> ? { [CK in keyof C]: C[CK] extends IScale<infer F> ? F : unknown } :
    T[K] extends IScaleObject<infer F> ? F :
    unknown;
}

type ValidActionTarget = IScale | IScaleCollection<any> | IScaleObject<any>;

export function register(request: (graphql: string) => Promise<any>): {
  Query: <F extends ValidActionTarget[]>(...scales: F) => ExactResult<F>,
  Mutation: <F extends ValidActionTarget[]>(...scales: F) => ExactResult<F>,
  Action: <F extends ValidActionTarget[]>(actionName: string, ...scales: F) => ExactResult<F>,
  Excute: <T = any>(graphql: string) => T,
}
