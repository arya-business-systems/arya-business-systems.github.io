/* ============================================================
   CONFIGURAÇÃO — troque aqui os seus links
   ============================================================ */
const CONFIG = {
  whatsapp: "https://wa.me/55DDDNUMERO",          // ex.: https://wa.me/5562999999999
  instagram: "https://instagram.com/SEU_PERFIL",
  email: "mailto:contato@aryasystems.com.br"
};

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

gsap.registerPlugin(ScrollTrigger);
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const isMobile = () => innerWidth < 760;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ACCENT = "#9d8cff";

$("#lnkWhats").href = CONFIG.whatsapp;
$("#lnkInsta").href = CONFIG.instagram;
$("#lnkMail").href = CONFIG.email;
$("#yr").textContent = new Date().getFullYear();
$("#lbar").style.width = "40%";

/* ============================================================
   ESTADO CONTROLADO PELA ROLAGEM
   ============================================================ */
const K = {
  hero:   {px:0,   py:-.35,pz:0,  ry:-.55,rx:.10,sc:1,  cz:8.2,cy:2.1,ly:.45,hl:-1,lid:0,  logo:0,bg:0,  glow:1},
  s1:     {px:0,   py:-.35,pz:0,  ry:0,   rx:0,  sc:1,  cz:5.6,cy:1.4,ly:.70,hl:0, lid:0,  logo:0,bg:.6, glow:1},
  s2:     {px:0,   py:-.35,pz:0,  ry:-.10,rx:0,  sc:1,  cz:3.8,cy:1.0,ly:.78,hl:1, lid:0,  logo:0,bg:1,  glow:1},
  s3:     {px:0,   py:-.35,pz:0,  ry:.12, rx:0,  sc:1,  cz:3.4,cy:.95,ly:.78,hl:2, lid:0,  logo:0,bg:1.2,glow:1},
  s4:     {px:0,   py:-.35,pz:0,  ry:0,   rx:0,  sc:1,  cz:3.7,cy:1.0,ly:.78,hl:3, lid:0,  logo:0,bg:1.4,glow:1},
  sobre:  {px:1.75,py:-.25,pz:0,  ry:-.7, rx:.15,sc:.85,cz:8,  cy:1.8,ly:.5, hl:-1,lid:0,  logo:0,bg:1.6,glow:.9},
  serv:   {px:0,   py:-.7, pz:-5, ry:.9,  rx:.35,sc:.9, cz:8,  cy:2.6,ly:.5, hl:-1,lid:0,  logo:0,bg:2,  glow:.5},
  proj:   {px:0,   py:1.6, pz:-7, ry:2.75,rx:.1, sc:1,  cz:8,  cy:1.8,ly:.6, hl:-1,lid:0,  logo:0,bg:2.6,glow:.7},
  inter:  {px:-1.8,py:-.3, pz:-1, ry:.6,  rx:.1, sc:.8, cz:8,  cy:1.8,ly:.5, hl:2, lid:0,  logo:0,bg:3,  glow:.9},
  contato:{px:0,   py:-.55,pz:0,  ry:0,   rx:.05,sc:.85,cz:7.6,cy:1.6,ly:.35,hl:-1,lid:.3,logo:1,bg:4,  glow:1.3}
};
const S = {...K.hero};            // alvo (rolagem)
const R = {...K.hero};            // valor exibido (suavizado)
const intro = {open:0};

/* ============================================================
   THREE.JS — CENA E NOTEBOOK
   ============================================================ */
let renderer, scene, camera, laptop, lidPivot, screenTex, sctx, glowMat, stars, ring, ok3d = true;
const SW = 1280, SH = 800;

try {
  renderer = new THREE.WebGLRenderer({canvas: $("#gl"), antialias: true, powerPreference: "high-performance"});
  if (!renderer.getContext()) throw new Error("sem webgl");
} catch (e) { ok3d = false; document.documentElement.classList.add("no-webgl"); }

function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
function logoMark(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s/40, s/40);
  c.strokeStyle = col; c.lineWidth = 3.4; c.lineCap = "round"; c.lineJoin = "round";
  c.beginPath(); c.moveTo(6,34); c.lineTo(18,7); c.lineTo(30,34); c.stroke();
  c.beginPath(); c.moveTo(11.5,24); c.lineTo(24.5,24); c.stroke();
  c.fillStyle = ACCENT; c.beginPath();
  c.moveTo(32,3); c.lineTo(33.5,6.5); c.lineTo(37,8); c.lineTo(33.5,9.5); c.lineTo(32,13); c.lineTo(30.5,9.5); c.lineTo(27,8); c.lineTo(30.5,6.5); c.closePath(); c.fill();
  c.restore();
}

