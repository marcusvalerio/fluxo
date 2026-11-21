// @ts-nocheck
/* Cenas de Natal do Fluximetro (árvore com escada e coral na cidadezinha). Mesmo código da prévia aprovada. */
export function mountNatal(root: HTMLElement, which: "arvore" | "coral") {
let alive=true;const raf=(f)=>alive&&requestAnimationFrame(f);
const rm=matchMedia("(prefers-reduced-motion: reduce)").matches;
const pig=(x,y,s,o={})=>{const c=o.c||"#3B5285",d=o.d||"#1B2440";return `<g transform="translate(${x} ${y}) scale(${s})">
 ${o.legs===false?"":`<rect class="legL" x="-18" y="18" width="8" height="12" rx="4" fill="${d}"/><rect class="legR" x="10" y="18" width="8" height="12" rx="4" fill="${d}"/>`}
 ${o.skates?`<rect x="-24" y="30" width="18" height="3" rx="1.5" fill="#B9C8DD"/><rect x="6" y="30" width="18" height="3" rx="1.5" fill="#B9C8DD"/>`:""}
 <ellipse cx="0" cy="0" rx="32" ry="25" fill="${c}"/><ellipse cx="32" cy="-1" rx="6" ry="7" fill="${c}"/><ellipse cx="-12" cy="-11" rx="10" ry="5" fill="#fff" opacity=".2"/>
 <rect x="-9" y="-28" width="18" height="4.5" rx="2.2" fill="${d}"/>
 ${o.scarf?`<path d="M-26 8 Q0 18 26 8 L26 14 Q0 24 -26 14Z" fill="${o.scarf}"/><rect x="14" y="12" width="7" height="16" rx="3" fill="${o.scarf}"/>`:""}
 ${o.hat?`<path d="M-14 -24 Q2 -60 26 -40 L14 -22Z" fill="#C24B3C"/><circle cx="27" cy="-41" r="5" fill="#F7F7F7"/><rect x="-18" y="-27" width="34" height="7" rx="3.5" fill="#F7F7F7"/>`:""}
 <g class="blink"><ellipse cx="-8" cy="-2" rx="3.6" ry="${o.scared?6:4.8}" fill="#F7F7F7"/><ellipse cx="8" cy="-2" rx="3.6" ry="${o.scared?6:4.8}" fill="#F7F7F7"/></g>
 ${o.scared?`<ellipse cx="0" cy="10" rx="4" ry="5" fill="${d}"/>`:""}
</g>`};
const TX=700, BASE=525;
function treeSvg(){let t="";
 const L=[[TX,520,200,120],[TX,430,170,115],[TX,345,140,105],[TX,265,110,95],[TX,192,78,85]];
 t+=`<rect x="${TX-20}" y="505" width="40" height="40" rx="6" fill="#4A3426"/>`;
 L.forEach(([x,y,w,h],i)=>{t+=`<path d="M${x-w} ${y} Q${x} ${y-14} ${x+w} ${y} L${x} ${y-h-40}Z" fill="${i%2?"#2E6B5A":"#24584A"}"/>`});
 [[640,300],[770,330],[610,420],[720,405],[800,440],[660,490],[760,500]].forEach(([x,y],i)=>{t+=`<g class="hang" style="animation-delay:${i*.3}s"><line x1="${x}" y1="${y-16}" x2="${x}" y2="${y-4}" stroke="#B9C8DD" stroke-width="1.5"/><circle cx="${x}" cy="${y+6}" r="11" fill="#F7F7F7" stroke="#8FA4D0" stroke-width="3"/><text x="${x}" y="${y+10}" font-size="10" text-anchor="middle" fill="#3B5285" font-family="Syne,sans-serif" font-weight="700">R$</text></g>`});
 return t}
function presents(){return [[600,540,52,"#3B5285","#F2C25E"],[805,545,46,"#C24B3C","#F7F7F7"],[860,552,32,"#8FA4D0","#1B2440"]].map(([x,y,s,c,r])=>`<rect x="${x-s/2}" y="${y-s+20}" width="${s}" height="${s}" rx="6" fill="${c}"/><rect x="${x-4}" y="${y-s+20}" width="8" height="${s}" fill="${r}"/><path d="M${x} ${y-s+20} q-14 -16 -18 0 q14 4 18 0 q14 -16 18 0 q-14 4 -18 0" fill="${r}"/>`).join("")}
const ladder=`<g><line x1="452" y1="545" x2="560" y2="140" stroke="#B98A5A" stroke-width="8" stroke-linecap="round"/><line x1="502" y1="548" x2="606" y2="150" stroke="#B98A5A" stroke-width="8" stroke-linecap="round"/>${Array.from({length:11},(_,i)=>{const k=(i+.5)/11;return `<line x1="${452+108*k}" y1="${545-405*k}" x2="${502+104*k}" y2="${548-398*k}" stroke="#D6A876" stroke-width="6" stroke-linecap="round"/>`}).join("")}</g>`;
function scene(id){return `
 <defs><radialGradient id="moon${id}"><stop offset="0" stop-color="#F7F7F7"/><stop offset="1" stop-color="#F7F7F7" stop-opacity="0"/></radialGradient></defs>
 <circle cx="150" cy="110" r="90" fill="url(#moon${id})" opacity=".35"/><circle cx="150" cy="110" r="34" fill="#F7F7F7" opacity=".9"/>
 <path d="M0 470 Q180 420 360 455 T720 440 T1000 450 V625 H0Z" fill="#2B3756"/>
 <path d="M0 500 Q200 470 420 495 T1000 490 V625 H0Z" fill="#EDF1F7" opacity=".92"/>
 <g class="behind"></g>
 ${treeSvg()}
 <path class="lights-top" fill="none" stroke="#1B2440" stroke-width="2.5"/><g class="bulbs-top"></g>
 ${ladder}
 <path class="garland" fill="none" stroke="#1B2440" stroke-width="3" stroke-linecap="round"/><g class="bulbs"></g>
 <g class="glow" opacity="0">${Array.from({length:12},(_,i)=>`<rect x="-2" y="-90" width="4" height="40" rx="2" fill="#F2C25E" transform="rotate(${i*30})"/>`).join("")}<circle r="40" fill="#FFE9A8" opacity=".35"/></g>
 <g class="party" opacity="0">${Array.from({length:8},(_,i)=>`<path d="M0 -6 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1Z" fill="${["#F2C25E","#F7F7F7","#C24B3C","#7CC4A2"][i%4]}"/>`).join("")}</g>
 <g class="tstar"><path d="M0 -30 l12 26 28 3 -21 19 6 28 -25 -14 -25 14 6 -28 -21 -19 28 -3Z" fill="#F2C25E"/></g>
 <g class="hero"></g>
 ${presents()}
 <g class="front"></g>`}
const COLS=["#F2C25E","#C24B3C","#8FA4D0","#7CC4A2"];
function q(P0,P1,P2,t){return [(1-t)*(1-t)*P0[0]+2*(1-t)*t*P1[0]+t*t*P2[0],(1-t)*(1-t)*P0[1]+2*(1-t)*t*P1[1]+t*t*P2[1]]}
function setup(svg,id){svg.innerHTML=scene(id);
 // pisca-pisca de cima: espiral que ondula de leve
 const fam=[{c:"#3B5285",s:1,o:{scarf:"#C24B3C"},ph:0},{c:"#3B5285",s:.95,o:{scarf:"#F2C25E",hat:true},ph:.35},{c:"#5A72A8",s:.6,o:{scarf:"#7CC4A2"},ph:.62},{c:"#5A72A8",s:.5,o:{scarf:"#8FA4D0"},ph:.8}];
 fam.forEach(f=>{const g=document.createElementNS("http://www.w3.org/2000/svg","g");g.innerHTML=`<g class="wob">${pig(0,0,1,{...f.o,c:f.c})}</g>`;f.el=g});
 return {svg,fam,hero:svg.querySelector(".hero"),star:svg.querySelector(".tstar"),glow:svg.querySelector(".glow"),party:svg.querySelector(".party"),gar:svg.querySelector(".garland"),bul:svg.querySelector(".bulbs"),lt:svg.querySelector(".lights-top"),bt:svg.querySelector(".bulbs-top"),beh:svg.querySelector(".behind"),fr:svg.querySelector(".front")}}
const S=which==="arvore"?[setup(root.querySelector("#big"),"a")]:[];
S.forEach(s=>s.hero.innerHTML=`<g class="hp">${pig(0,0,.75,{hat:true})}</g>`);
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
let sag={y:0,v:0},caught=false,lastT=0;
function frame(ms){const t=ms/1000,L=14,c=rm?11:t%L,dt=Math.min(.05,t-lastT);lastT=t;
 S.forEach(s=>{
  // herói: sobe (0-4), põe estrela (4-5), cai (5-6), preso balançando (6-12), some (12-13)
  let x,y,r=0,starX,starY,op=1,lit=0;
  const top=[575,170];
  if(c<4){const k=ease(c/4);x=480+(top[0]-480)*k;y=520+(top[1]-520)*k+Math.sin(c*9)*3}
  else if(c<5){x=top[0];y=top[1];const k=ease(c-4);starX=575+(700-575)*k;starY=150+(92-150)*k-Math.sin(k*Math.PI)*40}
  else if(c<6.6){x=top[0];const k=c-5;y=top[1]-Math.abs(Math.sin(k*Math.PI*2.5))*26;r=Math.sin(k*Math.PI*5)*10;lit=Math.min(1,k*2)}
  else if(c<7.6){const k=c-6.6;x=top[0]+60*k;y=top[1]+k*k*180;r=k*200;lit=1}
  else{x=635;y=350+sag.y;r=200+Math.sin(t*2.2)*12;op=c>13?1-(c-13):1;lit=1}
  if(c<4){starX=x+28;starY=y-10}if(c>=5){starX=700;starY=92}
  s.hero.setAttribute("transform",`translate(${x} ${y}) rotate(${r})`);s.hero.style.opacity=op;
  s.star.setAttribute("transform",`translate(${starX} ${starY}) scale(${c>=5?1+.08*lit*Math.sin(t*4):.6})`);
  s.glow.setAttribute("opacity",(lit*(.75+.25*Math.sin(t*3))).toFixed(2));s.glow.setAttribute("transform",`translate(700 92) rotate(${t*20})`);
  s.party.setAttribute("opacity",c>=5&&c<6.8?1:0);s.party.setAttribute("transform",`translate(${top[0]} ${top[1]-40})`);
  s.party.querySelectorAll("path").forEach((p,i)=>{const a=i/8*6.28,d=20+((c-5)%1.6)*40;p.setAttribute("transform",`translate(${Math.cos(a)*d} ${Math.sin(a)*d}) rotate(${t*200})`)});
  // guirlanda: presa nas pontas, o meio segue o Fluximetro quando ele cai
  const A=[575,300],B=[790,385];let C;
  if(c>=7.6&&c<13.5){C=[650,385+sag.y*1.6]}else{C=[690,360+Math.sin(t*1.3)*6]}
  s.gar.setAttribute("d",`M${A} Q${C} ${B}`);
  s.bul.innerHTML=Array.from({length:9},(_,i)=>{const p=q(A,C,B,(i+.5)/9);return `<circle cx="${p[0]}" cy="${p[1]+5}" r="5.5" fill="${COLS[i%4]}" opacity="${.55+.45*Math.abs(Math.sin(t*2+i))}"/>`}).join("");
  // espiral de cima, fluida
  let pts=[];for(let i=0;i<=30;i++){const k=i/30,yy=170+k*120,w=30+k*90,xx=700+Math.sin(k*Math.PI*4+t*.6)*w;pts.push([xx,yy+Math.sin(t*1.5+i)*2])}
  s.lt.setAttribute("d","M"+pts.map(p=>p.map(v=>v.toFixed(1)).join(" ")).join(" L"));
  s.bt.innerHTML=pts.filter((_,i)=>i%3==1).map((p,i)=>`<circle cx="${p[0]}" cy="${p[1]+5}" r="5" fill="${COLS[i%4]}" opacity="${.5+.5*Math.abs(Math.sin(t*2.4+i))}"/>`).join("");
  // família em volta da árvore
  s.fam.forEach((f,i)=>{const a=(rm?f.ph*6.28:t*.35+f.ph*6.28),sn=Math.sin(a),xx=TX+Math.cos(a)*270,yy=548+sn*38,sc=f.s*(.78+.22*(sn+1)/2)*.9;
   const host=sn<0?s.beh:s.fr;if(f.el.parentNode!==host)host.appendChild(f.el);
   const flip=Math.cos(a+1.57)<0?-1:1;f.el.setAttribute("transform",`translate(${xx} ${yy-Math.abs(Math.sin(t*6+i))*4}) scale(${sc*flip} ${sc})`);f.el.style.opacity=sn<0?.85:1});
 });
 // mola da guirlanda
 if(c>=7.6&&c<7.65&&!caught){sag.v=260;caught=true}if(c<7.6)caught=false;
 sag.v+=(-40*sag.y-3.2*sag.v)*dt;sag.y+=sag.v*dt;if(c<7.6){sag.y=0;sag.v=0}
 if(!rm)raf(frame)}
if(which==="arvore")raf(frame);
// neve
const cv=root.querySelector("#snow"),cx=cv&&cv.getContext("2d");if(cv){let fl=[];
function rs(){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);cv.width=r.width*d;cv.height=r.height*d;fl=Array.from({length:Math.round(r.width/6)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:(Math.random()*2+1)*d,v:(Math.random()*.6+.3)*d,w:Math.random()*6}))}
rs();addEventListener("resize",rs);
(function sn(t){if(!alive)return;cx.clearRect(0,0,cv.width,cv.height);cx.fillStyle="rgba(247,247,247,.85)";for(const f of fl){if(!rm){f.y+=f.v;f.x+=Math.sin(t/1000+f.w)*.3;if(f.y>cv.height){f.y=-4;f.x=Math.random()*cv.width}}cx.beginPath();cx.arc(f.x,f.y,f.r,0,7);cx.fill()}if(!rm)raf(sn)})(0);}
// ---- coral ----
if(which==="coral")(function(){const svg=root.querySelector("#coral");
 const P=[ // x, y, escala, cor, cachecol; os 2 primeiros da fila da frente são o Fluximetro (líder) e quem briga
  [500,505,1.2,"#3B5285","#F2C25E"],[340,500,.95,"#5A72A8","#7CC4A2"],[420,505,.9,"#5A72A8","#8FA4D0"],[600,500,.95,"#3B5285","#C24B3C"],[690,505,.85,"#5A72A8","#F2C25E"],[250,505,.85,"#3B5285","#8FA4D0"],
  [300,445,.7,"#3B5285","#C24B3C"],[385,440,.72,"#5A72A8","#F2C25E"],[470,445,.7,"#3B5285","#7CC4A2"],[555,440,.72,"#5A72A8","#C24B3C"],[640,445,.7,"#3B5285","#8FA4D0"],[725,442,.68,"#5A72A8","#7CC4A2"]];
 const LEAD=0,FIGHT=[1,2];
 const singer=(i)=>{const [,,,c,sc]=P[i];return `<g class="sg"><g>
  <rect x="-18" y="18" width="8" height="12" rx="4" fill="#1B2440"/><rect x="10" y="18" width="8" height="12" rx="4" fill="#1B2440"/>
  <ellipse cx="0" cy="0" rx="32" ry="25" fill="${c}"/><ellipse cx="32" cy="-1" rx="6" ry="7" fill="${c}"/><ellipse cx="-12" cy="-11" rx="10" ry="5" fill="#fff" opacity=".2"/>
  <path d="M-26 8 Q0 18 26 8 L26 14 Q0 24 -26 14Z" fill="${sc}"/>
  <path d="M-14 -24 Q2 -60 26 -40 L14 -22Z" fill="#C24B3C"/><circle cx="27" cy="-41" r="5" fill="#F7F7F7"/><rect x="-18" y="-27" width="34" height="7" rx="3.5" fill="#F7F7F7"/>
  <g class="eyes"><ellipse cx="-8" cy="-4" rx="3.6" ry="4.8" fill="#F7F7F7"/><ellipse cx="8" cy="-4" rx="3.6" ry="4.8" fill="#F7F7F7"/></g>
  <path class="brow" d="" stroke="#1B2440" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <path class="smile" d="" stroke="#1B2440" stroke-width="2.6" stroke-linecap="round" fill="none"/>
  <ellipse class="mouth" cx="0" cy="7" rx="4" ry="3" fill="#1B2440"/>
  <g class="blush" opacity="0"><ellipse cx="-18" cy="5" rx="5.5" ry="3" fill="#E06A5B"/><ellipse cx="18" cy="5" rx="5.5" ry="3" fill="#E06A5B"/></g>
  <path class="sweat" d="M24 -22 q4 7 0 10 q-4 -3 0 -10Z" fill="#B9C8DD" opacity="0"/>
  <rect class="book" x="-14" y="17" width="28" height="15" rx="3" fill="#C24B3C" stroke="#F7F7F7" stroke-width="1.5"/></g></g>`};
 const house=(x,w,h,roof,body)=>`<g transform="translate(${x} ${470-h})"><rect width="${w}" height="${h}" fill="${body}"/><path d="M-10 2 L${w/2} ${-h*.45} L${w+10} 2Z" fill="${roof}"/><path d="M-10 2 L${w/2} ${-h*.45} L${w+10} 2" stroke="#F7F7F7" stroke-width="7" fill="none" stroke-linejoin="round"/>
  ${[[.2,.35],[.6,.35]].map(([a,b])=>`<rect class="win" x="${w*a}" y="${h*b}" width="${w*.2}" height="${h*.22}" rx="2" fill="#F2C25E"/>`).join("")}<rect x="${w*.4}" y="${h*.68}" width="${w*.2}" height="${h*.32}" rx="2" fill="#4A3426"/><rect x="${w*.66}" y="${-h*.3}" width="${w*.12}" height="${h*.3}" fill="${body}"/></g>`;
 const HS=[[30,90,110,"#24345A","#5A2F2A"],[140,80,140,"#2B3756","#3B5285"],[250,100,100,"#24345A","#4A3426"],[380,85,150,"#1F2A48","#5A2F2A"],[600,95,120,"#2B3756","#3B5285"],[720,80,95,"#24345A","#4A3426"],[820,110,135,"#1F2A48","#5A2F2A"]];
 svg.innerHTML=`<defs><radialGradient id="spot"><stop offset="0" stop-color="#F2C25E" stop-opacity=".3"/><stop offset="1" stop-color="#F2C25E" stop-opacity="0"/></radialGradient></defs>
  <circle cx="860" cy="100" r="30" fill="#F7F7F7" opacity=".85"/>
  ${HS.map(h=>house(h[0],h[1],h[2],h[4],h[3])).join("")}
  <path d="M0 462 Q250 448 500 460 T1000 458 V625 H0Z" fill="#EDF1F7"/>
  <g transform="translate(520 300) scale(.55)"><rect x="-12" y="260" width="24" height="30" rx="4" fill="#4A3426"/><path d="M-110 270 L0 40 L110 270Z" fill="#24584A"/><path d="M-85 190 L0 0 L85 190Z" fill="#2E6B5A"/><path d="M0 -36 l9 20 22 2 -16 15 5 22 -20 -11 -20 11 5 -22 -16 -15 22 -2Z" fill="#F2C25E"/></g>
  <path class="wire" d="" stroke="#1B2440" stroke-width="2" fill="none"/><g class="wb"></g>
  <ellipse cx="490" cy="500" rx="360" ry="110" fill="url(#spot)"/>
  <g class="notes"></g>${[...P.keys()].sort((a,b)=>P[a][1]-P[b][1]).map(i=>`<g data-i="${i}">${singer(i)}</g>`).join("")}
  <g class="bubble" opacity="0"><rect x="-130" y="-66" width="260" height="56" rx="20" fill="#F7F7F7"/><path d="M-10 -12 L0 4 L10 -12Z" fill="#F7F7F7"/><text x="0" y="-42" text-anchor="middle" font-family="Inter,sans-serif" font-weight="600" font-size="15" fill="#1B2440">Gente… psiu… parou, vai</text><text x="0" y="-22" text-anchor="middle" font-family="Inter,sans-serif" font-size="12.5" fill="#4E5B78">tá todo mundo olhando 😅</text></g>`;
 const gs=[...svg.querySelectorAll("g[data-i]")],notes=svg.querySelector(".notes"),bub=svg.querySelector(".bubble"),wire=svg.querySelector(".wire"),wb=svg.querySelector(".wb");
 const N=Array.from({length:16},(_,i)=>({x:200+Math.random()*560,ph:Math.random(),s:.6+Math.random()*.7}));
 function f(ms){const t=ms/1000,L=12,c=rm?2:t%L;
  // 0-5 cantam, 5-8 os dois brigam (os outros param e olham), 8-10.5 o Fluximetro fica sem graça e pede pra parar, 10.5+ voltam
  const fight=c>=5&&c<8,shy=c>=7.6&&c<10.5,after=c>=8&&c<11;
  gs.forEach(g=>{const i=+g.dataset.i,[bx,by,sc]=P[i],me=g.firstElementChild;let x=bx,y=by,r=0;const fi=FIGHT.includes(i),lead=i===LEAD;
   const singing=!((fight&&fi)||(shy&&(lead||fi))),open=singing?(.5+.5*Math.abs(Math.sin(t*5+i))):(lead&&shy?0:.15);
   if(fight&&fi){const push=Math.sin(t*4)*12;x+=i===FIGHT[0]?push:-push;r=(i===FIGHT[0]?1:-1)*(8+Math.sin(t*22)*6);y-=Math.abs(Math.sin(t*9))*8}
   if(lead&&shy){r=Math.sin(t*3)*3;y+=2}
   if(singing)y-=Math.abs(Math.sin(t*2.6+i))*4;
   // os outros olham pra briga
   const look=(fight||shy)&&!fi&&!lead?(bx<380?2:-2):0;
   me.setAttribute("transform",`translate(${x} ${y}) rotate(${r}) scale(${sc})`);
   const m=me.querySelector(".mouth");m.setAttribute("ry",(1+open*7).toFixed(1));m.setAttribute("opacity",lead&&shy?0:1);
   me.querySelector(".smile").setAttribute("d",lead&&shy?"M-6 9 q6 4 12 0":"");
   me.querySelector(".brow").setAttribute("d",fight&&fi?"M-14 -12 L-3 -8 M14 -12 L3 -8":lead&&shy?"M-15 -9 L-5 -14 M15 -9 L5 -14":"");
   me.querySelector(".blush").setAttribute("opacity",(lead&&(fight||shy))||(fi&&after)?1:0);
   me.querySelector(".sweat").setAttribute("opacity",lead&&shy?1:0);
   me.querySelector(".eyes").setAttribute("transform",(fi&&after)?"translate(0 3) scale(1 .45)":lead&&shy?"translate(0 1) scale(1 .7)":`translate(${look} 0)`);
   me.querySelector(".book").setAttribute("transform",fight&&fi?`rotate(${Math.sin(t*18)*30})`:lead&&shy?"translate(0 -6)":"");
  });
  bub.setAttribute("opacity",c>=8&&c<10.5?1:0);bub.setAttribute("transform",`translate(${P[LEAD][0]} ${P[LEAD][1]-58})`);
  notes.innerHTML=N.map((n,i)=>{const k=((t*.35+n.ph)%1);return `<text x="${n.x+Math.sin(t+i)*20}" y="${420-k*260}" font-size="${26*n.s}" fill="#F2C25E" opacity="${(1-k).toFixed(2)}">${i%2?"♪":"♫"}</text>`}).join("");
  // varal de luzes entre as casas
  const A=[60,360],B=[940,350],C=[500,400+Math.sin(t)*6];wire.setAttribute("d",`M${A} Q${C} ${B}`);
  wb.innerHTML=Array.from({length:18},(_,i)=>{const p=q(A,C,B,(i+.5)/18);return `<circle cx="${p[0]}" cy="${p[1]+5}" r="5" fill="${COLS[i%4]}" opacity="${.5+.5*Math.abs(Math.sin(t*2+i))}"/>`}).join("");
  svg.querySelectorAll(".win").forEach((w,i)=>w.setAttribute("opacity",(.75+.25*Math.sin(t*1.3+i)).toFixed(2)));
  if(!rm)raf(f)}
 raf(f)})();
// neve do coral
if(which==="coral")(function(){const cv=root.querySelector("#snow2"),x=cv.getContext("2d");let fl=[];
 function rs(){const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);if(!r.width)return;cv.width=r.width*d;cv.height=r.height*d;fl=Array.from({length:Math.round(r.width/5)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:(Math.random()*2+1)*d,v:(Math.random()*.6+.3)*d,w:Math.random()*6}))}
 (function sn(t){if(!cv.width||cv.width<10)rs();x.clearRect(0,0,cv.width,cv.height);x.fillStyle="rgba(247,247,247,.85)";for(const f of fl){if(!rm){f.y+=f.v;f.x+=Math.sin(t/1000+f.w)*.3;if(f.y>cv.height){f.y=-4;f.x=Math.random()*cv.width}}x.beginPath();x.arc(f.x,f.y,f.r,0,7);x.fill()}if(!rm)raf(sn)})(0);
 addEventListener("resize",rs)})();
return ()=>{alive=false}
}
export const NATAL_MARKUP = {
  arvore: `<svg viewBox="0 0 1000 625" preserveAspectRatio="xMidYMax slice" id="big" style="position:absolute;inset:0;width:100%;height:100%"></svg><canvas id="snow" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>`,
  coral: `<svg viewBox="0 0 1000 625" preserveAspectRatio="xMidYMax slice" id="coral" style="position:absolute;inset:0;width:100%;height:100%"></svg><canvas id="snow2" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"></canvas>`,
}
