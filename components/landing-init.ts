// @ts-nocheck
/* Comportamento da landing: anel, gomos, contadores, revelar ao rolar, menu, inclinação do celular e lista de espera. */
export function initLanding(root: HTMLElement, onJoin: (email: string) => Promise<{ error?: string }>) {

root.classList.add("js");
const rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
// ícones
const SY={};document.querySelectorAll("symbol").forEach(x=>SY[x.id]=x);
document.querySelectorAll("svg[data-i]").forEach(el=>{const k=el.dataset.i,x=SY[k];if(!x)return;el.setAttribute("viewBox",x.getAttribute("viewBox"));el.innerHTML=x.innerHTML;el.classList.add("i-"+k);if(el.parentElement)el.parentElement.classList.add("i-"+k)});
// logo onda
const RN=28;function ring(svg,col,ph){let o="";for(let i=0;i<RN;i++){const a=i/RN*Math.PI*2-Math.PI/2,L=10+7*Math.sin(a*2+ph),r1=22,P=r=>`${(50+r*Math.cos(a)).toFixed(2)} ${(50+r*Math.sin(a)).toFixed(2)}`;o+=`<path d="M${P(r1)} L${P(r1+L)}" stroke="${col}" stroke-width="3.4" stroke-linecap="round"/>`}svg.innerHTML=o}
const RG=[...document.querySelectorAll("svg[data-ring]")];
let raf=0;(function loop(t){RG.forEach(x=>ring(x,x.dataset.ring,rm?1:t/1000*1.3));if(!rm)raf=requestAnimationFrame(loop)})(0);
// gomos
document.querySelectorAll(".gz").forEach(g=>{const N=13,on=Math.round(N*+g.dataset.on),cx=140,cy=142,R1=84,R2=134,C=g.dataset.c.split("|");let h="";
 for(let i=0;i<N;i++){const gp=.085,a0=Math.PI*(1-i/N)-gp,a1=Math.PI*(1-(i+1)/N)+gp,P=(r,a)=>`${(cx+r*Math.cos(a)).toFixed(1)} ${(cy-r*Math.sin(a)).toFixed(1)}`,c=i<on?C[0]:i===on?C[1]:C[2];
 h+=`<path style="transform-box:fill-box;transform-origin:center;animation:gp .55s ${i*55}ms cubic-bezier(.3,1.5,.5,1) both" d="M${P(R1,a0)} L${P(R2,a0)} A${R2} ${R2} 0 0 1 ${P(R2,a1)} L${P(R1,a1)} A${R1} ${R1} 0 0 0 ${P(R1,a0)}Z" fill="${c}" stroke="${c}" stroke-width="11" stroke-linejoin="round"/>`}
 g.innerHTML=h});

// contadores
const count=el=>{if(el.dataset.done)return;el.dataset.done=1;const to=+el.dataset.count;if(rm)return;const t0=performance.now(),f=t=>{const k=Math.min(1,(t-t0)/1300),v=Math.round(to*(1-Math.pow(1-k,3)));el.textContent="R$ "+v.toLocaleString("pt-BR");if(k<1)requestAnimationFrame(f)};requestAnimationFrame(f)};
// revelar e contar ao entrar na tela
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in-view");e.target.querySelectorAll("[data-count]").forEach(count)}}),{threshold:.2});
document.querySelectorAll(".rv,.hero,.step").forEach(x=>io.observe(x));
// linha do tempo e calendário
const inc={5:"in",10:"in h",20:"in h"};document.getElementById("tl").innerHTML=Array.from({length:30},(_,i)=>{const d=i+1;if(d===15)return'<i class="var"></i>';if(d===21)return'<i class="now"></i>';return`<i class="${inc[d]||""}"></i>`}).join("");
document.getElementById("cal").innerHTML=Array.from({length:28},(_,i)=>{const d=i+3;return`<span class="${d<21?"p":d===21?"n":""}${[25,27,30].includes(d)?" e":""}${d===30?" s":""}">${d}</span>`}).join("");
// privacidade
document.querySelector("#priv .eye").onclick=()=>document.getElementById("priv").classList.toggle("show");
// a frase da dor acende palavra por palavra ao rolar
const pain=document.getElementById("pain");pain.innerHTML=pain.innerHTML.replace(/<span class="acc">(.*?)<\/span>/,"§$1§").split(" ").map(w=>w.includes("§")?`<span class="w acc">${w.replace(/§/g,"")}</span>`:`<span class="w">${w}</span>`).join(" ");
const lightPain=()=>{const r=pain.getBoundingClientRect(),vh=innerHeight,p=Math.min(1,Math.max(0,(vh*.85-r.top)/(r.height+vh*.35)));const ws=pain.querySelectorAll(".w");ws.forEach((w,i)=>w.classList.toggle("on",i/ws.length<p))};
// nav clara depois do hero
const nav=document.getElementById("nav"),hero=document.getElementById("top");
const onScroll=()=>{const y=scrollY,h=hero.offsetHeight;const darkBands=[...document.querySelectorAll(".dark-band,.final")].some(b=>{const r=b.getBoundingClientRect();return r.top<60&&r.bottom>60});nav.classList.toggle("light",y>h-80&&!darkBands);lightPain()};
addEventListener("scroll",onScroll,{passive:true});onScroll();
// celular inclina com o mouse, cartões em profundidade
const stage=document.getElementById("stage"),tilt=document.getElementById("tilt"),fls=[...document.querySelectorAll(".fl")];
if(!rm&&matchMedia("(pointer:fine)").matches){document.querySelector(".hero").addEventListener("pointermove",e=>{const r=stage.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;tilt.style.transform=`rotateY(${x*14}deg) rotateX(${-y*10}deg)`;fls.forEach(f=>{const d=+f.dataset.depth;f.style.transform=`translate(${x*d}px,${y*d}px)`})})}
// captação
document.querySelectorAll("[data-cap]").forEach(f=>f.addEventListener("submit",async e=>{e.preventDefault();const m=f.nextElementSibling,inp=f.querySelector("input"),b=f.querySelector("button");b.disabled=true;m.textContent="Enviando…";try{const r=await onJoin(inp.value);m.textContent=r.error?r.error:"Pronto! Seu e-mail está na lista.";if(!r.error)inp.value=""}catch{m.textContent="Não deu pra enviar agora. Tenta de novo em instantes."}b.disabled=false}));

  return () => { cancelAnimationFrame(raf); removeEventListener("scroll", onScroll); io.disconnect() }
}
