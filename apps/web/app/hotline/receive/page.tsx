import {LiveHotline} from '@wiffeyyyy/ui/live-hotline';
export const metadata={title:'Your private Hotline receiver',robots:{index:false,follow:false},referrer:'no-referrer' as const};
export default function Receiver(){return <main className="os-home"><LiveHotline receiver/></main>}