const sales = [32,38,35,44,41,52,48,57,55,63,60,71,68,78];
const week = [.55,.7,.48,.82,.66,.92,.75];
function drawScreen(t, hl, logo) {
  const c = sctx, hr = Math.round(hl);
  c.fillStyle = "#0a0b0f"; c.fillRect(0,0,SW,SH);
  // sidebar
  c.fillStyle = "#101117"; c.fillRect(0,0,230,SH);
  logoMark(c, 30, 30, 38, "#fff");
  c.fillStyle = "#fff"; c.font = "700 26px 'Space Grotesk', sans-serif"; c.fillText("ARYA", 78, 60);
  const menu = ["Visão geral","Vendas","Pulso","Produtos","Clientes","Cresce","Relatórios"];
  const act = hr < 0 ? 0 : [0,1,2,3][hr];
  menu.forEach((m,i) => {
    const y = 120 + i*50;
    if (i === act) { c.fillStyle = "rgba(157,140,255,.18)"; rr(c,16,y-28,198,42,12); c.fill(); }
    c.fillStyle = i === act ? "#fff" : "#7d808c"; c.font = "500 18px Manrope, sans-serif"; c.fillText(m, 36, y);
  });
  c.fillStyle = "#7d808c"; c.font = "500 14px Manrope, sans-serif"; c.fillText("Vitória Gabrielly", 30, SH-48);
  c.fillStyle = ACCENT; c.fillText("Fundadora", 30, SH-26);
  // topo
  c.fillStyle = "#fff"; c.font = "600 32px 'Space Grotesk', sans-serif"; c.fillText(menu[act], 270, 62);
  c.fillStyle = "#6c6f7b"; c.font = "500 15px Manrope, sans-serif"; c.fillText("Loja exemplo · dados de demonstração", 270, 86);
  c.fillStyle = "rgba(159,240,196,.12)"; rr(c,1110,36,140,38,19); c.fill();
  c.fillStyle = `rgba(159,240,196,${.5+.5*Math.sin(t*4)})`; c.beginPath(); c.arc(1134,55,6,0,7); c.fill();
  c.fillStyle = "#9ff0c4"; c.font = "600 15px Manrope, sans-serif"; c.fillText("Ao vivo", 1150, 60);

  const panels = [[270,108,980,118],[270,244,620,300],[910,244,340,300],[270,562,980,210]];
  panels.forEach((p,i) => {
    const [x,y,w,h] = p;
    c.save();
    c.globalAlpha = hr < 0 || hr === i ? 1 : .32;
    if (hr === i) { c.shadowColor = ACCENT; c.shadowBlur = 40; }
    c.fillStyle = "#13141b"; rr(c,x,y,w,h,18); c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = hr === i ? ACCENT : "rgba(255,255,255,.07)"; c.lineWidth = hr === i ? 3 : 1.5; rr(c,x,y,w,h,18); c.stroke();
    if (i === 0) {
      const kp = [["Vendas hoje","R$ 2.480","+12%"],["Pedidos","38","+5"],["Ticket médio","R$ 65","+3%"],["Clientes recorrentes","12","+2"]];
      kp.forEach((k,j) => {
        const kx = x + 24 + j*240;
        c.fillStyle = "#7d808c"; c.font = "500 15px Manrope, sans-serif"; c.fillText(k[0], kx, y+40);
        c.fillStyle = "#fff"; c.font = "600 34px 'Space Grotesk', sans-serif"; c.fillText(k[1], kx, y+84);
        const vw = c.measureText(k[1]).width;
        c.fillStyle = "#9ff0c4"; c.font = "600 14px Manrope, sans-serif"; c.fillText(k[2], kx + vw + 12, y+82);
        if (j) { c.fillStyle = "rgba(255,255,255,.06)"; c.fillRect(kx-20, y+24, 1, 70); }
      });
    }
    if (i === 1) {
      c.fillStyle = "#fff"; c.font = "600 19px 'Space Grotesk', sans-serif"; c.fillText("Vendas — últimos 14 dias", x+24, y+38);
      const gx = x+24, gy = y+70, gw = w-48, gh = h-100;
      c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 1;
      for (let g=0; g<4; g++) { c.beginPath(); c.moveTo(gx, gy+g*gh/3); c.lineTo(gx+gw, gy+g*gh/3); c.stroke(); }
      const pts = sales.map((v,k) => [gx + k*gw/(sales.length-1), gy + gh - ((v + Math.sin(t*1.5+k)*2.5 - 25)/60)*gh]);
      const grd = c.createLinearGradient(0,gy,0,gy+gh); grd.addColorStop(0,"rgba(157,140,255,.45)"); grd.addColorStop(1,"rgba(157,140,255,0)");
      c.beginPath(); c.moveTo(pts[0][0], gy+gh); pts.forEach(p2 => c.lineTo(p2[0],p2[1])); c.lineTo(pts[pts.length-1][0], gy+gh); c.fillStyle = grd; c.fill();
      c.beginPath(); pts.forEach((p2,k) => k ? c.lineTo(p2[0],p2[1]) : c.moveTo(p2[0],p2[1])); c.strokeStyle = "#c9c1ff"; c.lineWidth = 3.5; c.stroke();
      const lp = pts[pts.length-1];
      c.fillStyle = "rgba(157,140,255,.3)"; c.beginPath(); c.arc(lp[0],lp[1],10+4*Math.sin(t*4),0,7); c.fill();
      c.fillStyle = "#fff"; c.beginPath(); c.arc(lp[0],lp[1],5,0,7); c.fill();
    }
    if (i === 2) {
      c.fillStyle = "#fff"; c.font = "600 19px 'Space Grotesk', sans-serif"; c.fillText("ARYA Pulso", x+24, y+38);
      const recs = [["#9ff0c4","3 clientes podem","voltar a comprar"],["#ffd58a","2 orçamentos","sem resposta"],["#ff9a9a","Camiseta P com","estoque baixo"]];
      const on = Math.floor(t*.8) % 3;
      recs.forEach((r2,k) => {
        const ry2 = y + 62 + k*76;
        c.fillStyle = k === on ? "rgba(157,140,255,.16)" : "rgba(255,255,255,.04)"; rr(c,x+18,ry2,w-36,64,14); c.fill();
        c.fillStyle = r2[0]; c.beginPath(); c.arc(x+44, ry2+32, 7, 0, 7); c.fill();
        c.fillStyle = "#fff"; c.font = "600 15px Manrope, sans-serif"; c.fillText(r2[1], x+64, ry2+28);
        c.fillStyle = "#8b8d98"; c.font = "500 14px Manrope, sans-serif"; c.fillText(r2[2], x+64, ry2+48);
      });
    }
    if (i === 3) {
      c.fillStyle = "#fff"; c.font = "600 19px 'Space Grotesk', sans-serif"; c.fillText("Vendas da semana", x+24, y+38);
      const days = ["S","T","Q","Q","S","S","D"];
      week.forEach((v,k) => {
        const bh = (v*.85 + .15*Math.sin(t*1.2+k)) * 110, bx = x+34+k*68;
        const g2 = c.createLinearGradient(0,y+175-bh,0,y+175); g2.addColorStop(0,"#fff"); g2.addColorStop(1,"rgba(157,140,255,.4)");
        c.fillStyle = g2; rr(c,bx,y+175-bh,38,bh,8); c.fill();
        c.fillStyle = "#7d808c"; c.font = "500 13px Manrope, sans-serif"; c.fillText(days[k], bx+14, y+198);
      });
      c.fillStyle = "#fff"; c.font = "600 19px 'Space Grotesk', sans-serif"; c.fillText("Mais vendidos", x+560, y+38);
      [["Camiseta oversized",.9],["Calça cargo",.68],["Boné básico",.5]].forEach((m,k) => {
        const my = y + 76 + k*44;
        c.fillStyle = "#c8cad3"; c.font = "500 15px Manrope, sans-serif"; c.fillText(m[0], x+560, my);
        c.fillStyle = "rgba(255,255,255,.07)"; rr(c,x+560,my+10,380,8,4); c.fill();
        c.fillStyle = ACCENT; rr(c,x+560,my+10,380*m[1],8,4); c.fill();
      });
    }
    c.restore();
  });
  if (logo > .01) {
    c.fillStyle = `rgba(5,5,8,${Math.min(1,logo)*.94})`; c.fillRect(0,0,SW,SH);
    c.save(); c.globalAlpha = Math.min(1,logo);
    const gr = c.createRadialGradient(SW/2,SH/2,0,SW/2,SH/2,500); gr.addColorStop(0,"rgba(157,140,255,.25)"); gr.addColorStop(1,"rgba(157,140,255,0)");
    c.fillStyle = gr; c.fillRect(0,0,SW,SH);
    logoMark(c, SW/2-150, SH/2-80, 120, "#fff");
    c.fillStyle = "#fff"; c.font = "700 92px 'Space Grotesk', sans-serif"; c.fillText("ARYA", SW/2-20, SH/2+22);
    c.fillStyle = "#8b8d98"; c.font = "500 22px Manrope, sans-serif"; c.textAlign = "center"; c.fillText("Business Systems", SW/2+90, SH/2+70); c.textAlign = "left";
    c.restore();
  }
}

