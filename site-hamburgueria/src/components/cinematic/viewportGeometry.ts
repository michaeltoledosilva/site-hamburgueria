export type BitmapGeometry={cssWidth:number;cssHeight:number;pixelWidth:number;pixelHeight:number};
/** Browser chrome changes CSS height, never the mobile backing store. Width changes rebuild once. */
export function bitmapGeometry(previous:BitmapGeometry|undefined,width:number,height:number,dpr:number,mobile:boolean):BitmapGeometry{
 if(mobile&&previous&&Math.abs(previous.cssWidth-width)<1)return previous;
 const ratio=Math.min(dpr||1,mobile?1.5:2),pixelLimit=mobile?1600000:8300000;
 const scale=Math.min(ratio,Math.sqrt(pixelLimit/Math.max(1,width*height)));
 return {cssWidth:width,cssHeight:height,pixelWidth:Math.max(1,Math.round(width*scale)),pixelHeight:Math.max(1,Math.round(height*scale))};
}
