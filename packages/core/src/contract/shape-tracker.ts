import type { FieldShape, ShapeType, ContractViolation } from './types';

const MAX_OBJECT_DEPTH = 3;

export function inferType(value: unknown): ShapeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return t;
  if (t === 'object') return 'object';
  return 'unknown';
}

export function inferShape(
  value: unknown,
  ignoreFields: Set<string>,
  depth: number = 0,
): Record<string, FieldShape> {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return {};
  }

  const fields: Record<string, FieldShape> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (ignoreFields.has(key)) continue;

    const type = inferType(val);
    const shape: FieldShape = { type, optional: false };

    if (type === 'object' && depth < MAX_OBJECT_DEPTH) {
      shape.children = inferShape(val, ignoreFields, depth + 1);
    }

    if (type === 'array' && Array.isArray(val) && val.length > 0) {
      shape.arrayItemType = inferType(val[0]);
    }

    fields[key] = shape;
  }

  return fields;
}

export function compareShapes(
  baseline: Record<string, FieldShape>,
  current: Record<string, FieldShape>,
  endpoint: string,
  method: string,
  prefix: string = '',
): ContractViolation[] {
  const violations: ContractViolation[] = [];

  for (const [key, baseField] of Object.entries(baseline)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const curField = current[key];

    if (!curField) {
      if (!baseField.optional) {
        violations.push({
          endpoint,
          method,
          field: path,
          expected: baseField.type,
          received: 'missing',
          message: `Field "${path}" disappeared from ${method} ${endpoint} response`,
        });
      }
      continue;
    }

    if (curField.type !== baseField.type && baseField.type !== 'null' && curField.type !== 'null') {
      violations.push({
        endpoint,
        method,
        field: path,
        expected: baseField.type,
        received: curField.type,
        message: `Field "${path}" changed type from ${baseField.type} to ${curField.type} in ${method} ${endpoint}`,
      });
    }

    if (baseField.children && curField.children) {
      violations.push(
        ...compareShapes(baseField.children, curField.children, endpoint, method, path),
      );
    }
  }

  return violations;
}
