// Metadata only. Personal content and real app behavior belong to the content/app phases.
export type AppDefinition = { slug: string; kind: 'reasons' | 'hotline' | 'adventure' | 'movie' | 'shop' | 'radio' | 'camera'; title: string; icon: string };
const apps: AppDefinition[] = [
  { slug: 'reasons', kind: 'reasons', title: 'Adore', icon: '💗' },
  { slug: 'hotline', kind: 'hotline', title: 'Hotdial', icon: '☎️' },
  { slug: 'adventure', kind: 'adventure', title: 'Pardanasheen', icon: '🌸' },
  { slug: 'movie', kind: 'movie', title: 'Saragram', icon: '📷' },
  { slug: 'kiss-shop', kind: 'shop', title: 'The Kiss Shop', icon: '💋' },
  { slug: 'camera', kind: 'camera', title: 'Clicksara', icon: '📷' },
];
export const getPublicApp = (slug: string) => apps.find(app => app.slug === slug);
