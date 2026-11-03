import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const source=process.argv[2];
if(!source)throw Error('Informe a pasta dos arquivos originais como argumento.');
const files=fs.readdirSync(source), manifest=[];
for(const file of files){
 const input=path.join(source,file);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height,r_frame_rate','-show_entries','format=duration','-of','json',input]));
 const stream=probe.streams.find(s=>s.width); const row={file,...stream,duration:probe.format.duration||null};
 if(file.endsWith('.mp4')){
 const scene=file.startsWith('Smash')?'chapa':file.startsWith('Composição')||file.includes('ingredients')?'camadas':'brasa';
 const profile=stream.width>stream.height?'desktop-native':'mobile-native';
 const output=`public/media/${scene}/${profile}`;fs.mkdirSync(output,{recursive:true});
 execFileSync('ffmpeg',['-v','error','-i',input,'-vf',`fps=10.1,scale=${profile==='desktop-native'?1920:720}:-2`,'-frames:v','80','-c:v','libwebp','-quality','77','-y',`${output}/%03d.webp`],{stdio:'inherit'});
 row.scene=scene;row.profile=profile;row.derivative=`${output}/%03d.webp`;
 } else {row.usage='Referência visual e cardápio';const id=file.includes('-1.png')?'burger':file.includes('-2.png')?'layers':'griddle';fs.mkdirSync('public/images',{recursive:true});execFileSync('ffmpeg',['-v','error','-i',input,'-vf','scale=1600:-2','-quality','84','-y',`public/images/${id}.webp`]);}
 manifest.push(row);
}
fs.mkdirSync('docs',{recursive:true});fs.writeFileSync('docs/media-map.json',JSON.stringify(manifest,null,2));
