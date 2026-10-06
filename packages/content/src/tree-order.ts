import type {CMSNode,PageDocument} from './cms';
/** Traverse the saved hierarchy, rather than the incidental storage array order. */
export function getOrderedNodes(document:PageDocument):CMSNode[]{
 const byId=new Map(document.nodes.map(node=>[node.id,node])),ordered:CMSNode[]=[],seen=new Set<string>();
 const visit=(id:string)=>{if(seen.has(id))return;seen.add(id);const node=byId.get(id);if(!node)return;ordered.push(node);node.children.forEach(visit)};
 document.rootIds.forEach(visit);return ordered;
}
