import type { CMSField } from './cms';
export const componentRegistry = {
  section: { label: 'Section', type: 'section', defaults: { padding: 20, radius: 24, background: 'transparent' } },
  heading: { label: 'Heading', type: 'block', defaults: { text: '', size: 30, weight: 600, align: 'left' } },
  text: { label: 'Paragraph', type: 'block', defaults: { text: '', size: 16, align: 'left' } },
  image: { label: 'Image', type: 'block', defaults: { src: '', alt: '', objectFit: 'cover', focalX: 50, focalY: 50 } },
  video: { label: 'Video', type: 'block', defaults: { src: '', alt: '' } },
  audio: { label: 'Audio', type: 'block', defaults: { src: '', alt: '' } },
  reason: {label:'Reason card',type:'block',defaults:{title:'A little reason',body:'',category:'Little things',src:'',alt:''}},
  'hotline-message': {label:'Hotline message',type:'block',defaults:{title:'Birthday message',body:'',src:'',alt:''}},
  'adventure-choice': {label:'Adventure choice',type:'block',defaults:{title:'Our next adventure',body:'',invitation:'It’s a date.'}},
  'movie-scene': {label:'Movie scene',type:'block',defaults:{title:'Our little movie',body:'',src:'',alt:''}},
  'kiss-gift': {label:'Kiss shop gift',type:'block',defaults:{title:'A gift for you',body:'',price:'1 kiss',src:'',alt:''}},
  'radio-track': {label:'Radio track',type:'block',defaults:{title:'Our song',body:'',src:'',alt:''}},
  'app-grid': { label: 'App grid', type: 'block', defaults: { columns: 2, gap: 12 } },
} as const;
export type ComponentName = keyof typeof componentRegistry;
export function createNode(component: ComponentName, id: string, parentId: string | null = null) {
  const definition = componentRegistry[component];
  return { id, type: definition.type, component, parentId, label: definition.label,
    props: { ...definition.defaults } as Record<string, CMSField>, children: [] as string[], visible: true };
}
