import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),{chromium}=require('C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.QA_BASE_URL||'http://127.0.0.1:3001';
fs.mkdirSync('docs/review',{recursive:true});
const b=await chromium.launch({channel:'msedge',headless:true}),report={browser:b.version(),rows:[],errors:[],dynamic:[]};
try{for(const [width,height] of [[320,568],[390,844],[1440,900]]){
const p=await b.newPage({viewport:{width,height},deviceScaleFactor:1});p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url())});
await p.goto(base+'/?perf=1');await p.waitForTimeout(600);
const capture=async(state)=>{await p.screenshot({path:`docs/review/${width}-${state}.png`});report.rows.push({width,height,state,...await p.evaluate(()=>({scroll:scrollY,overflow:document.documentElement.scrollWidth>innerWidth,frame:document.querySelector('canvas').dataset.frame,scene:document.querySelector('canvas').dataset.scene,profile:[...performance.getEntriesByType('resource')].filter(r=>r.name.includes('/media/')).map(r=>r.name),background:getComputedStyle(document.body).backgroundColor}))});};
await capture('entry');
for(const scene of [0,1,2]){await p.locator('.chapter-dot').nth(scene).click();await p.waitForTimeout(350);await capture('scene-'+scene);const bounds=await p.locator('.cinematic-scroll').boundingBox();const start=await p.evaluate(()=>scrollY);await p.evaluate(y=>scrollTo(0,y),start+(bounds.height-height)/3*.55);await p.waitForTimeout(300);await capture('mid-'+scene);}
for(const ratio of [.31,.325,.33,.34,.64,.655,.665,.68]){await p.evaluate(r=>{const el=document.querySelector('.cinematic-scroll');scrollTo(0,el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*r)},ratio);await p.waitForTimeout(160);await capture('transition-'+ratio);}
for(const dir of [1,-1])for(let i=0;i<20;i++){await p.mouse.wheel(0,dir*95);await p.waitForTimeout(35);}
await p.waitForTimeout(500);report.dynamic.push({width,height,reverse:await p.evaluate(()=>({scene:document.querySelector('canvas').dataset.scene,frame:document.querySelector('canvas').dataset.frame,target:document.querySelector('canvas').dataset.targetFrame}))});
for(const [selector,state] of [['#cardapio','menu'],['#delivery','delivery'],['.final-scene','closing'],['footer','exit'],['[data-zmt-signature]','signature']]){await p.locator(selector).scrollIntoViewIfNeeded();await p.waitForTimeout(150);await capture(state);}
await p.getByRole('button',{name:'Pedir pelo iFood'}).click();if(!(await p.getByRole('status').textContent()).includes('iFood:'))throw Error('iFood demo feedback failed');await p.getByRole('button',{name:'Conversar no WhatsApp'}).click();if(!(await p.getByRole('status').textContent()).includes('WhatsApp:'))throw Error('WhatsApp feedback failed');
await p.close();}
const p=await b.newPage({viewport:{width:390,height:844}});await p.goto(base);await p.screenshot({path:'docs/review/normal-route.png'});await p.emulateMedia({reducedMotion:'reduce'});await p.reload();await p.screenshot({path:'docs/review/reduced.png'});if(await p.locator('.experience').getAttribute('data-experience')!=='static')throw Error('Reduced motion missing');await p.close();
fs.writeFileSync('docs/review/results.json',JSON.stringify(report,null,2));if(report.errors.length||report.rows.some(r=>r.overflow))throw Error(JSON.stringify(report.errors));console.log('PASS: scenes, transitions, reverse gestures, normal route, demo CTAs, reduced motion, HTTP and overflow.');
}finally{await b.close()}
