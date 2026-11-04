import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function moduleAt(file){const exports={};vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../src/components/cinematic/'+file,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText,{exports});return exports;}
const {bitmapGeometry,framePlacement}=moduleAt('viewportGeometry.ts');
const {createRenderScheduler}=moduleAt('renderScheduler.ts');
test('height-only toolbar bursts preserve mobile bitmap identity and pixel count',()=>{let value=bitmapGeometry(undefined,390,844,2,true);const first=value;for(const h of [780,844,760,830,844]){value=bitmapGeometry(value,390,h,2,true);assert.equal(value,first);}assert.equal(value.pixelHeight,1266);});
test('orientation/width change rebuilds exactly once and respects pixel budget',()=>{const a=bitmapGeometry(undefined,390,844,3,true),b=bitmapGeometry(a,844,390,3,true);assert.notEqual(a,b);assert.ok(b.pixelWidth*b.pixelHeight<=1602000);assert.equal(bitmapGeometry(b,844,350,3,true),b);});
test('desktop height change can resize rather than retaining a stale bitmap',()=>{const a=bitmapGeometry(undefined,1440,900,2,false),b=bitmapGeometry(a,1440,768,2,false);assert.notEqual(a,b);assert.notEqual(a.pixelHeight,b.pixelHeight);});
test('scroll + decode + resize coalesce into one scheduled rendering task',()=>{let id=0,draws=0;const frames=new Map();const s=createRenderScheduler(()=>draws++,fn=>{frames.set(++id,fn);return id;},i=>frames.delete(i));for(let i=0;i<50;i++)s.request();assert.equal(frames.size,1);const fn=frames.values().next().value;frames.clear();fn();assert.equal(draws,1);s.request();assert.equal(frames.size,1);s.dispose();assert.equal(frames.size,0);s.request();assert.equal(frames.size,0);});
test('an existing animation tick flushes queued work without adding a second RAF',()=>{let id=0,draws=0;const frames=new Map();const s=createRenderScheduler(()=>draws++,fn=>{frames.set(++id,fn);return id;},i=>frames.delete(i));s.request();s.request();s.flush();assert.equal(draws,1);assert.equal(frames.size,0);s.request();assert.equal(frames.size,1);s.dispose();s.flush();assert.equal(draws,1);assert.equal(frames.size,0);});
test('portrait mobile framing preserves the complete source at tall and short viewports',()=>{for(const [w,h]of [[390,844],[412,915],[320,568],[430,932]]){const p=framePlacement(w,h,720,1280,true);assert.equal(p.contained,true);assert.ok(p.x>=0&&p.y>=0);assert.ok(p.x+p.width<=w+.001&&p.y+p.height<=h+.001);assert.ok(Math.abs(p.width/p.height-720/1280)<1e-10);}});
test('desktop framing retains its existing cover geometry',()=>{const p=framePlacement(1440,900,1920,1080,false);assert.equal(p.contained,false);assert.equal(p.width,1600);assert.equal(p.height,900);assert.equal(p.x,-80);assert.equal(p.y,0);});
