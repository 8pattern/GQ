type SingleOrList<T> = T | T[];

type IFieldType = number | string | boolean | null | { [key: string]: IFieldType };

type ISchemaDefination = Record<string, SingleOrList<IEntity> | SingleOrList<IField>>;

type ISchemaConditionValue = number | string | boolean | null | { [key: string]: ISchemaConditionValue };
type ISchemaCondition = Record<string, ISchemaConditionValue> | null;

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
          : (
            V extends IField<infer FT>
              ? FT[]
              : S[K][]
          )
      )
      : (
        S[K] extends IEntity<infer ET>
          ? S[K]
          : (
            S[K] extends IField<infer FT>
              ? FT
              : S[K]
          )
      );
}

type IEntity<S extends ISchemaDefination = any, C extends ISchemaCondition = null> = (IEntityObject<S>) & ((condition: C) => IEntityObject<S>);

interface IField<T extends IFieldType = any> {}

export function Entity<Condition extends ISchemaCondition = null, S extends ISchemaDefination = ISchemaDefination>(name: string, schema: S): IEntity<S, Condition>;
export function Field<T extends IFieldType>(name: string): IField<T>;


export function query(...fields: IField[]): void;
export function mutation(): void;