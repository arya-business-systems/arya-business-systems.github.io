/* =========================================================
   ARYA Systems — Faixa "Novo: ARYA Life" + seção "Nossos produtos"
   Arquivo independente: não mexe no resto do site.
   Para ligar: <script src="nossos-produtos.js"></script> antes do </body>
   ========================================================= */
(function () {
  // Endereços (troque aqui se algum mudar)
  var LINK_LIFE = "https://life.aryasystems.com.br";
  var LINK_BUSINESS = "app.html";

  // Evita colocar duas vezes
  if (document.getElementById("ap-produtos")) return;

  // ---------- Estilo (preto e branco da ARYA) ----------
  var css = `
  .ap-faixa{display:flex;justify-content:center;align-items:center;gap:10px;flex-wrap:wrap;
    background:#000;color:#fff;font-size:14px;padding:10px 16px;text-align:center;
    position:relative;z-index:9999;text-decoration:none}
  .ap-faixa:hover{text-decoration:none;background:#111}
  .ap-faixa b{font-weight:700;letter-spacing:.04em}
  .ap-faixa span.ap-seta{display:inline-block;transition:transform .2s}
  .ap-faixa:hover span.ap-seta{transform:translateX(4px)}
  .ap-novo{border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:2px 10px;font-size:11px;
    letter-spacing:.12em;text-transform:uppercase}

  #ap-produtos{background:#fff;color:#000;padding:72px 20px;position:relative;z-index:2}
  #ap-produtos *{box-sizing:border-box}
  .ap-wrap{max-width:1080px;margin:0 auto}
  .ap-eyebrow{font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#666;margin:0 0 12px}
  .ap-titulo{font-size:clamp(30px,6vw,48px);line-height:1.05;letter-spacing:-.02em;font-weight:700;margin:0 0 12px}
  .ap-sub{font-size:17px;color:#555;max-width:56ch;margin:0 0 40px}
  .ap-grade{display:grid;gap:16px;grid-template-columns:1fr}
  @media(min-width:768px){.ap-grade{grid-template-columns:1fr 1fr}}
  .ap-card{display:flex;flex-direction:column;justify-content:space-between;gap:28px;min-height:260px;
    border-radius:20px;padding:28px;text-decoration:none;
    transition:transform .3s cubic-bezier(.2,.7,.2,1),box-shadow .3s}
  .ap-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(0,0,0,.14);text-decoration:none}
  .ap-life{background:#000;color:#fff}
  .ap-business{background:#f2f2f2;color:#000;border:1px solid #e3e3e3}
  .ap-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;
    border:1px solid currentColor;border-radius:999px;padding:3px 10px;opacity:.75}
  .ap-nome{font-size:30px;font-weight:700;letter-spacing:-.01em;margin:16px 0 8px}
  .ap-desc{font-size:16px;line-height:1.5;opacity:.8;margin:0;max-width:40ch}
  .ap-acao{font-weight:700;font-size:15px}
  .ap-acao span{display:inline-block;transition:transform .2s}
  .ap-card:hover .ap-acao span{transform:translateX(4px)}
  `;
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------- Faixa no topo ----------
  var faixa = document.createElement("a");
  faixa.className = "ap-faixa";
  faixa.href = LINK_LIFE;
  faixa.innerHTML =
    '<span class="ap-novo">Novo</span>' +
    '<span>Conheça a <b>ARYA Life</b>: inteligência que ajuda você a encontrar oportunidades</span>' +
    '<span class="ap-seta">→</span>';
  document.body.insertBefore(faixa, document.body.firstChild);

  // ---------- Seção "Nossos produtos" ----------
  var secao = document.createElement("section");
  secao.id = "ap-produtos";
  secao.innerHTML =
    '<div class="ap-wrap">' +
      '<p class="ap-eyebrow">ARYA Systems</p>' +
      '<h2 class="ap-titulo">Nossos produtos</h2>' +
      '<p class="ap-sub">Tecnologia para resolver problemas reais, das pessoas e dos negócios.</p>' +
      '<div class="ap-grade">' +
        '<a class="ap-card ap-life" href="' + LINK_LIFE + '">' +
          '<div><span class="ap-tag">Novo</span>' +
          '<h3 class="ap-nome">ARYA Life</h3>' +
          '<p class="ap-desc">Encontre oportunidades de estudo e carreira, entenda os requisitos e acompanhe os prazos.</p></div>' +
          '<span class="ap-acao">Conhecer a ARYA Life <span>→</span></span>' +
        '</a>' +
        '<a class="ap-card ap-business" href="' + LINK_BUSINESS + '">' +
          '<div><span class="ap-tag">Para negócios</span>' +
          '<h3 class="ap-nome">ARYA Business</h3>' +
          '<p class="ap-desc">Gestão, vendas e inteligência comercial para pequenos negócios, em um só lugar.</p></div>' +
          '<span class="ap-acao">Entrar no sistema <span>→</span></span>' +
        '</a>' +
      '</div>' +
    '</div>';

  // Coloca a seção logo depois da primeira parte do site (topo/abertura).
  // Se não achar, coloca logo depois da faixa.
  var primeira = document.querySelector("body > header, body > section, main > section");
  if (primeira && primeira.parentNode) {
    primeira.parentNode.insertBefore(secao, primeira.nextSibling);
  } else {
    faixa.parentNode.insertBefore(secao, faixa.nextSibling);
  }
})();
