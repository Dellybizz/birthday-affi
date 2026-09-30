export type NodeType='section'|'block';
export type ContentNode={id:string;type:NodeType;component:string;parentId:string|null;props:Record<string,unknown>;children:string[]};
export type PageDocument={schemaVersion:1;nodes:ContentNode[];rootIds:string[]};
export const emptyDocument=():PageDocument=>({schemaVersion:1,nodes:[],rootIds:[]});
