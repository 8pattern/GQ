import { Scale, Entity, } from '../dataType';
import parse from '../parse';

const baseScale: Scale = {
  type: 'Scale',
  name: 'f',
  argument: null,
};

const baseSchema: Entity = {
  type: 'Entity',
  name: 's',
  argument: null,
  children: [],
};

test('Pure Entity', () => {
  expect(parse({ ...baseSchema })).toBe('s{}');
});

test('With scales', () => {
  expect(parse({ ...baseSchema, children: [{ ...baseScale }], })).toBe('s{f}');
  expect(parse({ ...baseSchema, children: [{ ...baseScale }, { ...baseScale, name: 'f1' }], })).toBe('s{f,f1}');
  expect(parse({ ...baseSchema, children: [{ ...baseScale }, [{ ...baseScale, name: 'f1' }]], })).toBe('s{f,f1}');

  expect(
    parse(
      {
        ...baseSchema,
        children: [
          { ...baseScale },
          { ...baseSchema, name: 's2', children: [{ ...baseScale }] },
          [{ ...baseSchema, name: 's3', children: [{ ...baseScale }, [{ ...baseScale, name: 'f1' }],] }],
          [{ ...baseScale, name: 'f1' }],
        ],
      }
    )
  ).toBe('s{f,s2{f},s3{f,f1},f1}');
});

test('With argument', () => {
  expect(parse({ ...baseScale, argument: { c1: 1, c2: '2', c3: true, c4: null, c5: { o: {} } } })).toBe('f(c1:1,c2:"2",c3:true,c4:null,c5:{"o":{}})');
  expect(parse({ ...baseSchema, argument: { c1: 1, c2: '2', c3: true, c4: null, c5: { o: {} } } })).toBe('s(c1:1,c2:"2",c3:true,c4:null,c5:{"o":{}}){}');
});