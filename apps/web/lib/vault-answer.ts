import 'server-only';
import {createHash} from 'node:crypto';
// Server-only answer matching: never import this module into a client component.
const fillers=new Set(['my','your','our','me','i','you','we','us','u','ur','the','a','an','is','was','were','are','when','that','time','memory','favourite','favorite','of','about','each','other','s','both','together','it','and','for','first']);
export function matchesVaultAnswer(input:unknown):boolean{
 if(typeof input!=='string'||input.length>160)return false;
 const words=input.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z\s']/g,' ').replace(/'/g,' ').trim().split(/\s+/);
 if(words.length>24)return false;
 const irregular:Record<string,string>={held:'hold',met:'meet',went:'go',fell:'fall',ran:'run',sat:'sit',saw:'see',came:'come'};
 const meaningful=words.filter(word=>!fillers.has(word)).map(word=>irregular[word]??word.replace(/ing$/,'').replace(/s$/,''));
 return createHash('sha256').update(meaningful.join(' ')).digest('hex')==='7d921183cc93386ab60f70bb2d44faa59f38f4fd8695a0320f637a8a598dabe2';
}
