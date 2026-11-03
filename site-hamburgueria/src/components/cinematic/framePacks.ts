/** Lossless groups of the existing WebP files: one RTT shared by nearby frames. */
export const packSize=16;
const maxPackBytes=4*1024*1024;
export function parseFramePack(buffer:ArrayBuffer,first:number){
 const view=new DataView(buffer);
 if(buffer.byteLength<8||buffer.byteLength>maxPackBytes||view.getUint32(0)!==0x42524631)throw Error('Invalid frame pack');
 const count=view.getUint32(4),header=8+count*12;
 if(count!==packSize||buffer.byteLength<header)throw Error('Invalid frame count');
 const entries: {index:number;offset:number;size:number}[]=[];let end=header;
 for(let i=0;i<count;i++){const p=8+i*12,index=view.getUint32(p),offset=view.getUint32(p+4),size=view.getUint32(p+8);if(index!==first+i||offset!==end||!size||offset+size>buffer.byteLength)throw Error('Invalid frame offsets');entries.push({index,offset,size});end=offset+size;}
 if(end!==buffer.byteLength)throw Error('Trailing frame data');return entries;
}
function address(url:string){const match=/^(.*)\/(\d{3})\.webp(\?.*)?$/.exec(url);if(!match)return;const index=Number(match[2])-1,block=Math.floor(index/packSize),first=block*packSize;return {index,first,base:match[1],block,query:match[3]||'',key:`${match[1]}/packs/${String(block).padStart(3,'0')}.bin${match[3]||''}`};}
type Cached={blob:Blob;entries:ReturnType<typeof parseFramePack>};
type Pending={key:string;first:number;controller:AbortController;resolve:(value:Cached|undefined)=>void;promise:Promise<Cached|undefined>;started:boolean};
export class FramePacks{
 private cache=new Map<string,Cached>();private pending=new Map<string,Pending>();private failed=new Set<string>();private deferred=new Set<string>();private queue:Pending[]=[];private active=0;private disposed=false;private current='';private retainedBytes=0;
 readonly budget=20*1024*1024;requests=0;transferredBytes=0;errors=0;
 constructor(private ready:()=>void=()=>{}){}
 plan(url:string,direction:number,prefetch=true,velocity=0,adjacent?:string){const a=address(url),neighbour=adjacent&&address(adjacent);if(!a||this.disposed)return;this.current=a.key;
  const lead=Math.abs(velocity)>100?2:1;
  for(const job of this.pending.values()){const block=Number(/\/(\d{3})\.bin/.exec(job.key)?.[1]);if((job.key.startsWith(a.base+'/packs/')&&(job.started||Math.abs(block-a.block)<=lead))||(neighbour&&job.key===neighbour.key))continue;if(job.started)job.controller.abort();else{this.queue=this.queue.filter(j=>j!==job);this.pending.delete(job.key);job.resolve(undefined);}}
  void this.ensure(a.key,a.first,true);
  // Preload only the adjacent block, never an entire scene or the other orientation.
  const local=a.index-a.first;if(prefetch&&((direction>0&&local>=3)||(direction<0&&local<=packSize-4)))for(let d=1;d<=lead;d++){const block=a.block+direction*d;if(block>=0&&block<5)void this.ensure(`${a.base}/packs/${String(block).padStart(3,'0')}.bin${a.query}`,block*packSize,false);}
  if(neighbour)void this.ensure(neighbour.key,neighbour.first,false);
 }
 get(url:string){const a=address(url);if(!a)return;const cached=this.cache.get(a.key);if(!cached)return;this.cache.delete(a.key);this.cache.set(a.key,cached);const entry=cached.entries[a.index-a.first];return cached.blob.slice(entry.offset,entry.offset+entry.size,'image/webp');}
 has(url:string){const a=address(url);return !!a&&this.cache.has(a.key);}
 invalidate(url:string){const a=address(url);if(!a||this.failed.has(a.key))return;this.failed.add(a.key);this.errors++;const cached=this.cache.get(a.key);if(cached){this.cache.delete(a.key);this.retainedBytes-=cached.blob.size;}}
 hasPending(url:string){const a=address(url);return !!a&&this.pending.has(a.key);}
 async wait(url:string,signal:AbortSignal){const a=address(url),job=a&&this.pending.get(a.key);if(!job)return this.get(url);if(signal.aborted)throw new DOMException('Aborted','AbortError');
  let abort:()=>void=()=>{};try{await Promise.race([job.promise,new Promise<never>((_,reject)=>{abort=()=>reject(new DOMException('Aborted','AbortError'));signal.addEventListener('abort',abort,{once:true});})]);if(signal.aborted)throw new DOMException('Aborted','AbortError');return this.get(url);}finally{signal.removeEventListener('abort',abort);}
 }
 private ensure(key:string,first:number,urgent:boolean):Promise<Cached|undefined>{if(this.disposed||this.failed.has(key)||(!urgent&&this.deferred.has(key)))return Promise.resolve(undefined);if(urgent)this.deferred.delete(key);const cached=this.cache.get(key);if(cached)return Promise.resolve(cached);const existing=this.pending.get(key);if(existing){if(existing.controller.signal.aborted)return existing.promise.then(()=>this.current===key?this.ensure(key,first,urgent):undefined);if(urgent&&!existing.started){this.queue=this.queue.filter(j=>j!==existing);this.queue.unshift(existing);}return existing.promise;}
  let resolve:Pending['resolve']=()=>{};const promise=new Promise<Cached|undefined>(r=>resolve=r),job={key,first,controller:new AbortController(),resolve,promise,started:false};this.pending.set(key,job);if(urgent)this.queue.unshift(job);else this.queue.push(job);this.pump();return promise;
 }
 private pump(){while(!this.disposed&&this.active<3&&this.queue.length){const job=this.queue.shift()!;job.started=true;this.active++;void this.download(job);}}
 private async download(job:Pending){let value:Cached|undefined;try{this.requests++;const response=await fetch(job.key,{signal:job.controller.signal,cache:'force-cache',priority:'low'});if(!response.ok)throw Error('Pack HTTP '+response.status);const length=Number(response.headers.get('content-length'));if(length>maxPackBytes)throw Error('Oversized frame pack');const blob=await response.blob();if(this.disposed||job.controller.signal.aborted)return;const entries=parseFramePack(await blob.arrayBuffer(),job.first);if(this.disposed||job.controller.signal.aborted)return;this.transferredBytes+=blob.size;value={blob,entries};this.cache.set(job.key,value);this.retainedBytes+=blob.size;
   for(const [key,cached]of this.cache){if(this.retainedBytes<=this.budget)break;if(key===this.current)continue;this.cache.delete(key);this.retainedBytes-=cached.blob.size;if(key===job.key)this.deferred.add(key);}
   if(this.cache.has(job.key))this.ready();
  }catch{if(!this.disposed&&!job.controller.signal.aborted){this.errors++;this.failed.add(job.key);}}
  finally{job.resolve(value);this.pending.delete(job.key);this.active--;this.pump();}
 }
 stats(){return {requests:this.requests,transferredBytes:this.transferredBytes,retainedBytes:this.retainedBytes,budget:this.budget,blocks:this.cache.size,pending:this.pending.size,errors:this.errors};}
 dispose(){this.disposed=true;for(const job of this.pending.values()){job.controller.abort();job.resolve(undefined);}this.pending.clear();this.queue=[];this.cache.clear();this.retainedBytes=0;}
}
