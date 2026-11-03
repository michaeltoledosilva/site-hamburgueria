/** Coalesces scroll, resize and decoded frames into a single browser frame. */
export function createRenderScheduler(render:()=>void,request:(callback:FrameRequestCallback)=>number=requestAnimationFrame,cancel:(id:number)=>void=cancelAnimationFrame){
 let pending=0,disposed=false;
 return {request(){if(!pending&&!disposed)pending=request(()=>{pending=0;if(!disposed)render();});},dispose(){disposed=true;if(pending)cancel(pending);pending=0;}};
}