function keyboardTexture() {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 400;
  const c = cv.getContext("2d");
  c.fillStyle = "#16171b"; c.fillRect(0,0,1024,400);
  const cols = 14, rows = 6, gap = 8, kw = (1024 - gap*(cols+1))/cols, kh = (400 - gap*(rows+1))/rows;
  for (let r=0; r<rows; r++) for (let k=0; k<cols; k++) {
    if (r === 5 && k > 3 && k < 10) continue;
    const x = gap + k*(kw+gap), y = gap + r*(kh+gap);
    c.fillStyle = "#0c0d10"; rr(c,x,y,kw,kh,8); c.fill();
    c.strokeStyle = "rgba(255,255,255,.06)"; c.lineWidth = 2; rr(c,x,y,kw,kh,8); c.stroke();
  }
  const sx = gap + 4*(kw+gap), sw = 6*(kw+gap) - gap;
  c.fillStyle = "#0c0d10"; rr(c,sx,gap+5*(kh+gap),sw,kh,8); c.fill();
  c.strokeStyle = "rgba(157,140,255,.25)"; rr(c,sx,gap+5*(kh+gap),sw,kh,8); c.stroke();
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function radialTexture(inner, outer) {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const c = cv.getContext("2d"), g = c.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,inner); g.addColorStop(1,outer); c.fillStyle = g; c.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(cv);
}
function backLogoTexture() {
  const cv = document.createElement("canvas"); cv.width = cv.height = 256;
  const c = cv.getContext("2d"); logoMark(c, 48, 40, 160, "rgba(230,230,240,.9)");
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

if (ok3d) {
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 1.8));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050507, 12, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;

  camera = new THREE.PerspectiveCamera(35, innerWidth/innerHeight, .1, 100);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4,6,5); scene.add(key);
  const rim = new THREE.PointLight(0x9d8cff, 40, 20); rim.position.set(-3,3,-4); scene.add(rim);
  const rim2 = new THREE.PointLight(0xffffff, 12, 15); rim2.position.set(4,2,-3); scene.add(rim2);
  scene.add(new THREE.AmbientLight(0xffffff, .15));

  laptop = new THREE.Group(); scene.add(laptop);
  const alu = new THREE.MeshStandardMaterial({color:0x2b2c31, metalness:.85, roughness:.32});
  const base = new THREE.Mesh(new RoundedBoxGeometry(3.3,.11,2.25,4,.05), alu);
  base.position.y = .055; laptop.add(base);
  const kb = new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.05), new THREE.MeshStandardMaterial({map:keyboardTexture(), roughness:.8, metalness:.2}));
  kb.rotation.x = -Math.PI/2; kb.position.set(0,.1105,-.3); laptop.add(kb);
  const pad = new THREE.Mesh(new RoundedBoxGeometry(1.15,.01,.7,2,.004), new THREE.MeshStandardMaterial({color:0x34353b, metalness:.7, roughness:.25}));
  pad.position.set(0,.11,.62); laptop.add(pad);
  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.6,24), new THREE.MeshStandardMaterial({color:0x111216, metalness:.6, roughness:.4}));
  hinge.rotation.z = Math.PI/2; hinge.position.set(0,.11,-1.09); laptop.add(hinge);

  lidPivot = new THREE.Group(); lidPivot.position.set(0,.11,-1.1); laptop.add(lidPivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(3.3,2.15,.06,4,.03), alu);
  lid.position.set(0,1.075,-.03); lidPivot.add(lid);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(3.24,2.09), new THREE.MeshStandardMaterial({color:0x050506, roughness:.15, metalness:.3}));
  bezel.position.set(0,1.075,.001); lidPivot.add(bezel);

  const sc = document.createElement("canvas"); sc.width = SW; sc.height = SH; sctx = sc.getContext("2d");
  screenTex = new THREE.CanvasTexture(sc); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
  const display = new THREE.Mesh(new THREE.PlaneGeometry(3.04,1.9), new THREE.MeshBasicMaterial({map:screenTex, toneMapped:false}));
  display.position.set(0,1.1,.003); lidPivot.add(display);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(3.24,2.09), new THREE.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:.06, roughness:.05, metalness:0, clearcoat:1}));
  glass.position.set(0,1.075,.006); lidPivot.add(glass);
  const cam = new THREE.Mesh(new THREE.CircleGeometry(.018,16), new THREE.MeshBasicMaterial({color:0x222233}));
  cam.position.set(0,2.08,.004); lidPivot.add(cam);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(.55,.55), new THREE.MeshBasicMaterial({map:backLogoTexture(), transparent:true}));
  back.position.set(0,1.1,-.062); back.rotation.y = Math.PI; lidPivot.add(back);

  glowMat = new THREE.MeshBasicMaterial({map:radialTexture("rgba(157,140,255,.55)","rgba(157,140,255,0)"), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending});
  const glowP = new THREE.Mesh(new THREE.PlaneGeometry(7,5), glowMat);
  glowP.rotation.x = -Math.PI/2; glowP.position.y = -.01; laptop.add(glowP);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2,3), new THREE.MeshBasicMaterial({map:radialTexture("rgba(0,0,0,.85)","rgba(0,0,0,0)"), transparent:true, depthWrite:false}));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = -.005; laptop.add(shadow);

  ring = new THREE.Mesh(new THREE.TorusGeometry(3.4,.006,8,180), new THREE.MeshBasicMaterial({color:0x9d8cff, transparent:true, opacity:.35}));
  ring.rotation.x = Math.PI/2; ring.position.y = -.02; laptop.add(ring);

  const n = isMobile() ? 700 : 1600, pos = new Float32Array(n*3);
  for (let i=0; i<n; i++) {
    const r = 6 + Math.random()*16, th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
    pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.cos(ph)*.6; pos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos,3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({size:.035, color:0xc9c1ff, transparent:true, opacity:.8, depthWrite:false}));
  scene.add(stars);

  const grid = new THREE.GridHelper(60, 60, 0x2a2840, 0x15141f);
  grid.position.y = -1.6; grid.material.transparent = true; grid.material.opacity = .35; scene.add(grid);
}
$("#lbar").style.width = "80%";

