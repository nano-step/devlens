export interface ContractConfig {
  learn?: boolean;
  endpoints?: (string | RegExp)[];
  ignoreFields?: string[];
  maxShapes?: number;
}

export type ShapeType = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object' | 'unknown';

export interface FieldShape {
  type: ShapeType;
  optional: boolean;
  children?: Record<string, FieldShape>;
  arrayItemType?: ShapeType;
}

export interface APIShape {
  endpoint: string;
  method: string;
  fields: Record<string, FieldShape>;
  sampleCount: number;
  firstSeen: number;
  lastSeen: number;
}

export interface ContractViolation {
  endpoint: string;
  method: string;
  field: string;
  expected: ShapeType;
  received: ShapeType | 'missing';
  message: string;
}
