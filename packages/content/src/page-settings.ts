import {safeMediaUrl} from './validate';
import {experienceRegistry} from './experience-registry';

// Every document/preserved experience has a route contract, including document-backed runtime apps.
export const protectedPageSlugs=experienceRegistry.filter(experience=>experience.authoring!=='runtime').map(experience=>experience.slug);

export function parsePageSettings(input:{title:string;slug:string;description:string;seoTitle?:string;seoDescription?:string;socialImage?:string;noIndex?:boolean}){
 const title=input.title.trim(),slug=input.slug.trim(),description=input.description.trim();
 if(!title||title.length>120)throw new Error('Title must contain 1–120 characters.');
 if(!/^[a-z][a-z0-9-]{0,63}$/.test(slug))throw new Error('Use a lowercase slug starting with a letter (maximum 64 characters).');
 if(description.length>300)throw new Error('Description is limited to 300 characters.');
 const seoTitle=input.seoTitle?.trim(),seoDescription=input.seoDescription?.trim(),socialImage=input.socialImage?.trim();
 if(seoTitle&&seoTitle.length>70)throw new Error('Search title is limited to 70 characters.');
 if(seoDescription&&seoDescription.length>160)throw new Error('Search description is limited to 160 characters.');
 if(socialImage&&!safeMediaUrl(socialImage))throw new Error('Use a safe media URL for the sharing image.');
 if(input.noIndex!==undefined&&typeof input.noIndex!=='boolean')throw new Error('Invalid search visibility.');
 return {title,slug,description,...(input.seoTitle!==undefined?{seoTitle:seoTitle??''}:{}),...(input.seoDescription!==undefined?{seoDescription:seoDescription??''}:{}),...(input.socialImage!==undefined?{socialImage:socialImage??''}:{}),...(input.noIndex!==undefined?{noIndex:input.noIndex}:{})};
}
