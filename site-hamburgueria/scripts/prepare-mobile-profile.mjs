import {readdirSync,existsSync,mkdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
const width=Number(process.argv[2]||576);if(!Number.isInteger(width)||width<320||width>1080)throw Error('Choose a mobile width between 320 and 1080');
for(const scene of readdirSync('public/media',{withFileTypes:true}).filter(e=>e.isDirectory())){
const input=`public/media/${scene.name}/mobile-native`,output=`public/media/${scene.name}/mobile-cinematic`;if(!existsSync(input))continue;
const result=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height','-of','json',`${input}/001.webp`],{encoding:'utf8'});const dimensions=JSON.parse(result.stdout).streams[0];if(dimensions.width<width)throw Error('No upscaling permitted');
mkdirSync(output,{recursive:true});if(existsSync(`${output}/080.webp`))continue;
const r=spawnSync('ffmpeg',['-v','error','-y','-framerate','10','-i',`${input}/%03d.webp`,'-vf',`scale=${width}:-2`,'-frames:v','80','-c:v','libwebp','-quality','78','-f','image2',`${output}/%03d.webp`],{stdio:'inherit'});if(r.status)process.exit(r.status);console.log(`${scene.name}: mobile-cinematic ${width}px, original aspect, 80 frames`);
}
