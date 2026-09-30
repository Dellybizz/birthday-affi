export type ComponentDefinition = {
  type: string;
  label: string;
  category: string;
  allowedParents: string[];
  defaultData: Record<string, unknown>;
  defaultSettings: Record<string, unknown>;
  schemaVersion: number;
};

const registry = new Map<string, ComponentDefinition>();

export function registerComponent(definition: ComponentDefinition) {
  if (registry.has(definition.type)) {
    throw new Error(`Component already registered: ${definition.type}`);
  }
  registry.set(definition.type, definition);
}

export function getComponent(type: string) {
  return registry.get(type);
}

export function listComponents() {
  return [...registry.values()];
}
