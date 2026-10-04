import {PuzzleApp} from '@wiffeyyyy/ui/puzzle-app';
import {getPublishedRuntimeAppConfiguration} from '../../../lib/cms';
export const metadata={title:'Pieces of Us'};
export default async function PiecesPage(){const config=await getPublishedRuntimeAppConfiguration('pieces');return <PuzzleApp config={config.slug==='pieces'?config:undefined}/>;}
