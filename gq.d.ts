type SingleOrList<T> = T | T[];

type IFieldType = number | string | boolean | null | { [key: string]: IFieldType };

type ISchemaDefination = Record<string, SingleOrList<IEntity> | SingleOrList<IField>>;

type IConditionValue = number | string | boolean | null | { [key: string]: IConditionValue };
type ICondition = Record<string, IConditionValue> | null;

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

type IEntity<S extends ISchemaDefination = any, C extends ICondition = null> = (IEntityObject<S>) & ((condition: C) => IEntityObject<S>);

type IField<T extends IFieldType = any, C extends ICondition = null> = (IFieldObject<T>) & ((condition: C) => IFieldObject<T>);

export function Entity<Condition extends ICondition = null, S extends ISchemaDefination = ISchemaDefination>(name: string, schema: S): IEntity<S, Condition>;
export function Field<Condition extends ICondition = null, T extends IFieldType = any>(name: string): IField<T, Condition>;


export function query(...fields: IField[]): void;
export function mutation(): void;