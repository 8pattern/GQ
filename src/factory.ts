type SingleOrList<T> = T & T[];

type SchemaValueType = SingleOrList<any>;
type SchemaDefination = Record<string, SchemaValueType>;

enum FieldType {
  entity = 'Entity',
  scale = 'Scale',
}

function ScaleFactory(name: string, parent: any = null) {
  const metaData = {
    type: FieldType.scale,
    name,
    argument: null,
  };

  const scale = (argument: any) => {
    const obj: any = new Proxy({}, {
      get: (_: any, p: string) => {
        if (p === '#') return { ...metaData, argument, };
        if (p === '#link') return parent;
        return undefined;
      },
    });
    return obj;
  };
  
  const obj: any = new Proxy(scale, {
    get: (_: any, p: string) => {
      if (p === '#type') return FieldType.scale;
      if (p === '#') return { ...metaData, };
      if (p === '#link') return parent;
      return undefined;
    },
  });

  return obj;
}

function EntityFactory(name: string, defination: SchemaDefination, parent: any = null) {
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
  
  const metaData = {
    type: FieldType.entity,
    name,
    argument: null,
    defination,
  };

  const entity = (argument: any) => {
    const obj: any = new Proxy({}, {
      get: (_, p: string) => {
        if (p === '#') return { ...metaData, argument, };
        if (p === '#link') return parent;
        if (p === '$') return (...fields: string[]) => fields.map(item => obj[item])
        if (p in mDefination) {
          const subMetaData = mDefination[p]?.['#'];
          if (subMetaData?.type === FieldType.scale) {
            return ScaleFactory(subMetaData.name, obj);
          }
          if (subMetaData?.type === FieldType.entity) {
            return EntityFactory(subMetaData.name, subMetaData.defination, obj);
          }
          return mDefination[p];
        }
        return undefined;
      },
    });
    return obj;
  };
  
  const _this: any = new Proxy(entity, {
    get: (_, p: string) => {
      if (p === '#type') return FieldType.entity;
      if (p === '#') return { ...metaData, };
      if (p === '#link') return parent;
      if (p === '$') return (...fields: string[]) => fields.map(item => _this[item])
      if (p in mDefination) {
        const subMetaData = mDefination[p]?.['#'];
        if (subMetaData?.type === FieldType.scale) {
          return ScaleFactory(subMetaData.name, _this);
        }
        if (subMetaData?.type === FieldType.entity) {
          return EntityFactory(subMetaData.name, subMetaData.defination, _this);
        }
        return mDefination[p];
      }
      return undefined;
    },
  });

  return _this as any;
}

export function Scale(name: string) {
  return ScaleFactory(name, null);
}

export function Entity(name: string, defination: SchemaDefination) {
  return EntityFactory(name, defination, null);
}
