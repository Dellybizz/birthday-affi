// The original 3D engine runs inside an isolated frame. Only CMS data and scoped events cross it.
export const HEART_BRIDGE=String.raw`
let cmsDocument=null,editingHeart=false,heartMotionOff=false,sceneSettings={},appearanceSettings={},previousScene='',previousMemories='',heartSelectedId='',heartAudioAllowed=false;
const inheritedHidden=new Set();
function heartEnabled(v){return v!==false&&v!=='false'}
function heartNumber(v,fallback,min,max){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback}
function heartRgba(hex,a){if(!/^#[0-9a-f]{6}$/i.test(hex||''))return hex;return 'rgba('+parseInt(hex.slice(1,3),16)+','+parseInt(hex.slice(3,5),16)+','+parseInt(hex.slice(5,7),16)+','+a+')'}
function heartStyle(el,p){
 for(const key of ['background','color','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','marginTop','marginRight','marginBottom','marginLeft','opacity','fontFamily','lineHeight','fontWeight','borderColor'])if(p[key]!==undefined)el.style[key]=typeof p[key]==='number'&&!['opacity','lineHeight','fontWeight'].includes(key)?p[key]+'px':p[key];
 for(const [key,css] of [['radius','borderRadius'],['size','fontSize'],['weight','fontWeight'],['letterSpacing','letterSpacing'],['borderWidth','borderWidth'],['maxWidth','maxWidth']])if(p[key]!==undefined)el.style[css]=p[key]+(['weight'].includes(key)?'':'px');
 if(p.borderWidth)el.style.borderStyle='solid';
 if(p.align)el.style.textAlign=p.align;
 if(p.displayHeight)el.style.height=p.displayHeight+'px';
 if(p.shadow)el.style.boxShadow=p.shadow==='none'?'none':p.shadow==='soft'?'0 10px 35px #0003':'0 22px 58px #0006';
}
function heartElement(part){const map={page:'body',intro:'#boot',tools:'.hud',scene:'#stage',appearance:'body',popup:'#cornerPopup',navigation:'.heart-navigation',soundtrack:'#heartSoundControl',brandTitle:'.brand strong',brandChapter:'#brandChapter',zoomHint:'.zoom-hint',next:'.next:not(.heart-back)',back:'.heart-back'};return document.querySelector(map[part]||'#'+part)}
function heartSend(type,data){parent.postMessage({type,...data},'*')}
function applyHeartDocument(data){
 cmsDocument=data.document;editingHeart=!!data.editing;heartSelectedId=data.selectedId||'';
 if(!cmsDocument||!Array.isArray(cmsDocument.nodes))return;
 const byId=new Map(cmsDocument.nodes.map(n=>[n.id,n]));inheritedHidden.clear();
 const visit=(id,hidden)=>{const n=byId.get(id);if(!n)return;const hide=hidden||!n.visible;if(hide)inheritedHidden.add(id);n.children.forEach(c=>visit(c,hide))};cmsDocument.rootIds.forEach(id=>visit(id,false));
 document.querySelectorAll('[data-cms-id]').forEach(el=>{el.removeAttribute('data-cms-id');el.removeAttribute('data-selected')});
 const part=key=>cmsDocument.nodes.find(n=>n.props.heartPart===key),scene=part('scene'),appearance=part('appearance');
 sceneSettings=scene?.props||{};appearanceSettings=appearance?.props||{};
 heartMotionOff=!!data.reducedMotion||matchMedia('(prefers-reduced-motion:reduce)').matches;
 document.body.classList.toggle('heart-motion-off',heartMotionOff);
 for(const n of cmsDocument.nodes){
  const key=n.props.heartPart;if(!key||key==='memory'||key==='memories')continue;
  const el=heartElement(key);if(!el)continue;
  el.dataset.cmsId=n.id;el.style.display=inheritedHidden.has(n.id)?'none':'';
  if(n.type==='block'&&n.component!=='audio'&&n.component!=='action')el.textContent=String(n.props.text??'');
  if(n.component==='action')el.textContent=String(n.props.title??'');
  if(n.component==='audio'){const src=String(n.props.src||'');if(el.getAttribute('src')!==src){el.pause();if(src)el.src=src;else el.removeAttribute('src');el.load()}el.loop=heartEnabled(n.props.loop);el.volume=heartNumber(n.props.initialVolume,.5,0,1);el.muted=editingHeart;}
  heartStyle(el,n.props);
  if(n.id===heartSelectedId)el.dataset.selected='true';
 }
 const text=key=>String(part(key)?.props.text??'');
 document.getElementById('popupClose').setAttribute('aria-label',text('popupCloseLabel')||'Close memory');
 const root=part('page');document.getElementById('heartCustomCss').textContent=String(root?.props.customCss??'');
 const intro=part('intro');if(!heartEnabled(intro?.props.showIntro)||inheritedHidden.has(intro?.id))document.getElementById('boot').classList.add('hide');
 const a=appearanceSettings,r=document.documentElement.style;
 const defaults={bg2:'#24101d',text:'#fff6fb',pink:'#ff8cbc',rose:'#ff679f',blush:'#ffc9df',violet:'#d4a6ff'};
 if(typeof ORIGINAL_HEART_COLORS!=='undefined')ORIGINAL_HEART_COLORS.forEach((token,i)=>{const chosen=a[token.key]||defaults[token.key],base=defaults[token.key];if(!/^#[0-9a-f]{6}$/i.test(chosen))return;const rgb=token.rgba.slice(0,3).map((value,j)=>Math.max(0,Math.min(255,value+parseInt(chosen.slice(1+j*2,3+j*2),16)-parseInt(base.slice(1+j*2,3+j*2),16))));r.setProperty('--heart-tint-'+i,'rgba('+rgb.join(',')+','+token.rgba[3]+')')});
 for(const key of ['bg','bg2','bg3','text','pink','rose','blush','violet'])if(a[key])r.setProperty('--'+key,a[key]);
 for(const [key,alpha] of [['muted','mutedAlpha'],['soft','softAlpha'],['line','lineAlpha'],['glass','glassAlpha'],['border','borderAlpha']])r.setProperty('--'+key,heartRgba(a[key]||a.muted,heartNumber(a[alpha],key==='soft'?.38:.6,0,1)));
 const numbers={nodeWidth:[114,32,400],mobileNodeWidth:[86,32,300],nodeRadius:[18,0,64],mobileNodeRadius:[13,0,64],popupWidth:[372,200,800],mobilePopupWidth:[330,180,600],popupRadius:[28,0,64],popupPadding:[11,0,96],controlRadius:[999,0,999],controlPadding:[12,0,96],controlHeight:[35,24,96],controlTextSize:[9,6,32],povTop:[14,0,200],mobilePovTop:[56,0,200],hudInset:[12,0,96]};
 for(const [key,[fallback,min,max]]of Object.entries(numbers))r.setProperty('--heart-'+key,heartNumber(a[key],fallback,min,max)+'px');
 r.setProperty('--heart-beat-duration',heartNumber(sceneSettings.heartbeatDuration,1.35,.2,10)+'s');
 document.body.style.fontFamily=a.fontFamily||'Inter,Arial,sans-serif';
 document.querySelector('.grain').style.opacity=heartNumber(a.grainOpacity,.045,0,1);
 document.querySelector('.vignette').style.boxShadow='inset 0 0 220px 100px rgba(0,0,0,'+heartNumber(a.vignetteStrength,.55,0,1)+')';
 document.querySelector('.heart-outline').style.opacity=heartNumber(a.outlineOpacity,.36,0,1);
 document.querySelector('.center-heart').style.opacity=heartNumber(a.centerOpacity,.6,0,1);
 for(const [setting,selector]of [['showMesh','#meshLines'],['showOutline','.heart-outline'],['showCenter','.center-heart'],['showParticles','#particles'],['showFloatingHearts','.soft-hearts'],['showGrain','.grain'],['showVignette','.vignette']])document.querySelector(selector).style.display=heartEnabled(sceneSettings[setting])?'':'none';
 const sceneKey=JSON.stringify(sceneSettings);if(previousScene!==sceneKey){previousScene=sceneKey;drifting=heartEnabled(sceneSettings.drifting);heartbeatEnabled=heartEnabled(sceneSettings.heartbeat);setPov(sceneSettings.defaultPov==='core'?'core':'overview');targetZoom=heartNumber(sceneSettings.initialZoom,1,.42,2.4);}
 document.body.classList.toggle('heartbeat-on',heartbeatEnabled&&!heartMotionOff);
 document.getElementById('orbitBtn').textContent=drifting?text('orbitBtn'):text('pausedLabel');document.getElementById('orbitBtn').classList.toggle('active',drifting);
 document.getElementById('heartbeatBtn').textContent=heartbeatEnabled?text('heartbeatBtn'):text('heartbeatOffLabel');document.getElementById('heartbeatBtn').classList.toggle('active',heartbeatEnabled);
 const collection=part('memories');const memoryNodes=[];const walk=id=>{const n=byId.get(id);if(!n||inheritedHidden.has(id))return;if(['image','video','audio'].includes(n.component))memoryNodes.push(n);n.children.forEach(walk)};if(collection)walk(collection.id);
 const memories=memoryNodes.map(n=>({id:n.id,mediaType:n.component,mediaUrl:String(n.props.src??'').startsWith('/puzzles/')?'https://wiffeyyyy-os.vercel.app'+String(n.props.src):String(n.props.src??''),title:String(n.props.title??n.label??''),note:String(n.props.body??''),props:n.props}));
 const signature=JSON.stringify([memories,sceneSettings.heartScale,sceneSettings.mobileHeartScale,sceneSettings.heartDepth,sceneSettings.mobileHeartDepth,sceneSettings.shells]);if(signature!==previousMemories){previousMemories=signature;closePopup();nodeLayer.replaceChildren();nodes=[];PAIRS.length=0;MEMORIES.splice(0,MEMORIES.length,...memories);buildMesh();buildPairs();}
 nodes.forEach((node,index)=>{const item=MEMORIES[index];node.el.dataset.cmsId=item.id;node.el.style.outline=item.id===heartSelectedId?'2px solid #ffc9df':'';heartStyle(node.el,item.props);const media=node.el.querySelector('img,video');if(media){media.style.objectFit=item.props.objectFit||'cover';media.style.objectPosition=(item.props.focalX??50)+'% '+(item.props.focalY??50)+'%';if(item.props.alt)media.alt=item.props.alt;}});
 const soundtrack=part('musicAudio'),audioEl=document.getElementById('musicAudio');document.getElementById('heartSoundControl').style.display=soundtrack?.props.src&&!inheritedHidden.has(soundtrack.id)?'':'none';
 if(editingHeart||!heartAudioAllowed){heartbeatAudio.pause();audioEl.pause()}
 else if(soundtrack?.props.src&&!inheritedHidden.has(soundtrack.id))audioEl.play().catch(()=>{});
 status.textContent=(text('cameraLabel')||'camera:')+' '+(pov==='core'?text('corePov'):text('overviewPov'));
}
window.addEventListener('message',event=>{if(event.source!==parent||event.data?.type!=='wiffey-heart:document')return;applyHeartDocument(event.data)});
document.addEventListener('click',event=>{
 const el=event.target.closest('[data-cms-id]');
 if(editingHeart&&el){event.preventDefault();event.stopImmediatePropagation();heartSend('wiffey-heart:select',{id:el.dataset.cmsId});return;}
 const link=event.target.closest('a[data-heart-route]');if(link){event.preventDefault();heartbeatAudio.pause();document.getElementById('musicAudio').pause();heartSend('wiffey-heart:navigate',{href:link.dataset.heartRoute});return;}
 if(event.target.closest('#bootBtn')){heartAudioAllowed=true;const audio=document.getElementById('musicAudio');if(audio.getAttribute('src'))audio.play().catch(()=>{});if(heartbeatEnabled&&heartbeatAudio.getAttribute('src'))heartbeatAudio.play().catch(()=>{});}
},true);
document.getElementById('heartSoundControl').addEventListener('click',()=>{const audio=document.getElementById('musicAudio');heartAudioAllowed=true;if(audio.paused)audio.play().catch(()=>{});else audio.pause()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){heartbeatAudio.pause();document.getElementById('musicAudio').pause()}});
heartSend('wiffey-heart:ready',{});
`;
