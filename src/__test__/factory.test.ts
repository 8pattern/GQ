import { Entity, Scale } from '../factory';

describe('Scale', () => {
  const scale = Scale('scaleName');

  test('Private properties are right', () => {
    expect(scale['#'].type).toBe('Scale');
    expect(scale['#'].name).toBe('scaleName');
  });

  test('Factory generates a function handle, which can be asigned by arguments', () => {
    expect(scale).toBeInstanceOf(Function);

    const argument = {};
    const scaleWithArgument = scale(argument);
    expect(scaleWithArgument['#'].type).toBe('Scale');
    expect(scaleWithArgument['#'].name).toBe('scaleName');
    expect(scaleWithArgument['#'].argument).toBe(argument);
  });
});

describe('Entity', () => {
  test('Private properties are right', () => {
    const defination = {};
    const entity = Entity('entityName', defination);
    expect(entity['#'].type).toBe('Entity');
    expect(entity['#'].name).toBe('entityName');
  });

  test('Factory generates a function handle, which can be asigned by arguments', () => {
    const defination = {};
    const entity = Entity('entityName', defination);
    expect(entity).toBeInstanceOf(Function);

    const argument = {};
    const entityWithArgument = entity(argument);
    expect(entityWithArgument['#'].type).toBe('Entity');
    expect(entityWithArgument['#'].name).toBe('entityName');
    expect(entityWithArgument['#'].defination).toBe(defination);
    expect(entityWithArgument['#'].argument).toBe(argument);
  });

  describe('Get property in the defination', () => {
    test('Scale type', () => {
      const scale = Scale('scale');
      const entity = Entity('', {
        f1: scale,
        f2: [scale],
      }) as any;
      expect(entity.f1['#'].name).toEqual('scale');
      expect(entity.f2['#'].name).toEqual('scale');
      
      const entityWithArgument = entity({}) as any;
      expect(entityWithArgument.f1['#'].name).toEqual('scale');
      expect(entityWithArgument.f2['#'].name).toEqual('scale');
    });

    test('Entity type', () => {
      const f = Scale('scale');
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
      expect(entity.e1.f1['#'].name).toBe('scale');
      expect(entity.e1.f2['#'].name).toBe('scale');
      expect(entity.e2.f1['#'].name).toBe('scale');
      expect(entity.e2.f2['#'].name).toBe('scale');

      const entityWithArgument = entity({}) as any;
      expect(entityWithArgument.e1['#'].name).toBe('entity');
      expect(entityWithArgument.e2['#'].name).toBe('entity');
      expect(entityWithArgument.e1.f1['#'].name).toBe('scale');
      expect(entityWithArgument.e1.f2['#'].name).toBe('scale');
      expect(entityWithArgument.e2.f1['#'].name).toBe('scale');
      expect(entityWithArgument.e2.f2['#'].name).toBe('scale');
    });

    describe('Scale is able to get the reference of the parent entity', () => {
      test('Scale will link to the parent entity', () => {
        const f = Scale('scale');
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
        const f = Scale('f');
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

      test('Able to receiving a function which returns an Entity, in order to reference itself', () => {
        const entity = Entity('entity', {
          me: () => entity,
          we: [() => entity],
        });
        expect(entity.me['#'].name).toBe('entity');
        expect(entity.we['#'].name).toBe('entity');
        expect(entity.me['#link']['#'].name).toBe('entity');
        expect(entity.we['#link']['#'].name).toBe('entity');
        expect(entity.me.me['#link']['#link']['#'].name).toBe('entity');
        expect(entity.me.we['#link']['#link']['#'].name).toBe('entity');
      })
    });

    test('`$` will get properties', () => {
      const scale = Scale('scale');
      const entity = Entity('', {
        f1: scale,
        f2: [scale],
      }) as any;

      expect(entity.$('f1', 'f2')['#'].type).toEqual('ScaleCollection');

      expect(entity.$('f1', 'f2')[0]['#'].name).toEqual('scale');
      expect(entity.$('f1', 'f2')[1]['#'].name).toEqual('scale');
      expect(entity({}).$('f1', 'f2')[0]['#'].name).toEqual('scale');
      expect(entity({}).$('f1', 'f2')[1]['#'].name).toEqual('scale');
    });
  });

  test('Scale can`t receive a list with different type, even if it is a constant', () => {
    expect(
      () => Entity('name', {
        f: [Scale('f'), Scale('f2')]
      })
    ).toThrowError()
  });
});

test('Public properties are correct', () => {
  const entity = Entity('entityName', {
    f: Scale('f'),
    af: [Scale('af')],
    e: Entity('e', {
      f: Scale('f'),
      af: [Scale('af')],
    }),
    ae: [Entity('ae', {
      f: Scale('f'),
      af: [Scale('af')],
    })],
    m: () => entity,
    am: [() => entity],
  });

  expect(entity.f['#type']).toBe('Scale');
  expect(entity.af['#type']).toBe('Scale');
  expect(entity.e.f['#type']).toBe('Scale');
  expect(entity.e.af['#type']).toBe('Scale');
  expect(entity.ae.f['#type']).toBe('Scale');
  expect(entity.ae.af['#type']).toBe('Scale');
  expect(entity.m.f['#type']).toBe('Scale');
  expect(entity.m.af['#type']).toBe('Scale');

  expect(entity['#type']).toBe('Entity');
  expect(entity.e['#type']).toBe('Entity');
  expect(entity.ae['#type']).toBe('Entity');
  expect(entity.m['#type']).toBe('Entity');
  expect(entity.am['#type']).toBe('Entity');

  expect(entity.$('f', 'af')['#type']).toBe('ScaleCollection');
  expect(entity.e.$('f', 'af')['#type']).toBe('ScaleCollection');
  expect(entity.ae.$('f', 'af')['#type']).toBe('ScaleCollection');
  expect(entity.m.$('f', 'af')['#type']).toBe('ScaleCollection');
  expect(entity.am.$('f', 'af')['#type']).toBe('ScaleCollection');
});
