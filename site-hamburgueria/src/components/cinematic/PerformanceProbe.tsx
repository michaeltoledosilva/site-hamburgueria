"use client";
import {useEffect} from 'react';
import {framesPerScene} from '@/data/scenes';
export default function PerformanceProbe(){
 useEffect(()=>{
  if(!new URLSearchParams(location.search).has('perf'))return;
  const output=document.createElement('output');output.id='cinematic-perf';output.hidden=true;document.body.appendChild(output);
  performance.setResourceTimingBufferSize(4000);
  const intervals:number[]=[],latencies:number[]=[],longTasks:number[]=[],gaps:number[]=[];
  let errors=0,raf=0,timer:ReturnType<typeof setTimeout>|undefined,last=0,until=0,scrolls=0,late=0,samples=0,posterWaits=0,lcp=0;
  const observers:PerformanceObserver[]=[];
  const bounded=(values:number[],value:number)=>{values.push(value);if(values.length>4000)values.shift();};
  const percentile=(v:number[])=>v.length?[...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*.95)]:null;
  function publish(){
   timer=undefined;
   const canvas=document.querySelector<HTMLCanvasElement>('.experience canvas'),stage=document.querySelector<HTMLElement>('.experience');
   const resources=(performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(r=>r.name.includes('/media/'));
   const heap=(performance as Performance & {memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize;
   output.textContent=JSON.stringify({experience:stage?.dataset.experience,errors,scrolls,frameSamples:intervals.length,frameMeanMs:intervals.length?intervals.reduce((a,b)=>a+b,0)/intervals.length:null,frameP95Ms:percentile(intervals),estimatedRafFps:intervals.length?1000/(intervals.reduce((a,b)=>a+b,0)/intervals.length):null,longTasks:longTasks.length,longTaskMaxMs:Math.max(0,...longTasks),frameGapP95:percentile(gaps),lateSamples:late,totalSamples:samples,posterWaitingSamples:posterWaits,targetLatencyP95Ms:percentile(latencies),lcpMs:lcp||null,heapBytes:heap,mediaRequests:resources.length,mediaTransferredBytes:resources.reduce((n,r)=>n+r.transferSize,0),mediaEncodedBytes:resources.reduce((n,r)=>n+r.encodedBodySize,0),mediaResponseMeanMs:resources.length?resources.reduce((n,r)=>n+r.duration,0)/resources.length:null,visualViewportHeight:visualViewport?.height,layoutViewportHeight:innerHeight,runway:Number(canvas?.dataset.runway)||0,bitmapWidth:canvas?.width,bitmapHeight:canvas?.height,bitmapReallocations:Number(canvas?.dataset.resizes)||0,draws:Number(canvas?.dataset.draws)||0,loader:canvas?.dataset.loader?JSON.parse(canvas.dataset.loader):null,drawMs:Number(canvas?.dataset.drawMs)||0,targetToDrawMs:Number(canvas?.dataset.targetToDrawMs)||0,scene:canvas?.dataset.scene,frame:canvas?.dataset.frame});
  }
  const dirty=()=>{if(!timer)timer=setTimeout(publish,250);};
  for(const type of ['longtask','largest-contentful-paint'])try{const o=new PerformanceObserver(list=>{for(const e of list.getEntries())if(type==='longtask')bounded(longTasks,e.duration);else lcp=e.startTime;dirty();});o.observe({type,buffered:true});observers.push(o);}catch{}
  function tick(now:number){
   raf=0;if(now>until){last=0;dirty();return;}
   if(last)bounded(intervals,now-last);last=now;
   const c=document.querySelector<HTMLCanvasElement>('.experience canvas');
   if(c&&c.dataset.targetScene){
    const scene=Number(c.dataset.targetScene),frame=Number(c.dataset.targetFrame),shownScene=Number(c.dataset.scene),shownFrame=Number(c.dataset.frame);
    const gap=Math.abs(shownScene*framesPerScene+shownFrame-scene*framesPerScene-frame);bounded(gaps,gap);samples++;
    if(scene!==shownScene||Math.abs(frame-shownFrame)>2)late++;
    if(document.querySelector<HTMLElement>('.experience')?.dataset.experience==='lite'&&Number(c.dataset.posterScene)!==scene)posterWaits++;
    if(gap===0)bounded(latencies,Number(c.dataset.targetToDrawMs)||0);
   }
   dirty();raf=requestAnimationFrame(tick);
  }
  const onScroll=()=>{scrolls++;until=performance.now()+220;if(!raf)raf=requestAnimationFrame(tick);dirty();};
  const onError=()=>{errors++;dirty();};
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('error',onError);window.addEventListener('unhandledrejection',onError);publish();
  return ()=>{cancelAnimationFrame(raf);clearTimeout(timer);observers.forEach(o=>o.disconnect());window.removeEventListener('scroll',onScroll);window.removeEventListener('error',onError);window.removeEventListener('unhandledrejection',onError);output.remove();};
 },[]);return null;
}
