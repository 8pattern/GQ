import { Entity, Scale, } from './dataType';

function parseArgument(argument: Entity['argument']) {
  if (!argument) return '';
  return `(${
    Object.entries(argument)
      .map(([k, v]) => [k, JSON.stringify(v)].join(':'))
      .join(',')
  })`;
}

function parseScales(scales: Entity['children']) {
  return scales
    .map(scale => {
      const el = scale instanceof Array ? scale[0] : scale;
      return parse(el);
    })
    .join(',');
}

export default function parse(el: Entity | Scale): string {
  const {
    type,
    name,
    argument,
  } = el;
  if (type === 'Entity') {
    return [
      name,
      parseArgument(argument),
      `{${parseScales((el as Entity).children)}}`,
    ].filter(Boolean).join('');
  }
  return [
    name,
    parseArgument(argument),
  ].filter(Boolean).join('');
}