/* ============================================================
   LIGAÇÃO ENTRE ROLAGEM E CENA
   ============================================================ */
function seg(trigger, start, end, a, b) {
  gsap.fromTo(S, {...a}, {...b, ease:"none", immediateRender:false,
    scrollTrigger:{trigger, start, end, scrub:true}});
}
seg("#story","top bottom","top top", K.hero, K.s1);

const storyTl = gsap.timeline({scrollTrigger:{trigger:"#story", start:"top top", end:"bottom bottom", scrub:true,
  onUpdate: self => { const i = Math.min(3, Math.floor(self.progress*4)); $$(".stepdots i").forEach((d,k) => d.classList.toggle("on", k === i)); }}});
storyTl.fromTo(S, {...K.s1}, {...K.s2, duration:1, ease:"none", immediateRender:false}, 0)
       .fromTo(S, {...K.s2}, {...K.s3, duration:1, ease:"none", immediateRender:false}, 1)
       .fromTo(S, {...K.s3}, {...K.s4, duration:1, ease:"none", immediateRender:false}, 2)
       .to({}, {duration:1}, 3);
const caps = $$(".cap"), chips = $$(".chip");
caps.forEach((c,i) => {
  if (i) storyTl.fromTo(c, {opacity:0, y:30}, {opacity:1, y:0, duration:.25, immediateRender:false}, i + .05);
  if (i < 3) storyTl.to(c, {opacity:0, y:-30, duration:.2}, i + .8);
});
storyTl.set(caps[0], {opacity:1, y:0}, 0);
chips.forEach((c,i) => {
  storyTl.fromTo(c, {opacity:0, scale:.8, y:20, filter:"blur(8px)"}, {opacity:1, scale:1, y:0, filter:"blur(0px)", duration:.35, immediateRender:false}, .2 + i*.55);
});
storyTl.to(chips, {y:(i) => i%2 ? -24 : 24, duration:1.2, ease:"none"}, 2.6);

