import { Entity, Scale } from '../factory';
import { registerRequest, Action, Query, Mutation, } from '../action';

afterEach(() => {
  registerRequest(null);
});


test('If not register request handle, it will return a empty list', async () => {
  registerRequest(null);
  expect(await Action('')).toEqual([]);
});

describe('Encode correctly', () => {
  const fn = jest.fn();
  beforeEach(() => {
    registerRequest(fn);
  });

  test('Scale can be transfered to graphql string', async () => {
    const scale = Scale('scale');
    await Action('', scale);
    expect(fn).toHaveBeenLastCalledWith('{scale}');
    await Action('', scale({a: 1, b: '2'}));
    expect(fn).toHaveBeenLastCalledWith('{scale(a:1,b:"2")}');
  });

  test('Scale in entity can be transfer to graphql string', async () => {
    const entity = Entity('entity', {
      f: Scale('f'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
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
    await Action('', entity.me.f, entity.me.me.f);
    expect(fn).toHaveBeenLastCalledWith('{entity{entity{f,entity{f}}}}');

    await Action('', entity({a: 1}).$('f', 'f2'));
    expect(fn).toHaveBeenLastCalledWith('{entity(a:1){f,f2}}');
    await Action('', entity({a: 1}).$('f', 'f2'));
    expect(fn).toHaveBeenLastCalledWith('{entity(a:1){f,f2}}');
    await Action('', entity.me.f({a: '1'}), entity.me.me({b: 2}).f);
    expect(fn).toHaveBeenLastCalledWith('{entity{entity{f(a:"1"),entity(b:2){f}}}}');
  });

  test('Entity definations can be composed', async () => {
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
    registerRequest(fn);

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


test('Extract correctly', async () => {
    const entity = Entity('entity', {
      f1: Scale('f1'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
      me: () => entity,
    });

    const data = {
      entity: {
        f1: 'f1',
        f2: 'f2',
        e: {
          ef: 'ef',
        },
        entity: {
          f1: 'ef1',
          f2: 'ef2',
        }
      },
    };

    registerRequest(jest.fn(async () => data));

    expect(await Action('', entity.f1)).toEqual(['f1']);
    expect(await Action('', entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Action('', entity.f1, entity.f2, entity.e.ef)).toEqual(['f1', 'f2', 'ef']);
    expect(await Action('', entity.$('f1', 'f2'), entity.e.ef)).toEqual([{f1: 'f1', f2: 'f2'}, 'ef']);
    expect(await Action('', entity.me.f1)).toEqual(['ef1']);

    expect(await Action('', entity({a: 1}).f1)).toEqual(['f1']);
    expect(await Action('', entity.f1({a: 1}), entity.f2({a: 1}))).toEqual(['f1', 'f2']);
    expect(await Action('', entity({a: 1}).f1, entity.f2({a: 1}), entity.e({a: 1}).ef)).toEqual(['f1', 'f2', 'ef']);
    expect(await Action('', entity({a: 1}).$('f1', 'f2'), entity.e.ef({a: 1}))).toEqual([{f1: 'f1', f2: 'f2'}, 'ef']);

    expect(await Action('', entity.f1, entity.$('f1', 'f2'))).toEqual(['f1', { f1: 'f1', f2: 'f2' }]);
    expect(await Action('', entity.f1, entity.$('f1', 'f2'), entity.f2)).toEqual(['f1', { f1: 'f1', f2: 'f2' }, 'f2']);
    expect(await Action('', entity.$('f1', 'f2'), entity.me.$('f1'))).toEqual([{ f1: 'f1', f2: 'f2' }, { f1: 'ef1' }]);
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
    registerRequest(fn);
    await Query(entity.f1, entity.f2)
    expect(fn).toHaveBeenCalledWith('query {entity{f1,f2}}');
    expect(await Query(entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Query(entity.$('f1', 'f2'))).toEqual([{f1: 'f1', f2: 'f2'}]);
  });

  test('Mutation', async () => {
    const fn = jest.fn(async () => data);
    registerRequest(fn);
    await Mutation(entity.f1, entity.f2)
    expect(fn).toHaveBeenCalledWith('mutation {entity{f1,f2}}');
    expect(await Mutation(entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Mutation(entity.$('f1', 'f2'))).toEqual([{f1: 'f1', f2: 'f2'}]);
  });
});
