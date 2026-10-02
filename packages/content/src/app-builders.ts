export type AppSlug="reasons"|"hotline"|"adventure"|"movie"|"kiss-shop"|"radio";
export type AppField={key:string;label:string;type:"text"|"textarea"|"media"|"number"|"toggle"|"select";options?:{label:string;value:string}[]};
export type AppBuilder={slug:AppSlug;title:string;description:string;fields:AppField[];itemTypes:string[]};
const media=(key:string,label:string):AppField=>({key,label,type:"media"});
export const appBuilders:AppBuilder[]=[
{slug:"reasons",title:"Adore",description:"Manage the personal reasons and optional photos.",itemTypes:["reason"],fields:[{key:"title",label:"Reason",type:"text"},{key:"body",label:"Message",type:"textarea"},media("media","Photo"),{key:"enabled",label:"Visible",type:"toggle"}]},
{slug:"hotline",title:"Birthday Hotline",description:"Manage the birthday call, recordings and keypad messages.",itemTypes:["greeting","button"],fields:[{key:"title",label:"Title",type:"text"},{key:"body",label:"Text fallback",type:"textarea"},media("media","Recording"),{key:"button",label:"Button",type:"text"},{key:"enabled",label:"Enabled",type:"toggle"}]},
{slug:"adventure",title:"Pardanasheen",description:"Manage fit-check photos, videos and albums.",itemTypes:["image","video"],fields:[{key:"title",label:"Media title",type:"text"},{key:"body",label:"Caption",type:"textarea"},media("media","Photo / video"),{key:"album",label:"Album",type:"text"},{key:"enabled",label:"Visible",type:"toggle"}]},
{slug:"movie",title:"Our Birthday Movie",description:"Manage scenes, clips, captions and ending message.",itemTypes:["scene","ending"],fields:[{key:"title",label:"Scene title",type:"text"},media("media","Photo / video"),{key:"body",label:"Caption",type:"textarea"},{key:"durationMs",label:"Duration (ms)",type:"number"},{key:"enabled",label:"Enabled",type:"toggle"}]},
{slug:"kiss-shop",title:"The Kiss Shop",description:"Manage gifts, playful prices and redemption receipts.",itemTypes:["gift"],fields:[{key:"title",label:"Gift name",type:"text"},{key:"body",label:"Description",type:"textarea"},{key:"price",label:"Playful price",type:"text"},media("media","Gift image"),{key:"enabled",label:"Available",type:"toggle"}]},
{slug:"radio",title:"Birthday Radio",description:"Manage stations, songs, dedications and audio.",itemTypes:["station","track"],fields:[{key:"title",label:"Title",type:"text"},{key:"body",label:"Dedication",type:"textarea"},media("media","Audio / cover"),{key:"position",label:"Track order",type:"number"},{key:"enabled",label:"Enabled",type:"toggle"}]}
];
export const getAppBuilder=(slug:string)=>appBuilders.find(x=>x.slug===slug);
