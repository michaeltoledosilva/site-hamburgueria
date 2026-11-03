import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const require=createRequire(import.meta.url);
const content=JSON.parse(readFileSync(new URL('../src/components/zmt-signature/content.json',import.meta.url),'utf8'));
let playwright;
try { playwright=require(process.env.PLAYWRIGHT_PATH||'playwright'); }
catch(error) { if(process.env.PLAYWRIGHT_PATH)throw error;playwright=require('C:/Users/micha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const browser=await playwright.chromium.launch({channel:process.env.QA_BROWSER||'msedge',headless:true});
const rows=[];
try {
  for(const width of [320,390,1440]) {
    const page=await browser.newPage({viewport:{width,height:width===320?568:900}});
    await page.goto((process.env.QA_BASE_URL||'http://127.0.0.1:3000')+'/?perf=1');
    const signature=page.locator('[data-zmt-signature]');
    if(await signature.count()!==1)throw new Error('Esperada uma única assinatura ZMT');
    await signature.scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
    const result=await signature.evaluate(ad=>{
      const links=[...ad.querySelectorAll('a')],button=links[0],url=new URL(button.href),brand=document.querySelector('.footer-brand'),name=brand?.childNodes[0]?.textContent?.trim(),headerBrand=document.querySelector('.brand'),headerCTA=document.querySelector('.header-book');
      return {version:ad.dataset.zmtSignature,title:ad.querySelector('h2').textContent,description:ad.querySelector('p').textContent,text:ad.textContent,owner:url.pathname,message:url.searchParams.get('text'),siteLink:links[1]?.href,name,fontWeight:getComputedStyle(button).fontWeight,fontLoaded:document.fonts.check('600 16px "ZMT Manrope"'),buttonHeight:button.getBoundingClientRect().height,background:getComputedStyle(ad).backgroundColor,buttonBackground:getComputedStyle(button).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1,headerOverlap:!!(headerBrand&&headerCTA&&headerBrand.getBoundingClientRect().right>headerCTA.getBoundingClientRect().left-5)};
    });
    if(result.version!==content.version||result.owner!='/'+content.whatsappNumber||!result.message||result.name&&!result.message.includes(result.name)||result.title!==content.text||result.description!==content.description||!result.text.includes(content.contactHint)||!result.text.includes(content.websiteLabel)||result.text.includes('EXPERIÊNCIAS DIGITAIS')||result.siteLink!==new URL(content.url).href||result.fontWeight!=='600'||!result.fontLoaded||result.buttonHeight<44||result.overflow||result.headerOverlap)throw new Error(JSON.stringify({width,...result}));
    rows.push({width,...result});await page.close();
  }
  mkdirSync('docs/template-validation',{recursive:true});writeFileSync('docs/template-validation/defaults.json',JSON.stringify(rows,null,2));console.log('PASS: central ZMT signature, dynamic origin, WhatsApp, website, local font and responsive layout');
} finally { await browser.close(); }
