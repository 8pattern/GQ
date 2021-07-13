type SingleOrList<T> = T & T[];

type SchemaValueType = SingleOrList<any>;
type SchemaDefination = Record<string, SchemaValueType>;

enum FieldType {
  entity = 'entity',
  field = 'field',
}

export function Entity(name: string, defination: SchemaDefination) {
  const mDefination = Object.fromEntries(
    Object.entries(defination)
      .map(([key, value]) => {
        let v = value;
        while (v instanceof Array) {
          if (v.length > 1) {
            throw new Error(`Only can define one type in "${key}"`);
          }
          v = v[0];
        }
        return [key, v];
      })
  );
  
  const info = {
    type: FieldType.entity,
    name,
    condition: null,
    defination,
  };

  const entity = (condition: any) => {
    info.condition = condition;
    const obj: any = new Proxy({}, {
      get: (_: any, p: string) => {
        if (p === '#') return info;
        if (p === '$') return (fields: string[]) => fields.map(item => defination[item])
        if (mDefination.hasOwnProperty(p)) {
          const target = mDefination[p as string];
          return new Proxy(target, {
            get(_, pp) {
              if (pp === '#link') return obj;
              return target[pp];
            }
          });
        }
        return undefined;
      },
    });
    return obj;
  };
  
  const obj: any = new Proxy(entity, {
    get: (_: any, p: string) => {
      if (p === '#') return info;
      if (p === '$') return (fields: string[]) => fields.map(item => defination[item])
      if (mDefination.hasOwnProperty(p)) {
        const target = mDefination[p as string];
        return new Proxy(target, {
          get(_, pp) {
            if (pp === '#link') return obj;
            return target[pp];
          }
        });
      }
      return undefined;
    },
  });

  return obj;
}

export function Field(name: string) {
  const info = {
    type: FieldType.field,
    name,
    condition: null,
  };

  const field = (condition: any) => {
    info.condition = condition;
    const obj: any = new Proxy({}, {
      get: (_: any, p: string) => {
        if (p === '#') return info;
        return undefined;
      },
    });
    return obj;
  };
  
  const obj: any = new Proxy(field, {
    get: (_: any, p: string) => {
      if (p === '#') return info;
      return undefined;
    },
  });

  return obj;
}
