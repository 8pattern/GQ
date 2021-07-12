import { Entity, Field } from '../factory';

describe('Field', () => {
  const field = Field('fieldName');

  test('Private properties are right', () => {
    expect(field['#'].type).toBe('field');
    expect(field['#'].name).toBe('fieldName');
  });
});

describe('Entity', () => {
  test('Private properties are right', () => {
    const defination = {};
    const entity = Entity('entityName', defination);
    expect(entity['#'].type).toBe('entity');
    expect(entity['#'].name).toBe('entityName');
  });

  test('Factory generates a function handle, which can be asigned by conditions', () => {
    const defination = {};
    const entity = Entity('entityName', defination);
    expect(entity).toBeInstanceOf(Function);

    const condition = {};
    const entityWithCondition = entity(condition);
    expect(entityWithCondition['#'].type).toBe('entity');
    expect(entityWithCondition['#'].name).toBe('entityName');
    expect(entityWithCondition['#'].defination).toBe(defination);
    expect(entityWithCondition['#'].condition).toBe(condition);
  });

  describe('Get property in the defination', () => {
    test('Field type', () => {
      const field = Field('field');
      const entity = Entity('', {
        f1: field,
        f2: [field],
      }) as any;
      expect(entity.f1).toEqual(field);
      expect(entity.f2).toEqual(field);
      
      const entityWithCondition = entity({}) as any;
      expect(entityWithCondition.f1).toEqual(field);
      expect(entityWithCondition.f2).toEqual(field);
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

      const entityWithCondition = entity({}) as any;
      expect(entityWithCondition.e1['#'].name).toBe('entity');
      expect(entityWithCondition.e2['#'].name).toBe('entity');
      expect(entityWithCondition.e1.f1['#'].name).toBe('field');
      expect(entityWithCondition.e1.f2['#'].name).toBe('field');
      expect(entityWithCondition.e2.f1['#'].name).toBe('field');
      expect(entityWithCondition.e2.f2['#'].name).toBe('field');
    });

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

      expect(entity1.f1['#link']).toBe(entity1);
      expect(entity1.f2['#link']).toBe(entity1);
      expect(entity1.e1['#link']).toBe(entity1);
      expect(entity1.e2['#link']).toBe(entity1);

      expect(entity2.f1['#link']).toBe(entity2);
      expect(entity2.f2['#link']).toBe(entity2);
      expect(entity2.e1['#link']).toBe(entity2);
      expect(entity2.e2['#link']).toBe(entity2);

      const entityWithCondition1 = entity1({}) as any;
      const entityWithCondition2 = entity2({}) as any;

      expect(entityWithCondition1.f1['#link']).toBe(entityWithCondition1);
      expect(entityWithCondition1.f2['#link']).toBe(entityWithCondition1);
      expect(entityWithCondition1.e1['#link']).toBe(entityWithCondition1);
      expect(entityWithCondition1.e2['#link']).toBe(entityWithCondition1);

      expect(entityWithCondition2.f1['#link']).toBe(entityWithCondition2);
      expect(entityWithCondition2.f2['#link']).toBe(entityWithCondition2);
      expect(entityWithCondition2.e1['#link']).toBe(entityWithCondition2);
      expect(entityWithCondition2.e2['#link']).toBe(entityWithCondition2);
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
