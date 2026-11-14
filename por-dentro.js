/* ===== ARYA POR DENTRO — notebook 3D controlado pela rolagem =====
   Precisa de: gsap, ScrollTrigger e three (carregados no index.html). */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const secao = document.getElementById("por-dentro");
if (secao && window.gsap && window.ScrollTrigger) iniciar();

function iniciar() {
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s) => secao.querySelector(s);
  const $$ = (s) => [...secao.querySelectorAll(s)];
  const stick = $(".ax3-stick");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = () => innerWidth < 760;
  const LOGO = new Path2D("M215 127 208 118 200 111 192 105 179 100 165 98 151 98 138 100 126 104 114 110 104 116 91 126 78 136 66 147 18 193 8 204 7 206 28 206 82 206 119 165 157 121 164 114 172 110 177 109 183 109 192 111 202 117 208 121 215 128ZM356 74 356 75 354 84 348 92 341 97 332 100 339 102 344 104 351 110 354 116 356 124 358 118 359 114 364 108 368 104 372 102 380 100 370 96 366 94 363 91 358 82ZM92 104 92 104 94 103 100 97 114 85 126 76 134 71 144 66 151 63 162 61 171 61 179 64 187 68 194 76 270 178 276 186 282 191 294 199 300 202 308 204 320 206 352 206 352 204 347 197 341 190 337 184 221 26 218 23 212 17 206 13 201 11 194 9 188 8 175 9 166 12 157 18 150 26 146 30 140 38 136 45Z"); // símbolo oficial da ARYA (viewBox 387 x 213)

  /* ---------- etapas da rolagem ---------- */
  const K = [
    {open:0, px:0, py:-.30, ry:-.95, rx:.18, cz:9.6, cy:2.4, ly:.40, hl:-1, logo:0, glow:.4},
    {open:1, px:0, py:-.35, ry:-.40, rx:.10, cz:7.6, cy:1.9, ly:.50, hl:-1, logo:0, glow:1},
    {open:1, px:0, py:-.35, ry:0,    rx:0,   cz:5.4, cy:1.35,ly:.70, hl:0,  logo:0, glow:1},
    {open:1, px:0, py:-.35, ry:-.08, rx:0,   cz:3.8, cy:1.0, ly:.78, hl:1,  logo:0, glow:1},
    {open:1, px:0, py:-.35, ry:.10,  rx:0,   cz:3.4, cy:.95, ly:.78, hl:2,  logo:0, glow:1},
    {open:1, px:0, py:-.35, ry:0,    rx:0,   cz:3.7, cy:1.0, ly:.78, hl:3,  logo:0, glow:1},
    {open:1, px:0, py:-.55, ry:.42,  rx:.08, cz:8.2, cy:1.8, ly:.25, hl:-1, logo:1, glow:1.3}
  ];
  const S = {...K[0]}, R = {...K[0]};

  /* ---------- 3D ---------- */
  let renderer, scene, camera, laptop, lidPivot, screenTex, sctx, glowMat, ring, stars, ok = true;
  const SW = 1280, SH = 800;
  try {
    renderer = new THREE.WebGLRenderer({canvas: $(".ax3-canvas"), antialias: true, powerPreference: "high-performance"});
    if (!renderer.getContext()) throw 0;
  } catch (e) { ok = false; secao.classList.add("sem3d"); }

  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function logo(c, x, y, w, cor) { c.save(); c.translate(x, y); c.scale(w/387, w/387); c.fillStyle = cor; c.fill(LOGO, "evenodd"); c.restore(); }

  const vendas = [32,38,35,44,41,52,48,57,55,63,60,71,68,78];
  const semana = [.42,.58,.88,.35,.5,.66,.94];
  const VERDE = "#22c55e";

  function tela(t, hl, lg) {
    const c = sctx, h = Math.round(hl);
    c.fillStyle = "#050505"; c.fillRect(0,0,SW,SH);
    c.fillStyle = "#0e0e0e"; c.fillRect(0,0,230,SH);
    logo(c, 26, 34, 64, "#fff");
    c.fillStyle = "#fff"; c.font = "400 20px Michroma, sans-serif"; c.fillText("ARYA", 100, 62);
    const menu = ["Dashboard","Vendas","Pulso","Produtos","Clientes","Cresce","Relatórios"];
    const ativo = h < 0 ? 0 : [0,1,2,3][h];
    menu.forEach((m,i) => {
      const y = 130 + i*50;
      if (i === ativo) { c.fillStyle = "#fff"; rr(c,16,y-28,198,42,12); c.fill(); }
      c.fillStyle = i === ativo ? "#000" : "#7a7a7a"; c.font = "600 18px Inter, sans-serif"; c.fillText(m, 36, y);
    });
    c.fillStyle = "#7a7a7a"; c.font = "500 14px Inter, sans-serif"; c.fillText("Vitória Gabrielly", 28, SH-48);
    c.fillStyle = "#fff"; c.fillText("Fundadora", 28, SH-26);

    c.fillStyle = "#fff"; c.font = "400 28px Michroma, sans-serif"; c.fillText(menu[ativo], 270, 64);
    c.fillStyle = "#666"; c.font = "500 15px Inter, sans-serif"; c.fillText("Loja exemplo · dados de demonstração", 270, 90);
    c.fillStyle = "rgba(34,197,94,.12)"; rr(c,1100,36,150,38,19); c.fill();
    c.fillStyle = `rgba(34,197,94,${.5 + .5*Math.sin(t*4)})`; c.beginPath(); c.arc(1124,55,6,0,7); c.fill();
    c.fillStyle = VERDE; c.font = "600 15px Inter, sans-serif"; c.fillText("Tempo real", 1138, 60);

    const P = [[270,110,980,118],[270,246,620,300],[910,246,340,300],[270,564,980,210]];
    P.forEach(([x,y,w,hh], i) => {
      c.save();
      c.globalAlpha = h < 0 || h === i ? 1 : .3;
      if (h === i) { c.shadowColor = "rgba(255,255,255,.6)"; c.shadowBlur = 40; }
      c.fillStyle = "#111"; rr(c,x,y,w,hh,18); c.fill(); c.shadowBlur = 0;
      c.strokeStyle = h === i ? "#fff" : "rgba(255,255,255,.08)"; c.lineWidth = h === i ? 3 : 1.5; rr(c,x,y,w,hh,18); c.stroke();
      if (i === 0) {
        [["Faturamento do mês","R$ 18.490"],["Vendas","142"],["Ticket médio","R$ 130"],["Estoque baixo","3"]].forEach((k,j) => {
          const kx = x + 26 + j*240;
          c.fillStyle = "#7a7a7a"; c.font = "500 15px Inter, sans-serif"; c.fillText(k[0], kx, y+42);
          c.fillStyle = "#fff"; c.font = "700 34px Inter, sans-serif"; c.fillText(k[1], kx, y+86);
          if (j) { c.fillStyle = "rgba(255,255,255,.07)"; c.fillRect(kx-20, y+24, 1, 70); }
        });
      }
      if (i === 1) {
        c.fillStyle = "#fff"; c.font = "600 19px Inter, sans-serif"; c.fillText("Vendas — últimos 14 dias", x+24, y+40);
        const gx = x+24, gy = y+72, gw = w-48, gh = hh-102;
        c.strokeStyle = "rgba(255,255,255,.05)"; c.lineWidth = 1;
        for (let g=0; g<4; g++) { c.beginPath(); c.moveTo(gx, gy+g*gh/3); c.lineTo(gx+gw, gy+g*gh/3); c.stroke(); }
        const pts = vendas.map((v,k) => [gx + k*gw/(vendas.length-1), gy + gh - ((v + Math.sin(t*1.5+k)*2.5 - 25)/60)*gh]);
        const gr = c.createLinearGradient(0,gy,0,gy+gh); gr.addColorStop(0,"rgba(255,255,255,.28)"); gr.addColorStop(1,"rgba(255,255,255,0)");
        c.beginPath(); c.moveTo(pts[0][0], gy+gh); pts.forEach(p => c.lineTo(p[0],p[1])); c.lineTo(pts[pts.length-1][0], gy+gh); c.fillStyle = gr; c.fill();
        c.beginPath(); pts.forEach((p,k) => k ? c.lineTo(p[0],p[1]) : c.moveTo(p[0],p[1])); c.strokeStyle = "#fff"; c.lineWidth = 3.5; c.stroke();
        const lp = pts[pts.length-1];
        c.fillStyle = "rgba(34,197,94,.3)"; c.beginPath(); c.arc(lp[0],lp[1],10+4*Math.sin(t*4),0,7); c.fill();
        c.fillStyle = VERDE; c.beginPath(); c.arc(lp[0],lp[1],5,0,7); c.fill();
      }
      if (i === 2) {
        c.fillStyle = "#fff"; c.font = "600 19px Inter, sans-serif"; c.fillText("ARYA Pulso", x+24, y+40);
        const recs = [[VERDE,"3 clientes podem","voltar a comprar"],["#fbbf24","2 orçamentos","sem resposta"],["#f87171","Camiseta P com","estoque baixo"]];
        const on = Math.floor(t*.8) % 3;
        recs.forEach((r,k) => {
          const ry = y + 64 + k*76;
          c.fillStyle = k === on ? "rgba(255,255,255,.1)" : "rgba(255,255,255,.035)"; rr(c,x+18,ry,w-36,64,14); c.fill();
          c.fillStyle = r[0]; c.beginPath(); c.arc(x+44, ry+32, 7, 0, 7); c.fill();
          c.fillStyle = "#fff"; c.font = "600 15px Inter, sans-serif"; c.fillText(r[1], x+64, ry+28);
          c.fillStyle = "#8a8a8a"; c.font = "500 14px Inter, sans-serif"; c.fillText(r[2], x+64, ry+48);
        });
      }
      if (i === 3) {
        c.fillStyle = "#fff"; c.font = "600 19px Inter, sans-serif"; c.fillText("Últimos 7 dias", x+24, y+40);
        const dias = ["S","T","Q","Q","S","S","D"];
        semana.forEach((v,k) => {
          const bh = (v*.85 + .15*Math.sin(t*1.2+k)) * 110, bx = x+34+k*68;
          c.fillStyle = k === 6 ? "#fff" : "#3a3a3a"; rr(c,bx,y+177-bh,38,bh,8); c.fill();
          c.fillStyle = "#7a7a7a"; c.font = "500 13px Inter, sans-serif"; c.fillText(dias[k], bx+14, y+200);
        });
        c.fillStyle = "#fff"; c.font = "600 19px Inter, sans-serif"; c.fillText("Mais vendidos", x+560, y+40);
        [["Camiseta oversized",.9,"38 un."],["Calça cargo",.55,"21 un."],["Boné aba reta",.45,"17 un."]].forEach((m,k) => {
          const my = y + 78 + k*44;
          c.fillStyle = "#cfcfcf"; c.font = "500 15px Inter, sans-serif"; c.fillText(m[0], x+560, my);
          c.fillStyle = "#7a7a7a"; c.fillText(m[2], x+880, my);
          c.fillStyle = "rgba(255,255,255,.07)"; rr(c,x+560,my+10,380,8,4); c.fill();
          c.fillStyle = "#fff"; rr(c,x+560,my+10,380*m[1],8,4); c.fill();
        });
      }
      c.restore();
    });
    if (lg > .01) {
      const a = Math.min(1, lg);
      c.fillStyle = `rgba(0,0,0,${a*.95})`; c.fillRect(0,0,SW,SH);
      c.save(); c.globalAlpha = a;
      const g = c.createRadialGradient(SW/2,SH/2,0,SW/2,SH/2,520); g.addColorStop(0,"rgba(255,255,255,.12)"); g.addColorStop(1,"rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(0,0,SW,SH);
      logo(c, SW/2-170, SH/2-170, 340, "#fff");
      c.fillStyle = "#fff"; c.font = "400 56px Michroma, sans-serif"; c.textAlign = "center";
      c.fillText("A R Y A", SW/2, SH/2+90);
      c.fillStyle = "#777"; c.font = "500 20px Inter, sans-serif"; c.fillText("Sua loja pensa com você.", SW/2, SH/2+135);
      c.textAlign = "left"; c.restore();
    }
  }

  function texTeclado() {
    const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 400;
    const c = cv.getContext("2d"); c.fillStyle = "#141414"; c.fillRect(0,0,1024,400);
    const cols = 14, rows = 6, gap = 8, kw = (1024-gap*(cols+1))/cols, kh = (400-gap*(rows+1))/rows;
    for (let r=0; r<rows; r++) for (let k=0; k<cols; k++) {
      if (r === 5 && k > 3 && k < 10) continue;
      const x = gap + k*(kw+gap), y = gap + r*(kh+gap);
      c.fillStyle = "#0a0a0a"; rr(c,x,y,kw,kh,8); c.fill();
      c.strokeStyle = "rgba(255,255,255,.06)"; c.lineWidth = 2; rr(c,x,y,kw,kh,8); c.stroke();
    }
    c.fillStyle = "#0a0a0a"; rr(c, gap+4*(kw+gap), gap+5*(kh+gap), 6*(kw+gap)-gap, kh, 8); c.fill();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }
  function texRadial(a, b) {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256;
    const c = cv.getContext("2d"), g = c.createRadialGradient(128,128,0,128,128,128);
    g.addColorStop(0,a); g.addColorStop(1,b); c.fillStyle = g; c.fillRect(0,0,256,256);
    return new THREE.CanvasTexture(cv);
  }
  function texLogoCostas() {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 300;
    logo(cv.getContext("2d"), 16, 8, 480, "rgba(235,235,235,.92)");
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function tamanho() { return [stick.clientWidth || innerWidth, stick.clientHeight || innerHeight]; }

  if (ok) {
    const [w, h] = tamanho();
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.5 : 1.8));
    renderer.setSize(w, h, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000);

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x000000, 12, 30);
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
    camera = new THREE.PerspectiveCamera(35, w/h, .1, 100);

    const luz = new THREE.DirectionalLight(0xffffff, 1.6); luz.position.set(4,6,5); scene.add(luz);
    const contra = new THREE.PointLight(0xffffff, 30, 20); contra.position.set(-3,3,-4); scene.add(contra);
    scene.add(new THREE.AmbientLight(0xffffff, .15));

    laptop = new THREE.Group(); scene.add(laptop);
    const alu = new THREE.MeshStandardMaterial({color:0x26272b, metalness:.85, roughness:.32});
    const base = new THREE.Mesh(new RoundedBoxGeometry(3.3,.11,2.25,4,.05), alu); base.position.y = .055; laptop.add(base);
    const kb = new THREE.Mesh(new THREE.PlaneGeometry(2.8,1.05), new THREE.MeshStandardMaterial({map:texTeclado(), roughness:.8, metalness:.2}));
    kb.rotation.x = -Math.PI/2; kb.position.set(0,.1105,-.3); laptop.add(kb);
    const pad = new THREE.Mesh(new RoundedBoxGeometry(1.15,.01,.7,2,.004), new THREE.MeshStandardMaterial({color:0x303136, metalness:.7, roughness:.25}));
    pad.position.set(0,.11,.62); laptop.add(pad);
    const dob = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.6,24), new THREE.MeshStandardMaterial({color:0x101010, metalness:.6, roughness:.4}));
    dob.rotation.z = Math.PI/2; dob.position.set(0,.11,-1.09); laptop.add(dob);

    lidPivot = new THREE.Group(); lidPivot.position.set(0,.11,-1.1); laptop.add(lidPivot);
    const tampa = new THREE.Mesh(new RoundedBoxGeometry(3.3,2.15,.06,4,.03), alu); tampa.position.set(0,1.075,-.03); lidPivot.add(tampa);
    const moldura = new THREE.Mesh(new THREE.PlaneGeometry(3.24,2.09), new THREE.MeshStandardMaterial({color:0x040404, roughness:.15, metalness:.3}));
    moldura.position.set(0,1.075,.001); lidPivot.add(moldura);
    const cv = document.createElement("canvas"); cv.width = SW; cv.height = SH; sctx = cv.getContext("2d");
    screenTex = new THREE.CanvasTexture(cv); screenTex.colorSpace = THREE.SRGBColorSpace; screenTex.anisotropy = 8;
    const display = new THREE.Mesh(new THREE.PlaneGeometry(3.04,1.9), new THREE.MeshBasicMaterial({map:screenTex, toneMapped:false}));
    display.position.set(0,1.1,.003); lidPivot.add(display);
    const vidro = new THREE.Mesh(new THREE.PlaneGeometry(3.24,2.09), new THREE.MeshPhysicalMaterial({color:0xffffff, transparent:true, opacity:.05, roughness:.05, clearcoat:1}));
    vidro.position.set(0,1.075,.006); lidPivot.add(vidro);
    const costas = new THREE.Mesh(new THREE.PlaneGeometry(.8,.47), new THREE.MeshBasicMaterial({map:texLogoCostas(), transparent:true}));
    costas.position.set(0,1.1,-.062); costas.rotation.y = Math.PI; lidPivot.add(costas);

    glowMat = new THREE.MeshBasicMaterial({map:texRadial("rgba(255,255,255,.35)","rgba(255,255,255,0)"), transparent:true, depthWrite:false, blending:THREE.AdditiveBlending});
    const brilho = new THREE.Mesh(new THREE.PlaneGeometry(7,5), glowMat); brilho.rotation.x = -Math.PI/2; brilho.position.y = -.01; laptop.add(brilho);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(4.2,3), new THREE.MeshBasicMaterial({map:texRadial("rgba(0,0,0,.9)","rgba(0,0,0,0)"), transparent:true, depthWrite:false}));
    sombra.rotation.x = -Math.PI/2; sombra.position.y = -.005; laptop.add(sombra);
    ring = new THREE.Mesh(new THREE.TorusGeometry(3.4,.006,8,180), new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.25}));
    ring.rotation.x = Math.PI/2; ring.position.y = -.02; laptop.add(ring);

    const n = mobile() ? 600 : 1400, pos = new Float32Array(n*3);
    for (let i=0; i<n; i++) {
      const r = 6 + Math.random()*16, th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
      pos[i*3] = r*Math.sin(ph)*Math.cos(th); pos[i*3+1] = r*Math.cos(ph)*.6; pos[i*3+2] = r*Math.sin(ph)*Math.sin(th);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(pos,3));
    stars = new THREE.Points(sg, new THREE.PointsMaterial({size:.03, color:0xffffff, transparent:true, opacity:.55, depthWrite:false}));
    scene.add(stars);
    const grade = new THREE.GridHelper(60, 60, 0x222222, 0x111111); grade.position.y = -1.6; scene.add(grade);
  }

  /* ---------- linha do tempo da rolagem ---------- */
  const marcas = [0, .16, .30, .46, .62, .78, 1];
  const tl = gsap.timeline({scrollTrigger:{trigger:secao, start:"top top", end:"bottom bottom", scrub:true,
    onUpdate: s => {
      $(".ax3-barra").style.transform = `scaleX(${s.progress})`;
      const p = s.progress, i = p < .30 ? -1 : p < .46 ? 0 : p < .62 ? 1 : p < .78 ? 2 : p < .9 ? 3 : -1;
      $$(".ax3-pontos i").forEach((d,k) => d.classList.toggle("on", k === i));
    }}});
  for (let i = 0; i < K.length-1; i++) {
    tl.fromTo(S, {...K[i]}, {...K[i+1], ease:"none", duration:marcas[i+1]-marcas[i], immediateRender:false}, marcas[i]);
  }
  tl.to($(".ax3-intro"), {opacity:0, y:-40, duration:.1}, .12);
  const caps = $$(".ax3-cap");
  caps.forEach((c,i) => {
    const ini = marcas[i+2] - .05;
    tl.fromTo(c, {opacity:0, y:30}, {opacity:1, y:0, duration:.05, immediateRender:false}, ini);
    tl.to(c, {opacity:0, y:-30, duration:.04}, ini + .13);
  });
  $$(".ax3-chip").forEach((c,i) => {
    tl.fromTo(c, {opacity:0, scale:.8, y:20}, {opacity:1, scale:1, y:0, duration:.06, immediateRender:false}, .34 + i*.1);
    tl.to(c, {opacity:0, y:-20, duration:.05}, .86);
  });
  tl.fromTo($(".ax3-fim"), {opacity:0, y:30}, {opacity:1, y:0, duration:.08, immediateRender:false}, .9);

  /* ---------- renderização (só quando a seção está na tela) ---------- */
  if (!ok) return;
  let visivel = false, ultimo = performance.now(), quadro = 0, mx = 0, my = 0;
  new IntersectionObserver(e => {
    const antes = visivel; visivel = e[0].isIntersecting;
    if (visivel && !antes) { ultimo = performance.now(); requestAnimationFrame(loop); }
  }, {rootMargin: "200px"}).observe(secao);
  addEventListener("pointermove", e => { mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; });
  addEventListener("resize", () => {
    const [w, h] = tamanho();
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.5 : 1.8));
    renderer.setSize(w, h, false);
  });

  function loop(agora) {
    if (!visivel || document.hidden) return;
    const dt = Math.min(.05, (agora - ultimo)/1000); ultimo = agora; quadro++;
    const k = reduce ? 1 : 1 - Math.pow(.0015, dt);
    for (const p in S) R[p] += (S[p] - R[p]) * k;
    const [w, h] = tamanho(), asp = w/h, fit = asp >= 1.2 ? 1 : (1.2/asp)*.85, t = agora/1000;

    laptop.position.set(R.px, R.py + Math.sin(t*.8)*.04, 0);
    laptop.rotation.set(R.rx + my*.06, R.ry + mx*.12, 0);
    lidPivot.rotation.x = THREE.MathUtils.lerp(Math.PI/2, -.22, R.open);
    camera.position.set(mx*.25, R.cy - my*.15, R.cz*fit);
    camera.lookAt(0, R.ly, 0);
    glowMat.opacity = R.glow * (.7 + .3*Math.sin(t*1.4));
    ring.rotation.z = t*.1; ring.material.opacity = .2*R.glow;
    stars.rotation.y = t*.015;

    if (!(mobile() && quadro % 2)) { tela(t, R.hl, R.logo); screenTex.needsUpdate = true; }
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden && visivel) { ultimo = performance.now(); requestAnimationFrame(loop); } });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => ScrollTrigger.refresh());
}
