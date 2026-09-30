export type AppDefinition={slug:string;title:string;icon:string;description:string;accent:string;kind:"reasons"|"hotline"|"adventure"|"movie"|"shop"|"radio"};
export const apps:AppDefinition[]=[
{slug:"reasons",title:"Reasons I’m Obsessed",icon:"💗",description:"Little things I love about you.",accent:"#d86f91",kind:"reasons"},
{slug:"hotline",title:"Birthday Hotline",icon:"☎️",description:"A call, a voice, a little affection.",accent:"#c96f61",kind:"hotline"},
{slug:"adventure",title:"Our Next Adventure",icon:"🧭",description:"Pick the kind of day we should have.",accent:"#7f9b72",kind:"adventure"},
{slug:"movie",title:"Our Birthday Movie",icon:"🎬",description:"A tiny film about us.",accent:"#77668f",kind:"movie"},
{slug:"kiss-shop",title:"The Kiss Shop",icon:"💋",description:"Gifts, promises, and things to redeem.",accent:"#c85f77",kind:"shop"},
{slug:"radio",title:"Birthday Radio",icon:"📻",description:"Songs with a reason behind them.",accent:"#6f8da8",kind:"radio"}];
export function getPublicApp(slug:string){return apps.find(a=>a.slug===slug);}
