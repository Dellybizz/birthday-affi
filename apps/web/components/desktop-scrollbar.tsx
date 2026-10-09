'use client';
import {useEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';

const scrollAreas='.sara-scroll,.pard-content,.adore-content,.kiss-scroll,.vault-entrance,.vault-story,.book-reading-window,.pieces-scroll,.phone-notifications,.os-home';
type Position={top:number;max:number;height:number;controls:string};
/** Desktop scroll control lives outside the scaled phone; app scroll positions remain native. */
export function DesktopScrollbar({enabled}:{enabled:boolean}){
 const baseId=useId(),sequence=useRef(0),pathname=usePathname(),source=useRef<HTMLElement|null>(null),rail=useRef<HTMLDivElement>(null);
 const [host,setHost]=useState<HTMLElement|null>(null),[position,setPosition]=useState<Position>({top:0,max:0,height:0,controls:''});
 const drag=useRef<{y:number;top:number}|null>(null);
 useEffect(()=>{
  if(!enabled)return;
  const desktop=matchMedia('(min-width: 768px) and (pointer: fine)');let frame=0,observed:HTMLElement|null=null;
  const read=()=>{const el=source.current;setPosition(el?{top:el.scrollTop,max:Math.max(0,el.scrollHeight-el.clientHeight),height:el.clientHeight,controls:el.id}:{top:0,max:0,height:0,controls:''})};
  const resize=new ResizeObserver(()=>schedule());
  const refresh=()=>{
   frame=0;
   const modal=document.querySelector<HTMLElement>('dialog:modal'),scope=modal??document.querySelector<HTMLElement>('#birthday-content');
   const shade=document.querySelector<HTMLElement>('.os-universal-shade[data-open="true"],.phone-shade[data-open="true"]');
   const candidates=desktop.matches?(shade?[...shade.querySelectorAll<HTMLElement>('.phone-notifications')]:scope?[...scope.querySelectorAll<HTMLElement>(modal?'*':scrollAreas),...(modal?[modal]:[])]:[]):[];
   const next=candidates.filter(el=>{const css=getComputedStyle(el);return el.getClientRects().length>0&&css.visibility!=='hidden'&&/auto|scroll/.test(css.overflowY)&&el.scrollHeight>el.clientHeight+1}).sort((a,b)=>(b.scrollHeight-b.clientHeight)-(a.scrollHeight-a.clientHeight))[0]??null;
   if(next!==observed){resize.disconnect();if(next){resize.observe(next);for(const child of next.children)resize.observe(child)}observed=next;}
   if(next&&!next.id)next.id=baseId+'-scroll-'+(++sequence.current);
   source.current=next;setHost(next?(modal??document.body):null);read();
  };
  function schedule(){if(!frame)frame=requestAnimationFrame(refresh)}
  const mutation=new MutationObserver(records=>{if(records.some(r=>!rail.current?.contains(r.target)&&!(r.target instanceof Element&&r.target.closest('.desktop-scrollbar'))))schedule()});
  mutation.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','open','hidden','data-open']});
  const scroll=(event:Event)=>{if(event.target===source.current)read()};
  document.addEventListener('scroll',scroll,true);document.addEventListener('toggle',schedule,true);window.addEventListener('resize',schedule);desktop.addEventListener('change',schedule);schedule();
  return()=>{cancelAnimationFrame(frame);resize.disconnect();mutation.disconnect();document.removeEventListener('scroll',scroll,true);document.removeEventListener('toggle',schedule,true);window.removeEventListener('resize',schedule);desktop.removeEventListener('change',schedule);source.current=null;};
 },[enabled,pathname,baseId]);
 const move=(top:number)=>{const el=source.current;if(el)el.scrollTop=Math.max(0,Math.min(position.max,top))};
 if(!enabled||!host||position.max<=0)return null;
 const thumb=Math.max(3,100*position.height/(position.max+position.height)),offset=(100-thumb)*position.top/position.max;
 return createPortal(<div ref={rail} className="desktop-scrollbar" role="scrollbar" aria-label="Scroll current app" aria-controls={position.controls} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.round(position.max)} aria-valuenow={Math.round(position.top)} tabIndex={0}
  onKeyDown={event=>{const steps:Record<string,number>={ArrowDown:48,ArrowUp:-48,PageDown:position.height*.9,PageUp:-position.height*.9};if(event.key in steps){event.preventDefault();move(position.top+steps[event.key])}else if(event.key==='Home'||event.key==='End'){event.preventDefault();move(event.key==='Home'?0:position.max)}}}
  onWheel={event=>{event.preventDefault();move(position.top+event.deltaY)}}
  onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);const rect=event.currentTarget.getBoundingClientRect();if(!(event.target as Element).closest('.desktop-scrollbar-thumb'))move((event.clientY-rect.top)/rect.height*(position.max+position.height)-position.height/2);drag.current={y:event.clientY,top:source.current?.scrollTop??0};}}
  onPointerMove={event=>{if(!drag.current||!rail.current)return;const travel=rail.current.clientHeight*(1-thumb/100);if(travel>0)move(drag.current.top+(event.clientY-drag.current.y)*position.max/travel)}}
  onPointerUp={()=>{drag.current=null}} onPointerCancel={()=>{drag.current=null}}>
  <div className="desktop-scrollbar-thumb" style={{height:thumb+'%',top:offset+'%'}}/>
 </div>,host);
}
