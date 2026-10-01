import type { PageDocument } from './cms';
import { componentRegistry } from './registry';
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const color = (value: unknown) => typeof value === 'string' && /^(#[0-9a-fA-F]{3,8}|transparent)$/.test(value);
export function safeMediaUrl(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value === '' || /^\/(?!\/)[^\\\s]*$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}
export class ContentValidationError extends Error {
  constructor(public issues: string[]) { super('Invalid page document: ' + issues.join('; ')); this.name = 'ContentValidationError'; }
}
export function parsePageDocument(input: unknown): PageDocument {
  const issues: string[] = [];
  const fail = (message: string) => { issues.push(message); };
  if (!record(input) || input.schemaVersion !== 2 || !Array.isArray(input.nodes) || !Array.isArray(input.rootIds))
    throw new ContentValidationError(['Expected schemaVersion 2, nodes and rootIds']);
  if (input.nodes.length > 500 || JSON.stringify(input).length > 1_000_000) throw new ContentValidationError(['Document exceeds content limits']);
  const nodes = new Map<string, Record<string, unknown>>();
  for (const raw of input.nodes) {
    if (!record(raw) || !id(raw.id)) { fail('Invalid node ID'); continue; }
    if (nodes.has(raw.id)) fail('Duplicate node ID: ' + raw.id);
    nodes.set(raw.id, raw);
    const definition = typeof raw.component === 'string' && Object.hasOwn(componentRegistry, raw.component) ? componentRegistry[raw.component as keyof typeof componentRegistry] : undefined;
    if (!definition || definition.type !== raw.type) fail(raw.id + ': unknown or mismatched component');
    if (typeof raw.visible !== 'boolean' || !(raw.parentId === null || id(raw.parentId))) fail(raw.id + ': invalid visibility or parent');
    if (raw.label !== undefined && (typeof raw.label !== 'string' || raw.label.length > 200)) fail(raw.id + ': invalid label');
    if (!Array.isArray(raw.children) || !raw.children.every(id) || new Set(raw.children).size !== raw.children.length) fail(raw.id + ': invalid children');
    if (!record(raw.props)) { fail(raw.id + ': invalid props'); continue; }
    for (const [key, value] of Object.entries(raw.props)) {
      if (!(value === null || ['string', 'number', 'boolean'].includes(typeof value)) || (typeof value === 'number' && !Number.isFinite(value))) fail(raw.id + ': invalid property ' + key);
      if (typeof value === 'string' && value.length > 20_000) fail(raw.id + ': property too long');
      const ranges: Record<string, [number, number]> = { padding: [0,96], margin:[0,96], radius:[0,64], opacity:[0,1], size:[10,72], weight:[100,900], columns:[1,4], gap:[0,96], focalX:[0,100], focalY:[0,100], displayHeight:[0,1200] };
      if (key === 'columns' && (typeof value !== 'number' || !Number.isInteger(value))) fail(raw.id + ': columns must be an integer');
      if (ranges[key] && (typeof value !== 'number' || value < ranges[key][0] || value > ranges[key][1])) fail(raw.id + ': invalid ' + key);
      if (['background','color'].includes(key) && !color(value)) fail(raw.id + ': invalid color');
      if (key === 'align' && !['left','center','right'].includes(String(value))) fail(raw.id + ': invalid alignment');
      if (key === 'objectFit' && !['cover','contain'].includes(String(value))) fail(raw.id + ': invalid image fit');
      if (key === 'mediaAssetId' && value !== null && (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))) fail(raw.id + ': invalid media asset');
      if (['mediaWidth','mediaHeight'].includes(key) && value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 20000)) fail(raw.id + ': invalid media dimensions');
      if (key === 'variantWidths' && (typeof value !== 'string' || !/^(|480|960|1600|480,960|480,1600|960,1600|480,960,1600)$/.test(value))) fail(raw.id + ': invalid image variants');
      if (key === 'src' && !safeMediaUrl(value)) fail(raw.id + ': unsafe image URL');
      if (['text','alt','className','title','body','category','price','invitation'].includes(key) && typeof value !== 'string') fail(raw.id + ': invalid ' + key);
    }
    if(raw.props.mediaAssetId && raw.props.src !== '/media/'+raw.props.mediaAssetId) fail(raw.id + ': media source must match asset');
  }
  if (!input.rootIds.every(id) || new Set(input.rootIds).size !== input.rootIds.length) fail('Invalid root IDs');
  const visited = new Set<string>();
  function visit(nodeId: string, parent: string | null, depth: number) {
    const node = nodes.get(nodeId);
    if (!node || visited.has(nodeId) || depth > 20) { fail('Missing, repeated or deeply nested node: ' + nodeId); return; }
    visited.add(nodeId);
    if (node.parentId !== parent) fail(nodeId + ': parent/child mismatch');
    if (parent === null && node.type !== 'section') fail(nodeId + ': root must be a section');
    if (node.type === 'block' && Array.isArray(node.children) && node.children.length) fail(nodeId + ': blocks cannot contain children');
    if (Array.isArray(node.children)) for (const child of node.children) if (id(child)) visit(child, nodeId, depth + 1);
  }
  for (const root of input.rootIds) if (id(root)) visit(root, null, 0);
  if (visited.size !== nodes.size) fail('Unreachable nodes or cycle');
  if (input.theme !== undefined) {
    if (!record(input.theme)) fail('Invalid theme');
    else for (const [key, value] of Object.entries(input.theme)) {
      if (key === 'radius') { if (typeof value !== 'number' || value < 0 || value > 64) fail('Invalid theme radius'); }
      else if (!['primary','background','surface','text','muted'].includes(key) || !color(value)) fail('Invalid theme color: ' + key);
    }
  }
  if (issues.length) throw new ContentValidationError(issues);
  return JSON.parse(JSON.stringify(input)) as PageDocument;
}
