import {experienceRegistry} from './experience-registry';

// Every built-in document/preserved experience has a route contract. Runtime-only apps do
// not own a pages row, so only non-runtime registry entries participate in page lifecycle.
export const protectedPageSlugs=experienceRegistry.filter(experience=>experience.authoring!=='runtime').map(experience=>experience.slug);

export function parsePageSettings(input:{title:string;slug:string;description:string}){
 const title=input.title.trim(),slug=input.slug.trim(),description=input.description.trim();
 if(!title||title.length>120)throw new Error('Title must contain 1–120 characters.');
 if(!/^[a-z][a-z0-9-]{0,63}$/.test(slug))throw new Error('Use a lowercase slug starting with a letter (maximum 64 characters).');
 if(description.length>300)throw new Error('Description is limited to 300 characters.');
 return {title,slug,description};
}
