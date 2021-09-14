type SingleOrList<T> = T & T[];

type SchemaValueType = SingleOrList<any>;
type SchemaDefination = Record<string, SchemaValueType>;

export enum FieldType {
  Entity = 'Entity',
  Scale = 'Scale',
  ScaleCollection = 'ScaleCollection',
}

function ScaleFactory(name: string, parent: any = null) {
  const metaData = {
    type: FieldType.Scale,
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
      if (p === '#type') return FieldType.Scale;
      if (p === '#') return { ...metaData, };
      if (p === '#link') return parent;
      return undefined;
    },
  });

  return obj;
}

function ScaleCollectionFactory(scales: any[]) {
  const type = FieldType.ScaleCollection;
  return new Proxy(scales, {
    get: (target, p: string) => {
      if (p === '#') return { type, };
      if (p === '#type') return type;
      return target[p];
    }
  })
}

function EntityFactory(name: string, defination: SchemaDefination, parent: any = null) {
  const mDefination = Object.fromEntries(
    Object.entries(defination)
      .map(([key, value]) => {
        let v = value;
        while (v instanceof Array) {
          if (v.length > 1) {
            throw new Error(`Only one type can be defined in "${key}"`);
          }
          v = v[0];
        }
        return [key, v];
      })
  );
  
  const metaData = {
    type: FieldType.Entity,
    name,
    argument: null,
    defination,
  };

  const entity = (argument: any) => {
    const obj: any = new Proxy({}, {
      get: (_, p: string) => {
        if (p === '#') return { ...metaData, argument, };
        if (p === '#link') return parent;
        if (p === '$') return (...fields: string[]) => ScaleCollectionFactory(fields.map(item => obj[item]))
        if (p in mDefination) {
          let target = mDefination[p];
          if (![FieldType.Entity, FieldType.Scale].includes(target?.['#']?.type) && target instanceof Function) {
            const r = target();
            if (r?.['#']?.type !== FieldType.Entity) {
              console.warn(`Only Entity needs a function defination in "${p}", consider replacing it without function`);
            }
            target = r;
          }
          const subMetaData = target?.['#'];
          if (subMetaData?.type === FieldType.Scale) {
            return ScaleFactory(subMetaData.name, obj);
          }
          if (subMetaData?.type === FieldType.Entity) {
            return EntityFactory(subMetaData.name, subMetaData.defination, obj);
          }
          return target;
        }
        return undefined;
      },
    });
    return obj;
  };
  
  const _this: any = new Proxy(entity, {
    get: (_, p: string) => {
      if (p === '#type') return FieldType.Entity;
      if (p === '#') return { ...metaData, };
      if (p === '#link') return parent;
      if (p === '$') return (...fields: string[]) => ScaleCollectionFactory(fields.map(item => _this[item]));
      if (p in mDefination) {
        let target = mDefination[p];
        if (![FieldType.Entity, FieldType.Scale].includes(target?.['#']?.type) && target instanceof Function) {
          const r = target();
          if (r?.['#']?.type !== FieldType.Entity) {
            console.warn(`Only Entity needs a function defination in "${p}", please check it.`);
          }
          target = r;
        }
        const subMetaData = target?.['#'];
        if (subMetaData?.type === FieldType.Scale) {
          return ScaleFactory(subMetaData.name, _this);
        }
        if (subMetaData?.type === FieldType.Entity) {
          return EntityFactory(subMetaData.name, subMetaData.defination, _this);
        }
        return target;
      }
      return undefined;
    },
  });

  return _this as any;
}

export function Scale(name: string): any {
  return ScaleFactory(name, null);
}

export function Entity(name: string, defination: SchemaDefination): any {
  return EntityFactory(name, defination, null);
}
