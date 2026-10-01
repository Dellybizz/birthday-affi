import {HomeNavigation} from '../../components/home-navigation';
import {getPublicNavigation} from '../../lib/cms';
import { getPublishedDocument } from '../../lib/cms';
import { CMSRenderer } from '@wiffeyyyy/ui/cms-renderer';
import { HomeScreen } from '../../components/home-screen';
export const dynamic='force-dynamic';
export default async function Home(){const [document,navigation]=await Promise.all([getPublishedDocument('home'),getPublicNavigation()]);return document?<main className="os-home"><CMSRenderer document={document} embedded/>{navigation&&!document.nodes.some(n=>n.component==='app-grid')&&<HomeNavigation items={navigation}/>}</main>:<HomeScreen navigation={navigation}/>}

export async function generateMetadata(){const {getPublicPageInfo}=await import('../../lib/cms');const info=await getPublicPageInfo('home');return info?{title:info.metadata.title,description:info.metadata.description}:{};}
