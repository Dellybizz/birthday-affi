import type {Metadata} from 'next';
import {getPublicPageInfo} from './cms';
import {getExperience} from '@wiffeyyyy/content';
export async function publishedPageMetadata(slug:string):Promise<Metadata>{
 const info=await getPublicPageInfo(slug);if(!info)return {};
 const title=info.metadata.seoTitle||info.metadata.title,description=info.metadata.seoDescription||info.metadata.description;
 return {title,description,robots:info.metadata.noIndex?{index:false,follow:true}:undefined,openGraph:{title,description,...(info.metadata.socialImage?{images:[info.metadata.socialImage]}:{})},alternates:{canonical:getExperience(info.slug)?.livePath??'/pages/'+info.slug}};
}
