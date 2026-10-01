import type { CMSField } from './cms';
export const componentRegistry = {
  section: { label: 'Section', type: 'section', defaults: { padding: 20, radius: 24, background: 'transparent' } },
  heading: { label: 'Heading', type: 'block', defaults: { text: '', size: 30, weight: 600, align: 'left' } },
  text: { label: 'Paragraph', type: 'block', defaults: { text: '', size: 16, align: 'left' } },
  image: { label: 'Image', type: 'block', defaults: { src: '', alt: '' } },
  'app-grid': { label: 'App grid', type: 'block', defaults: { columns: 2, gap: 12 } },
} as const;
export type ComponentName = keyof typeof componentRegistry;
export function createNode(component: ComponentName, id: string, parentId: string | null = null) {
  const definition = componentRegistry[component];
  return { id, type: definition.type, component, parentId, label: definition.label,
    props: { ...definition.defaults } as Record<string, CMSField>, children: [] as string[], visible: true };
}
