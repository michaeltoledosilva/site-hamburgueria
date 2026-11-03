import {scenes,framesPerScene,mobileFrameProfile} from '@/data/scenes';
import {FramePacks} from './framePacks';
export const frameUrl=(scene:number,frame:number,mobile:boolean)=>`/media/${(scenes[scene] as {id:string;mediaId?:string}).mediaId||scenes[scene].id}/${mobile?(mobileFrameProfile||'mobile-native'):'desktop-native'}/${String(frame+1).padStart(3,'0')}.webp`;
export type Frame={image:CanvasImageSource;width:number;height:number;bytes:number;index:number;key:string;close:()=>void};
type Job={scene:number;index:number;key:string;generation:number;queuedAt:number;rank:number};
type Flight={job:Job;controller:AbortController;started:number;stage:'network'|'decode'};
export class FrameLoader{
 private packs:FramePacks|undefined;
 private packsStarted=false;private packStartScheduled=false;private packStartRaf=0;private packStartRaf2=0;
 private frames=new Map<string,Frame>();private blobs=new Map<string,Blob>();private inflight=new Map<string,Flight>();private queue:Job[]=[];
 private target:{scene:number;index:number;direction:number;velocity:number}|undefined;private relevant=new Set<string>();private protectedKeys=new Set<string>();private disposed=false;private decodedBytes=0;private blobBytes=0;private lastPlan='';private lastDrawn='';private generation=0;
 readonly budget:number;readonly concurrency:number;requests=0;decodes=0;aborts=0;errors=0;staleResults=0;hits=0;misses=0;private retryTimer:ReturnType<typeof setTimeout>|undefined;private retriedGeneration=-1;
 private downloadTimes:number[]=[];private decodeTimes:number[]=[];private queueTimes:number[]=[];
 constructor(private mobile:boolean,private notify:()=>void,concurrency=3,private testQuery='',compactMemory=mobile,private decodeMode:'bitmap'|'html'='bitmap',private diagnostics=false,usePacks=true){this.budget=(compactMemory?48:96)*1024*1024;this.concurrency=Math.max(2,Math.min(4,concurrency));if(usePacks)this.packs=new FramePacks(()=>this.packReady());}
 setProfile(mobile:boolean){if(this.mobile!==mobile){this.mobile=mobile;this.lastPlan='';this.target=undefined;this.queue=[];for(const flight of this.inflight.values())if(!flight.controller.signal.aborted){flight.controller.abort();this.aborts++;}}}
 private url(scene:number,index:number){const base=frameUrl(scene,index,this.mobile);return (this.mobile&&this.testQuery.includes('profile=balanced')?base.replace('/mobile-native/','/mobile-balanced/'):base)+(this.testQuery?'?'+this.testQuery:'');}
 private record(list:number[],value:number){if(this.diagnostics){list.push(value);if(list.length>1000)list.shift();}}
 plan(scene:number,index:number,direction:number,velocity:number,stride=0){
  const ahead=Math.min(6,Math.max(4,Math.ceil(Math.abs(velocity)*.05))),step=Math.min(32,Math.max(1,Math.round(Math.abs(stride))));
  const signature=`${scene}:${index}:${direction}:${ahead}:${step}`;if(signature===this.lastPlan)return;this.lastPlan=signature;const generation=++this.generation,now=performance.now();
  const previousQueue=new Map(this.queue.map(j=>[j.key,j.queuedAt]));const list:Job[]=[],seen=new Set<string>();
  const add=(s:number,f:number)=>{if(f<0||f>=framesPerScene||s<0||s>=scenes.length)return;const key=this.url(s,f);if(!seen.has(key)){seen.add(key);list.push({scene:s,index:f,key,generation,queuedAt:previousQueue.get(key)??now,rank:list.length});}};
  // Exact position, reversible neighbours and transition endpoints precede prediction.
    add(scene,index);
  if(step>3){const global=Math.max(0,Math.min(scenes.length*framesPerScene-1,scene*framesPerScene+index+step*direction));add(Math.floor(global/framesPerScene),global%framesPerScene);}
  add(scene,index+direction);add(scene,index-direction);
  if(index>58)add(scene+1,0);if(index<12)add(scene-1,framesPerScene-1);
  add(scene,Math.max(0,Math.min(framesPerScene-1,index+step*direction)));
  for(let d=2;d<=ahead;d++){add(scene,index+d*direction);if(d<=2)add(scene,index-d*direction);}
  if(index<=58)add(scene+1,0);
  this.target={scene,index,direction,velocity};this.relevant=seen;this.protectedKeys=new Set([this.url(scene,index),this.lastDrawn,this.url(scene,0)]);
  if(this.packsStarted)this.planPacks();
  this.queue=list.filter(j=>!this.frames.has(j.key)&&(!this.inflight.has(j.key)||this.inflight.get(j.key)!.controller.signal.aborted)).slice(0,18);
  for(const flight of this.inflight.values()){
   if(seen.has(flight.job.key)){flight.job.generation=generation;flight.job.rank=list.find(j=>j.key===flight.job.key)!.rank;continue;}
   const far=flight.job.scene!==scene||Math.abs(flight.job.index-index)>16;
   // Do not repeatedly cancel adjacent microgestures or very young requests.
   if(far&&now-flight.started>=35&&!flight.controller.signal.aborted){flight.controller.abort();this.aborts++;}
  }
  this.pump();
 }
 private pump(){while(!this.disposed&&this.queue.length){
  const urgent=this.queue.findIndex(j=>j.rank===0&&!this.inflight.has(j.key)&&(this.blobs.has(j.key)||this.packs?.has(j.key)));
  // A cached exact target needs no network slot. Let one urgent decode bypass old downloads.
  if(this.inflight.size>=this.concurrency&&(urgent<0||this.inflight.size>=this.concurrency+1||Array.from(this.inflight.values()).some(f=>f.stage==='decode')))break;
  const available=urgent>=0?urgent:this.queue.findIndex(j=>!this.inflight.has(j.key));if(available<0)break;const job=this.queue.splice(available,1)[0];if(this.frames.has(job.key))continue;const flight:Flight={job,controller:new AbortController(),started:performance.now(),stage:'network'};this.inflight.set(job.key,flight);void this.load(flight);
 }}
 private async load(flight:Flight){
  const {job,controller}=flight;let frame:Frame|undefined,fromPack=false;this.record(this.queueTimes,performance.now()-job.queuedAt);
  try{
   let blob=this.blobs.get(job.key);if(!blob){blob=this.packs?.get(job.key);fromPack=!!blob;}
   if(!blob&&job.rank>0&&this.packs?.hasPending(job.key)){blob=await this.packs.wait(job.key,controller.signal);fromPack=!!blob;}
   if(blob){if(this.blobs.has(job.key)){this.blobs.delete(job.key);this.blobs.set(job.key,blob);}}
   else{this.requests++;const start=performance.now(),response=await fetch(job.key,{signal:controller.signal,cache:'force-cache',priority:job.rank===0?'high':'low'});if(!response.ok)throw new Error(`Frame HTTP ${response.status}`);blob=await response.blob();this.record(this.downloadTimes,performance.now()-start);if(controller.signal.aborted||this.disposed)return;this.blobs.set(job.key,blob);this.blobBytes+=blob.size;while(this.blobBytes>12*1024*1024){const key=this.blobs.keys().next().value!;this.blobBytes-=this.blobs.get(key)!.size;this.blobs.delete(key);}}
   const target=this.target,upcoming=target&&job.scene===target.scene&&(job.index-target.index)*target.direction>=-2&&Math.abs(job.index-target.index)<=16;
   if(controller.signal.aborted||this.disposed||(!this.relevant.has(job.key)&&!upcoming)){this.staleResults++;return;}
   flight.stage='decode';const start=performance.now();
   if(this.decodeMode==='bitmap'&&typeof createImageBitmap==='function')try{const bitmap=await createImageBitmap(blob);frame={image:bitmap,width:bitmap.width,height:bitmap.height,bytes:bitmap.width*bitmap.height*4,index:job.index,key:job.key,close:()=>bitmap.close()};}catch{if(controller.signal.aborted||this.disposed)return;}
   if(!frame){const objectUrl=URL.createObjectURL(blob),img=new Image();img.decoding='async';img.src=objectUrl;try{await img.decode();frame={image:img,width:img.naturalWidth,height:img.naturalHeight,bytes:img.naturalWidth*img.naturalHeight*4,index:job.index,key:job.key,close:()=>{img.src='';}};}finally{URL.revokeObjectURL(objectUrl);}}
   this.record(this.decodeTimes,performance.now()-start);this.decodes++;
   // Replanning must not discard a nearby completed frame from the current profile/scene.
   if(this.disposed||controller.signal.aborted||(!this.relevant.has(job.key)&&(!this.target||job.scene!==this.target.scene||Math.abs(job.index-this.target.index)>16))){frame.close();this.staleResults++;return;}
   this.frames.set(job.key,frame);this.decodedBytes+=frame.bytes;this.evict();this.notify();
  }catch{if(!controller.signal.aborted&&!this.disposed){if(fromPack){this.packs?.invalidate(job.key);if(this.relevant.has(job.key))this.queue.unshift({...job,queuedAt:performance.now()});}
   else{this.errors++;if(job.rank===0&&job.generation===this.generation&&this.retriedGeneration!==this.generation){this.retriedGeneration=this.generation;clearTimeout(this.retryTimer);this.retryTimer=setTimeout(()=>{if(!this.disposed&&job.generation===this.generation&&!this.frames.has(job.key)){this.queue.unshift({...job,queuedAt:performance.now()});this.pump();}},250);}}}}
  finally{if(this.inflight.get(job.key)===flight)this.inflight.delete(job.key);this.pump();}
 }
 private evict(){for(const [key,value] of this.frames){if(this.decodedBytes<=this.budget)break;if(this.protectedKeys.has(key))continue;this.frames.delete(key);this.decodedBytes-=value.bytes;value.close();}}
 get(scene:number,index:number,maxDistance=4){for(let d=0;d<=maxDistance;d++)for(const f of d?[index-d,index+d]:[index]){if(f<0||f>=framesPerScene)continue;const key=this.url(scene,f),value=this.frames.get(key);if(value){this.frames.delete(key);this.frames.set(key,value);if(this.diagnostics)this.hits++;return value;}}if(this.diagnostics)this.misses++;return null;}
 private planPacks(){if(this.disposed||!this.target)return;const {scene,index,direction,velocity}=this.target;const adjacent=direction>0&&index>=48&&scene<scenes.length-1?this.url(scene+1,0):direction<0&&index<=24&&scene>0?this.url(scene-1,framesPerScene-1):undefined;this.packs?.plan(this.url(scene,index),direction,true,velocity,adjacent);}
 private packReady(){if(this.disposed||!this.target)return;const key=this.url(this.target.scene,this.target.index);if(!this.packs?.has(key)||this.frames.has(key))return;const flight=this.inflight.get(key);
  if(flight?.stage==='network'&&!flight.controller.signal.aborted){flight.controller.abort();this.aborts++;this.queue=this.queue.filter(j=>j.key!==key);this.queue.unshift({...flight.job,generation:this.generation,queuedAt:performance.now(),rank:0});}this.pump();
 }
 drawn(frame:Frame){this.lastDrawn=frame.key;this.protectedKeys.add(frame.key);
  if(this.packs&&!this.packsStarted&&!this.packStartScheduled){this.packStartScheduled=true;const start=()=>{if(this.disposed)return;this.packsStarted=true;this.planPacks();};
   // Let the first image and text reach the browser before starting bulk background traffic.
   if(typeof requestAnimationFrame==='function')this.packStartRaf=requestAnimationFrame(()=>{this.packStartRaf2=requestAnimationFrame(start);});else start();
  }
 }
 stats(){const p95=(v:number[])=>v.length?[...v].sort((a,b)=>a-b)[Math.floor((v.length-1)*.95)]:null;return {generation:this.generation,queue:this.queue.length,decodedBytes:this.decodedBytes,decodedFrames:this.frames.size,compressedBytes:this.blobBytes+(this.packs?.stats().retainedBytes||0),packs:this.packs?.stats(),requests:this.requests,decodes:this.decodes,aborts:this.aborts,errors:this.errors,staleResults:this.staleResults,hits:this.hits,misses:this.misses,cacheHitRate:this.hits/Math.max(1,this.hits+this.misses),inflight:this.inflight.size,network:[...this.inflight.values()].filter(f=>f.stage==='network').length,decoding:[...this.inflight.values()].filter(f=>f.stage==='decode').length,budget:this.budget,concurrency:this.concurrency,queueP95Ms:p95(this.queueTimes),downloadP95Ms:p95(this.downloadTimes),decodeP95Ms:p95(this.decodeTimes)};}
 dispose(){this.disposed=true;this.packs?.dispose();if(typeof cancelAnimationFrame==='function'){cancelAnimationFrame(this.packStartRaf);cancelAnimationFrame(this.packStartRaf2);}clearTimeout(this.retryTimer);this.inflight.forEach(f=>f.controller.abort());this.inflight.clear();this.frames.forEach(f=>f.close());this.frames.clear();this.blobs.clear();this.queue=[];this.decodedBytes=0;this.blobBytes=0;}
}



