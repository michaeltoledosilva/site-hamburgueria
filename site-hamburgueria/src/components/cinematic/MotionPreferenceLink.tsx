'use client';
import {useSyncExternalStore} from 'react';
const subscribe=(notify:()=>void)=>{window.addEventListener('popstate',notify);return ()=>window.removeEventListener('popstate',notify);};
const getSnapshot=()=>new URLSearchParams(window.location.search).get('motion')==='reduce';
const getServerSnapshot=()=>false;
export default function MotionPreferenceLink(){
 const reduced=useSyncExternalStore(subscribe,getSnapshot,getServerSnapshot);
 return <a href={reduced?'/':'/?motion=reduce'}>{reduced?'Versão com movimento':'Versão sem movimento'}</a>;
}
