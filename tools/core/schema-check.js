// A small JSON Schema checker covering the subset MWER's schemas use:
// type, const, enum, required, properties, additionalProperties: false,
// items, minItems, maxItems, uniqueItems, minLength, maxLength, pattern,
// minimum, maximum and local $ref. Kept dependency-free on purpose.

export function checkSchema(schema, value) {
  const errors = [];
  walk(schema, value, '$');
  return errors;

  function resolve(node) {
    while (node && node.$ref) {
      if (!node.$ref.startsWith('#/')) throw new Error(`Unsupported $ref: ${node.$ref}`);
      node = node.$ref.slice(2).split('/').reduce((n, key) => n[key], schema);
    }
    return node;
  }

  function walk(node, v, path) {
    node = resolve(node);

    if ('const' in node && v !== node.const) {
      errors.push(`${path}: must be ${JSON.stringify(node.const)}`);
      return;
    }
    if (node.enum && !node.enum.includes(v)) {
      errors.push(`${path}: must be one of ${node.enum.map(e => JSON.stringify(e)).join(', ')}`);
      return;
    }
    if (node.type) {
      const allowed = [].concat(node.type);
      const actual = typeOf(v);
      if (!allowed.some(t => t === actual || (t === 'number' && actual === 'integer'))) {
        errors.push(`${path}: must be ${allowed.join(' or ')}`);
        return;
      }
    }

    if (typeof v === 'string') {
      if (node.minLength !== undefined && v.length < node.minLength) errors.push(`${path}: must not be empty`);
      if (node.maxLength !== undefined && v.length > node.maxLength) errors.push(`${path}: must be at most ${node.maxLength} characters`);
      if (node.pattern && !new RegExp(node.pattern, 'u').test(v)) errors.push(`${path}: does not match ${node.pattern}`);
    }

    if (typeof v === 'number') {
      if (node.minimum !== undefined && v < node.minimum) errors.push(`${path}: must be at least ${node.minimum}`);
      if (node.maximum !== undefined && v > node.maximum) errors.push(`${path}: must be at most ${node.maximum}`);
    }

    if (Array.isArray(v)) {
      if (node.minItems !== undefined && v.length < node.minItems) errors.push(`${path}: must have at least ${node.minItems} items`);
      if (node.maxItems !== undefined && v.length > node.maxItems) errors.push(`${path}: must have at most ${node.maxItems} items`);
      if (node.uniqueItems && new Set(v.map(item => JSON.stringify(item))).size !== v.length) errors.push(`${path}: must not contain duplicates`);
      if (node.items) v.forEach((item, i) => walk(node.items, item, `${path}[${i}]`));
    }

    if (typeOf(v) === 'object') {
      for (const key of node.required ?? []) {
        if (!(key in v)) errors.push(`${path}: missing required field "${key}"`);
      }
      for (const [key, child] of Object.entries(v)) {
        if (node.properties && key in node.properties) walk(node.properties[key], child, `${path}.${key}`);
        else if (node.additionalProperties === false) errors.push(`${path}: "${key}" is not an allowed field`);
      }
    }
  }
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (Number.isInteger(v)) return 'integer';
  return typeof v;
}
