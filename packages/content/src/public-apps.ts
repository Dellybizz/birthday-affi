// Metadata only. Personal content and real app behavior belong to the content/app phases.
export type AppDefinition = { slug: string; kind: 'reasons' | 'hotline' | 'adventure' | 'movie' | 'shop' | 'radio'; title: string; icon: string };
const apps: AppDefinition[] = [
  { slug: 'reasons', kind: 'reasons', title: 'Adore', icon: '💗' },
  { slug: 'hotline', kind: 'hotline', title: 'Birthday Hotline', icon: '☎️' },
  { slug: 'adventure', kind: 'adventure', title: 'Pardanasheen', icon: '🌸' },
  { slug: 'movie', kind: 'movie', title: 'Saragram', icon: '📷' },
  { slug: 'kiss-shop', kind: 'shop', title: 'The Kiss Shop', icon: '💋' },
  { slug: 'radio', kind: 'radio', title: 'Birthday Radio', icon: '📻' },
];
export const getPublicApp = (slug: string) => apps.find(app => app.slug === slug);
