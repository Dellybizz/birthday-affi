import {experienceRegistry,type CmsAppKind} from './experience-registry';

// App-content adapter metadata is derived from the canonical experience registry.
// Runtime-only experiences without a CMS app kind (for example Pieces of Us) still live
// in the registry and are resolved through getExperience/getExperienceByLivePath.
export type AppDefinition={slug:string;kind:CmsAppKind;title:string;icon:string};
const apps:AppDefinition[]=experienceRegistry.flatMap(experience=>experience.appKind&&experience.icon?[{slug:experience.slug,kind:experience.appKind,title:experience.title,icon:experience.icon}]:[]);
export const getPublicApp=(slug:string)=>apps.find(app=>app.slug===slug);
