import { Entity, Scale } from '../factory';
import { register, } from '../action';

describe('Encode correctly', () => {
  test('Scale can be transfered to graphql string', async () => {
    const fn = jest.fn();
    const { Action } = register(fn);
    const scale = Scale('scale');
    await Action('', scale);
    expect(fn).toHaveBeenLastCalledWith('{scale}');
    await Action('', scale({a: 1, b: '2'}));
    expect(fn).toHaveBeenLastCalledWith('{scale(a:1,b:"2")}');
  });

  test('Scale in entity can be transfer to graphql string', async () => {
    const fn = jest.fn();
    const { Action } = register(fn);
    const entity = Entity('entity', {
      f: Scale('f'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
      af: [Scale('af')],
      ae: [Entity('ae', {
        f: Scale('f'),
        af: [Scale('af')],
      })],
      me: () => entity,
    });
    await Action('', entity.f);
    expect(fn).toHaveBeenLastCalledWith('{entity{f}}');
    await Action('', entity.$('f', 'f2'));
    expect(fn).toHaveBeenLastCalledWith('{entity{f,f2}}');
    await Action('', entity.f, entity.e);
    expect(fn).toHaveBeenLastCalledWith('{entity{f,e{}}}');
    await Action('', entity.f, entity.e.ef);
    expect(fn).toHaveBeenLastCalledWith('{entity{f,e{ef}}}');
    await Action('', entity.af, entity.ae.f, entity.ae.af);
    expect(fn).toHaveBeenLastCalledWith('{entity{af,ae{f,af}}}');
    await Action('', entity.me.f, entity.me.me.f);
    expect(fn).toHaveBeenLastCalledWith('{entity{entity{f,entity{f}}}}');

    await Action('', entity({a: 1}).$('f', 'f2'));
    expect(fn).toHaveBeenLastCalledWith('{entity(a:1){f,f2}}');
    await Action('', entity({a: 1}).$('f', 'f2'));
    expect(fn).toHaveBeenLastCalledWith('{entity(a:1){f,f2}}');
    await Action('', entity.me.f({a: '1'}), entity.me.me({b: 2}).f);
    expect(fn).toHaveBeenLastCalledWith('{entity{entity{f(a:"1"),entity(b:2){f}}}}');
  });

  test('Arguments can be transfered', async () => {
    const fn = jest.fn();
    const { Action } = register(fn);
    const entity = Entity('entity', {
      f: Scale('f'),
    });
    await Action('', entity.f({a: 1, b: '2', c: [1,2], d: { m: 1, n: '2', }}));
    expect(fn).toHaveBeenLastCalledWith('{entity{f(a:1,b:"2",c:[1,2],d:{m:1,n:"2"})}}');
    await Action('', entity.f({a: { m: 1, n: '2', }, b: [{ m: 1, n: 2, }] }));
    expect(fn).toHaveBeenLastCalledWith('{entity{f(a:{m:1,n:"2"},b:[{m:1,n:2}])}}');
  });

  test('Entity definations can be composed', async () => {
    const fn = jest.fn();
    const { Action } = register(fn);
    
    const extra = {
      fe: Scale('fe'),
    };

    const e1 = Entity('e1', {
      f1: Scale('f1'),
      ...extra,
    });

    const e2 = Entity('e2', {
      f2: Scale('f2'),
      ...extra,
    });

    await Action('', e1.f1, e1.fe, e2.f2, e2.fe);
    expect(fn).toHaveBeenLastCalledWith('{e1{f1,fe},e2{f2,fe}}');
    await Action('', e1.f1, e1.fe({a: 1}), e2.f2, e2.fe({b: 2}));
    expect(fn).toHaveBeenLastCalledWith('{e1{f1,fe(a:1)},e2{f2,fe(b:2)}}');
    await Action('', e1({e1: 0}).fe({a: 1}), e2({e2: 0}).fe({b: 2}));
    expect(fn).toHaveBeenLastCalledWith('{e1(e1:0){fe(a:1)},e2(e2:0){fe(b:2)}}');
  });

  test('Conflict fields will be split apart', async () => {
    const fn = jest.fn();
    const { Action } = register(fn);

    const entity = Entity('entity', {
      f: Scale('f'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
      me: () => entity,
    });
    await Action('', entity({a: 1}).f, entity.e.ef);
    expect(fn).toHaveBeenNthCalledWith(1, '{entity(a:1){f}}');
    expect(fn).toHaveBeenNthCalledWith(2, '{entity{e{ef}}}');

    await Action('', entity({a: 1}).f, entity.e({b: '2'}).ef);
    expect(fn).toHaveBeenNthCalledWith(3, '{entity(a:1){f}}');
    expect(fn).toHaveBeenNthCalledWith(4, '{entity{e(b:"2"){ef}}}');

    await Action('', entity({a: 1}).f, entity.e({b: '2'}).ef({c: true}));
    expect(fn).toHaveBeenNthCalledWith(5, '{entity(a:1){f}}');
    expect(fn).toHaveBeenNthCalledWith(6, '{entity{e(b:"2"){ef(c:true)}}}');

    await Action('', entity.f, entity({a: 1}).$('f', 'f2'), entity.f2);
    expect(fn).toHaveBeenNthCalledWith(7, '{entity{f,f2}}');
    expect(fn).toHaveBeenNthCalledWith(8, '{entity(a:1){f,f2}}');


    await Action('', entity.me({a:1}).f, entity.me({b: 2}).me.f, entity.me.$('f', 'f2'));
    expect(fn).toHaveBeenNthCalledWith(9, '{entity{entity(a:1){f}}}');
    expect(fn).toHaveBeenNthCalledWith(10, '{entity{entity(b:2){entity{f}}}}');
    expect(fn).toHaveBeenNthCalledWith(11, '{entity{entity{f,f2}}}');
  });
});

describe('Extract correctly', () => {
  test('Basic', async() => {
    const entity = Entity('entity', {
      f1: Scale('f1'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
    });
  
    const data = {
      entity: {
        f1: 'f1',
        f2: 'f2',
        e: {
          ef: 'ef',
        },
      },
    };
  
    const fn = jest.fn(async () => data);
    const { Action } = register(fn);

    expect(await Action('', entity.f1)).toEqual(['f1']);
    expect(await Action('', entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Action('', entity.f1, entity.f2, entity.e.ef)).toEqual(['f1', 'f2', 'ef']);
    expect(await Action('', entity.$('f1', 'f2'), entity.e.ef)).toEqual([{f1: 'f1', f2: 'f2'}, 'ef']);
    expect(await Action('', entity({a: 1}).f1)).toEqual(['f1']);
    expect(await Action('', entity.f1({a: 1}), entity.f2({a: 1}))).toEqual(['f1', 'f2']);
    expect(await Action('', entity({a: 1}).f1, entity.f2({a: 1}), entity.e({a: 1}).ef)).toEqual(['f1', 'f2', 'ef']);
    expect(await Action('', entity({a: 1}).$('f1', 'f2'), entity.e.ef({a: 1}))).toEqual([{f1: 'f1', f2: 'f2'}, 'ef']);
    expect(await Action('', entity.f1, entity.$('f1', 'f2'))).toEqual(['f1', { f1: 'f1', f2: 'f2' }]);
    expect(await Action('', entity.f1, entity.$('f1', 'f2'), entity.f2)).toEqual(['f1', { f1: 'f1', f2: 'f2' }, 'f2']);
  });

  test('Array field', async () => {
    const entity = Entity('entity', {
      f: Scale('f'),
      af: [Scale('af')],
      ae: [Entity('ae', {
        f: Scale('f'),
        af: [Scale('af')],
      })],
    });
  
    const data = {
      entity: {
        f: 'f',
        af: [1, 2, 3],
        ae: [{ f: 1, af: [1, 2, 3], }, { f: 2, af: [2, 3, 4], }],
      },
    };
  
    const fn = jest.fn(async () => data);
    const { Action } = register(fn);

    expect(await Action('', entity.af)).toEqual([[1, 2, 3]]);
    expect(await Action('', entity.ae.f)).toEqual([[1, 2]]);
    expect(await Action('', entity.ae.af)).toEqual([[[1, 2, 3], [2, 3, 4]]]);
    expect(await Action('', entity.ae.$('f', 'af'))).toEqual([[{ f: 1, af: [1, 2, 3], }, { f: 2, af: [2, 3, 4], }]]);
    expect(await Action('', entity.f, entity.ae.$('f', 'af'))).toEqual(['f', [{ f: 1, af: [1, 2, 3], }, { f: 2, af: [2, 3, 4], }]]);
  });

  test('Reference self', async () => {
    const entity = Entity('entity', {
      f1: Scale('f1'),
      f2: Scale('f2'),
      me: () => entity,
    });
  
    const data = {
      entity: {
        f1: 'f1',
        f2: 'f2',
        entity: {
          f1: 'ef1',
          f2: 'ef2',
        },
      },
    };
  
    const fn = jest.fn(async () => data);
    const { Action } = register(fn);

    expect(await Action('', entity.me.f1)).toEqual(['ef1']);
    expect(await Action('', entity.$('f1', 'f2'), entity.me.$('f1'))).toEqual([{ f1: 'f1', f2: 'f2' }, { f1: 'ef1' }]);
  });

  test('If corresponding field, return null', async () => {
    const entity = Entity('entity', {
      f1: Scale('f1'),
      f2: Scale('f2'),
      e: Entity('e', {
        f: Scale('f'),
      }),
    });
  
    const fn = jest.fn(async () => null);
    const { Action } = register(fn);

    expect(await Action('', entity.f1)).toEqual([null]);
    expect(await Action('', entity.f1, entity.f2)).toEqual([null, null]);
    expect(await Action('', entity.$('f1', 'f2'))).toEqual([null]);
    expect(await Action('', entity.e.f)).toEqual([null]);
  });
});

describe('Custom actions', () => {
  const entity = Entity('entity', {
    f1: Scale('f1'),
    f2: Scale('f2'),
  });

  const data = {
    entity: {
      f1: 'f1',
      f2: 'f2',
    },
  };

  test('Query', async () => {
    const fn = jest.fn(async () => data);
    const { Query } = register(fn);

    await Query(entity.f1, entity.f2)
    expect(fn).toHaveBeenCalledWith('query {entity{f1,f2}}');
    expect(await Query(entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Query(entity.$('f1', 'f2'))).toEqual([{f1: 'f1', f2: 'f2'}]);
  });

  test('Mutation', async () => {
    const fn = jest.fn(async () => data);
    const { Mutation } = register(fn);
    await Mutation(entity.f1, entity.f2)
    expect(fn).toHaveBeenCalledWith('mutation {entity{f1,f2}}');
    expect(await Mutation(entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Mutation(entity.$('f1', 'f2'))).toEqual([{f1: 'f1', f2: 'f2'}]);
  });
});

test('Different registered handles won`t be influened by others', async () => {
  const s = Scale('s');

  const f1 = jest.fn(async () => ({s: 1}))
  const { Action: Action1, Mutation: Mutation1, Query: Query1 } = register(f1);
  const f2 = jest.fn(async () => ({s: 2}))
  const { Action: Action2, Mutation: Mutation2, Query: Query2 } = register(f2);

  const [res_a1] = await Action1('', s);
  const [res_m1] = await Mutation1(s);
  const [res_q1] = await Query1(s);
  const [res_a2] = await Action2('', s);
  const [res_m2] = await Mutation2(s);
  const [res_q2] = await Query2(s);
  
  expect(f1).toBeCalledTimes(3);
  expect(f2).toBeCalledTimes(3);

  expect(res_a1).toBe(1);
  expect(res_m1).toBe(1);
  expect(res_q1).toBe(1);
  expect(res_a2).toBe(2);
  expect(res_m2).toBe(2);
  expect(res_q2).toBe(2);
});
