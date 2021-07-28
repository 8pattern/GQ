import { Entity, Field, } from './dataType';

function parseArgument(argument: Entity['argument']) {
  if (!argument) return '';
  return `(${
    Object.entries(argument)
      .map(([k, v]) => [k, JSON.stringify(v)].join(':'))
      .join(',')
  })`;
}

function parseFields(fields: Entity['children']) {
  return fields
    .map(field => {
      const el = field instanceof Array ? field[0] : field;
      return parse(el);
    })
    .join(',');
}

export default function parse(el: Entity | Field): string {
  const {
    type,
    name,
    argument,
  } = el;
  if (type === 'entity') {
    return [
      name,
      parseArgument(argument),
      `{${parseFields((el as Entity).children)}}`,
    ].filter(Boolean).join('');
  }
  return [
    name,
    parseArgument(argument),
  ].filter(Boolean).join('');
}