seg("#sobre","top bottom","top 15%", K.s4, K.sobre);
seg("#servicos","top bottom","top 25%", K.sobre, K.serv);
seg("#projetos","top bottom","top top", K.serv, K.proj);
seg("#interativo","top bottom","top 25%", K.proj, K.inter);
seg("#contato","top bottom","bottom bottom", K.inter, K.contato);

/* cores de fundo por etapa */
const BG = [new THREE.Color("#050507"), new THREE.Color("#0a0820"), new THREE.Color("#07060f"), new THREE.Color("#040a10"), new THREE.Color("#060510")];
const tmpC = new THREE.Color();
function bgAt(v) { const i = Math.max(0, Math.min(BG.length-2, Math.floor(v))); return tmpC.copy(BG[i]).lerp(BG[i+1], Math.min(1, v - i)); }

/* ============================================================
   LOOP DE RENDERIZAÇÃO
   ============================================================ */
let last = performance.now(), frame = 0, mouseX = 0, mouseY = 0, vel = 0, running = true;
addEventListener("pointermove", e => { mouseX = e.clientX/innerWidth - .5; mouseY = e.clientY/innerHeight - .5; });
document.addEventListener("visibilitychange", () => { running = !document.hidden; if (running) { last = performance.now(); requestAnimationFrame(loop); } });

