export const sectionKinds=['startup-greeting','welcome-hero','enter-action','keepsake-note','birthday-heading','date-widget','app-launcher','recent-app','intro','reason-deck','heartfelt-card','incoming-call','birthday-message','affection-keypad','text-versions','choice-group','invitation-reveal','movie-credits','movie-player','movie-chapters','birthday-ending','product-collection','gift-bag','gift-checkout','gift-receipt','redemption-note','station-selector','radio-player','dedication','track-list'] as const;
export type SectionKind=typeof sectionKinds[number];
export const layoutSingletons=['incoming-call','birthday-message','affection-keypad','invitation-reveal','movie-player','movie-chapters','product-collection','gift-bag','gift-checkout','gift-receipt','station-selector','radio-player','track-list'] as const;
export const sectionBlocks:Record<string,string[]>={
 'startup-greeting':['text'],'welcome-hero':['heading','text'],'enter-action':['action'],'keepsake-note':['text'],
 'birthday-heading':['heading','text'],'date-widget':['text'],'app-launcher':['app-grid'],'recent-app':['text'],'intro':['heading','text'],
 'reason-deck':['reason'],'heartfelt-card':['heading','text'],'incoming-call':[],'birthday-message':['hotline-message'],
 'affection-keypad':['hotline-message'],'text-versions':['text'],'choice-group':['adventure-choice'],'invitation-reveal':['invitation'],
 'movie-credits':['heading','text'],'movie-player':['movie-scene'],'movie-chapters':['chapter'],'birthday-ending':['heading','text'],
 'product-collection':['kiss-gift'],'gift-bag':[],'gift-checkout':[],'gift-receipt':[],'redemption-note':['text'],
 'station-selector':['station'],'radio-player':[],'dedication':['text'],'track-list':['radio-track'],
};
