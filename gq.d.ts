type SingleOrList<T> = T | T[];

type IFieldType = SingleOrList<number | string | boolean | null | { [key: string]: IFieldType }>;
type ISchemaDefination = Record<string, SingleOrList<IEntity | IField>>;

type IFieldTypeInner = any;
type ISchemaDefinationInner = Record<string, any>;

type IArgumentValue = number | string | boolean | null | { [key: string]: IArgumentValue };
type IArgument = Record<string, IArgumentValue> | null;

type TransferField<T> = 
  T extends (infer V)[]
    ? (
      V extends IEntity<infer S, infer C> ? IEntity<{ [SK in keyof S]: TransferField<TransferField<S[SK]>[]> }, C> : 
      V extends IField<infer FT, infer FC> ? IField<FT[], FC> :
      T
    )
    : (
      T extends IEntity<infer S, infer C> ? IEntity<{ [SK in keyof S]: TransferField<TransferField<S[SK]>> }, C> : 
      T extends IField<infer FT, infer FC> ? IField<FT, FC> :
      T
    );

interface IFieldObject<T extends IFieldTypeInner> {}

type IFieldCollection<T extends Record<string, any>> = {
  [key: number]: unknown;
}

type IEntityObject<S extends ISchemaDefinationInner> = {
  $<F extends keyof S>(...field: F[]): IFieldCollection<{ [R in F]: TransferField<S[R]> }>;
} & {
  [K in keyof S]: TransferField<S[K]>
}

type IEntity<S extends ISchemaDefinationInner = any, C extends IArgument = null> = (IEntityObject<S>) & ((argument: C) => IEntityObject<S>);

type IField<T extends IFieldTypeInner = any, C extends IArgument = null> = IFieldObject<T> & ((argument: C) => IFieldObject<T>);

export function Entity<Argument extends IArgument = null, S extends ISchemaDefination = ISchemaDefination>(name: string, schema: S): IEntity<S, Argument>;
export function Field<Argument extends IArgument = null, T extends IFieldType = any>(name: string): IField<T, Argument>;

type ExactResult<T extends ValidActionTarget[]> = {
  [K in keyof T]:
    T[K] extends IField<infer F> ? F :
    T[K] extends IFieldCollection<infer C> ? { [CK in keyof C]: C[CK] extends IField<infer F> ? F : unknown } :
    T[K] extends IFieldObject<infer F> ? F :
    unknown;
}

export function registerRequest(request: (graphql: string) => Promise<any>): void

type ValidActionTarget = IField | IFieldCollection<any> | IFieldObject<any>;

export function Action<F extends ValidActionTarget[]>(actionName: string, ...fields: F): ExactResult<F>;

export function Query<F extends ValidActionTarget[]>(...fields: F): ExactResult<F>;
export function Mutation<F extends ValidActionTarget[]>(...fields: F): ExactResult<F>;