function loop(now) {
  if (!running || !ok3d) return;
  const dt = Math.min(.05, (now - last)/1000); last = now; frame++;
  const k = reduce ? 1 : 1 - Math.pow(.0015, dt);
  for (const p in S) R[p] += (S[p] - R[p]) * k;

  const mob = isMobile(), aspect = innerWidth/innerHeight;
  const fit = aspect >= 1.2 ? 1 : (1.2/aspect)*.85;
  const t = now/1000;

  laptop.position.set(mob ? 0 : R.px, R.py + Math.sin(t*.8)*.04, R.pz);
  laptop.rotation.set(R.rx + mouseY*.06, R.ry + mouseX*.12, 0);
  laptop.scale.setScalar(R.sc);
  const open = intro.open * (1 - R.lid);
  lidPivot.rotation.x = THREE.MathUtils.lerp(Math.PI/2, -.22, open);

  camera.position.set(mouseX*.25, R.cy - mouseY*.15, R.cz*fit);
  camera.lookAt(0, R.ly, 0);

  glowMat.opacity = R.glow * (.7 + .3*Math.sin(t*1.4));
  ring.rotation.z = t*.1; ring.material.opacity = .25*R.glow;
  vel *= .92;
  stars.rotation.y = t*.015 + window.scrollY*.0004;
  stars.rotation.x = vel*.002;

  const bg = bgAt(R.bg); renderer.setClearColor(bg); scene.fog.color.copy(bg);

  if (!(mob && frame % 2)) { drawScreen(t, R.hl, R.logo); screenTex.needsUpdate = true; }
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
addEventListener("scroll", () => { vel += 1; }, {passive:true});
addEventListener("resize", () => {
  if (!ok3d) return;
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile() ? 1.5 : 1.8));
  renderer.setSize(innerWidth, innerHeight, false);
});

/* ============================================================
   ANIMAÇÕES DE INTERFACE
   ============================================================ */
gsap.to("#progress", {scaleX:1, ease:"none", scrollTrigger:{start:0, end:"max", scrub:.3}});

$$("[data-split]").forEach(el => {
  el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
  gsap.to(el.querySelectorAll(".w"), {opacity:1, stagger:.08, ease:"none", scrollTrigger:{trigger:el, start:"top 80%", end:"bottom 45%", scrub:true}});
});
$$("[data-reveal]").forEach(el => {
  gsap.from(el, {y:50, opacity:0, duration:1, ease:"power3.out", scrollTrigger:{trigger:el, start:"top 88%", toggleActions:"play none none reverse"}});
});
$$("[data-count]").forEach(el => {
  const o = {v:0};
  gsap.to(o, {v:+el.dataset.count, duration:1.6, ease:"power2.out", onUpdate:() => el.textContent = Math.round(o.v),
    scrollTrigger:{trigger:el, start:"top 90%", toggleActions:"play none none reset"}});
});
$$(".phase .bar i").forEach(el => {
  gsap.to(el, {width:el.dataset.w + "%", duration:1.6, ease:"power3.out", scrollTrigger:{trigger:el, start:"top 92%"}});
});
gsap.from(".card", {y:80, opacity:0, rotateX:-20, stagger:.08, duration:1, ease:"power3.out", scrollTrigger:{trigger:".cards", start:"top 82%"}});

/* galeria horizontal */
const track = $("#track"), projs = $$(".proj");
$("#ptotal").textContent = String(projs.length).padStart(2,"0");
gsap.to(track, {x:() => -(track.scrollWidth - innerWidth), ease:"none",
  scrollTrigger:{trigger:"#projetos", start:"top top", end:"bottom bottom", scrub:true, invalidateOnRefresh:true,
    onUpdate:s => { $("#pbar").style.transform = `scaleX(${s.progress})`; $("#pcount").textContent = String(Math.min(projs.length, 1 + Math.floor(s.progress*projs.length))).padStart(2,"0"); }}});
