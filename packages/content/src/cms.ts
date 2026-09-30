export type CMSField = string | number | boolean | null;
export type CMSNode = { id: string; type: 'section' | 'block'; component: string; parentId: string | null; props: Record<string, CMSField>; children: string[]; visible: boolean };
export type PageDocument = { schemaVersion: 2; nodes: CMSNode[]; rootIds: string[]; theme?: Record<string, CMSField> };
export const defaultTheme = { primary: '#d86f91', background: '#fbf5ef', surface: '#ffffff', text: '#302927', muted: '#81736d', radius: 24 };
export const emptyPage = (): PageDocument => ({ schemaVersion: 2, nodes: [], rootIds: [], theme: defaultTheme });
