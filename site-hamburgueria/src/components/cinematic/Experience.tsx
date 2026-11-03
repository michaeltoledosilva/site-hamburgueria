'use client';
import {useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {useGSAP} from '@gsap/react';
import NextImage from 'next/image';
import {scenes,framesPerScene,scrollPerScene} from '@/data/scenes';
import {site} from '@/config/site';
import {createRenderScheduler} from './renderScheduler';
import {bitmapGeometry,type BitmapGeometry} from './viewportGeometry';
import {FrameLoader,frameUrl,type Frame} from './frameLoader';
gsap.registerPlugin(ScrollTrigger,useGSAP);
export default function Experience(){
 const root=useRef<HTMLElement>(null);const geometry=useRef({width:0,progress:0,inside:false});
 useGSAP(()=>{
  // Mobile scroll is native. Disable the plugin's global resize refresh; desktop refresh is explicit below.
  ScrollTrigger.config({autoRefreshEvents:'visibilitychange,DOMContentLoaded,load'});
  const media=gsap.matchMedia();
  media.add({mobile:'(max-width: 1023px), (max-aspect-ratio: 1/1)',all:'all'},context=>{
   const mobile=Boolean(context.conditions?.mobile),element=root.current!,wrapper=element.parentElement!,surface=element.querySelector('canvas')!,ctx=surface.getContext('2d');if(!ctx)return;
   const lastScene=scenes.length-1;
   const cards=Array.from(element.querySelectorAll<HTMLElement>('.scene-copy')),dots=Array.from(element.querySelectorAll<HTMLButtonElement>('.chapter-dot'));
   const bar=element.querySelector<HTMLElement>('.progress-fill')!,counter=element.querySelector<HTMLElement>('.current-chapter')!;
   const connection=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
   const reduced=matchMedia('(prefers-reduced-motion: reduce)'),params=new URLSearchParams(location.search);
   const simple=reduced.matches||params.get('motion')==='reduce'||connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType||'');
   const lite=mobile&&!simple&&params.get('experience')==='lite';
   const layers=Array.from(element.querySelectorAll<HTMLElement>('.lite-picture')),posters=layers.map(layer=>layer.querySelector('img')!),ready=new Set<number>();
   const modeLink=element.querySelector<HTMLAnchorElement>('.experience-toggle')!;modeLink.href=lite?'/?experience=full':'/?experience=lite';modeLink.textContent=lite?'Completa':'Modo leve';modeLink.setAttribute('aria-label',lite?'Completa: ativar experiência cinematográfica':'Modo leve: ativar experiência leve');
   if(params.has('perf'))element.dataset.initializations=String(Number(element.dataset.initializations||0)+1);
   element.dataset.experience=lite?'lite':simple?'static':'full';wrapper.classList.toggle('is-lite',lite);element.classList.toggle('lite-mode',lite);
   let disposed=false,position=0,active=-1,signature='',lastProgress=-1,lastPosition=0,lastTime=performance.now(),direction=1,velocity=0,start=0,distance=1;
      let trigger:ScrollTrigger|undefined;let needsMeasure=false,needsProgress=true;let bitmap:BitmapGeometry|undefined;let measuredWidth=0,measuredHeight=0;let lastFrame:Frame|undefined;
   const sampled=params.has('perf')&&params.get('sampling')==='4';let settled=false;let settleTimer:ReturnType<typeof setTimeout>|undefined;
   function frameAt(local:number){const exact=Math.min(framesPerScene-1,Math.round(local*(framesPerScene-1)));return sampled&&!settled?Math.min(framesPerScene-1,Math.round(exact/4)*4):exact;}
   const scheduler=createRenderScheduler(()=>{if(disposed)return;if(needsMeasure){needsMeasure=false;measure();}if(needsProgress){needsProgress=false;update(gsap.utils.clamp(0,1,(scrollY-start)/distance),false);}draw();});
   const requestDraw=()=>scheduler.request();
   const testQuery=params.has('perf')&&params.has('trial')?new URLSearchParams({trial:params.get('trial')!,qaDelay:params.get('delay')||'0',profile:params.get('profile')||'native'}).toString():'';
   const loader=new FrameLoader(mobile&&matchMedia('(max-aspect-ratio: 1/1)').matches,requestDraw,params.has('perf')&&['2','3','4'].includes(params.get('loads')||'')?Number(params.get('loads')):3,testQuery,mobile,params.has('perf')&&params.get('decode')==='html'?'html':'bitmap',params.has('perf'),!(params.has('perf')&&params.get('transport')==='files'));
   function paint(frame:Frame,scene:number,alpha:number){const w=surface.width,h=surface.height,scale=Math.max(w/frame.width,h/frame.height),dw=frame.width*scale,dh=frame.height*scale;ctx!.globalAlpha=alpha;ctx!.drawImage(frame.image,(w-dw)*.5,(h-dh)*(mobile?.2:.5),dw,dh);}
   function draw(){
    if(disposed||simple)return;
    if(lite){const s=Math.min(lastScene,Math.floor(position)),local=position-s,blend=s<lastScene?gsap.utils.clamp(0,1,(local-.8)/.2):0;const shown=ready.has(s)?s:Math.max(0,...Array.from(ready).filter(i=>i<=s));layers.forEach((layer,i)=>{const opacity=i===shown?1:(i===s+1&&ready.has(i)?blend:0);if(layer.style.opacity!==String(opacity))layer.style.opacity=String(opacity);if(i===shown||i===s+1)layer.style.transform=`translate3d(0,${-local*7}px,0) scale(${1.015+local*.012})`;});surface.dataset.scene=String(s);surface.dataset.frame='0';surface.dataset.targetFrame='0';surface.dataset.engine='lite-css';surface.dataset.posterScene=String(shown);surface.dataset.postersReady=String(ready.size);surface.dataset.loader=JSON.stringify({decodedFrames:ready.size,requests:0,budget:0});return;}
    if(params.has('perf'))surface.dataset.loader=JSON.stringify(loader.stats());
    const scene=Math.min(lastScene,Math.floor(position)),local=position-scene,index=frameAt(local),next=Math.min(lastScene,scene+1),blend=scene<lastScene?gsap.utils.clamp(0,1,(local-.87)/.13):0;
    let frame=loader.get(scene,index);if(!frame&&surface.dataset.scene!==String(scene))frame=loader.get(scene,0,0);
    const other=blend?loader.get(next,0,0):null;
    const key=`${scene}:${frame?.index}:${other?.index}:${blend.toFixed(3)}:${surface.width}:${surface.height}`;
        if(!frame){if(!lastFrame&&surface.dataset.scene!==String(scene)&&ready.has(scene)){layers.forEach((layer,i)=>{layer.style.opacity=i===scene?'1':'0';layer.style.transform='none';});element.classList.add('poster-fallback');surface.style.visibility='hidden';surface.dataset.scene=String(scene);surface.dataset.frame='0';if(params.has('perf'))surface.dataset.fallback='poster';}return;}
    element.classList.remove('poster-fallback');surface.style.visibility='';if(params.has('perf'))surface.dataset.fallback='';
    if(key===signature)return;
    const now=params.has('perf')?performance.now():0;paint(frame,scene,1);if(other)paint(other,next,blend);ctx!.globalAlpha=1;signature=key;loader.drawn(frame);lastFrame=frame;
    surface.dataset.scene=String(scene);surface.dataset.frame=String(frame.index);if(params.has('perf'))surface.dataset.draws=String(Number(surface.dataset.draws||0)+1);if(params.has('perf')){surface.dataset.sourceWidth=String(frame.width);surface.dataset.sourceHeight=String(frame.height);surface.dataset.drawMs=(performance.now()-now).toFixed(2);if(frame.index===index)surface.dataset.targetToDrawMs=(performance.now()-Number(surface.dataset.targetAt||performance.now())).toFixed(2);}
    if(params.has('perf'))surface.dataset.loader=JSON.stringify(loader.stats());
   }
   function update(progress:number,schedule=true){
        geometry.current.progress=progress;geometry.current.inside=scrollY>=start&&scrollY<=start+distance;if(progress===lastProgress)return;lastProgress=progress;
    if(sampled){settled=false;clearTimeout(settleTimer);settleTimer=setTimeout(()=>{settled=true;const scene=Math.floor(position);loader.plan(scene,frameAt(position-scene),direction,0);requestDraw();},100);}
    position=Math.min(scenes.length-.000001,progress*scenes.length);const scene=Math.floor(position),local=position-scene,index=frameAt(local),now=performance.now(),delta=position-lastPosition;
    if(delta)direction=delta>0?1:-1;velocity=delta*framesPerScene/Math.max(.016,(now-lastTime)/1000);lastTime=now;lastPosition=position;
    const visible=local>.94&&scene<lastScene?scene+1:scene;
    if(active!==visible){active=visible;cards.forEach((card,i)=>{const show=i===active;card.style.opacity=show?'1':'0';card.inert=!show;card.setAttribute('aria-hidden',String(!show));});dots.forEach((dot,i)=>dot.setAttribute('aria-current',i===active?'step':'false'));counter.textContent=String(active+1).padStart(2,'0');}
    const opacity=scene<lastScene&&local>.82&&local<.94?String(1-(local-.82)/.12):'1';if(cards[active].style.opacity!==opacity)cards[active].style.opacity=opacity;
    cards[active].style.transform=`translate3d(0,${(local<.82?(1-local/.82)*12:-(local-.82)*65).toFixed(2)}px,0)`;bar.style.transform=`scaleX(${progress})`;if(!lite)loader.plan(scene,index,direction,velocity,delta*framesPerScene);if(params.has('perf')&&(surface.dataset.targetScene!==String(scene)||surface.dataset.targetFrame!==String(index))){surface.dataset.targetAt=String(now);surface.dataset.targetScene=String(scene);surface.dataset.targetFrame=String(index);}if(schedule)requestDraw();
   }
   function measure(){
    const w=surface.clientWidth,widthChanged=Math.abs(w-measuredWidth)>1,restore=mobile&&geometry.current.width>0&&Math.abs(w-geometry.current.width)>1&&geometry.current.inside;
    if(mobile&&widthChanged){
     const probe=element.querySelector<HTMLElement>('.runway-probe')!;
     // Read svh only on initialization / a real width change. Toolbar updates do not change the runway.
     distance=Math.max(1,probe.offsetHeight);
     wrapper.style.setProperty('--cinematic-runway',`${distance}px`);
     loader.setProfile(matchMedia('(max-aspect-ratio: 1/1)').matches);
    }
    const next=bitmapGeometry(bitmap,w,surface.clientHeight,devicePixelRatio,mobile);
    if(!lite&&!simple&&(surface.width!==next.pixelWidth||surface.height!==next.pixelHeight)){
     surface.width=next.pixelWidth;surface.height=next.pixelHeight;
     ctx!.imageSmoothingEnabled=true;ctx!.imageSmoothingQuality='high';signature='';
     // Width/orientation rebuild: redraw the protected frame before returning to the browser.
     if(lastFrame)paint(lastFrame,Number(surface.dataset.scene)||0,1);
     if(params.has('perf'))surface.dataset.resizes=String(Number(surface.dataset.resizes||0)+1);
    }
    bitmap=next;measuredWidth=w;measuredHeight=surface.clientHeight;geometry.current.width=w;
    start=wrapper.getBoundingClientRect().top+scrollY;
    if(restore)window.scrollTo({top:start+geometry.current.progress*distance,behavior:'instant'});
    if(!mobile&&trigger)trigger.refresh();
    if(!mobile)distance=Math.max(1,wrapper.offsetHeight-element.offsetHeight);
    if(params.has('perf')){surface.dataset.runway=String(distance);surface.dataset.stageHeight=String(element.offsetHeight);surface.dataset.measures=String(Number(surface.dataset.measures||0)+1);}
   }
   const onScroll=()=>{needsProgress=true;requestDraw();};
   element.classList.toggle('static-mode',Boolean(simple));wrapper.classList.toggle('is-static',Boolean(simple));
   const posterHandlers=posters.map((img,i)=>{const decode=()=>{void img.decode().then(()=>{if(!disposed){ready.add(i);requestDraw();}}).catch(()=>{});};if(!simple){img.addEventListener('load',decode);decode();}return ()=>img.removeEventListener('load',decode);});
   if(simple){cards.forEach(c=>{c.inert=false;c.removeAttribute('aria-hidden');});}
   else if(mobile){measure();window.addEventListener('scroll',onScroll,{passive:true});onScroll();}
   else{measure();trigger=ScrollTrigger.create({trigger:element,start:'top top',end:()=>`+=${innerHeight*scrollPerScene*scenes.length}`,pin:true,anticipatePin:1,invalidateOnRefresh:true,onUpdate:self=>{needsProgress=false;update(self.progress,false);scheduler.flush();}});update(trigger.progress);}
   const resize=()=>{if(disposed||simple)return;
    // Height-only events are handled by CSS dvh. No layout reads, refreshes, rebuilds or scrollTo.
    if(Math.abs(element.clientWidth-measuredWidth)<1&&(mobile||Math.abs(surface.clientHeight-measuredHeight)<1))return;
    needsMeasure=true;needsProgress=true;requestDraw();
   };window.addEventListener('resize',resize,{passive:true});
   // Observe content width rather than the dvh stage: no height-feedback loop.
   const stageObserver=!simple&&typeof ResizeObserver!=='undefined'?new ResizeObserver(resize):undefined;stageObserver?.observe(wrapper);
   const handlers=dots.map((dot,i)=>{const handler=()=>{if(simple)return;const target=trigger?trigger.start+(trigger.end-trigger.start)*(i/scenes.length+.008):start+distance*(i/scenes.length+.008);window.scrollTo({top:target,behavior:'instant'});};dot.addEventListener('click',handler);return ()=>dot.removeEventListener('click',handler);});
   const change=()=>location.reload();reduced.addEventListener('change',change);
   return ()=>{disposed=true;clearTimeout(settleTimer);scheduler.dispose();stageObserver?.disconnect();loader.dispose();lastFrame=undefined;trigger?.kill();window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',resize);reduced.removeEventListener('change',change);handlers.forEach(fn=>fn());posterHandlers.forEach(fn=>fn());element.classList.remove('static-mode','lite-mode','poster-fallback');surface.style.visibility='';wrapper.classList.remove('is-static','is-lite');wrapper.style.removeProperty('--cinematic-runway');};
  },root);
  return ()=>media.revert();
 },{scope:root});
 return <div className="cinematic-scroll"><section ref={root} className="experience" id="experiencia" aria-label="Experiência cinematográfica em três capítulos">
  <div className="runway-probe" aria-hidden="true"/><div className="scene-backdrop" aria-hidden="true"/><canvas aria-hidden="true"/><div className="scene-shade"/>
  <div className="lite-pictures" aria-hidden="true">{scenes.map((scene,i)=><picture key={scene.id} className="lite-picture"><source media="(max-aspect-ratio: 1/1)" srcSet={frameUrl(i,0,true)} width={720} height={1280}/><NextImage src={frameUrl(i,0,false)} width={1920} height={1080} alt="" loading={i===0?'eager':'lazy'} unoptimized/></picture>)}</div>
  <header className="site-header"><a className="brand" href="#inicio">{site.name}<span>{site.role}</span></a><nav aria-label="Principal"><a href="#cardapio">Cardápio</a><a className="header-book" href={site.bookingUrl} aria-label="Delivery demonstrativo"><span className="header-book-long">Delivery demonstrativo</span><span className="header-book-short" aria-hidden="true">Delivery</span><span aria-hidden="true">↗</span></a></nav></header>
  <a className="skip-animation" href="#cardapio" aria-label="Pular animação e ir ao cardápio">Pular <span aria-hidden="true">↓</span></a>
  <a className="experience-toggle" href={['/','?experience=full'].join('')}>Modo leve</a>
  <div className="editorial-line"><span>FOGO, TEXTURA & SABOR</span><span>PROJETO DEMONSTRATIVO · ZMT</span></div>
  {scenes.map((scene,i)=><article key={scene.id} className={`scene-copy scene-${i}`} aria-hidden={i!==0} style={{opacity:i===0?1:0}}>
   <span className="eyebrow"><span className="small-line"/> {String(i+1).padStart(2,'0')} — {scene.label}</span>
   {i===0?<h1>O SABOR COMEÇA{' '}<br/>PELOS{' '}<em>OLHOS.</em></h1>:<h2>{scene.title}</h2>}
   <p>{scene.description}</p>
   {(i===0||i===2)?<a className="button button-cream" href="#cardapio">Explorar cardápio <span>↗</span></a>:<span className="scene-note">O TEMPO CERTO. O PONTO CERTO.</span>}
   <picture><source media="(max-aspect-ratio: 1/1)" srcSet={frameUrl(i,0,true)} width={720} height={1280}/><img className="static-poster" src={frameUrl(i,0,false)} alt={`${site.name} — ${scene.label}`} loading="lazy"/></picture>
  </article>)}
  <div className="cinema-bottom"><span className="scroll-hint"><span>↓</span> ROLE PARA DESCOBRIR</span><div className="chapter-navigation" aria-label="Capítulos">{scenes.map((s,i)=><button key={s.id} type="button" className="chapter-dot" aria-label={`Capítulo ${i+1}: ${s.label}`} aria-current={i===0?'step':'false'}><span/></button>)}</div><span className="chapter-count"><b className="current-chapter">01</b><span> / 03</span></span></div>
  <div className="progress-track"><div className="progress-fill"/></div>
 </section></div>;
}
