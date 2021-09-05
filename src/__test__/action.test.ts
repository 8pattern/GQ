import { Entity, Scale } from '../factory';
import { encode, extract, registerRequest, Action, Query, Mutation, } from '../action';

describe('Encode', () => {
  test('Scale can be transfer to graphql string', () => {
    const scale = Scale('scale');
    
    expect(encode(scale)).toBe('{scale}');
    expect(encode(scale({a: 1, b: '2'}))).toBe('{scale(a:1,b:"2")}');
  });

  test('Scale in entity can be transfer to graphql string', () => {
    const entity = Entity('entity', {
      f: Scale('f'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
    });
    
    expect(encode(entity.f)).toBe('{entity{f}}');
    expect(encode(entity.$('f', 'f2'))).toBe('{entity{f,f2}}');
    expect(encode(entity.f, entity.e)).toBe('{entity{f,e{}}}');
    expect(encode(entity.f, entity.e.ef)).toBe('{entity{f,e{ef}}}');

    expect(encode(entity({a: 1}).$('f', 'f2'))).toBe('{entity(a:1){f,f2}}');
    expect(encode(entity({a: 1}).f, entity.e.ef)).toBe('{entity(a:1){f},entity{e{ef}}}');
    expect(encode(entity({a: 1}).f, entity.e({b: '2'}).ef)).toBe('{entity(a:1){f},entity{e(b:"2"){ef}}}');
    expect(encode(entity({a: 1}).f, entity.e({b: '2'}).ef({c: true}))).toBe('{entity(a:1){f},entity{e(b:"2"){ef(c:true)}}}');
  });

  test('Scale with arguments in entity can be transfer to graphql string', () => {
    const entity = Entity('entity', {
      f: Scale('f'),
      f2: Scale('f2'),
      e: Entity('e', {
        ef: Scale('ef'),
      }),
    });
    
    expect(encode(entity.f)).toBe('{entity{f}}');
    expect(encode(entity.$('f', 'f2'))).toBe('{entity{f,f2}}');
    expect(encode(entity.f, entity.e)).toBe('{entity{f,e{}}}');
    expect(encode(entity.f, entity.e.ef)).toBe('{entity{f,e{ef}}}');

    expect(encode(entity({a: 1}).$('f', 'f2'))).toBe('{entity(a:1){f,f2}}');
    expect(encode(entity({a: 1}).f, entity.e.ef)).toBe('{entity(a:1){f},entity{e{ef}}}');
    expect(encode(entity({a: 1}).f, entity.e({b: '2'}).ef)).toBe('{entity(a:1){f},entity{e(b:"2"){ef}}}');
    expect(encode(entity({a: 1}).f, entity.e({b: '2'}).ef({c: true}))).toBe('{entity(a:1){f},entity{e(b:"2"){ef(c:true)}}}');
  });

  test('Entity defination can be composed', () => {
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
    
    expect(encode(e1.f1, e1.fe, e2.f2, e2.fe)).toBe('{e1{f1,fe},e2{f2,fe}}');
    expect(encode(e1.f1, e1.fe({a: 1}), e2.f2, e2.fe({b: 2}))).toBe('{e1{f1,fe(a:1)},e2{f2,fe(b:2)}}');
    expect(encode(e1({e1: 0}).fe({a: 1}), e2({e2: 0}).fe({b: 2}))).toBe('{e1(e1:0){fe(a:1)},e2(e2:0){fe(b:2)}}');
  });
});


describe('Extract', () => {
  test('Extract data correctly', () => {
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

    expect(extract(data, entity.f1)).toEqual(['f1']);
    expect(extract(data, entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(extract(data, entity.f1, entity.f2, entity.e.ef)).toEqual(['f1', 'f2', 'ef']);
    expect(extract(data, entity.$('f1', 'f2'), entity.e.ef)).toEqual([{f1: 'f1', f2: 'f2'}, 'ef']);

    expect(extract(data, entity({a: 1}).f1)).toEqual(['f1']);
    expect(extract(data, entity.f1({a: 1}), entity.f2({a: 1}))).toEqual(['f1', 'f2']);
    expect(extract(data, entity({a: 1}).f1, entity.f2({a: 1}), entity.e({a: 1}).ef)).toEqual(['f1', 'f2', 'ef']);
    expect(extract(data, entity({a: 1}).$('f1', 'f2'), entity.e.ef({a: 1}))).toEqual([{f1: 'f1', f2: 'f2'}, 'ef']);
  });
});

describe('Action', () => {
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

  test.skip('If not register request handle, it will return a empty list', async () => {
    expect(await Action('', entity.f1, entity.f2)).toEqual([]);
  });

  test('The request handle receives correct arguments', async () => {
    const fn = jest.fn();
    registerRequest(fn);
    await Action('query', entity.f1, entity.f2)
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('query {entity{f1,f2}}');
  });

  test('The request handle return value will be extracted correctly', async () => {
    const fn = jest.fn(async () => data);
    registerRequest(fn);
    expect(await Action('query', entity.f1, entity.f2)).toEqual(['f1', 'f2']);
    expect(await Action('query', entity.$('f1', 'f2'))).toEqual([{f1: 'f1', f2: 'f2'}]);
  });

  describe('Custom actions', () => {
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
});