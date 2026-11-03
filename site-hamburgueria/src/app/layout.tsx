import type {Metadata,Viewport} from 'next';
import './globals.css';
import './cinematic-viewport.css';
import './cinematic-mobile-composition.css';
import './cinematic-mobile-controls.css';
import './brasa.css';
import PerformanceProbe from '@/components/cinematic/PerformanceProbe';
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#100e0c'};
export const metadata:Metadata={metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3001'),title:'BRASA BURGER | O sabor começa pelos olhos',description:'Uma experiência gastronômica cinematográfica. Hambúrgueres, fogo e sabor em um projeto demonstrativo desenvolvido pela ZMT.',robots:{index:false,follow:true},openGraph:{title:'BRASA BURGER — O sabor começa pelos olhos',description:'Uma experiência irresistível em cada camada. Projeto demonstrativo ZMT.',images:[{url:'/images/burger.webp',width:1600,height:900,alt:'BRASA BURGER — hambúrguer artesanal'}],locale:'pt_BR',type:'website'},twitter:{card:'summary_large_image'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><a className="skip-link" href="#cardapio">Pular experiência visual</a>{children}<PerformanceProbe/></body></html>}
