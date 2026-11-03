import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function harness(){
 let time=0,closed=0,notified=0;const pending=[];
 const source=readFileSync(new URL('../src/components/cinematic/frameLoader.ts',import.meta.url),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const exports={};
 vm.runInNewContext(code,{exports,require:()=>({scenes:Array.from({length:5},(_,i)=>({id:String(i)})),framesPerScene:80}),performance:{now:()=>time},AbortController,setTimeout,clearTimeout,URL,fetch:(url,{signal})=>new Promise((resolve,reject)=>{const job={url,resolve:()=>resolve({ok:true,blob:async()=>({size:100})})};pending.push(job);signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});}),createImageBitmap:async()=>({width:864,height:1080,close:()=>closed++})});
 const loader=new exports.FrameLoader(true,()=>notified++,3,'',true,'bitmap',true);
 return {loader,pending,advance:ms=>time+=ms,closed:()=>closed,notified:()=>notified};
}
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};

test('large same-scene jump cancels obsolete loads and converges to latest target',async()=>{
 const h=harness();h.loader.plan(0,10,1,20);assert.equal(h.pending.length,3);h.advance(50);h.loader.plan(0,60,1,200,50);await flush();assert.equal(h.loader.stats().aborts,3);assert.ok(h.pending.slice(3).some(p=>p.url.endsWith('/061.webp')));for(const p of h.pending.slice(3))p.resolve();await flush();assert.equal(h.loader.get(0,60,0)?.index,60);assert.equal(h.loader.stats().errors,0);h.loader.dispose();assert.equal(h.loader.stats().decodedBytes,0);assert.ok(h.closed()>0);
});
test('microgestures deduplicate and preserve young relevant requests',async()=>{
 const h=harness();h.loader.plan(0,10,1,20);h.advance(10);h.loader.plan(0,11,1,20);assert.equal(h.pending.length,3);assert.equal(h.loader.stats().aborts,0);for(const p of h.pending)p.resolve();await flush();assert.equal(h.loader.get(0,11,0)?.index,11);h.loader.dispose();
});
test('late generation cannot paint a previous scene, reverse reaches target',async()=>{
 const h=harness();h.loader.plan(3,60,1,100);h.advance(10);h.loader.plan(1,20,-1,100,-40);for(const p of h.pending.slice(0,3))p.resolve();await flush();assert.equal(h.notified(),0);assert.ok(h.loader.stats().staleResults>=1);for(const p of h.pending.slice(3))p.resolve();await flush();assert.equal(h.loader.get(1,20,0)?.index,20);assert.equal(h.loader.get(3,60,0),null);h.loader.dispose();
});
test('dispose while downloading prevents decode and notification',async()=>{
 const h=harness();h.loader.plan(0,10,1,20);h.loader.dispose();for(const p of h.pending)p.resolve();await flush();assert.equal(h.notified(),0);assert.equal(h.loader.stats().decodedFrames,0);
});
test('immediate reversal to an aborting URL is retried, not lost from the queue',async()=>{
 const h=harness();h.loader.plan(0,10,1,100);h.advance(50);h.loader.plan(0,60,1,100,50);h.loader.plan(0,10,-1,100,-50);await flush();for(const p of h.pending.slice(3))p.resolve();await flush();assert.equal(h.loader.get(0,10,0)?.index,10);h.loader.dispose();
});

test('profile changes request the correct URLs without disposing the protected bitmap',async()=>{
 const h=harness();h.loader.plan(0,10,1,20);for(const p of h.pending)p.resolve();await flush();const shown=h.loader.get(0,10,0);h.loader.drawn(shown);h.loader.setProfile(false);h.loader.plan(0,10,1,20);await flush();assert.ok(h.pending.some(p=>p.url.includes('/desktop-native/011.webp')));assert.equal(h.closed(),0);h.loader.dispose();
});

test('already downloaded upcoming frame survives an intermediate scroll replan',async()=>{
 const h=harness();h.loader.plan(0,10,1,100,16);const future=h.pending.find(p=>p.url.endsWith('/027.webp'));assert.ok(future);h.advance(10);h.loader.plan(0,12,1,100,2);future.resolve();await flush();assert.equal(h.loader.get(0,26,0)?.index,26);h.loader.dispose();
});
test('reversal discards an obsolete far-forward prediction before decode',async()=>{
 const h=harness();h.loader.plan(0,10,1,100,16);const future=h.pending.find(p=>p.url.endsWith('/027.webp'));h.advance(10);h.loader.plan(0,12,-1,100,-2);future.resolve();await flush();assert.equal(h.loader.get(0,26,0),null);h.loader.dispose();
});