projs.forEach((p,i) => gsap.fromTo(p, {rotateY:-12, opacity:.35}, {rotateY:0, opacity:1, ease:"none",
  scrollTrigger:{trigger:"#projetos", start:() => `top+=${i*innerHeight*.5} top`, end:() => `top+=${i*innerHeight*.5 + innerHeight*.6} top`, scrub:true, invalidateOnRefresh:true}}));
$$(".draw").forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
  gsap.to(p, {strokeDashoffset:0, duration:2, ease:"power2.out", repeat:-1, repeatDelay:1.2, yoyo:true}); });
$$(".dash").forEach(p => gsap.to(p, {strokeDashoffset:-32, duration:1, ease:"none", repeat:-1}));

/* cards 3D com mouse */
$$(".card").forEach(c => {
  c.addEventListener("pointermove", e => {
    const r = c.getBoundingClientRect(), x = (e.clientX - r.left)/r.width, y = (e.clientY - r.top)/r.height;
    c.style.setProperty("--mx", x*100 + "%"); c.style.setProperty("--my", y*100 + "%");
    if (e.pointerType === "mouse") gsap.to(c, {rotateY:(x-.5)*14, rotateX:-(y-.5)*14, duration:.4, ease:"power2.out"});
  });
  c.addEventListener("pointerleave", () => gsap.to(c, {rotateX:0, rotateY:0, duration:.6, ease:"elastic.out(1,.5)"}));
  c.addEventListener("click", () => openModal(c.dataset.card));
});

/* modal */
const INFO = {
  management:["Pilar 1","ARYA Management","A gestão do negócio inteiro em um só lugar, pensada para quem não tem tempo para planilhas.",["Dashboard com vendas, ticket médio e meta do mês","Cadastro de clientes com histórico de compras","Produtos com foto, categoria e estoque","Funciona no celular, iPad e computador"]],
  pulso:["Pilar 2","ARYA Intelligence · Pulso","O Pulso lê os dados da loja e mostra o que fazer primeiro, sempre explicando de onde veio cada sugestão.",["Clientes que podem voltar a comprar","Orçamentos sem resposta","Produtos com estoque baixo","Clientes recorrentes em destaque"]],
  connect:["Pilar 3","ARYA Connect","A ponte entre a loja virtual e a gestão: os pedidos online entram sozinhos como venda.",["Pedido da loja virtual vira venda automaticamente","Estoque atualizado sem digitar nada","Base para futuras conexões com fornecedores e parceiros"]],
  cresce:["Fidelização","ARYA Cresce","Ferramentas para o cliente voltar e comprar de novo.",["Programa de fidelidade por pontos","Lembretes de recompra","Lista de clientes inativos para reativar"]],
  caixa:["Vendas","Caixa rápido","Venda no balcão em poucos toques.",["Leitura por código de barras","Escolha de tamanho e cor na hora","Cancelamento seguro que devolve o estoque"]],
  estoque:["Produtos","Estoque e grade","Controle de cada tamanho e cor, com segurança.",["Grade de tamanhos e cores por produto","Entradas, saídas e ajustes registrados","Filtros por categoria e estoque baixo","Fotos dos produtos"]],
  relatorios:["Gestão","Orçamentos, relatórios e fornecedores","Tudo o que acontece antes e depois da venda.",["Orçamentos que viram venda com um toque","Relatórios completos do período","Exportação para planilha (CSV)","Cadastro de fornecedores"]]
};
const modal = $("#modal");
function openModal(id) {
  const d = INFO[id]; if (!d) return;
  $("#mTag").textContent = d[0]; $("#mTitle").textContent = d[1]; $("#mText").textContent = d[2];
  $("#mList").innerHTML = d[3].map(x => `<li>${x}</li>`).join("");
  modal.style.display = "grid";
  gsap.fromTo(".bd", {opacity:0}, {opacity:1, duration:.3});
  gsap.fromTo("#modal .box", {y:40, opacity:0, scale:.95}, {y:0, opacity:1, scale:1, duration:.5, ease:"power3.out"});
  gsap.from("#mList li", {x:-20, opacity:0, stagger:.07, delay:.2});
}
function closeModal() { gsap.to("#modal .box", {y:30, opacity:0, duration:.25}); gsap.to(".bd", {opacity:0, duration:.3, onComplete:() => modal.style.display = "none"}); }
$("#modal .x").onclick = closeModal; $("#modal .bd").onclick = closeModal; $("#mCta").addEventListener("click", closeModal);
addEventListener("keydown", e => { if (e.key === "Escape" && modal.style.display === "grid") closeModal(); });

