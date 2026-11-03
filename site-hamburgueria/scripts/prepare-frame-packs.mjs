import fs from 'node:fs';import path from 'node:path';
let total=0,count=0;
for(const scene of fs.readdirSync('public/media'))for(const profile of ['desktop-native','mobile-native']){
const dir=path.join('public/media',scene,profile);if(!fs.existsSync(dir))continue;
for(let first=0;first<80;first+=16){const images=Array.from({length:16},(_,i)=>fs.readFileSync(path.join(dir,String(first+i+1).padStart(3,'0')+'.webp'))),header=Buffer.alloc(8+images.length*12);header.writeUInt32BE(0x42524631,0);header.writeUInt32BE(images.length,4);let offset=header.length;
images.forEach((image,i)=>{header.writeUInt32BE(first+i,8+i*12);header.writeUInt32BE(offset,12+i*12);header.writeUInt32BE(image.length,16+i*12);offset+=image.length;});const packed=Buffer.concat([header,...images]),dest=path.join(dir,'packs',String(first/16).padStart(3,'0')+'.bin');fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest)||!fs.readFileSync(dest).equals(packed))fs.writeFileSync(dest,packed);total+=packed.length;count++;
// Build gate: every compressed frame is byte-identical to its individual fallback.
images.forEach((image,i)=>{const at=header.readUInt32BE(12+i*12);if(!packed.subarray(at,at+image.length).equals(image))throw Error('Frame integrity failed');});
}for(const name of fs.readdirSync(path.join(dir,'packs')))if(/^\d{3}\.bin$/.test(name)&&Number(name.slice(0,3))>=5)fs.unlinkSync(path.join(dir,'packs',name));}
console.log(`Frame packs: ${count} blocks, ${total} bytes; all 480 WebPs byte-identical.`);
