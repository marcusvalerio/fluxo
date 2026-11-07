"use client"

import { useEffect, useRef } from "react"

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`

// Esfera de plasma: ruído 3D domado em uma esfera com fresnel e aura.
const FRAG = `
precision highp float;
uniform vec2 res; uniform float t; uniform float health; uniform float pulse; uniform vec2 ptr;
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return mod289(((x*34.)+1.)*x);}
float noise(vec3 p){vec3 a=floor(p);vec3 d=p-a;d=d*d*(3.-2.*d);
 vec4 b=a.xxyy+vec4(0.,1.,0.,1.);vec4 k1=perm(b.xyxy);vec4 k2=perm(k1.xyxy+b.zzww);
 vec4 c=k2+a.zzzz;vec4 k3=perm(c);vec4 k4=perm(c+1.);
 vec4 o1=fract(k3*(1./41.));vec4 o2=fract(k4*(1./41.));
 vec4 o3=o2*d.z+o1*(1.-d.z);vec2 o4=o3.yw*d.x+o3.xz*(1.-d.x);return o4.y*d.y+o4.x*(1.-d.y);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.02;a*=.5;}return v;}
vec3 pal(float h){
 vec3 calm=vec3(.33,.98,.76), mid=vec3(.86,1.,.24), hot=vec3(1.,.42,.24), crit=vec3(1.,.2,.45);
 return h>.66?mix(mid,calm,(h-.66)/.34):h>.33?mix(hot,mid,(h-.33)/.33):mix(crit,hot,h/.33);
}
void main(){
 vec2 uv=(gl_FragCoord.xy-.5*res)/min(res.x,res.y);
 uv-=ptr*.04;
 float agit=mix(1.9,.55,health);
 float r=length(uv);
 float R=.33+.012*sin(t*1.3)+pulse*.03;
 float wob=fbm(vec3(uv*3.,t*.25*agit))*.06*agit;
 float d=r-(R+wob);
 vec3 base=pal(health);
 vec3 col=vec3(0.);
 // corpo
 if(d<0.){
  float z=sqrt(max(0.,R*R-r*r))/R;
  vec3 n=normalize(vec3(uv/R,z));
  vec3 q=n*2.2+vec3(0.,0.,t*.18*agit);
  float f=fbm(q+fbm(q*1.7+t*.1*agit));
  float bands=smoothstep(.35,.85,f);
  vec3 deep=base*.18;
  col=mix(deep,base,bands);
  col+=vec3(1.)*pow(max(0.,dot(n,normalize(vec3(-.4,.6,.7)))),24.)*.55;
  float fres=pow(1.-z,2.6);
  col+=base*fres*1.4;
  col*=.75+.35*f;
 }
 // aura
 float glow=exp(-max(d,0.)*9.)*.55+exp(-max(d,0.)*28.)*.6;
 col+=base*glow*(d>0.?1.:.25)*(.8+.4*pulse);
 // anel orbital
 float ring=abs(length(uv*vec2(1.,3.2))-.52);
 col+=base*smoothstep(.006,0.,ring)*.35*smoothstep(-.02,.06,uv.y+.02*sin(t));
 col=1.-exp(-col*1.25);
 col+=vec3(.0196,.0235,.031)*(1.-col);
 gl_FragColor=vec4(col,1.);
}`

export function Orb({ health, className }: { health: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const target = useRef(health)
  const pulse = useRef(0)

  useEffect(() => {
    if (Math.abs(target.current - health) > 0.001) pulse.current = 1
    target.current = health
  }, [health])

  useEffect(() => {
    const c = ref.current!
    const gl = c.getContext("webgl", { antialias: true, premultipliedAlpha: false })
    if (!gl) return
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, "p")
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = u("res"), uT = u("t"), uH = u("health"), uP = u("pulse"), uPtr = u("ptr")

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let h = 0.5, raf = 0, last = performance.now(), time = 0
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 }
    const onMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2
      ptr.ty = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener("pointermove", onMove)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.width = c.clientWidth * dpr
      c.height = c.clientHeight * dpr
      gl.viewport(0, 0, c.width, c.height)
    }
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    resize()

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      time += reduce ? dt * 0.15 : dt
      h += (target.current - h) * Math.min(1, dt * 2.2)
      pulse.current *= Math.pow(0.04, dt)
      ptr.x += (ptr.tx - ptr.x) * dt * 3
      ptr.y += (ptr.ty - ptr.y) * dt * 3
      gl.uniform2f(uRes, c.width, c.height)
      gl.uniform1f(uT, time)
      gl.uniform1f(uH, h)
      gl.uniform1f(uP, pulse.current)
      gl.uniform2f(uPtr, ptr.x, ptr.y)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onMove)
    }
  }, [])

  return <canvas ref={ref} className={className} aria-hidden style={{ maskImage: "radial-gradient(closest-side, #000 72%, transparent)", WebkitMaskImage: "radial-gradient(closest-side, #000 72%, transparent)" }} />
}
