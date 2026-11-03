import {createServer} from 'node:http';
import {stat} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
const root=path.resolve(process.env.NEXT_BUILD_DIR||'out');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.ico':'image/x-icon','.svg':'image/svg+xml','.mp4':'video/mp4','.json':'application/json','.txt':'text/plain'};
createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const environmentDelay=pathname.startsWith('/media/')?Math.min(500,Number(process.env.QA_ASSET_DELAY_MS)||0):0;
  const delay=Math.min(500,Math.max(environmentDelay,Number(new URL(req.url,'http://localhost').searchParams.get('qaDelay'))||0));
  if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
  const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const info=await stat(file);if(!info.isFile())throw new Error('Not a file');
  const headers={'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':environmentDelay?'no-store':pathname.startsWith('/media/')?'public, max-age=3600':'no-cache','Accept-Ranges':'bytes'};
  let start=0,end=info.size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
   if(!match){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
   start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;
   if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
   headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;status=206;
  }
  res.writeHead(status,{...headers,'Content-Length':end-start+1});
  if(req.method==='HEAD'){res.end();return;}
  const stream=createReadStream(file,{start,end});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||3000,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${Number(process.env.PORT)||3000}`));
