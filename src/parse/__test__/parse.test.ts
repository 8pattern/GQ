import { Field, Entity, } from '../dataType';
import parse from '../parse';

const baseField: Field = {
  type: 'field',
  name: 'f',
  argument: null,
};

const baseSchema: Entity = {
  type: 'entity',
  name: 's',
  argument: null,
  children: [],
};

test('Pure Entity', () => {
  expect(parse({ ...baseSchema })).toBe('s{}');
});

test('With fields', () => {
  expect(parse({ ...baseSchema, children: [{ ...baseField }], })).toBe('s{f}');
  expect(parse({ ...baseSchema, children: [{ ...baseField }, { ...baseField, name: 'f1' }], })).toBe('s{f,f1}');
  expect(parse({ ...baseSchema, children: [{ ...baseField }, [{ ...baseField, name: 'f1' }]], })).toBe('s{f,f1}');

  expect(
    parse(
      {
        ...baseSchema,
        children: [
          { ...baseField },
          { ...baseSchema, name: 's2', children: [{ ...baseField }] },
          [{ ...baseSchema, name: 's3', children: [{ ...baseField }, [{ ...baseField, name: 'f1' }],] }],
          [{ ...baseField, name: 'f1' }],
        ],
      }
    )
  ).toBe('s{f,s2{f},s3{f,f1},f1}');
});

test('With argument', () => {
  expect(parse({ ...baseField, argument: { c1: 1, c2: '2', c3: true, c4: null, c5: { o: {} } } })).toBe('f(c1:1,c2:"2",c3:true,c4:null,c5:{"o":{}})');
  expect(parse({ ...baseSchema, argument: { c1: 1, c2: '2', c3: true, c4: null, c5: { o: {} } } })).toBe('s(c1:1,c2:"2",c3:true,c4:null,c5:{"o":{}}){}');
});