/* simulador do Pulso */
const s1 = $("#s1"), s2 = $("#s2"), s3 = $("#s3");
function sim() {
  const a = +s1.value, b = +s2.value, c = +s3.value;
  $("#v1").textContent = a; $("#v2").textContent = b; $("#v3").textContent = c;
  const bars = $$("#chart div"), vals = [a/20, b/60, c/15], nums = [a,b,c];
  bars.forEach((el,i) => { el.style.height = Math.max(4, vals[i]*100) + "%"; el.querySelector("span").textContent = nums[i]; });
  const items = [
    {s:a/20, cor:"#ff9a9a", ic:"!", t: a ? `Repor ${a} produto${a>1?"s":""} antes que acabe` : "Estoque em dia", d: a ? "Esses itens estão abaixo do estoque mínimo que você definiu." : "Nenhum produto abaixo do mínimo."},
    {s:b/60, cor:"#9ff0c4", ic:"↺", t: b ? `Chamar ${b} cliente${b>1?"s":""} de volta` : "Clientes ativos", d: b ? "Eles compraram antes e estão há mais de 30 dias sem voltar." : "Todos compraram recentemente."},
    {s:c/15, cor:"#ffd58a", ic:"✉", t: c ? `Cobrar resposta de ${c} orçamento${c>1?"s":""}` : "Orçamentos respondidos", d: c ? "Orçamentos enviados que ainda não viraram venda." : "Nenhum orçamento parado."}
  ].sort((x,y) => y.s - x.s);
  $("#recs").innerHTML = items.map((r,i) => `<div class="rec"><div class="d" style="background:${r.cor}22;color:${r.cor}">${r.ic}</div><div><b>${i===0 && r.s>0 ? "Prioridade: " : ""}${r.t}</b><small>${r.d}</small></div></div>`).join("");
}
[s1,s2,s3].forEach(s => s.addEventListener("input", sim)); sim();

/* acordeão */
$$(".acc .it").forEach(it => {
  const btn = it.querySelector("button"), ans = it.querySelector(".ans");
  btn.addEventListener("click", () => {
    const open = it.classList.toggle("open");
    gsap.to(ans, {height: open ? "auto" : 0, duration:.45, ease:"power3.inOut"});
  });
});

/* links internos com rolagem suave */
$$("[data-go]").forEach(a => a.addEventListener("click", e => {
  const id = a.getAttribute("href"); if (!id || !id.startsWith("#")) return;
  const el = $(id); if (!el) return; e.preventDefault();
  window.scrollTo({top: el.getBoundingClientRect().top + scrollY, behavior: reduce ? "auto" : "smooth"});
}));
const navMap = [["#sobre","#sobre"],["#servicos","#servicos"],["#projetos","#projetos"],["#interativo","#interativo"],["#contato","#contato"]];
navMap.forEach(([sec]) => ScrollTrigger.create({trigger:sec, start:"top 50%", end:"bottom 50%",
  onToggle:s => { const a = $(`.navlinks a[href="${sec}"]`); if (a) a.classList.toggle("on", s.isActive); }}));

/* brilho que segue o mouse */
if (matchMedia("(pointer:fine)").matches) {
  const cur = $("#cursor"); cur.style.opacity = 1;
  const qx = gsap.quickTo(cur, "x", {duration:.6, ease:"power3"}), qy = gsap.quickTo(cur, "y", {duration:.6, ease:"power3"});
  addEventListener("pointermove", e => { qx(e.clientX); qy(e.clientY); });
}

/* ============================================================
   ENTRADA
   ============================================================ */
function start() {
  $("#lbar").style.width = "100%";
  gsap.to("#loader", {opacity:0, duration:.6, delay:.25, onComplete:() => $("#loader").remove()});
  gsap.from("[data-hero]", {y:60, opacity:0, duration:1.2, stagger:.1, ease:"power4.out", delay:.4});
  gsap.from("nav", {y:-30, opacity:0, duration:1, delay:.6});
  gsap.to(intro, {open:1, duration:reduce ? 0 : 2.2, ease:"power3.inOut", delay:.3});
  if (ok3d) {
    const k0 = {...K.hero}; R.cz = k0.cz + 4; R.ry = k0.ry - 1.2; R.py = k0.py - .5;
    requestAnimationFrame(loop);
  }
  ScrollTrigger.refresh();
}
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(start, 150));
