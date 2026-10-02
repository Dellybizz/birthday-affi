import type { CMSNode, PageDocument } from './cms';
import { parsePageDocument } from './validate';
import { createNode } from './registry';
export type Breakpoint='mobile'|'tablet'|'desktop';
export const responsiveFields=['background','color','padding','margin','radius','opacity','size','weight','align','columns','gap','objectFit','focalX','focalY','displayHeight'] as const;
export function resolveResponsive(node:CMSNode,device:Breakpoint):CMSNode {
 const props={...node.props};
 for(const key of responsiveFields){const override=props[device+':'+key];if(override!==undefined)props[key]=override}
 return {...node,props};
}
export function resetResponsive(document:PageDocument,id:string,device:Breakpoint):PageDocument {
 const next=structuredClone(document),node=next.nodes.find(n=>n.id===id);if(!node)throw new Error('Layer not found');
 for(const key of responsiveFields)delete node.props[device+':'+key];
 return parsePageDocument(next);
}
export function searchNodes(document:PageDocument,query:string):CMSNode[]{
 const q=query.trim().toLocaleLowerCase();if(!q)return [];
 return document.nodes.filter(n=>[n.label,n.component,...Object.values(n.props).filter(v=>typeof v==='string')].join(' ').toLocaleLowerCase().includes(q));
}
export type RevisionChange={id:string;label:string;kind:'added'|'removed'|'changed';fields:string[]};
export function compareDocuments(before:PageDocument,after:PageDocument):RevisionChange[]{
 const a=new Map(before.nodes.map(n=>[n.id,n])),b=new Map(after.nodes.map(n=>[n.id,n]));
 const changes:RevisionChange[]=[];
 for(const id of new Set([...a.keys(),...b.keys()])){
  const old=a.get(id),node=b.get(id),label=node?.label??old?.label??id;
  if(!old||!node){changes.push({id,label,kind:old?'removed':'added',fields:[]});continue}
  const fields=['label','visible','parentId','component','children'].filter(k=>JSON.stringify(old[k as keyof CMSNode])!==JSON.stringify(node[k as keyof CMSNode]));
  for(const key of new Set([...Object.keys(old.props),...Object.keys(node.props)]))if(old.props[key]!==node.props[key])fields.push('settings.'+key);
  if(fields.length)changes.push({id,label,kind:'changed',fields});
 }
 if(JSON.stringify(before.theme)!==JSON.stringify(after.theme))changes.push({id:'theme',label:'Page theme',kind:'changed',fields:['theme']});
 if(JSON.stringify(before.rootIds)!==JSON.stringify(after.rootIds))changes.push({id:'order',label:'Section order',kind:'changed',fields:['rootIds']});
 return changes;
}
export const pageTemplates=[{id:'greeting',label:'Birthday greeting'},{id:'photo-story',label:'Photo story'},{id:'app-home',label:'App home'}, {id:'reasons',label:'Adore'}, {id:'hotline',label:'Birthday Hotline'}, {id:'adventure',label:'Pardanasheen'}, {id:'movie',label:'Saragram'}, {id:'kiss-shop',label:'The Kiss Shop'}, {id:'radio',label:'Birthday Radio'}, {id:'final-reveal',label:'Final reveal'}] as const;
export function appendTemplate(document:PageDocument,template:string,newId:()=>string):PageDocument{
 if(!pageTemplates.some(t=>t.id===template))throw new Error('Unknown template');
 const next=structuredClone(document),section:CMSNode=createNode('section',newId());section.label=pageTemplates.find(t=>t.id===template)!.label;
 const heading=createNode('heading',newId(),section.id);heading.props.text=template==='app-home'?'Your birthday home':'Happy birthday, favourite person.';
 const text=createNode('text',newId(),section.id);text.props.text='Write your personal message here.';
 const nodes:CMSNode[]=[heading,text];
 if(template==='photo-story')nodes.push(createNode('image',newId(),section.id));
 if(template==='app-home')nodes.push(createNode('app-grid',newId(),section.id));
 const layouts:Record<string,{component:Parameters<typeof createNode>[0];titles:string[]}>={
  reasons:{component:'reason',titles:['A little habit I love','The way you make me feel','My most heartfelt reason']},
  hotline:{component:'hotline-message',titles:['Your birthday greeting','Press 1 for a compliment','Press 2 for emergency affection']},
  adventure:{component:'image',titles:['Fit check','Another favourite look']},
  movie:{component:'movie-scene',titles:['Opening credits','Our favourite memories','Your birthday ending']},
  'kiss-shop':{component:'kiss-gift',titles:['Movie night','A long hug','Breakfast together','A handwritten letter']},
  radio:{component:'radio-track',titles:['Birthday dedication','A song that reminds me of you','Our favourite song']},
 };
 const layout=layouts[template];
 if(layout){heading.props.text=section.label;text.props.text='Make this space yours. Select each card to edit its message and media.';
  for(const title of layout.titles){const node:CMSNode=createNode(layout.component,newId(),section.id);node.label=title;node.props.title=title;node.props.body='Add your personal message here.';if(layout.component==='adventure-choice')node.props.invitation='Add a real date plan you can arrange.';nodes.push(node)}
 }
 if(template==='final-reveal'){heading.props.text='One last thing…';text.props.text='Write your most heartfelt birthday message here.'}

 section.children=nodes.map(n=>n.id);next.rootIds.push(section.id);next.nodes.push(section,...nodes);
 return parsePageDocument(next);
}
export function exportSection(document:PageDocument,id:string):PageDocument{
 const root=document.nodes.find(n=>n.id===id);if(root?.type!=='section')throw new Error('Choose a section');
 const ids=new Set<string>();const visit=(id:string)=>{ids.add(id);document.nodes.find(n=>n.id===id)!.children.forEach(visit)};visit(id);
 const nodes=structuredClone(document.nodes.filter(n=>ids.has(n.id)));nodes.find(n=>n.id===id)!.parentId=null;
 return parsePageDocument({schemaVersion:2,nodes,rootIds:[id],theme:document.theme});
}
export function importSection(document:PageDocument,input:unknown,newId:()=>string):PageDocument{
 const source=parsePageDocument(input);if(source.rootIds.length!==1)throw new Error('A reusable section must have one root');
 const remap=new Map(source.nodes.map(n=>[n.id,newId()]));
 const nodes=source.nodes.map(n=>({...n,id:remap.get(n.id)!,parentId:n.parentId?remap.get(n.parentId)!:null,children:n.children.map(id=>remap.get(id)!)}));
 return parsePageDocument({...structuredClone(document),nodes:[...document.nodes,...nodes],rootIds:[...document.rootIds,remap.get(source.rootIds[0])!]});
}
