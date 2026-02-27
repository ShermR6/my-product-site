"use client";

import { useEffect, useRef } from "react";

export default function AirplaneBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let planes: any[] = [];
    let animId: number;
    const PLANE_COUNT = 7;
    const SPEED_MULT = 3.5;
    const TRAIL_LENGTH = 55;

    const isDark = () => document.documentElement.getAttribute("data-theme") !== "light";

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
    }

    function makePlaneImage(size: number, opacity: number): HTMLCanvasElement {
      const dark = isDark();
      const oc = document.createElement("canvas");
      oc.width = size * 3;
      oc.height = size * 3;
      const ox = oc.getContext("2d")!;
      const cx = oc.width / 2;
      const cy = oc.height / 2;
      const s = size;
      const bodyColor = dark ? "#e0f2fe" : "#1e3a5f";
      const engineColor = dark ? "rgba(14,165,233,0.6)" : "rgba(14,100,190,0.5)";
      ox.globalAlpha = opacity;
      ox.fillStyle = bodyColor;
      ox.beginPath();
      ox.ellipse(cx, cy, s * 0.18, s * 0.72, 0, 0, Math.PI * 2);
      ox.fill();
      ox.beginPath();
      ox.moveTo(cx, cy - s * 0.1);
      ox.lineTo(cx - s * 0.75, cy + s * 0.25);
      ox.lineTo(cx - s * 0.55, cy + s * 0.35);
      ox.lineTo(cx, cy + s * 0.05);
      ox.lineTo(cx + s * 0.55, cy + s * 0.35);
      ox.lineTo(cx + s * 0.75, cy + s * 0.25);
      ox.closePath();
      ox.fill();
      ox.beginPath();
      ox.moveTo(cx, cy + s * 0.45);
      ox.lineTo(cx - s * 0.32, cy + s * 0.72);
      ox.lineTo(cx - s * 0.18, cy + s * 0.72);
      ox.lineTo(cx, cy + s * 0.52);
      ox.lineTo(cx + s * 0.18, cy + s * 0.72);
      ox.lineTo(cx + s * 0.32, cy + s * 0.72);
      ox.closePath();
      ox.fill();
      ox.fillStyle = engineColor;
      ox.beginPath();
      ox.ellipse(cx - s * 0.38, cy + s * 0.15, s * 0.09, s * 0.22, 0, 0, Math.PI * 2);
      ox.fill();
      ox.beginPath();
      ox.ellipse(cx + s * 0.38, cy + s * 0.15, s * 0.09, s * 0.22, 0, 0, Math.PI * 2);
      ox.fill();
      return oc;
    }

    function waypoints() {
      return [
        [0.05,0.15],[0.2,0.05],[0.4,0.2],[0.6,0.08],[0.8,0.18],[0.95,0.05],
        [0.1,0.5],[0.3,0.4],[0.5,0.55],[0.7,0.45],[0.9,0.5],
        [0.05,0.8],[0.25,0.7],[0.45,0.85],[0.65,0.75],[0.85,0.88],[0.95,0.7],
        [-0.05,0.35],[1.05,0.6],[-0.05,0.65],[1.05,0.25],
      ];
    }

    function pickTwo() {
      const wps = waypoints();
      const i = Math.floor(Math.random() * wps.length);
      let j = Math.floor(Math.random() * wps.length);
      while (j === i) j = Math.floor(Math.random() * wps.length);
      return [wps[i], wps[j]];
    }

    function bezierPoint(x1:number,y1:number,cpx:number,cpy:number,x2:number,y2:number,t:number){
      return { x:(1-t)*(1-t)*x1+2*(1-t)*t*cpx+t*t*x2, y:(1-t)*(1-t)*y1+2*(1-t)*t*cpy+t*t*y2 };
    }

    function bezierAngle(x1:number,y1:number,cpx:number,cpy:number,x2:number,y2:number,t:number){
      const dx=2*(1-t)*(cpx-x1)+2*t*(x2-cpx);
      const dy=2*(1-t)*(cpy-y1)+2*t*(y2-cpy);
      return Math.atan2(dy,dx)+Math.PI/2;
    }

    function createPlane() {
      const [[ax,ay],[bx,by]] = pickTwo();
      const cpx=(ax+bx)/2+(Math.random()-0.5)*0.4;
      const cpy=(ay+by)/2+(Math.random()-0.5)*0.4;
      const baseSpeed=SPEED_MULT*0.00035;
      const size=10+Math.random()*10;
      const opacity=isDark() ? 0.2+Math.random()*0.3 : 0.3+Math.random()*0.35;
      return {
        x1:ax,y1:ay,x2:bx,y2:by,cpx,cpy,
        progress:Math.random(),
        speed:baseSpeed+Math.random()*baseSpeed*0.5,
        opacity,size,
        img:makePlaneImage(size,opacity),
        trail:[] as {x:number;y:number}[],
      };
    }

    // Re-generate planes when theme toggles so colors update
    const observer = new MutationObserver(() => { planes = planes.map(() => { const p=createPlane(); p.progress=Math.random(); return p; }); });
    observer.observe(document.documentElement, { attributes:true, attributeFilter:["data-theme"] });

    function draw() {
      ctx!.clearRect(0,0,W,H);
      const dark=isDark();
      const grad=ctx!.createRadialGradient(W*0.5,0,0,W*0.5,H*0.5,W*0.65);
      if(dark){ grad.addColorStop(0,"rgba(14,165,233,0.05)"); grad.addColorStop(1,"rgba(0,0,0,0)"); }
      else { grad.addColorStop(0,"rgba(14,100,200,0.04)"); grad.addColorStop(1,"rgba(255,255,255,0)"); }
      ctx!.fillStyle=grad; ctx!.fillRect(0,0,W,H);

      planes.forEach(p=>{
        p.progress+=p.speed;
        const t=Math.min(p.progress,1);
        const pos=bezierPoint(p.x1*W,p.y1*H,p.cpx*W,p.cpy*H,p.x2*W,p.y2*H,t);
        const angle=bezierAngle(p.x1*W,p.y1*H,p.cpx*W,p.cpy*H,p.x2*W,p.y2*H,Math.min(t+0.001,1));
        p.trail.push({x:pos.x,y:pos.y});
        if(p.trail.length>TRAIL_LENGTH) p.trail.shift();
        if(p.trail.length>1){
          for(let i=1;i<p.trail.length;i++){
            const frac=i/p.trail.length;
            const prev=p.trail[i-1]; const curr=p.trail[i];
            ctx!.beginPath(); ctx!.moveTo(prev.x,prev.y); ctx!.lineTo(curr.x,curr.y);
            ctx!.strokeStyle=dark
              ? `rgba(14,165,233,${p.opacity*frac*0.45})`
              : `rgba(14,100,180,${p.opacity*frac*0.3})`;
            ctx!.lineWidth=0.8; ctx!.stroke();
          }
        }
        ctx!.save(); ctx!.translate(pos.x,pos.y); ctx!.rotate(angle);
        ctx!.drawImage(p.img,-p.img.width/2,-p.img.height/2);
        ctx!.restore();
        if(p.progress>1.1){ Object.assign(p,createPlane()); p.trail=[]; p.progress=0; }
      });
      animId=requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize",resize);
    planes = Array.from({length:PLANE_COUNT},()=>createPlane());
    draw();

    return ()=>{ cancelAnimationFrame(animId); window.removeEventListener("resize",resize); observer.disconnect(); };
  },[]);

  return (
    <canvas ref={canvasRef} style={{
      position:"fixed",top:0,left:0,width:"100%",height:"100%",
      pointerEvents:"none",zIndex:0,
    }}/>
  );
}
