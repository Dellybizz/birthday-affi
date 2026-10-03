export type CmsAppKind='reasons'|'hotline'|'adventure'|'movie'|'shop'|'radio'|'camera'|'vault';
export type ExperienceLifecycle='active'|'runtime'|'legacy';
export type ExperienceAuthoring='document'|'runtime'|'preserved';
export type ExperienceSurface='page'|'phone';

export type ExperienceDefinition={
 slug:string;
 title:string;
 livePath:string|null;
 order:number;
 lifecycle:ExperienceLifecycle;
 authoring:ExperienceAuthoring;
 surface:ExperienceSurface;
 icon?:string;
 appKind?:CmsAppKind;
};

// Canonical metadata only. Personal content belongs to page documents; visitor/runtime state
// belongs to the runtime stores. Admin and public routing both derive from this registry.
export const experienceRegistry:readonly ExperienceDefinition[]=[
 {slug:'memories-archive',title:'Memories Archive',livePath:'/',order:0,lifecycle:'active',authoring:'document',surface:'page'},
 {slug:'in-my-heart',title:'In My Heart',livePath:'/pages/in-my-heart',order:1,lifecycle:'active',authoring:'document',surface:'page'},
 {slug:'home',title:'iPhone Home',livePath:'/home',order:2,lifecycle:'active',authoring:'document',surface:'phone'},
 {slug:'reasons',title:'Adore',livePath:'/app/reasons',order:3,lifecycle:'active',authoring:'document',surface:'phone',icon:'💗',appKind:'reasons'},
 {slug:'hotline',title:'Hotdial',livePath:'/app/hotline',order:4,lifecycle:'active',authoring:'document',surface:'phone',icon:'☎️',appKind:'hotline'},
 {slug:'adventure',title:'Pardanasheen',livePath:'/app/adventure',order:5,lifecycle:'active',authoring:'document',surface:'phone',icon:'🌸',appKind:'adventure'},
 {slug:'movie',title:'Saragram',livePath:'/app/movie',order:6,lifecycle:'active',authoring:'document',surface:'phone',icon:'📷',appKind:'movie'},
 {slug:'kiss-shop',title:'Kiss Shop',livePath:'/app/kiss-shop',order:7,lifecycle:'active',authoring:'document',surface:'phone',icon:'💋',appKind:'shop'},
 {slug:'camera',title:'Clicksara',livePath:'/app/camera',order:20,lifecycle:'runtime',authoring:'runtime',surface:'phone',icon:'📷',appKind:'camera'},
 {slug:'vault',title:'Vault',livePath:'/app/vault',order:21,lifecycle:'runtime',authoring:'runtime',surface:'phone',icon:'🔐',appKind:'vault'},
 {slug:'pieces',title:'Pieces of Us',livePath:'/app/pieces',order:22,lifecycle:'runtime',authoring:'runtime',surface:'phone',icon:'🧩'},
 {slug:'welcome',title:'Welcome',livePath:null,order:90,lifecycle:'legacy',authoring:'preserved',surface:'page'},
 {slug:'radio',title:'Birthday Radio',livePath:null,order:91,lifecycle:'legacy',authoring:'preserved',surface:'phone',icon:'📻',appKind:'radio'}
];

export const activeDocumentExperiences:readonly ExperienceDefinition[]=experienceRegistry.filter(experience=>experience.lifecycle==='active'&&experience.authoring==='document');
export const runtimeExperiences:readonly ExperienceDefinition[]=experienceRegistry.filter(experience=>experience.lifecycle==='runtime');
export const legacyExperiences:readonly ExperienceDefinition[]=experienceRegistry.filter(experience=>experience.lifecycle==='legacy');

const bySlug=new Map<string,ExperienceDefinition>(experienceRegistry.map(experience=>[experience.slug,experience]));
const normalizePath=(value:string)=>{const path=(value.split(/[?#]/,1)[0]||'/').replace(/\/+$/,'');return path||'/'};
const byPath=new Map<string,ExperienceDefinition>(experienceRegistry.filter(experience=>experience.livePath).map(experience=>[normalizePath(experience.livePath!),experience]));

export function getExperience(slug:string|null|undefined){return slug?bySlug.get(slug):undefined}
export function getExperienceByLivePath(pathname:string|null|undefined){return pathname?byPath.get(normalizePath(pathname)):undefined}
export function isPhoneExperiencePath(pathname:string|null|undefined){return getExperienceByLivePath(pathname)?.surface==='phone'}
