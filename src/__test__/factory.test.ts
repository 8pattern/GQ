import { Entity, Field } from '../factory';

describe('Field', () => {
  const field = Field('fieldName');

  test('Private properties are right', () => {
    expect(field['#'].type).toBe('field');
    expect(field['#'].name).toBe('fieldName');
  });

  test('Factory generates a function handle, which can be asigned by arguments', () => {
    expect(field).toBeInstanceOf(Function);

    const argument = {};
    const fieldWithArgument = field(argument);
    expect(fieldWithArgument['#'].type).toBe('field');
    expect(fieldWithArgument['#'].name).toBe('fieldName');
    expect(fieldWithArgument['#'].argument).toBe(argument);
  });
});

describe('Entity', () => {
  test('Private properties are right', () => {
    const defination = {};
    const entity = Entity('entityName', defination);
    expect(entity['#'].type).toBe('entity');
    expect(entity['#'].name).toBe('entityName');
  });

  test('Factory generates a function handle, which can be asigned by arguments', () => {
    const defination = {};
    const entity = Entity('entityName', defination);
    expect(entity).toBeInstanceOf(Function);

    const argument = {};
    const entityWithArgument = entity(argument);
    expect(entityWithArgument['#'].type).toBe('entity');
    expect(entityWithArgument['#'].name).toBe('entityName');
    expect(entityWithArgument['#'].defination).toBe(defination);
    expect(entityWithArgument['#'].argument).toBe(argument);
  });

  describe('Get property in the defination', () => {
    test('Field type', () => {
      const field = Field('field');
      const entity = Entity('', {
        f1: field,
        f2: [field],
      }) as any;
      expect(entity.f1['#'].name).toEqual('field');
      expect(entity.f2['#'].name).toEqual('field');
      
      const entityWithArgument = entity({}) as any;
      expect(entityWithArgument.f1['#'].name).toEqual('field');
      expect(entityWithArgument.f2['#'].name).toEqual('field');
    });

    test('Entity type', () => {
      const f = Field('field');
      const e = Entity('entity', {
        f1: f,
        f2: [f],
      });
      const entity = Entity('', {
        e1: e,
        e2: [e],
      }) as any;
      expect(entity.e1['#'].name).toBe('entity');
      expect(entity.e2['#'].name).toBe('entity');
      expect(entity.e1.f1['#'].name).toBe('field');
      expect(entity.e1.f2['#'].name).toBe('field');
      expect(entity.e2.f1['#'].name).toBe('field');
      expect(entity.e2.f2['#'].name).toBe('field');

      const entityWithArgument = entity({}) as any;
      expect(entityWithArgument.e1['#'].name).toBe('entity');
      expect(entityWithArgument.e2['#'].name).toBe('entity');
      expect(entityWithArgument.e1.f1['#'].name).toBe('field');
      expect(entityWithArgument.e1.f2['#'].name).toBe('field');
      expect(entityWithArgument.e2.f1['#'].name).toBe('field');
      expect(entityWithArgument.e2.f2['#'].name).toBe('field');
    });

    describe('Field is able to get the reference of the parent entity', () => {
      test('Field will link to the parent entity', () => {
        const f = Field('field');
        const e = Entity('entity', {});
        const entity1 = Entity('entity1', {
          f1: f,
          f2: [f],
          e1: e,
          e2: [e],
        }) as any;
        const entity2 = Entity('entity2', {
          f1: f,
          f2: [f],
          e1: e,
          e2: [e],
        }) as any;
  
        expect(entity1.f1['#link']['#'].name).toBe('entity1');
        expect(entity1.f2['#link']['#'].name).toBe('entity1');
        expect(entity1.e1['#link']['#'].name).toBe('entity1');
        expect(entity1.e2['#link']['#'].name).toBe('entity1');
  
        expect(entity2.f1['#link']['#'].name).toBe('entity2');
        expect(entity2.f2['#link']['#'].name).toBe('entity2');
        expect(entity2.e1['#link']['#'].name).toBe('entity2');
        expect(entity2.e2['#link']['#'].name).toBe('entity2');
  
        const entityWithArgument1 = entity1({}) as any;
        const entityWithArgument2 = entity2({}) as any;
  
        expect(entityWithArgument1.f1['#link']['#'].name).toBe('entity1');
        expect(entityWithArgument1.f2['#link']['#'].name).toBe('entity1');
        expect(entityWithArgument1.e1['#link']['#'].name).toBe('entity1');
        expect(entityWithArgument1.e2['#link']['#'].name).toBe('entity1');
  
        expect(entityWithArgument2.f1['#link']['#'].name).toBe('entity2');
        expect(entityWithArgument2.f2['#link']['#'].name).toBe('entity2');
        expect(entityWithArgument2.e1['#link']['#'].name).toBe('entity2');
        expect(entityWithArgument2.e2['#link']['#'].name).toBe('entity2');
      });

      test('Link property can be forward', () => {
        const f = Field('f');
        const e = Entity('e', {
          f,
        });
        const entity = Entity('entity', {
          e,
        }) as any;
  
        expect(entity.e.f['#link']['#'].name).toBe('e');
        expect(entity.e['#link']['#'].name).toBe('entity');
        expect(entity.e.f['#link']['#link']['#'].name).toBe('entity');
      });
    });

    test('`$` will get properties', () => {
      const field = Field('field');
      const entity = Entity('', {
        f1: field,
        f2: [field],
      }) as any;

      expect(entity.$('f1', 'f2')[0]['#'].name).toEqual('field');
      expect(entity.$('f1', 'f2')[1]['#'].name).toEqual('field');
      expect(entity({}).$('f1', 'f2')[0]['#'].name).toEqual('field');
      expect(entity({}).$('f1', 'f2')[1]['#'].name).toEqual('field');
    });
  });

  test('Field can`t receive a list with different type, even if it is a constant', () => {
    expect(
      () => Entity('name', {
        f: [Field('f'), Field('f2')]
      })
    ).toThrowError()
  });
});
