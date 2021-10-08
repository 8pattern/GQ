interface Base {
  name: string;
}

export interface Scale extends Base {
  type: 'Scale';
  argument: Record<string, ArgumentValue> | null;
}

type ArgumentValue = any;

export interface Entity extends Base {
  type: 'Entity';
  argument: Record<string, ArgumentValue> | null;
  children: (Entity | [Entity] | Scale | [Scale])[];
}