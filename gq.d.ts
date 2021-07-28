type SingleOrList<T> = T | T[];

type IFieldType = SingleOrList<number | string | boolean | null | { [key: string]: IFieldType }>;

type ISchemaDefination = Record<string, SingleOrList<IEntity> | SingleOrList<IField>>;

type IArgumentValue = number | string | boolean | null | { [key: string]: IArgumentValue };
type IArgument = Record<string, IArgumentValue> | null;

type IEntityObject<S extends ISchemaDefination> = {
  $<F extends keyof S>(...field: F[]): {
    [R in F]: S[R]
  };
} & {
  [K in keyof S]:
    S[K] extends (infer V)[]
      ? (
        V extends IEntity<infer ET>
          ? IEntity<{ [SK in keyof ET]: ET[SK][] }>
          : S[K]
      )
      : S[K];
}

type IFieldObject<T extends IFieldType> = T;

type IEntity<S extends ISchemaDefination = any, C extends IArgument = null> = (IEntityObject<S>) & ((argument: C) => IEntityObject<S>);

type IField<T extends IFieldType = any, C extends IArgument = null> = (IFieldObject<T>) & ((argument: C) => IFieldObject<T>);

export function Entity<Argument extends IArgument = null, S extends ISchemaDefination = ISchemaDefination>(name: string, schema: S): IEntity<S, Argument>;
export function Field<Argument extends IArgument = null, T extends IFieldType = any>(name: string): IField<T, Argument>;

export function Action(actionName: string, ...fields: IField[]): void;

export function Query(...fields: IField[]): void;
export function Mutation(...fields: IField[]): void;
