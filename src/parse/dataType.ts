interface Base {
  name: string;
}

export interface Scale extends Base {
  type: 'Scale';
  argument: Record<string, ArgumentValue> | null;
}

type ArgumentValue = number | string | boolean | null | (number | string | boolean | null)[] | { [key: string]: ArgumentValue };

export interface Entity extends Base {
  type: 'Entity';
  argument: Record<string, ArgumentValue> | null;
  children: (Entity | [Entity] | Scale | [Scale])[];
}