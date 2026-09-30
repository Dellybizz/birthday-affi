// Metadata only. Personal content and real app behavior belong to the content/app phases.
export type AppDefinition = { slug: string; kind: 'reasons' | 'hotline' | 'adventure' | 'movie' | 'shop' | 'radio'; title: string; icon: string };
const apps: AppDefinition[] = [
  { slug: 'reasons', kind: 'reasons', title: 'Reasons I’m Obsessed', icon: '💗' },
  { slug: 'hotline', kind: 'hotline', title: 'Birthday Hotline', icon: '☎️' },
  { slug: 'adventure', kind: 'adventure', title: 'Our Next Adventure', icon: '🧭' },
  { slug: 'movie', kind: 'movie', title: 'Our Birthday Movie', icon: '🎬' },
  { slug: 'kiss-shop', kind: 'shop', title: 'The Kiss Shop', icon: '💋' },
  { slug: 'radio', kind: 'radio', title: 'Birthday Radio', icon: '📻' },
];
export const getPublicApp = (slug: string) => apps.find(app => app.slug === slug);
