export type BagLine={id:string;choice:string};
export type ReceiptLine={id:string;title:string;price:string;kisses:number;choice:string};
export type KissReceipt={id:string;createdAt:string;lines:ReceiptLine[]};
export type KissShopState={version:1;bag:BagLine[];receipts:KissReceipt[]};
export const emptyKissShopState=():KissShopState=>({version:1,bag:[],receipts:[]});
export function kissPrice(price:string):number|null{
 if(/^(?:on the house|free)(?:\s*♡)?$/i.test(price.trim()))return 0;
 const match=price.trim().match(/^(\d+)\s+(?:\w+\s+)?kiss(?:es)?$/i);if(!match)return null;
 const n=Number(match[1]);return n<=1000?n:null;
}
export function parseKissShopState(raw:string|null,ids:string[]):KissShopState{
 try{if(!raw||raw.length>200000)return emptyKissShopState();const data=JSON.parse(raw);if(data?.version!==1)return emptyKissShopState();
 const bag:BagLine[]=[],seen=new Set<string>();
 if(Array.isArray(data.bag))for(const x of data.bag){if(typeof x?.id==='string'&&ids.includes(x.id)&&!seen.has(x.id)){seen.add(x.id);bag.push({id:x.id,choice:typeof x.choice==='string'?x.choice.slice(0,120):''})}}
 const receipts:KissReceipt[]=[];
 if(Array.isArray(data.receipts))for(const r of data.receipts.slice(0,50)){
  if(typeof r?.id!=='string'||r.id.length>100||typeof r.createdAt!=='string'||!Number.isFinite(Date.parse(r.createdAt))||!Array.isArray(r.lines)||!r.lines.length||r.lines.length>50)continue;
  const lines=r.lines.filter((l:ReceiptLine)=>typeof l?.id==='string'&&typeof l.title==='string'&&typeof l.price==='string'&&Number.isInteger(l.kisses)&&l.kisses>=0&&l.kisses<=1000).map((l:ReceiptLine)=>({id:l.id.slice(0,100),title:l.title.slice(0,200),price:l.price.slice(0,100),kisses:l.kisses,choice:typeof l.choice==='string'?l.choice.slice(0,120):''}));
  if(lines.length)receipts.push({id:r.id,createdAt:r.createdAt,lines});
 }
 return {version:1,bag:bag.slice(0,50),receipts};
 }catch{return emptyKissShopState()}
}
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function kissReceiptSvg(receipt:KissReceipt){
 const lines=['KissShop · Our little plans',receipt.id,new Date(receipt.createdAt).toISOString().slice(0,10),...receipt.lines.flatMap(l=>[l.title+' · '+l.price,...(l.choice?[l.choice]:[])]),'Total: '+receipt.lines.reduce((n,l)=>n+l.kisses,0)+' kisses','No expiry date. Just us.','Show me when we meet.'];
 const wrapped=lines.flatMap(s=>s.match(/.{1,42}(?:\s|$)|.{1,42}/g)??[]);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="${160+wrapped.length*31}"><rect width="100%" height="100%" rx="24" fill="#fff6e8"/><rect x="18" y="18" width="524" height="${124+wrapped.length*31}" rx="18" fill="none" stroke="#d7bda4" stroke-dasharray="4 5"/>${wrapped.map((line,i)=>`<text x="42" y="${67+i*31}" fill="#804149" font-family="Georgia,serif" font-size="${i===0?24:16}">${xml(line)}</text>`).join('')}</svg>`;
}
