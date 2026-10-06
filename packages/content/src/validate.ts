import {appSettingDefinitions,authoredApps} from './app-settings';
import { parseCaptions } from '../../audio/src/controller';
import type { PageDocument } from './cms';
import {sectionKinds,layoutSingletons,sectionBlocks} from './layout-contract';
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
    for (const [rawKey, value] of Object.entries(raw.props)) {
      let key=rawKey;
      if(rawKey.includes(':')){const parts=rawKey.split(':');if(parts.length!==2||!['mobile','tablet','desktop'].includes(parts[0])||!['background','color','padding','margin','radius','opacity','size','weight','align','columns','gap','objectFit','focalX','focalY','displayHeight'].includes(parts[1])){fail(raw.id+': invalid responsive override');continue}key=parts[1]}

      if (!(value === null || ['string', 'number', 'boolean'].includes(typeof value)) || (typeof value === 'number' && !Number.isFinite(value))) fail(raw.id + ': invalid property ' + key);
      if (typeof value === 'string' && value.length > 20_000) fail(raw.id + ': property too long');
      const ranges: Record<string, [number, number]> = { paddingTop:[0,96],paddingRight:[0,96],paddingBottom:[0,96],paddingLeft:[0,96],marginTop:[0,96],marginRight:[0,96],marginBottom:[0,96],marginLeft:[0,96],maxWidth:[0,1600],borderWidth:[0,12],lineHeight:[1,3],letterSpacing:[0,12],initialVolume:[0,1],padding: [0,96], margin:[0,96], radius:[0,64], opacity:[0,1], size:[10,72], weight:[100,900], columns:[1,4], gap:[0,96], focalX:[0,100], focalY:[0,100], displayHeight:[0,1200] };
      if (key === 'columns' && (typeof value !== 'number' || !Number.isInteger(value))) fail(raw.id + ': columns must be an integer');
      if (ranges[key] && (typeof value !== 'number' || value < ranges[key][0] || value > ranges[key][1])) fail(raw.id + ': invalid ' + key);
      if (['background','color','borderColor','appAccent','appBackground'].includes(key) && !color(value)) fail(raw.id + ': invalid color');
      if (key === 'phonePart' && !['home','wallpaper','status','notifications','notification','widget','launcher','app-icon','navigation'].includes(String(value))) fail(raw.id + ': invalid phone part');
      if (key === 'pageSlug' && (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(value))) fail(raw.id + ': invalid page slug');
      if (key === 'collection' && !['film','bonus'].includes(String(value))) fail(raw.id + ': invalid movie collection');
      if (key === 'accent' && !color(value)) fail(raw.id + ': invalid accent color');
      if (key === 'iconBackground' && !color(value)) fail(raw.id + ': invalid icon color');
      if (key === 'dim' && (typeof value !== 'number' || value < 0 || value > 0.8)) fail(raw.id + ': invalid wallpaper dimming');
      if (key === 'battery' && (typeof value !== 'number' || value < 0 || value > 100)) fail(raw.id + ': invalid battery');
      if(key==='fontFamily'&&!['Georgia','Arial','serif','sans-serif'].includes(String(value)))fail(raw.id+': invalid font');
      if(key==='shadow'&&!['none','soft','deep'].includes(String(value)))fail(raw.id+': invalid shadow');
      if (key === 'align' && !['left','center','right'].includes(String(value))) fail(raw.id + ': invalid alignment');
      if (key === 'objectFit' && !['cover','contain'].includes(String(value))) fail(raw.id + ': invalid image fit');
      if (key === 'mediaAssetId' && value !== null && (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value))) fail(raw.id + ': invalid media asset');
      if (['mediaWidth','mediaHeight'].includes(key) && value !== null && (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 20000)) fail(raw.id + ': invalid media dimensions');
      if (key === 'variantWidths' && (typeof value !== 'string' || !/^(|480|960|1600|480,960|480,1600|960,1600|480,960,1600)$/.test(value))) fail(raw.id + ': invalid image variants');
      if (key === 'captions') {try {if(typeof value!=='string')throw new Error();parseCaptions(value)}catch{fail(raw.id + ': invalid timed captions')}}
      if (['src','poster','avatar','voiceSrc','callerPhoto','introSrc'].includes(key) && !safeMediaUrl(value)) fail(raw.id + ': unsafe media URL');
      if (['text','alt','className','title','body','category','price','invitation'].includes(key) && typeof value !== 'string') fail(raw.id + ': invalid ' + key);
    }
    if(['answers','answer','acceptedAnswers','story','chapters'].some(key=>Object.hasOwn(raw.props as Record<string,unknown>,key)))fail(raw.id+': private Vault content cannot be stored in a public page');
    const settings=authoredApps.flatMap(app=>appSettingDefinitions[app]);
    for(const {field} of settings){const value=raw.props[field.key];if(value===undefined)continue;if(field.type==='select'&&!field.options?.includes(String(value)))fail(raw.id+': invalid '+field.key);if(['text','textarea'].includes(field.type)&&(typeof value!=='string'||value.length>2000))fail(raw.id+': invalid '+field.key);if(field.type==='number'&&(typeof value!=='number'||!Number.isFinite(value)||value<(field.min??0)||value>(field.max??Infinity)))fail(raw.id+': invalid '+field.key);}
    if(raw.props.runtimeApp!==undefined&&(raw.parentId!==null||raw.type!=='section'||!['camera','vault','pieces'].includes(String(raw.props.runtimeApp))))fail(raw.id+': invalid runtime app');
    if(raw.props.runtimePart!==undefined){if(typeof raw.props.title!=='string'||typeof raw.props.src!=='string')fail(raw.id+': invalid puzzle title or photo');if(raw.props.runtimePart!=='level'||raw.component!=='image')fail(raw.id+': invalid runtime item');for(const key of ['cols','rows'])if(typeof raw.props[key]!=='number'||!Number.isInteger(raw.props[key])||Number(raw.props[key])<2||Number(raw.props[key])>8)fail(raw.id+': invalid puzzle '+key);if(typeof raw.props.ratio!=='number'||raw.props.ratio<.3||raw.props.ratio>3||!['Easy','Moderate','Hard'].includes(String(raw.props.difficulty)))fail(raw.id+': invalid puzzle shape or difficulty');}
    if(raw.props.mediaAssetId && raw.props.src !== '/media/'+raw.props.mediaAssetId) fail(raw.id + ': media source must match asset');
  }
  const runtimeRoots=[...nodes.values()].filter(n=>record(n.props)&&n.props.runtimeApp!==undefined);
  if(runtimeRoots.length>1)fail('Only one runtime app is allowed');
  if(runtimeRoots.length){const root=runtimeRoots[0],props=root.props as Record<string,unknown>;if(input.rootIds.length!==1)fail('Runtime app requires a single root');const children=Array.isArray(root.children)?root.children:[];if(props.runtimeApp!=='pieces'&&children.length)fail('This app has no public content items');if(props.runtimeApp==='pieces'&&(children.length>10||children.some(id=>!record(nodes.get(String(id))?.props)|| (nodes.get(String(id))!.props as Record<string,unknown>).runtimePart!=='level')))fail('Use at most 10 puzzle levels');}
  for(const n of nodes.values())if(record(n.props)&&n.props.runtimePart==='level'&&(!n.parentId||!record(nodes.get(String(n.parentId))?.props)||(nodes.get(String(n.parentId))!.props as Record<string,unknown>).runtimeApp!=='pieces'))fail('Puzzle levels belong inside Pieces of Us');
  if(input.layout!==undefined){
   if(!record(input.layout)||input.layout.version!==1||!['welcome','home','reasons','hotline','adventure','movie','kiss-shop','radio'].includes(String(input.layout.page)))fail('Invalid layout version or page');
  }
  for(const raw of nodes.values()){
   const props=record(raw.props)?raw.props:{};
   if(props.sectionKind!==undefined&&(raw.type!=='section'||!sectionKinds.includes(props.sectionKind as never)))fail(String(raw.id)+': invalid section kind');
   if(props.sectionKind!==undefined&&Array.isArray(raw.children)&&sectionBlocks[String(props.sectionKind)])for(const child of raw.children)if(!sectionBlocks[String(props.sectionKind)].includes(String(nodes.get(String(child))?.component)))fail(String(raw.id)+': incompatible block');
   if(raw.component==='action'&&!['/home','/','/pages/in-my-heart'].includes(String(props.href)))fail(String(raw.id)+': invalid action destination');
   for(const [key,component] of [['sceneId','movie-scene'],['stationId','station']] as const)if(props[key]!==undefined&&props[key]!==''&&(!nodes.has(String(props[key]))||nodes.get(String(props[key]))?.component!==component))fail(String(raw.id)+': missing '+key+' reference');
   if(props.introSrc!==undefined&&!safeMediaUrl(props.introSrc))fail(String(raw.id)+': unsafe intro URL');
   if(props.digit!==undefined&&!/^[0-9]$/.test(String(props.digit)))fail(String(raw.id)+': invalid keypad digit');
  }
  for(const kind of layoutSingletons)if([...nodes.values()].filter(n=>record(n.props)&&n.props.sectionKind===kind).length>1)fail('Only one '+kind+' section is allowed');
  for(const node of nodes.values())if(record(node.props)&&node.props.sectionKind==='affection-keypad'&&Array.isArray(node.children)){const digits=node.children.map(id=>nodes.get(String(id))).filter(n=>n?.visible!==false).map(n=>record(n?.props)?n.props.digit:undefined).filter(x=>x!==undefined);if(new Set(digits).size!==digits.length)fail('Duplicate keypad digits')}
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
