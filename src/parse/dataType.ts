interface Base {
  name: string;
}

export interface Field extends Base {
  type: 'field';
  argument: Record<string, ArgumentValue> | null;
}

type ArgumentValue = number | string | boolean | null | { [key: string]: ArgumentValue };

export interface Entity extends Base {
  type: 'entity';
  argument: Record<string, ArgumentValue> | null;
  children: (Entity | [Entity] | Field | [Field])[];
}