type SingleOrList<T> = T | T[];

type IScaleType = SingleOrList<number | string | boolean | null | { [key: string]: IScaleType }>;
type ISchemaDefination = Record<string, SingleOrList<IEntity | IScale>>;

type IScaleTypeInner = any;
type ISchemaDefinationInner = Record<string, any>;

type IArgumentValue = number | string | boolean | null | { [key: string]: IArgumentValue };
type IArgument = Record<string, IArgumentValue> | null;

type TransferScale<T> = 
  T extends (infer V)[]
    ? (
      V extends IEntity<infer S, infer C> ? IEntity<{ [SK in keyof S]: TransferScale<TransferScale<S[SK]>[]> }, C> : 
      V extends IScale<infer FT, infer FC> ? IScale<FT[], FC> :
      T
    )
    : (
      T extends IEntity<infer S, infer C> ? IEntity<{ [SK in keyof S]: TransferScale<TransferScale<S[SK]>> }, C> : 
      T extends IScale<infer FT, infer FC> ? IScale<FT, FC> :
      T
    );

interface IScaleObject<T extends IScaleTypeInner> {}

type IScaleCollection<T extends Record<string, any>> = {
  [key: number]: unknown;
}

type ScaleKey<T extends ISchemaDefination> = {
  [K in keyof T]: T[K] extends SingleOrList<IEntity> ? never : ( T[K] extends SingleOrList<IScale> ? K : never);
}[keyof T];

type IEntityObject<S extends ISchemaDefinationInner> = {
  $<F extends ScaleKey<S>>(...scale: F[]): IScaleCollection<{ [R in F]: TransferScale<S[R]> }>;
} & {
  [K in keyof S]: TransferScale<S[K]>
}

type IEntity<S extends ISchemaDefinationInner = any, C extends IArgument = null> = (IEntityObject<S>) & ((argument: C) => IEntityObject<S>);

type IScale<T extends IScaleTypeInner = any, C extends IArgument = null> = IScaleObject<T> & ((argument: C) => IScaleObject<T>);

export function Entity<Argument extends IArgument = null, S extends ISchemaDefination = ISchemaDefination>(name: string, schema: S): IEntity<S, Argument>;
export function Scale<Argument extends IArgument = null, T extends IScaleType = any>(name: string): IScale<T, Argument>;

type ExactResult<T extends ValidActionTarget[]> = {
  [K in keyof T]:
    T[K] extends IScale<infer F> ? F :
    T[K] extends IScaleCollection<infer C> ? { [CK in keyof C]: C[CK] extends IScale<infer F> ? F : unknown } :
    T[K] extends IScaleObject<infer F> ? F :
    unknown;
}

export function registerRequest(request: (graphql: string) => Promise<any>): void

type ValidActionTarget = IScale | IScaleCollection<any> | IScaleObject<any>;

export function Action<F extends ValidActionTarget[]>(actionName: string, ...scales: F): ExactResult<F>;

export function Query<F extends ValidActionTarget[]>(...scales: F): ExactResult<F>;
export function Mutation<F extends ValidActionTarget[]>(...scales: F): ExactResult<F>;
