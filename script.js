// =========================================================
// ARYA - script.js (versão completa) - PARTE 1
// =========================================================

// ===== Navegação e avisos =====
const titulos = {
  dashboard: "Dashboard",
  clientes: "Clientes",
  produtos: "Produtos",
  vendas: "Vendas",
  intelligence: "ARYA Intelligence"
};

const tituloEl = document.getElementById("viewTitle");
const toastEl = document.getElementById("toast");
let toastTimer = null;

function mostrarTela(nome) {
  if (!titulos[nome]) return;

  document.querySelectorAll(".view").forEach(function (v) {
    v.classList.toggle("active", v.id === "view-" + nome);
  });

  document.querySelectorAll("[data-view]").forEach(function (b) {
    b.classList.toggle("active", b.dataset.view === nome);
  });

  tituloEl.textContent = titulos[nome];
  window.scrollTo(0, 0);
}

function avisar(mensagem) {
  toastEl.textContent = mensagem;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove("show");
  }, 2600);
}

document.querySelectorAll("[data-view]").forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarTela(botao.dataset.view);
  });
});

const btnTesteVendas = document.getElementById("btnTeste3");
if (btnTesteVendas) {
  btnTesteVendas.addEventListener("click", function () {
    avisar("Este botão será ligado ao banco de dados na próxima etapa.");
  });
}

// ===== Tela de login (visual e validação) =====
const authEl = document.getElementById("auth");
const formAuth = document.getElementById("formAuth");
const tabEntrar = document.getElementById("tabEntrar");
const tabCriar = document.getElementById("tabCriar");
const fieldEmpresa = document.getElementById("fieldEmpresa");
const fieldConfirma = document.getElementById("fieldConfirma");
const btnAuth = document.getElementById("btnAuth");
const authErro = document.getElementById("authErro");
const inEmpresa = document.getElementById("empresa");
const inEmail = document.getElementById("email");
const inSenha = document.getElementById("senha");
const inConfirma = document.getElementById("confirma");

let modoCadastro = false;

function definirModo(cadastro) {
  modoCadastro = cadastro;
  tabEntrar.classList.toggle("active", !cadastro);
  tabCriar.classList.toggle("active", cadastro);
  fieldEmpresa.hidden = !cadastro;
  fieldConfirma.hidden = !cadastro;
  btnAuth.textContent = cadastro ? "Criar conta" : "Entrar";
  inSenha.autocomplete = cadastro ? "new-password" : "current-password";
  limparErros();
}

function limparErros() {
  authErro.textContent = "";
  [inEmpresa, inEmail, inSenha, inConfirma].forEach(function (i) {
    i.classList.remove("invalid");
  });
}

function falha(campo, mensagem) {
  campo.classList.add("invalid");
  authErro.textContent = mensagem;
  campo.focus();
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

tabEntrar.addEventListener("click", function () { definirModo(false); });
tabCriar.addEventListener("click", function () { definirModo(true); });

formAuth.addEventListener("submit", function (evento) {
  evento.preventDefault();
  limparErros();

  if (modoCadastro && inEmpresa.value.trim().length < 2) {
    return falha(inEmpresa, "Informe o nome da empresa.");
  }
  if (!emailValido(inEmail.value.trim())) {
    return falha(inEmail, "Digite um e-mail válido.");
  }
  if (inSenha.value.length < 8) {
    return falha(inSenha, "A senha precisa ter pelo menos 8 caracteres.");
  }
  if (modoCadastro && inSenha.value !== inConfirma.value) {
    return falha(inConfirma, "As senhas não são iguais.");
  }

  processarAuth();
});

document.getElementById("btnPrevia").addEventListener("click", function () {
  authEl.classList.add("hidden");
});

// ===== Configuração central do Supabase =====
const SUPABASE_URL = "https://olmnpqlnyymwveskzbph.supabase.co";
const SUPABASE_KEY = "sb_publishable_yFOBf0FXYMO6-7hXa_B1pA_bneB7DzS";

let sb = null;

async function iniciarSupabase() {
  if (sb) return sb;
  const modulo = await import("https://esm.sh/@supabase/supabase-js@2");
  sb = modulo.createClient(SUPABASE_URL, SUPABASE_KEY);
  return sb;
}

// ===== Teste de conexão =====
const notaEl = document.querySelector(".auth-note");

function mostrarStatus(texto, estado) {
  const cores = { ok: "#16a34a", erro: "#dc2626", info: "#71717a" };
  notaEl.textContent = texto;
  notaEl.style.color = cores[estado];
}

async function testarConexao() {
  mostrarStatus("Testando conexão com o Supabase...", "info");

  try {
    const cliente = await iniciarSupabase();

    // Sem login, o banco deve RECUSAR esta leitura (código 42501).
    // Essa recusa prova que a conexão e a chave funcionam
    // e que a segurança está ativa.
    const resposta = await cliente.from("plans").select("id").limit(1);
    console.log("Resposta do teste:", resposta);

    const erro = resposta.error;
    if (erro && erro.code === "42501") {
      mostrarStatus("Conectado ao Supabase, segurança ativa.", "ok");
    } else if (!erro) {
      mostrarStatus("Conectado ao Supabase.", "ok");
    } else {
      mostrarStatus("Erro (" + (erro.code || "sem código") + "): " + erro.message, "erro");
    }
  } catch (e) {
    console.error(e);
    mostrarStatus("Falha na conexão: " + e.message, "erro");
  }
}

testarConexao();

// ===== Cadastro (criar conta + empresa) =====
function processarAuth() {
  if (modoCadastro) {
    cadastrar(inEmpresa.value.trim(), inEmail.value.trim(), inSenha.value);
  } else {
    entrar(inEmail.value.trim(), inSenha.value);
  }
}

function traduzirErro(e) {
  const msg = e && e.message ? e.message : String(e);
  if (/already registered/i.test(msg)) return "Este e-mail já está cadastrado.";
  if (/invalid login/i.test(msg)) return "E-mail já existe com outra senha. Use a senha original.";
  if (/invalid/i.test(msg) && /email/i.test(msg)) return "E-mail inválido. Use um e-mail real.";
  if (/password/i.test(msg)) return "Senha recusada: " + msg;
  if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde alguns minutos.";
  if (/já possui uma empresa/i.test(msg)) return "Este usuário já tem uma empresa.";
  return "Erro: " + msg;
}

async function cadastrar(empresa, email, senha) {
  btnAuth.disabled = true;
  btnAuth.textContent = "Criando conta...";
  authErro.textContent = "";

  try {
    const cliente = await iniciarSupabase();

    // 1) Cria o usuário (ou entra, se ele já foi criado em uma tentativa anterior)
    let resposta = await cliente.auth.signUp({ email: email, password: senha });
    if (resposta.error && /already registered/i.test(resposta.error.message)) {
      resposta = await cliente.auth.signInWithPassword({ email: email, password: senha });
    }
    if (resposta.error) throw resposta.error;
    if (!resposta.data || !resposta.data.session) {
      throw new Error("Sem sessão. Confira se o Confirm email está desligado no Supabase.");
    }

    // 2) Cria a empresa e o perfil de dono (função segura do banco)
    const empresaResp = await cliente.rpc("create_company_with_profile", {
      p_company_name: empresa,
      p_full_name: null
    });
    if (empresaResp.error) throw empresaResp.error;

    console.log("Empresa criada. ID:", empresaResp.data);
    const nome = await abrirApp();
    avisar("Conta e empresa criadas: " + nome);
  } catch (e) {
    console.error(e);
    authErro.textContent = traduzirErro(e);
  } finally {
    btnAuth.disabled = false;
    btnAuth.textContent = modoCadastro ? "Criar conta" : "Entrar";
  }
}

// ===== Login, sessão e sair =====
async function abrirApp() {
  const cliente = await iniciarSupabase();
  const usuario = await cliente.auth.getUser();
  if (usuario.error || !usuario.data.user) {
    throw new Error("Sessão inválida. Entre novamente.");
  }

  // Leitura real protegida pelo RLS: só retorna dados da sua empresa
  const perfil = await cliente
    .from("profiles")
    .select("role, companies(name)")
    .eq("id", usuario.data.user.id)
    .maybeSingle();
  if (perfil.error) throw perfil.error;
  if (!perfil.data) {
    throw new Error("Este usuário ainda não tem empresa. Use Criar conta com a mesma senha para concluir.");
  }

  const nomeEmpresa = perfil.data.companies ? perfil.data.companies.name : "Minha empresa";
  document.querySelector(".sidebar-foot").textContent = nomeEmpresa;
  adicionarBotaoSair();
  authEl.classList.add("hidden");
  return nomeEmpresa;
}

async function entrar(email, senha) {
  btnAuth.disabled = true;
  btnAuth.textContent = "Entrando...";
  authErro.textContent = "";

  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.auth.signInWithPassword({ email: email, password: senha });
    if (resposta.error) throw resposta.error;

    const nome = await abrirApp();
    avisar("Login realizado: " + nome);
  } catch (e) {
    console.error(e);
    const msg = e && e.message ? e.message : "";
    authErro.textContent = /invalid login/i.test(msg)
      ? "E-mail ou senha incorretos."
      : traduzirErro(e);
  } finally {
    btnAuth.disabled = false;
    btnAuth.textContent = modoCadastro ? "Criar conta" : "Entrar";
  }
}

function adicionarBotaoSair() {
  if (document.getElementById("btnSair")) return;
  const botao = document.createElement("button");
  botao.id = "btnSair";
  botao.type = "button";
  botao.className = "btn";
  botao.textContent = "Sair";
  botao.addEventListener("click", sair);
  document.querySelector(".topbar").appendChild(botao);
}

async function sair() {
  try {
    const cliente = await iniciarSupabase();
    await cliente.auth.signOut();
  } catch (e) {
    console.error(e);
  }
  const botao = document.getElementById("btnSair");
  if (botao) botao.remove();
  document.querySelector(".sidebar-foot").textContent = "ARYA Management";
  inSenha.value = "";
  inConfirma.value = "";
  definirModo(false);
  mostrarTela("dashboard");
  limparDadosClientes();
  limparDadosProdutos();
  mostrarStatus("Sessão encerrada.", "info");
  authEl.classList.remove("hidden");
}

async function verificarSessao() {
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.auth.getSession();
    if (resposta.data && resposta.data.session) {
      await abrirApp();
    }
  } catch (e) {
    console.error(e);
  }
}

verificarSessao();
// FIM DA PARTE 1

// ===== PARTE 2 =====
// ===== Clientes (banco real): listar, cadastrar, editar e excluir =====
const formCliente = document.getElementById("formCliente");
const listaClientesEl = document.getElementById("listaClientes");
const clBuscaEl = document.getElementById("clBusca");
const btnNovoCliente = document.getElementById("btnNovoCliente");
const btnSalvarCliente = document.getElementById("btnSalvarCliente");
const tituloFormCliente = document.getElementById("tituloFormCliente");
const clErroEl = document.getElementById("clErro");
const inClNome = document.getElementById("clNome");
const inClTelefone = document.getElementById("clTelefone");
const inClEmail = document.getElementById("clEmail");
const inClNotas = document.getElementById("clNotas");

let clientesCache = [];
let empresaCache = { usuario: null, empresa: null };
let clienteEditandoId = null;
let confirmandoId = null;

function criarBotao(texto, classe, aoClicar) {
  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = classe;
  botao.textContent = texto;
  botao.addEventListener("click", aoClicar);
  return botao;
}

function mostrarMensagemLista(texto) {
  listaClientesEl.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  listaClientesEl.appendChild(aviso);
}

function abrirFormulario(c) {
  clErroEl.textContent = "";
  clienteEditandoId = c ? c.id : null;
  inClNome.value = c ? c.name : "";
  inClTelefone.value = c && c.phone ? c.phone : "";
  inClEmail.value = c && c.email ? c.email : "";
  inClNotas.value = c && c.notes ? c.notes : "";
  tituloFormCliente.textContent = c ? "Editar cliente" : "Novo cliente";
  btnSalvarCliente.textContent = c ? "Salvar alterações" : "Salvar";
  formCliente.hidden = false;
  formCliente.scrollIntoView({ behavior: "smooth", block: "start" });
  inClNome.focus();
}

function fecharFormulario() {
  clienteEditandoId = null;
  formCliente.reset();
  clErroEl.textContent = "";
  tituloFormCliente.textContent = "Novo cliente";
  btnSalvarCliente.textContent = "Salvar";
  formCliente.hidden = true;
}

function desenharClientes() {
  const termo = clBuscaEl.value.trim().toLowerCase();
  const filtrados = clientesCache.filter(function (c) {
    return c.name.toLowerCase().includes(termo);
  });

  if (filtrados.length === 0) {
    mostrarMensagemLista(
      clientesCache.length === 0
        ? "Nenhum cliente cadastrado ainda."
        : "Nenhum cliente encontrado para essa pesquisa."
    );
    return;
  }

  listaClientesEl.innerHTML = "";

  filtrados.forEach(function (c) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = c.name;

    const contato = document.createElement("p");
    contato.className = "item-sub";
    const partes = [c.phone, c.email].filter(Boolean);
    contato.textContent = partes.length ? partes.join(" · ") : "Sem contato";

    info.appendChild(nome);
    info.appendChild(contato);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (confirmandoId === c.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = "Excluir?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        excluirCliente(c.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        confirmandoId = null;
        desenharClientes();
      }));
    } else {
      acoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function () {
        confirmandoId = null;
        abrirFormulario(c);
      }));
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        confirmandoId = c.id;
        desenharClientes();
      }));
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    listaClientesEl.appendChild(linha);
  });
}

async function carregarClientes() {
  mostrarMensagemLista("Carregando clientes...");

  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      mostrarMensagemLista("Entre na sua conta para ver os clientes.");
      return;
    }

    const resposta = await cliente
      .from("customers")
      .select("id, name, phone, email, notes, created_at")
      .order("created_at", { ascending: false });
    if (resposta.error) throw resposta.error;

    clientesCache = resposta.data || [];
    confirmandoId = null;
    desenharClientes();
  } catch (e) {
    console.error(e);
    mostrarMensagemLista("Não foi possível carregar os clientes: " + (e.message || e));
  }
}

async function obterEmpresaId() {
  const cliente = await iniciarSupabase();
  const usuario = await cliente.auth.getUser();
  if (usuario.error || !usuario.data.user) {
    throw new Error("Sessão inválida. Entre novamente.");
  }

  const idUsuario = usuario.data.user.id;
  if (empresaCache.usuario === idUsuario && empresaCache.empresa) {
    return empresaCache.empresa;
  }

  const resposta = await cliente.rpc("current_company_id");
  if (resposta.error) throw resposta.error;
  if (!resposta.data) throw new Error("Este usuário não tem empresa.");

  empresaCache = { usuario: idUsuario, empresa: resposta.data };
  return resposta.data;
}

async function excluirCliente(id) {
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.from("customers").delete().eq("id", id).select("id");
    if (resposta.error) throw resposta.error;
    if (!resposta.data || resposta.data.length === 0) {
      throw new Error("Sem permissão para excluir (só dono ou admin) ou cliente não encontrado.");
    }

    confirmandoId = null;
    avisar("Cliente excluído.");
    await carregarClientes();
  } catch (e) {
    console.error(e);
    confirmandoId = null;
    avisar("Não foi possível excluir: " + (e.message || e));
    desenharClientes();
  }
}

function limparDadosClientes() {
  clientesCache = [];
  confirmandoId = null;
  fecharFormulario();
  clBuscaEl.value = "";
  mostrarMensagemLista("Os clientes aparecerão aqui.");
}

formCliente.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  clErroEl.textContent = "";

  const nome = inClNome.value.trim();
  const telefone = inClTelefone.value.trim();
  const email = inClEmail.value.trim();
  const notas = inClNotas.value.trim();

  if (nome.length < 2) {
    clErroEl.textContent = "Informe o nome do cliente (mínimo 2 letras).";
    return;
  }
  if (email && !emailValido(email)) {
    clErroEl.textContent = "E-mail do cliente inválido.";
    return;
  }

  btnSalvarCliente.disabled = true;
  btnSalvarCliente.textContent = "Salvando...";

  try {
    const cliente = await iniciarSupabase();
    const dados = {
      name: nome,
      phone: telefone || null,
      email: email || null,
      notes: notas || null
    };

    const editando = Boolean(clienteEditandoId);
    let resposta;

    if (editando) {
      resposta = await cliente
        .from("customers")
        .update(dados)
        .eq("id", clienteEditandoId)
        .select()
        .single();
    } else {
      dados.company_id = await obterEmpresaId();
      resposta = await cliente
        .from("customers")
        .insert(dados)
        .select()
        .single();
    }
    if (resposta.error) throw resposta.error;

    fecharFormulario();
    avisar((editando ? "Cliente atualizado: " : "Cliente salvo: ") + resposta.data.name);
    await carregarClientes();
  } catch (e) {
    console.error(e);
    clErroEl.textContent = "Não foi possível salvar: " + (e.message || e);
  } finally {
    btnSalvarCliente.disabled = false;
    btnSalvarCliente.textContent = clienteEditandoId ? "Salvar alterações" : "Salvar";
  }
});

btnNovoCliente.addEventListener("click", function () {
  abrirFormulario(null);
});

document.getElementById("btnCancelarCliente").addEventListener("click", fecharFormulario);

clBuscaEl.addEventListener("input", desenharClientes);

document.querySelectorAll('[data-view="clientes"]').forEach(function (botao) {
  botao.addEventListener("click", carregarClientes);
});

// ===== Produtos: estrutura da tela =====
document.getElementById("view-produtos").innerHTML = `
  <article class="card wide">
    <div class="card-head">
      <h2>Produtos</h2>
      <div class="item-actions">
        <button class="btn btn-ghost" id="btnCategorias" type="button">Categorias</button>
        <button class="btn" id="btnNovoProduto" type="button">+ Novo produto</button>
      </div>
    </div>

    <div class="form-panel" id="painelCategorias" hidden>
      <h3>Categorias</h3>
      <div class="field-row">
        <div class="field">
          <label for="catNome">Nova categoria</label>
          <input id="catNome" type="text" placeholder="Ex.: Camisetas" />
        </div>
      </div>
      <p class="form-error" id="catErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnAdicionarCategoria" type="button">Adicionar</button>
        <button class="btn btn-ghost" id="btnFecharCategorias" type="button">Fechar</button>
      </div>
      <div id="listaCategorias" class="list">
        <div class="empty">Nenhuma categoria ainda.</div>
      </div>
    </div>

    <form class="form-panel" id="formProduto" hidden novalidate>
      <h3 id="tituloFormProduto">Novo produto</h3>
      <div class="field">
        <label for="prNome">Nome</label>
        <input id="prNome" type="text" placeholder="Ex.: Camiseta preta" />
      </div>
      <div class="field">
        <label for="prDescricao">Descrição</label>
        <input id="prDescricao" type="text" placeholder="Opcional" />
      </div>
      <div class="field">
        <label for="prCategoria">Categoria</label>
        <select id="prCategoria">
          <option value="">Sem categoria</option>
        </select>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="prCusto">Preço de custo (R$)</label>
          <input id="prCusto" type="text" inputmode="decimal" placeholder="0,00" />
        </div>
        <div class="field">
          <label for="prVenda">Preço de venda (R$)</label>
          <input id="prVenda" type="text" inputmode="decimal" placeholder="0,00" />
        </div>
      </div>
      <div class="field">
        <label for="prMinimo">Estoque mínimo (alerta)</label>
        <input id="prMinimo" type="text" inputmode="numeric" placeholder="0" />
      </div>
      <div class="field">
        <label>Foto do produto</label>
        <div class="item-actions" style="align-items:center; flex-wrap:wrap;">
          <img id="prFotoPreview" alt="Foto do produto" hidden
               style="width:72px; height:72px; object-fit:cover; border-radius:12px;" />
          <button class="btn btn-ghost btn-small" id="btnEscolherFoto" type="button">Escolher foto</button>
          <button class="btn btn-ghost btn-small" id="btnRemoverFoto" type="button" hidden>Remover foto</button>
        </div>
        <input id="prFoto" type="file" accept="image/*" hidden />
      </div>
      <p class="form-error" id="prErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnSalvarProduto" type="submit">Salvar</button>
        <button class="btn btn-ghost" id="btnCancelarProduto" type="button">Cancelar</button>
      </div>
    </form>

    <div class="form-panel" id="painelEstoque" hidden>
      <h3 id="estTitulo">Movimentar estoque</h3>
      <p class="item-sub" id="estSaldo"></p>

      <div class="form-actions" id="estTipos">
        <button class="btn btn-small" type="button" data-tipo="in">Entrada</button>
        <button class="btn btn-ghost btn-small" type="button" data-tipo="out">Saída</button>
        <button class="btn btn-ghost btn-small" type="button" data-tipo="adjustment">Ajuste</button>
      </div>
      <p class="item-sub" id="estDica"></p>

      <div class="field-row">
        <div class="field">
          <label for="estQtd" id="estQtdLabel">Quantidade</label>
          <input id="estQtd" type="text" inputmode="numeric" placeholder="0" />
        </div>
        <div class="field">
          <label for="estMotivo">Motivo (opcional)</label>
          <input id="estMotivo" type="text" placeholder="Ex.: Chegou mercadoria" />
        </div>
      </div>
      <p class="form-error" id="estErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnConfirmarEstoque" type="button">Confirmar</button>
        <button class="btn btn-ghost" id="btnFecharEstoque" type="button">Fechar</button>
      </div>

      <h3>Últimas movimentações</h3>
      <div id="estHistorico" class="list">
        <div class="empty">Nenhuma movimentação ainda.</div>
      </div>
    </div>

    <div class="search-row">
      <input id="prBusca" type="search" placeholder="Pesquisar por nome..." />
    </div>

    <div id="listaProdutos" class="list">
      <div class="empty">Os produtos aparecerão aqui.</div>
    </div>
  </article>
`;
// FIM DA PARTE 2

// ===== PARTE 3 =====
// ===== Produtos (banco real): listar, cadastrar, editar e excluir =====
const formProduto = document.getElementById("formProduto");
const listaProdutosEl = document.getElementById("listaProdutos");
const prBuscaEl = document.getElementById("prBusca");
const btnNovoProduto = document.getElementById("btnNovoProduto");
const btnSalvarProduto = document.getElementById("btnSalvarProduto");
const tituloFormProduto = document.getElementById("tituloFormProduto");
const prErroEl = document.getElementById("prErro");
const inPrNome = document.getElementById("prNome");
const inPrDescricao = document.getElementById("prDescricao");
const inPrCusto = document.getElementById("prCusto");
const inPrVenda = document.getElementById("prVenda");
const inPrMinimo = document.getElementById("prMinimo");

let produtosCache = [];
let produtoEditandoId = null;
let confirmandoProdutoId = null;

// Aceita "59,90", "59.90" e "1.234,50". Retorna NaN se for inválido.
function lerNumero(texto) {
  let t = String(texto).trim().replace(/\s/g, "").replace(/^R\$/i, "");
  if (t === "") return 0;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
  return Math.round(Number(t) * 100) / 100;
}

function moeda(valor) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function numeroParaCampo(valor) {
  return Number(valor).toFixed(2).replace(".", ",");
}

function mostrarMensagemProdutos(texto) {
  listaProdutosEl.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  listaProdutosEl.appendChild(aviso);
}

function abrirFormProduto(p) {
  prErroEl.textContent = "";
  produtoEditandoId = p ? p.id : null;
  inPrNome.value = p ? p.name : "";
  inPrDescricao.value = p && p.description ? p.description : "";
  preencherSelectCategorias(p && p.category_id ? p.category_id : "");
  inPrCusto.value = p ? numeroParaCampo(p.cost_price) : "";
  inPrVenda.value = p ? numeroParaCampo(p.sale_price) : "";
  inPrMinimo.value = p ? String(p.min_stock) : "";
  prepararFotoForm(p && p.image_url ? p.image_url : null);
  tituloFormProduto.textContent = p ? "Editar produto" : "Novo produto";
  btnSalvarProduto.textContent = p ? "Salvar alterações" : "Salvar";
  formProduto.hidden = false;
  formProduto.scrollIntoView({ behavior: "smooth", block: "start" });
  inPrNome.focus();
}

function fecharFormProduto() {
  produtoEditandoId = null;
  formProduto.reset();
  prepararFotoForm(null);
  prErroEl.textContent = "";
  tituloFormProduto.textContent = "Novo produto";
  btnSalvarProduto.textContent = "Salvar";
  formProduto.hidden = true;
}

function desenharProdutos() {
  const termo = prBuscaEl.value.trim().toLowerCase();
  const filtrados = produtosCache.filter(function (p) {
    return p.name.toLowerCase().includes(termo);
  });

  if (filtrados.length === 0) {
    mostrarMensagemProdutos(
      produtosCache.length === 0
        ? "Nenhum produto cadastrado ainda."
        : "Nenhum produto encontrado para essa pesquisa."
    );
    return;
  }

  listaProdutosEl.innerHTML = "";

  filtrados.forEach(function (p) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = p.name;

    const detalhes = document.createElement("p");
    detalhes.className = "item-sub";
    let texto =
      nomeCategoria(p.category_id) +
      " · Venda " + moeda(p.sale_price) +
      " · Custo " + moeda(p.cost_price) +
      " · Estoque " + p.stock_quantity;
    if (p.min_stock > 0 && p.stock_quantity <= p.min_stock) {
      texto += " · ⚠ Estoque baixo";
    }
    detalhes.textContent = texto;

    info.appendChild(nome);
    info.appendChild(detalhes);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (confirmandoProdutoId === p.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = "Excluir?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        excluirProduto(p.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        desenharProdutos();
      }));
    } else {
      acoes.appendChild(criarBotao("Estoque", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        abrirEstoque(p);
      }));
      acoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        fecharEstoque();
        fecharCategorias();
        abrirFormProduto(p);
      }));
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = p.id;
        desenharProdutos();
      }));
    }

    const bloco = document.createElement("div");
    bloco.style.display = "flex";
    bloco.style.alignItems = "center";
    bloco.style.gap = "12px";
    bloco.appendChild(criarMiniatura(p));
    bloco.appendChild(info);

    linha.appendChild(bloco);
    linha.appendChild(acoes);
    listaProdutosEl.appendChild(linha);
  });
}

async function carregarProdutos() {
  mostrarMensagemProdutos("Carregando produtos...");

  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      mostrarMensagemProdutos("Entre na sua conta para ver os produtos.");
      return;
    }

    const resposta = await cliente
      .from("products")
      .select("id, name, description, category_id, image_url, cost_price, sale_price, stock_quantity, min_stock, created_at")
      .order("created_at", { ascending: false });
    if (resposta.error) throw resposta.error;

    produtosCache = resposta.data || [];
    confirmandoProdutoId = null;
    desenharProdutos();
  } catch (e) {
    console.error(e);
    mostrarMensagemProdutos("Não foi possível carregar os produtos: " + (e.message || e));
  }
}

async function excluirProduto(id) {
  const produto = produtosCache.find(function (x) { return x.id === id; });
  const fotoAntiga = produto ? produto.image_url : null;
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.from("products").delete().eq("id", id).select("id");
    if (resposta.error) throw resposta.error;
    if (!resposta.data || resposta.data.length === 0) {
      throw new Error("Sem permissão para excluir (só dono ou admin) ou produto não encontrado.");
    }

    confirmandoProdutoId = null;
    if (fotoAntiga) await apagarFotoPorUrl(fotoAntiga);
    avisar("Produto excluído.");
    await carregarProdutos();
  } catch (e) {
    console.error(e);
    confirmandoProdutoId = null;
    if (e && e.code === "23503") {
      avisar("Este produto tem histórico de estoque e não pode ser excluído.");
      desenharProdutos();
      return;
    }
    avisar("Não foi possível excluir: " + (e.message || e));
    desenharProdutos();
  }
}

formProduto.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  prErroEl.textContent = "";

  const nome = inPrNome.value.trim();
  const descricao = inPrDescricao.value.trim();
  const custo = lerNumero(inPrCusto.value);
  const venda = lerNumero(inPrVenda.value);
  const textoMinimo = inPrMinimo.value.trim();

  if (nome.length < 2) {
    prErroEl.textContent = "Informe o nome do produto (mínimo 2 letras).";
    return;
  }
  if (!inPrVenda.value.trim()) {
    prErroEl.textContent = "Informe o preço de venda.";
    return;
  }
  if (Number.isNaN(venda) || Number.isNaN(custo)) {
    prErroEl.textContent = "Preço inválido. Use números, como 59,90.";
    return;
  }
  if (textoMinimo && !/^\d+$/.test(textoMinimo)) {
    prErroEl.textContent = "Estoque mínimo deve ser um número inteiro.";
    return;
  }
  const minimo = textoMinimo ? Number(textoMinimo) : 0;

  btnSalvarProduto.disabled = true;
  btnSalvarProduto.textContent = "Salvando...";

  const produtoAtual = produtosCache.find(function (x) { return x.id === produtoEditandoId; });
  const fotoAntiga = produtoAtual ? produtoAtual.image_url : null;
  let caminhoEnviado = null;

  try {
    const cliente = await iniciarSupabase();
    const dados = {
      name: nome,
      description: descricao || null,
      category_id: document.getElementById("prCategoria").value || null,
      cost_price: custo,
      sale_price: venda,
      min_stock: minimo
    };

    if (fotoNova) {
      btnSalvarProduto.textContent = "Enviando foto...";
      const envio = await enviarFoto(fotoNova, await obterEmpresaId());
      caminhoEnviado = envio.caminho;
      dados.image_url = envio.url;
      btnSalvarProduto.textContent = "Salvando...";
    } else if (fotoRemover) {
      dados.image_url = null;
    }

    const editando = Boolean(produtoEditandoId);
    let resposta;

    if (editando) {
      resposta = await cliente
        .from("products")
        .update(dados)
        .eq("id", produtoEditandoId)
        .select()
        .single();
    } else {
      dados.company_id = await obterEmpresaId();
      resposta = await cliente
        .from("products")
        .insert(dados)
        .select()
        .single();
    }
    if (resposta.error) throw resposta.error;

    if (fotoAntiga && (fotoNova || fotoRemover)) {
      await apagarFotoPorUrl(fotoAntiga);
    }

    fecharFormProduto();
    avisar((editando ? "Produto atualizado: " : "Produto salvo: ") + resposta.data.name);
    await carregarProdutos();
  } catch (e) {
    console.error(e);
    if (caminhoEnviado) await apagarFotoPorCaminho(caminhoEnviado);
    prErroEl.textContent = "Não foi possível salvar: " + (e.message || e);
  } finally {
    btnSalvarProduto.disabled = false;
    btnSalvarProduto.textContent = produtoEditandoId ? "Salvar alterações" : "Salvar";
  }
});

btnNovoProduto.addEventListener("click", function () {
  abrirFormProduto(null);
});
document.getElementById("btnCancelarProduto").addEventListener("click", fecharFormProduto);
prBuscaEl.addEventListener("input", desenharProdutos);

document.querySelectorAll('[data-view="produtos"]').forEach(function (botao) {
  botao.addEventListener("click", async function () {
    await carregarCategorias();
    await carregarProdutos();
  });
});

// ===== Estoque (banco real): entrada, saída, ajuste e histórico =====
// O saldo só muda pela função segura do banco "adjust_stock".
const painelEstoque = document.getElementById("painelEstoque");
const estTituloEl = document.getElementById("estTitulo");
const estSaldoEl = document.getElementById("estSaldo");
const estDicaEl = document.getElementById("estDica");
const estQtdLabelEl = document.getElementById("estQtdLabel");
const inEstQtd = document.getElementById("estQtd");
const inEstMotivo = document.getElementById("estMotivo");
const estErroEl = document.getElementById("estErro");
const btnConfirmarEstoque = document.getElementById("btnConfirmarEstoque");
const estHistoricoEl = document.getElementById("estHistorico");

const nomesTipo = { in: "Entrada", out: "Saída", adjustment: "Ajuste" };
const dicasTipo = {
  in: "Entrada: soma ao estoque (ex.: chegou mercadoria).",
  out: "Saída: tira do estoque (ex.: perda, defeito, uso interno).",
  adjustment: "Ajuste: informe quantas unidades você contou. O sistema calcula a diferença."
};

let estoqueProdutoId = null;
let estoqueTipo = "in";

function definirTipoEstoque(tipo) {
  estoqueTipo = tipo;
  document.querySelectorAll("#estTipos [data-tipo]").forEach(function (b) {
    b.className = b.dataset.tipo === tipo ? "btn btn-small" : "btn btn-ghost btn-small";
  });
  estDicaEl.textContent = dicasTipo[tipo];
  estQtdLabelEl.textContent = tipo === "adjustment" ? "Quantidade contada" : "Quantidade";
  estErroEl.textContent = "";
}

function atualizarCabecalhoEstoque() {
  const p = produtosCache.find(function (x) { return x.id === estoqueProdutoId; });
  if (!p) return;
  estTituloEl.textContent = "Estoque: " + p.name;
  estSaldoEl.textContent = "Saldo atual: " + p.stock_quantity + " unidade(s)";
}

function abrirEstoque(p) {
  fecharFormProduto();
  fecharCategorias();
  estoqueProdutoId = p.id;
  inEstQtd.value = "";
  inEstMotivo.value = "";
  definirTipoEstoque("in");
  atualizarCabecalhoEstoque();
  painelEstoque.hidden = false;
  painelEstoque.scrollIntoView({ behavior: "smooth", block: "start" });
  carregarHistoricoEstoque();
}

function fecharEstoque() {
  estoqueProdutoId = null;
  inEstQtd.value = "";
  inEstMotivo.value = "";
  estErroEl.textContent = "";
  painelEstoque.hidden = true;
}

function mostrarMensagemHistorico(texto) {
  estHistoricoEl.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  estHistoricoEl.appendChild(aviso);
}

async function carregarHistoricoEstoque() {
  if (!estoqueProdutoId) return;
  mostrarMensagemHistorico("Carregando histórico...");

  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente
      .from("stock_movements")
      .select("id, type, quantity, reason, created_at")
      .eq("product_id", estoqueProdutoId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (resposta.error) throw resposta.error;

    const lista = resposta.data || [];
    if (lista.length === 0) {
      mostrarMensagemHistorico("Nenhuma movimentação ainda.");
      return;
    }

    estHistoricoEl.innerHTML = "";
    lista.forEach(function (m) {
      const linha = document.createElement("div");
      linha.className = "list-item";

      const info = document.createElement("div");
      const titulo = document.createElement("p");
      titulo.className = "item-title";
      const sinal = m.quantity > 0 ? "+" : "";
      titulo.textContent = (nomesTipo[m.type] || m.type) + " · " + sinal + m.quantity;

      const sub = document.createElement("p");
      sub.className = "item-sub";
      const data = new Date(m.created_at).toLocaleString("pt-BR");
      sub.textContent = m.reason ? data + " · " + m.reason : data;

      info.appendChild(titulo);
      info.appendChild(sub);
      linha.appendChild(info);
      estHistoricoEl.appendChild(linha);
    });
  } catch (e) {
    console.error(e);
    mostrarMensagemHistorico("Não foi possível carregar o histórico: " + (e.message || e));
  }
}

async function confirmarEstoque() {
  estErroEl.textContent = "";
  const texto = inEstQtd.value.trim();

  if (!/^\d+$/.test(texto)) {
    estErroEl.textContent = "Digite a quantidade só com números inteiros (ex.: 5).";
    return;
  }
  const quantidade = Number(texto);
  if (estoqueTipo !== "adjustment" && quantidade === 0) {
    estErroEl.textContent = "A quantidade precisa ser maior que zero.";
    return;
  }

  btnConfirmarEstoque.disabled = true;
  btnConfirmarEstoque.textContent = "Salvando...";

  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.rpc("adjust_stock", {
      p_product_id: estoqueProdutoId,
      p_type: estoqueTipo,
      p_quantity: quantidade,
      p_reason: inEstMotivo.value.trim() || null
    });
    if (resposta.error) throw resposta.error;

    avisar(nomesTipo[estoqueTipo] + " registrada. Novo saldo: " + resposta.data);
    inEstQtd.value = "";
    inEstMotivo.value = "";
    await carregarProdutos();
    atualizarCabecalhoEstoque();
    await carregarHistoricoEstoque();
  } catch (e) {
    console.error(e);
    estErroEl.textContent = e && e.message ? e.message : String(e);
  } finally {
    btnConfirmarEstoque.disabled = false;
    btnConfirmarEstoque.textContent = "Confirmar";
  }
}

function limparDadosProdutos() {
  produtosCache = [];
  confirmandoProdutoId = null;
  categoriasCache = [];
  confirmandoCategoriaId = null;
  fecharCategorias();
  fecharEstoque();
  fecharFormProduto();
  prBuscaEl.value = "";
  mostrarMensagemProdutos("Os produtos aparecerão aqui.");
}

document.querySelectorAll("#estTipos [data-tipo]").forEach(function (botao) {
  botao.addEventListener("click", function () {
    definirTipoEstoque(botao.dataset.tipo);
  });
});
btnConfirmarEstoque.addEventListener("click", confirmarEstoque);
document.getElementById("btnFecharEstoque").addEventListener("click", fecharEstoque);
btnNovoProduto.addEventListener("click", fecharEstoque);
// FIM DA PARTE 3

// ===== PARTE 4 =====
// ===== Categorias (banco real): listar, criar, excluir e usar no produto =====
const painelCategorias = document.getElementById("painelCategorias");
const inCatNome = document.getElementById("catNome");
const catErroEl = document.getElementById("catErro");
const listaCategoriasEl = document.getElementById("listaCategorias");
const btnAdicionarCategoria = document.getElementById("btnAdicionarCategoria");
const selPrCategoria = document.getElementById("prCategoria");

let categoriasCache = [];
let confirmandoCategoriaId = null;

function nomeCategoria(id) {
  if (!id) return "Sem categoria";
  const c = categoriasCache.find(function (x) { return x.id === id; });
  return c ? c.name : "Sem categoria";
}

function preencherSelectCategorias(selecionada) {
  selPrCategoria.innerHTML = "";
  const vazio = document.createElement("option");
  vazio.value = "";
  vazio.textContent = "Sem categoria";
  selPrCategoria.appendChild(vazio);

  categoriasCache.forEach(function (c) {
    const opcao = document.createElement("option");
    opcao.value = c.id;
    opcao.textContent = c.name;
    selPrCategoria.appendChild(opcao);
  });
  selPrCategoria.value = selecionada || "";
}

function mostrarMensagemCategorias(texto) {
  listaCategoriasEl.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  listaCategoriasEl.appendChild(aviso);
}

function desenharCategorias() {
  if (categoriasCache.length === 0) {
    mostrarMensagemCategorias("Nenhuma categoria ainda.");
    return;
  }

  listaCategoriasEl.innerHTML = "";
  categoriasCache.forEach(function (c) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = c.name;
    const qtd = produtosCache.filter(function (p) { return p.category_id === c.id; }).length;
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = qtd + " produto(s)";
    info.appendChild(nome);
    info.appendChild(sub);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";
    if (confirmandoCategoriaId === c.id) {
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        excluirCategoria(c.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        confirmandoCategoriaId = null;
        desenharCategorias();
      }));
    } else {
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        confirmandoCategoriaId = c.id;
        desenharCategorias();
      }));
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    listaCategoriasEl.appendChild(linha);
  });
}

async function carregarCategorias() {
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) return;

    const resposta = await cliente
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });
    if (resposta.error) throw resposta.error;

    categoriasCache = resposta.data || [];
    confirmandoCategoriaId = null;
    preencherSelectCategorias(selPrCategoria.value);
    desenharCategorias();
  } catch (e) {
    console.error(e);
    mostrarMensagemCategorias("Não foi possível carregar as categorias: " + (e.message || e));
  }
}

async function adicionarCategoria() {
  catErroEl.textContent = "";
  const nome = inCatNome.value.trim();
  if (nome.length < 1) {
    catErroEl.textContent = "Digite o nome da categoria.";
    return;
  }
  const repetida = categoriasCache.some(function (c) {
    return c.name.toLowerCase() === nome.toLowerCase();
  });
  if (repetida) {
    catErroEl.textContent = "Já existe uma categoria com esse nome.";
    return;
  }

  btnAdicionarCategoria.disabled = true;
  btnAdicionarCategoria.textContent = "Salvando...";

  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente
      .from("categories")
      .insert({ name: nome, company_id: await obterEmpresaId() })
      .select("id, name")
      .single();
    if (resposta.error) throw resposta.error;

    inCatNome.value = "";
    avisar("Categoria criada: " + resposta.data.name);
    await carregarCategorias();
  } catch (e) {
    console.error(e);
    catErroEl.textContent = e && e.code === "23505"
      ? "Já existe uma categoria com esse nome."
      : "Não foi possível salvar: " + (e.message || e);
  } finally {
    btnAdicionarCategoria.disabled = false;
    btnAdicionarCategoria.textContent = "Adicionar";
  }
}

async function excluirCategoria(id) {
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.from("categories").delete().eq("id", id).select("id");
    if (resposta.error) throw resposta.error;
    if (!resposta.data || resposta.data.length === 0) {
      throw new Error("Sem permissão para excluir (só dono ou admin) ou categoria não encontrada.");
    }

    avisar("Categoria excluída.");
    await carregarCategorias();
    await carregarProdutos();
  } catch (e) {
    console.error(e);
    confirmandoCategoriaId = null;
    avisar(e && e.code === "23503"
      ? "Essa categoria está sendo usada por produtos. Troque a categoria deles antes."
      : "Não foi possível excluir: " + (e.message || e));
    desenharCategorias();
  }
}

function abrirCategorias() {
  fecharFormProduto();
  fecharEstoque();
  catErroEl.textContent = "";
  painelCategorias.hidden = false;
  desenharCategorias();
  painelCategorias.scrollIntoView({ behavior: "smooth", block: "start" });
  inCatNome.focus();
}

function fecharCategorias() {
  inCatNome.value = "";
  catErroEl.textContent = "";
  confirmandoCategoriaId = null;
  painelCategorias.hidden = true;
}

document.getElementById("btnCategorias").addEventListener("click", abrirCategorias);
document.getElementById("btnFecharCategorias").addEventListener("click", fecharCategorias);
btnAdicionarCategoria.addEventListener("click", adicionarCategoria);
inCatNome.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    evento.preventDefault();
    adicionarCategoria();
  }
});
btnNovoProduto.addEventListener("click", fecharCategorias);

// ===== Foto do produto (Supabase Storage, bucket "product-images") =====
// Cada empresa só pode salvar fotos dentro da própria pasta: <id da empresa>/arquivo.jpg
const BUCKET_FOTOS = "product-images";
const inPrFoto = document.getElementById("prFoto");
const prFotoPreview = document.getElementById("prFotoPreview");
const btnEscolherFoto = document.getElementById("btnEscolherFoto");
const btnRemoverFoto = document.getElementById("btnRemoverFoto");

let fotoNova = null;      // foto escolhida agora (ainda não enviada)
let fotoRemover = false;  // marcou "Remover foto"
let fotoPreviewUrl = null;

function prepararFotoForm(urlAtual) {
  fotoNova = null;
  fotoRemover = false;
  if (fotoPreviewUrl) {
    URL.revokeObjectURL(fotoPreviewUrl);
    fotoPreviewUrl = null;
  }
  inPrFoto.value = "";
  mostrarPreviewFoto(urlAtual);
}

function mostrarPreviewFoto(url) {
  if (url) {
    prFotoPreview.src = url;
    prFotoPreview.hidden = false;
    btnRemoverFoto.hidden = false;
    btnEscolherFoto.textContent = "Trocar foto";
  } else {
    prFotoPreview.removeAttribute("src");
    prFotoPreview.hidden = true;
    btnRemoverFoto.hidden = true;
    btnEscolherFoto.textContent = "Escolher foto";
  }
}

// Diminui a foto (máx. 1200px) e salva como JPG para carregar rápido no app
function reduzirImagem(arquivo) {
  return new Promise(function (resolve) {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = function () {
      const maximo = 1200;
      const escala = Math.min(1, maximo / Math.max(img.naturalWidth, img.naturalHeight));
      const largura = Math.round(img.naturalWidth * escala);
      const altura = Math.round(img.naturalHeight * escala);
      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, largura, altura);
      ctx.drawImage(img, 0, 0, largura, altura);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (blob) {
        resolve(blob || arquivo);
      }, "image/jpeg", 0.85);
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      resolve(arquivo);
    };
    img.src = url;
  });
}

async function enviarFoto(blob, empresaId) {
  const cliente = await iniciarSupabase();
  const tipo = blob.type || "image/jpeg";
  const extensao = tipo === "image/png" ? "png" : tipo === "image/webp" ? "webp" : "jpg";
  const caminho = empresaId + "/" + Date.now() + "-" +
    Math.random().toString(36).slice(2, 8) + "." + extensao;

  const resposta = await cliente.storage
    .from(BUCKET_FOTOS)
    .upload(caminho, blob, { contentType: tipo, upsert: false });
  if (resposta.error) throw resposta.error;

  const publica = cliente.storage.from(BUCKET_FOTOS).getPublicUrl(caminho);
  return { caminho: caminho, url: publica.data.publicUrl };
}

async function apagarFotoPorCaminho(caminho) {
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.storage.from(BUCKET_FOTOS).remove([caminho]);
    if (resposta.error) console.warn("Não apagou a foto antiga:", resposta.error);
  } catch (e) {
    console.warn("Não apagou a foto antiga:", e);
  }
}

async function apagarFotoPorUrl(url) {
  const marcador = "/" + BUCKET_FOTOS + "/";
  const posicao = url.indexOf(marcador);
  if (posicao === -1) return;
  const caminho = decodeURIComponent(url.slice(posicao + marcador.length).split("?")[0]);
  await apagarFotoPorCaminho(caminho);
}

function criarMiniatura(p) {
  const caixa = document.createElement("div");
  caixa.style.width = "48px";
  caixa.style.height = "48px";
  caixa.style.flex = "0 0 48px";
  caixa.style.borderRadius = "10px";
  caixa.style.overflow = "hidden";
  caixa.style.display = "flex";
  caixa.style.alignItems = "center";
  caixa.style.justifyContent = "center";
  caixa.style.background = "#f4f4f5";
  caixa.style.border = "1px solid #e4e4e7";
  caixa.style.fontWeight = "600";

  if (p.image_url) {
    const img = document.createElement("img");
    img.src = p.image_url;
    img.alt = p.name;
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "cover";
    caixa.appendChild(img);
  } else {
    caixa.textContent = p.name.trim().charAt(0).toUpperCase();
  }
  return caixa;
}

btnEscolherFoto.addEventListener("click", function () {
  inPrFoto.click();
});

inPrFoto.addEventListener("change", async function () {
  prErroEl.textContent = "";
  const arquivo = inPrFoto.files && inPrFoto.files[0];
  if (!arquivo) return;

  if (!/^image\//.test(arquivo.type)) {
    prErroEl.textContent = "Escolha um arquivo de imagem (JPG, PNG ou WEBP).";
    inPrFoto.value = "";
    return;
  }

  btnEscolherFoto.disabled = true;
  btnEscolherFoto.textContent = "Preparando...";
  const reduzida = await reduzirImagem(arquivo);
  btnEscolherFoto.disabled = false;

  if (reduzida.size > 5 * 1024 * 1024) {
    prErroEl.textContent = "Foto muito grande. Use uma imagem de até 5 MB.";
    inPrFoto.value = "";
    mostrarPreviewFoto(prFotoPreview.hidden ? null : prFotoPreview.src);
    return;
  }

  fotoNova = reduzida;
  fotoRemover = false;
  if (fotoPreviewUrl) URL.revokeObjectURL(fotoPreviewUrl);
  fotoPreviewUrl = URL.createObjectURL(reduzida);
  mostrarPreviewFoto(fotoPreviewUrl);
});

btnRemoverFoto.addEventListener("click", function () {
  fotoNova = null;
  fotoRemover = true;
  inPrFoto.value = "";
  mostrarPreviewFoto(null);
});
// FIM DA PARTE 4

// ===== PARTE 5: Filtro por categoria e estoque baixo =====
// Esta versão de desenharProdutos substitui a anterior (o navegador usa a última).
const filtroBarra = document.createElement("div");
filtroBarra.style.cssText = "display:flex; align-items:flex-end; gap:16px; flex-wrap:wrap; margin-bottom:8px;";
filtroBarra.innerHTML = `
  <div class="field" style="min-width:200px; margin-bottom:0;">
    <label for="prFiltroCategoria">Categoria</label>
    <select id="prFiltroCategoria"><option value="">Todas</option></select>
  </div>
  <label for="prFiltroBaixo" style="display:flex; align-items:center; gap:8px; padding:11px 0; font-size:14px; font-weight:500; cursor:pointer;">
    <input id="prFiltroBaixo" type="checkbox" style="width:18px; height:18px; accent-color:#0a0a0a;" />
    Só estoque baixo
  </label>
`;
prBuscaEl.parentElement.after(filtroBarra);

const selFiltroCategoria = document.getElementById("prFiltroCategoria");
const chkFiltroBaixo = document.getElementById("prFiltroBaixo");

function atualizarOpcoesFiltro() {
  const atual = selFiltroCategoria.value;
  selFiltroCategoria.innerHTML = "";

  const todas = document.createElement("option");
  todas.value = "";
  todas.textContent = "Todas";
  selFiltroCategoria.appendChild(todas);

  const sem = document.createElement("option");
  sem.value = "__sem__";
  sem.textContent = "Sem categoria";
  selFiltroCategoria.appendChild(sem);

  categoriasCache.forEach(function (c) {
    const opcao = document.createElement("option");
    opcao.value = c.id;
    opcao.textContent = c.name;
    selFiltroCategoria.appendChild(opcao);
  });

  const existe = Array.from(selFiltroCategoria.options).some(function (o) {
    return o.value === atual;
  });
  selFiltroCategoria.value = existe ? atual : "";
}

function estaComEstoqueBaixo(p) {
  return p.min_stock > 0 && p.stock_quantity <= p.min_stock;
}

function desenharProdutos() {
  atualizarOpcoesFiltro();

  const termo = prBuscaEl.value.trim().toLowerCase();
  const categoria = selFiltroCategoria.value;
  const soBaixo = chkFiltroBaixo.checked;

  const filtrados = produtosCache.filter(function (p) {
    if (!p.name.toLowerCase().includes(termo)) return false;
    if (categoria === "__sem__" && p.category_id) return false;
    if (categoria && categoria !== "__sem__" && p.category_id !== categoria) return false;
    if (soBaixo && !estaComEstoqueBaixo(p)) return false;
    return true;
  });

  if (filtrados.length === 0) {
    mostrarMensagemProdutos(
      produtosCache.length === 0
        ? "Nenhum produto cadastrado ainda."
        : "Nenhum produto encontrado com esses filtros."
    );
    return;
  }

  listaProdutosEl.innerHTML = "";

  filtrados.forEach(function (p) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = p.name;

    const detalhes = document.createElement("p");
    detalhes.className = "item-sub";
    let texto =
      nomeCategoria(p.category_id) +
      " · Venda " + moeda(p.sale_price) +
      " · Custo " + moeda(p.cost_price) +
      " · Estoque " + p.stock_quantity;
    if (estaComEstoqueBaixo(p)) {
      texto += " · ⚠ Estoque baixo";
    }
    detalhes.textContent = texto;

    info.appendChild(nome);
    info.appendChild(detalhes);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (confirmandoProdutoId === p.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = "Excluir?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        excluirProduto(p.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        desenharProdutos();
      }));
    } else {
      acoes.appendChild(criarBotao("Estoque", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        abrirEstoque(p);
      }));
      acoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        fecharEstoque();
        fecharCategorias();
        abrirFormProduto(p);
      }));
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = p.id;
        desenharProdutos();
      }));
    }

    const bloco = document.createElement("div");
    bloco.style.display = "flex";
    bloco.style.alignItems = "center";
    bloco.style.gap = "12px";
    bloco.appendChild(criarMiniatura(p));
    bloco.appendChild(info);

    linha.appendChild(bloco);
    linha.appendChild(acoes);
    listaProdutosEl.appendChild(linha);
  });
}

selFiltroCategoria.addEventListener("change", desenharProdutos);
chkFiltroBaixo.addEventListener("change", desenharProdutos);
// FIM DA PARTE 5

// ===== PARTE 6: Vendas (banco real) =====
// Criar venda usa a função segura "create_sale" e cancelar usa "cancel_sale".
document.getElementById("view-vendas").innerHTML = `
  <article class="card wide">
    <div class="card-head">
      <h2>Vendas</h2>
      <button class="btn" id="btnNovaVenda" type="button">+ Nova venda</button>
    </div>

    <div class="form-panel" id="painelVenda" hidden>
      <h3>Nova venda</h3>
      <div class="field">
        <label for="vdCliente">Cliente (opcional)</label>
        <select id="vdCliente"><option value="">Sem cliente</option></select>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="vdProduto">Produto</label>
          <select id="vdProduto"><option value="">Escolha um produto</option></select>
        </div>
        <div class="field">
          <label for="vdQtd">Quantidade</label>
          <input id="vdQtd" type="text" inputmode="numeric" placeholder="1" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost btn-small" id="btnAdicionarItem" type="button">+ Adicionar ao carrinho</button>
      </div>
      <div id="vdCarrinho" class="list">
        <div class="empty">Nenhum produto adicionado.</div>
      </div>
      <div class="field-row" style="margin-top:14px;">
        <div class="field">
          <label for="vdPagamento">Forma de pagamento</label>
          <select id="vdPagamento">
            <option value="pix">Pix</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao_credito">Cartão de crédito</option>
            <option value="cartao_debito">Cartão de débito</option>
            <option value="outro">Outro</option>
          </select>
        </div>
        <div class="field">
          <label for="vdDesconto">Desconto (R$)</label>
          <input id="vdDesconto" type="text" inputmode="decimal" placeholder="0,00" />
        </div>
      </div>
      <div class="field">
        <label for="vdNotas">Observações</label>
        <input id="vdNotas" type="text" placeholder="Opcional" />
      </div>
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; padding:14px 0; margin:6px 0 10px; border-top:1px solid var(--border);">
        <p class="item-sub" id="vdResumoDetalhe">Subtotal R$ 0,00 · Desconto R$ 0,00</p>
        <div style="text-align:right;">
          <p class="label">Total</p>
          <p id="vdTotal" style="font-size:28px; font-weight:600; letter-spacing:-.03em;">R$ 0,00</p>
        </div>
      </div>
      <p class="form-error" id="vdErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnFinalizarVenda" type="button">Finalizar venda</button>
        <button class="btn btn-ghost" id="btnFecharVenda" type="button">Fechar</button>
      </div>
    </div>

    <h3>Últimas vendas</h3>
    <div id="listaVendas" class="list">
      <div class="empty">As vendas aparecerão aqui.</div>
    </div>
  </article>
`;

const painelVenda = document.getElementById("painelVenda");
const selVdCliente = document.getElementById("vdCliente");
const selVdProduto = document.getElementById("vdProduto");
const inVdQtd = document.getElementById("vdQtd");
const vdCarrinhoEl = document.getElementById("vdCarrinho");
const selVdPagamento = document.getElementById("vdPagamento");
const inVdDesconto = document.getElementById("vdDesconto");
const inVdNotas = document.getElementById("vdNotas");
const vdResumoDetalheEl = document.getElementById("vdResumoDetalhe");
const vdTotalEl = document.getElementById("vdTotal");
const vdErroEl = document.getElementById("vdErro");
const btnFinalizarVenda = document.getElementById("btnFinalizarVenda");
const listaVendasEl = document.getElementById("listaVendas");

const nomesPagamento = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  outro: "Outro"
};

let vdClientes = [];
let vdProdutos = [];
let vdVendas = [];
let vdItensPorVenda = {};
let vdCarrinho = [];
let vdConfirmandoCancelId = null;

function vdMensagem(el, texto) {
  el.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  el.appendChild(aviso);
}

function vdBuscarProduto(id) {
  return vdProdutos.find(function (p) { return p.id === id; });
}

function vdBuscarCliente(id) {
  return vdClientes.find(function (c) { return c.id === id; });
}

function vdPreencherSelects() {
  const clienteAtual = selVdCliente.value;
  selVdCliente.innerHTML = "";
  const semCliente = document.createElement("option");
  semCliente.value = "";
  semCliente.textContent = "Sem cliente";
  selVdCliente.appendChild(semCliente);
  vdClientes.forEach(function (c) {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name;
    selVdCliente.appendChild(o);
  });
  selVdCliente.value = vdBuscarCliente(clienteAtual) ? clienteAtual : "";

  const produtoAtual = selVdProduto.value;
  selVdProduto.innerHTML = "";
  const escolha = document.createElement("option");
  escolha.value = "";
  escolha.textContent = "Escolha um produto";
  selVdProduto.appendChild(escolha);
  vdProdutos.forEach(function (p) {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name + " · " + moeda(p.sale_price) + " · estoque " + p.stock_quantity;
    if (p.stock_quantity <= 0) o.disabled = true;
    selVdProduto.appendChild(o);
  });
  selVdProduto.value = vdBuscarProduto(produtoAtual) ? produtoAtual : "";
}

function vdSubtotal() {
  return vdCarrinho.reduce(function (soma, item) {
    const p = vdBuscarProduto(item.product_id);
    return p ? soma + Number(p.sale_price) * item.quantity : soma;
  }, 0);
}

function vdAtualizarResumo() {
  const subtotal = vdSubtotal();
  let desconto = lerNumero(inVdDesconto.value);
  if (Number.isNaN(desconto)) desconto = 0;
  const total = Math.max(0, subtotal - desconto);
  vdResumoDetalheEl.textContent = "Subtotal " + moeda(subtotal) + " · Desconto " + moeda(desconto);
  vdTotalEl.textContent = moeda(total);
}

function vdDesenharCarrinho() {
  if (vdCarrinho.length === 0) {
    vdMensagem(vdCarrinhoEl, "Nenhum produto adicionado.");
    vdAtualizarResumo();
    return;
  }

  vdCarrinhoEl.innerHTML = "";
  vdCarrinho.forEach(function (item) {
    const p = vdBuscarProduto(item.product_id);
    if (!p) return;

    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = p.name;
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = item.quantity + " × " + moeda(p.sale_price) + " = " +
      moeda(Number(p.sale_price) * item.quantity);
    info.appendChild(nome);
    info.appendChild(sub);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";
    acoes.appendChild(criarBotao("Remover", "btn btn-ghost btn-small", function () {
      vdCarrinho = vdCarrinho.filter(function (x) { return x.product_id !== item.product_id; });
      vdDesenharCarrinho();
    }));

    linha.appendChild(info);
    linha.appendChild(acoes);
    vdCarrinhoEl.appendChild(linha);
  });
  vdAtualizarResumo();
}

function vdAdicionarItem() {
  vdErroEl.textContent = "";
  const id = selVdProduto.value;
  if (!id) {
    vdErroEl.textContent = "Escolha um produto.";
    return;
  }
  const texto = inVdQtd.value.trim() || "1";
  if (!/^\d+$/.test(texto) || Number(texto) <= 0) {
    vdErroEl.textContent = "Quantidade inválida. Use números inteiros (ex.: 2).";
    return;
  }
  const qtd = Number(texto);
  const p = vdBuscarProduto(id);
  const existente = vdCarrinho.find(function (x) { return x.product_id === id; });
  const jaNoCarrinho = existente ? existente.quantity : 0;

  if (jaNoCarrinho + qtd > p.stock_quantity) {
    vdErroEl.textContent = "Estoque insuficiente para \"" + p.name + "\". Disponível: " + p.stock_quantity;
    return;
  }

  if (existente) {
    existente.quantity += qtd;
  } else {
    vdCarrinho.push({ product_id: id, quantity: qtd });
  }
  inVdQtd.value = "";
  selVdProduto.value = "";
  vdDesenharCarrinho();
}

function vdLimparFormulario() {
  vdCarrinho = [];
  selVdCliente.value = "";
  selVdProduto.value = "";
  inVdQtd.value = "";
  selVdPagamento.value = "pix";
  inVdDesconto.value = "";
  inVdNotas.value = "";
  vdErroEl.textContent = "";
  vdDesenharCarrinho();
}

function vdAbrirPainel() {
  vdErroEl.textContent = "";
  painelVenda.hidden = false;
  painelVenda.scrollIntoView({ behavior: "smooth", block: "start" });
}

function vdFecharPainel() {
  painelVenda.hidden = true;
  vdErroEl.textContent = "";
}

async function vdFinalizar() {
  vdErroEl.textContent = "";
  if (vdCarrinho.length === 0) {
    vdErroEl.textContent = "Adicione pelo menos um produto à venda.";
    return;
  }
  const desconto = lerNumero(inVdDesconto.value);
  if (Number.isNaN(desconto)) {
    vdErroEl.textContent = "Desconto inválido. Use números, como 10,00.";
    return;
  }
  const subtotal = vdSubtotal();
  if (desconto > subtotal) {
    vdErroEl.textContent = "O desconto não pode ser maior que o valor da venda.";
    return;
  }

  btnFinalizarVenda.disabled = true;
  btnFinalizarVenda.textContent = "Registrando...";

  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.rpc("create_sale", {
      p_items: vdCarrinho.map(function (x) {
        return { product_id: x.product_id, quantity: x.quantity };
      }),
      p_payment_method: selVdPagamento.value,
      p_customer_id: selVdCliente.value || null,
      p_discount: desconto,
      p_notes: inVdNotas.value.trim() || null
    });
    if (resposta.error) throw resposta.error;

    avisar("Venda registrada: " + moeda(subtotal - desconto));
    vdLimparFormulario();
    vdFecharPainel();
    await carregarVendas();
  } catch (e) {
    console.error(e);
    vdErroEl.textContent = e && e.message ? e.message : String(e);
  } finally {
    btnFinalizarVenda.disabled = false;
    btnFinalizarVenda.textContent = "Finalizar venda";
  }
}

function desenharVendas() {
  if (vdVendas.length === 0) {
    vdMensagem(listaVendasEl, "Nenhuma venda registrada ainda.");
    return;
  }

  listaVendasEl.innerHTML = "";
  vdVendas.forEach(function (v) {
    const cancelada = v.status === "cancelled";

    const linha = document.createElement("div");
    linha.className = "list-item";
    if (cancelada) linha.style.opacity = "0.55";

    const info = document.createElement("div");
    const titulo = document.createElement("p");
    titulo.className = "item-title";
    titulo.textContent = moeda(v.total) + (cancelada ? " · Cancelada" : "");
    if (cancelada) titulo.style.textDecoration = "line-through";

    const sub = document.createElement("p");
    sub.className = "item-sub";
    const data = new Date(v.created_at).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const c = v.customer_id ? vdBuscarCliente(v.customer_id) : null;
    sub.textContent = data + " · " + (c ? c.name : "Sem cliente") + " · " +
      (nomesPagamento[v.payment_method] || v.payment_method);

    const itens = document.createElement("p");
    itens.className = "item-sub";
    const lista = vdItensPorVenda[v.id] || [];
    itens.textContent = lista.length
      ? lista.map(function (i) { return i.quantity + "× " + i.product_name; }).join(", ")
      : "Sem itens";

    info.appendChild(titulo);
    info.appendChild(sub);
    info.appendChild(itens);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (!cancelada) {
      if (vdConfirmandoCancelId === v.id) {
        const pergunta = document.createElement("span");
        pergunta.className = "item-sub";
        pergunta.textContent = "Cancelar? O estoque volta.";
        acoes.appendChild(pergunta);
        acoes.appendChild(criarBotao("Sim, cancelar", "btn btn-danger btn-small", function () {
          vdCancelar(v.id);
        }));
        acoes.appendChild(criarBotao("Voltar", "btn btn-ghost btn-small", function () {
          vdConfirmandoCancelId = null;
          desenharVendas();
        }));
      } else {
        acoes.appendChild(criarBotao("Cancelar venda", "btn btn-ghost btn-small", function () {
          vdConfirmandoCancelId = v.id;
          desenharVendas();
        }));
      }
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    listaVendasEl.appendChild(linha);
  });
}

async function vdCancelar(id) {
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.rpc("cancel_sale", { p_sale_id: id });
    if (resposta.error) throw resposta.error;

    vdConfirmandoCancelId = null;
    avisar("Venda cancelada. O estoque foi devolvido.");
    await carregarVendas();
  } catch (e) {
    console.error(e);
    vdConfirmandoCancelId = null;
    avisar("Não foi possível cancelar: " + (e.message || e));
    desenharVendas();
  }
}

async function carregarVendas() {
  vdMensagem(listaVendasEl, "Carregando vendas...");

  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      vdMensagem(listaVendasEl, "Entre na sua conta para ver as vendas.");
      return;
    }

    const respostas = await Promise.all([
      cliente.from("customers").select("id, name").order("name", { ascending: true }),
      cliente.from("products").select("id, name, sale_price, stock_quantity").order("name", { ascending: true }),
      cliente.from("sales")
        .select("id, customer_id, subtotal, discount, total, payment_method, status, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(30)
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    vdClientes = respostas[0].data || [];
    vdProdutos = respostas[1].data || [];
    vdVendas = respostas[2].data || [];

    vdItensPorVenda = {};
    if (vdVendas.length > 0) {
      const ids = vdVendas.map(function (v) { return v.id; });
      const itensResp = await cliente
        .from("sale_items")
        .select("sale_id, product_name, quantity, total")
        .in("sale_id", ids);
      if (itensResp.error) throw itensResp.error;
      (itensResp.data || []).forEach(function (i) {
        if (!vdItensPorVenda[i.sale_id]) vdItensPorVenda[i.sale_id] = [];
        vdItensPorVenda[i.sale_id].push(i);
      });
    }

    // Tira do carrinho produtos que não existem mais (ex.: trocou de conta)
    vdCarrinho = vdCarrinho.filter(function (x) { return vdBuscarProduto(x.product_id); });

    vdConfirmandoCancelId = null;
    vdPreencherSelects();
    vdDesenharCarrinho();
    desenharVendas();
  } catch (e) {
    console.error(e);
    vdMensagem(listaVendasEl, "Não foi possível carregar as vendas: " + (e.message || e));
  }
}

document.getElementById("btnNovaVenda").addEventListener("click", vdAbrirPainel);
document.getElementById("btnFecharVenda").addEventListener("click", vdFecharPainel);
document.getElementById("btnAdicionarItem").addEventListener("click", vdAdicionarItem);
btnFinalizarVenda.addEventListener("click", vdFinalizar);
inVdDesconto.addEventListener("input", vdAtualizarResumo);

document.querySelectorAll('[data-view="vendas"]').forEach(function (botao) {
  botao.addEventListener("click", carregarVendas);
});
// FIM DA PARTE 6

// ===== PARTE 7: Logo oficial da ARYA =====
const ARYA_SIMBOLO = `<svg viewBox="0 0 387 213" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M215 127 208 118 200 111 192 105 179 100 165 98 151 98 138 100 126 104 114 110 104 116 91 126 78 136 66 147 18 193 8 204 7 206 28 206 82 206 119 165 157 121 164 114 172 110 177 109 183 109 192 111 202 117 208 121 215 128ZM356 74 356 75 354 84 348 92 341 97 332 100 339 102 344 104 351 110 354 116 356 124 358 118 359 114 364 108 368 104 372 102 380 100 370 96 366 94 363 91 358 82ZM92 104 92 104 94 103 100 97 114 85 126 76 134 71 144 66 151 63 162 61 171 61 179 64 187 68 194 76 270 178 276 186 282 191 294 199 300 202 308 204 320 206 352 206 352 204 347 197 341 190 337 184 221 26 218 23 212 17 206 13 201 11 194 9 188 8 175 9 166 12 157 18 150 26 146 30 140 38 136 45Z"/></svg>`;

document.querySelectorAll(".brand-mark").forEach(function (el) {
  el.innerHTML = ARYA_SIMBOLO;
  el.setAttribute("aria-label", "ARYA");
});

const estiloLogo = document.createElement("style");
estiloLogo.textContent = `
  .brand-mark {
    width: auto; height: auto;
    background: none; border-radius: 0;
    color: var(--text);
  }
  .brand-mark svg { display: block; width: 40px; height: auto; }
  .auth-brand { flex-direction: column; align-items: center; gap: 16px; padding-bottom: 14px; }
  .auth-brand .brand-mark svg { width: 64px; }
  .auth-brand .brand-name { font-size: 20px; letter-spacing: .42em; margin-right: -.42em; }
`;
document.head.appendChild(estiloLogo);
// FIM DA PARTE 7

// ===== PARTE 8: Dashboard com dados reais =====
document.getElementById("view-dashboard").innerHTML = `
  <div class="grid-4">
    <article class="card">
      <p class="label">Faturamento · 30 dias</p>
      <p class="value" id="dbFat">—</p>
      <p class="hint">Vendas concluídas</p>
    </article>
    <article class="card">
      <p class="label">Vendas · 30 dias</p>
      <p class="value" id="dbVendas">—</p>
      <p class="hint" id="dbTicket">Ticket médio —</p>
    </article>
    <article class="card">
      <p class="label">Clientes</p>
      <p class="value" id="dbClientes">—</p>
      <p class="hint">Cadastrados</p>
    </article>
    <article class="card">
      <p class="label">Estoque baixo</p>
      <p class="value" id="dbBaixo">—</p>
      <p class="hint">Produtos no limite</p>
    </article>
  </div>

  <article class="card" style="margin-bottom:16px;">
    <div class="card-head">
      <h2>Faturamento · últimos 7 dias</h2>
      <p class="item-sub" id="dbSemanaTotal"></p>
    </div>
    <div id="dbGrafico" class="db-grafico"></div>
  </article>

  <div class="db-duas">
    <article class="card">
      <div class="card-head"><h2>Mais vendidos · 30 dias</h2></div>
      <div id="dbTop" class="list"></div>
    </article>
    <article class="card">
      <div class="card-head"><h2>Precisa repor</h2></div>
      <div id="dbRepor" class="list"></div>
    </article>
  </div>
`;

const estiloDashboard = document.createElement("style");
estiloDashboard.textContent = `
  .db-grafico { display: flex; align-items: flex-end; gap: 10px; height: 210px; padding-top: 8px; }
  .db-col {
    flex: 1; min-width: 0; height: 100%;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px;
  }
  .db-barra {
    width: 100%; max-width: 56px; min-height: 3px;
    background: var(--text); border-radius: 8px 8px 4px 4px;
    transition: height .5s ease;
  }
  .db-barra.vazia { background: var(--border); }
  .db-valor { font-size: 11px; font-weight: 600; color: var(--muted); white-space: nowrap; }
  .db-dia { font-size: 12px; font-weight: 500; color: var(--muted); text-transform: capitalize; }
  .db-hoje .db-dia { color: var(--text); font-weight: 700; }
  .db-duas { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .db-trilho { height: 4px; border-radius: 999px; background: var(--surface-2); margin-top: 8px; overflow: hidden; }
  .db-trilho > div { height: 100%; background: var(--text); border-radius: 999px; }
  .badge.online::before { background: var(--success); }
  @media (max-width: 768px) {
    .db-duas { grid-template-columns: 1fr; }
    .db-valor { font-size: 10px; }
  }
`;
document.head.appendChild(estiloDashboard);

const dbBadge = document.querySelector(".badge");
let dbTimer = null;

function moedaCurta(v) {
  if (v >= 1000) return "R$ " + (v / 1000).toFixed(1).replace(".", ",") + "k";
  return "R$ " + Math.round(v);
}

function chaveDia(data) {
  return data.toLocaleDateString("sv-SE"); // formato AAAA-MM-DD no horário local
}

function dbTexto(id, texto) {
  document.getElementById(id).textContent = texto;
}

function dbDesenharGrafico(vendas) {
  const grafico = document.getElementById("dbGrafico");
  grafico.innerHTML = "";

  const dias = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dias.push({ data: d, chave: chaveDia(d), total: 0 });
  }
  vendas.forEach(function (v) {
    const chave = chaveDia(new Date(v.created_at));
    const dia = dias.find(function (x) { return x.chave === chave; });
    if (dia) dia.total += Number(v.total);
  });

  const maximo = Math.max.apply(null, dias.map(function (d) { return d.total; }));
  const somaSemana = dias.reduce(function (s, d) { return s + d.total; }, 0);
  dbTexto("dbSemanaTotal", "Total da semana: " + moeda(somaSemana));

  dias.forEach(function (d, i) {
    const col = document.createElement("div");
    col.className = "db-col" + (i === 6 ? " db-hoje" : "");

    const valor = document.createElement("span");
    valor.className = "db-valor";
    valor.textContent = d.total > 0 ? moedaCurta(d.total) : "";

    const barra = document.createElement("div");
    barra.className = "db-barra" + (d.total > 0 ? "" : " vazia");
    barra.style.height = (maximo > 0 ? Math.max(3, Math.round(140 * d.total / maximo)) : 3) + "px";

    const dia = document.createElement("span");
    dia.className = "db-dia";
    dia.textContent = i === 6 ? "Hoje" : d.data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");

    col.appendChild(valor);
    col.appendChild(barra);
    col.appendChild(dia);
    grafico.appendChild(col);
  });
}

function dbLinha(lista, titulo, sub, porcentagem) {
  const linha = document.createElement("div");
  linha.className = "list-item";
  linha.style.display = "block";

  const t = document.createElement("p");
  t.className = "item-title";
  t.textContent = titulo;
  const s = document.createElement("p");
  s.className = "item-sub";
  s.textContent = sub;
  linha.appendChild(t);
  linha.appendChild(s);

  if (porcentagem !== undefined) {
    const trilho = document.createElement("div");
    trilho.className = "db-trilho";
    const preenchido = document.createElement("div");
    preenchido.style.width = Math.max(4, porcentagem) + "%";
    trilho.appendChild(preenchido);
    linha.appendChild(trilho);
  }
  lista.appendChild(linha);
}

function dbVazio(lista, texto) {
  lista.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  lista.appendChild(aviso);
}

function limparDashboard() {
  ["dbFat", "dbVendas", "dbClientes", "dbBaixo"].forEach(function (id) { dbTexto(id, "—"); });
  dbTexto("dbTicket", "Ticket médio —");
  dbTexto("dbSemanaTotal", "");
  document.getElementById("dbGrafico").innerHTML = "";
  dbVazio(document.getElementById("dbTop"), "Entre na sua conta para ver os dados.");
  dbVazio(document.getElementById("dbRepor"), "Entre na sua conta para ver os dados.");
  if (dbBadge) {
    dbBadge.textContent = "Desconectado";
    dbBadge.classList.remove("online");
  }
}

async function carregarDashboard() {
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      limparDashboard();
      return;
    }

    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - 29);

    const respostas = await Promise.all([
      cliente.from("sales")
        .select("id, total, status, created_at")
        .gte("created_at", desde.toISOString())
        .neq("status", "cancelled"),
      cliente.from("customers").select("id", { count: "exact", head: true }),
      cliente.from("products").select("id, name, stock_quantity, min_stock")
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    const vendas = respostas[0].data || [];
    const totalClientes = respostas[1].count || 0;
    const produtos = respostas[2].data || [];

    // Cards
    const faturamento = vendas.reduce(function (s, v) { return s + Number(v.total); }, 0);
    const baixos = produtos
      .filter(function (p) { return p.min_stock > 0 && p.stock_quantity <= p.min_stock; })
      .sort(function (a, b) { return a.stock_quantity - b.stock_quantity; });

    dbTexto("dbFat", moeda(faturamento));
    dbTexto("dbVendas", String(vendas.length));
    dbTexto("dbTicket", "Ticket médio " + (vendas.length ? moeda(faturamento / vendas.length) : "—"));
    dbTexto("dbClientes", String(totalClientes));
    dbTexto("dbBaixo", String(baixos.length));

    // Gráfico
    dbDesenharGrafico(vendas);

    // Mais vendidos
    const listaTop = document.getElementById("dbTop");
    listaTop.innerHTML = "";
    if (vendas.length === 0) {
      dbVazio(listaTop, "Nenhuma venda nos últimos 30 dias.");
    } else {
      const ids = vendas.map(function (v) { return v.id; });
      const itensResp = await cliente
        .from("sale_items")
        .select("product_name, quantity, total")
        .in("sale_id", ids);
      if (itensResp.error) throw itensResp.error;

      const porProduto = {};
      (itensResp.data || []).forEach(function (i) {
        if (!porProduto[i.product_name]) porProduto[i.product_name] = { qtd: 0, total: 0 };
        porProduto[i.product_name].qtd += i.quantity;
        porProduto[i.product_name].total += Number(i.total);
      });
      const ranking = Object.keys(porProduto)
        .map(function (nome) { return { nome: nome, qtd: porProduto[nome].qtd, total: porProduto[nome].total }; })
        .sort(function (a, b) { return b.qtd - a.qtd; })
        .slice(0, 5);
      const maiorQtd = ranking.length ? ranking[0].qtd : 1;

      ranking.forEach(function (r, i) {
        dbLinha(listaTop, (i + 1) + ". " + r.nome,
          r.qtd + " un. vendidas · " + moeda(r.total),
          Math.round(100 * r.qtd / maiorQtd));
      });
    }

    // Precisa repor
    const listaRepor = document.getElementById("dbRepor");
    listaRepor.innerHTML = "";
    if (baixos.length === 0) {
      dbVazio(listaRepor, "✦ Tudo certo com o estoque.");
    } else {
      baixos.slice(0, 6).forEach(function (p) {
        dbLinha(listaRepor, "⚠ " + p.name,
          "Estoque " + p.stock_quantity + " · mínimo " + p.min_stock);
      });
    }

    if (dbBadge) {
      dbBadge.textContent = "Dados em tempo real";
      dbBadge.classList.add("online");
    }
  } catch (e) {
    console.error(e);
    avisar("Não foi possível carregar o Dashboard: " + (e.message || e));
  }
}

function agendarDashboard() {
  clearTimeout(dbTimer);
  dbTimer = setTimeout(carregarDashboard, 300);
}

// Atualiza ao entrar, ao sair e ao abrir a aba Dashboard
iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (sessao) {
      agendarDashboard();
    } else {
      clearTimeout(dbTimer);
      limparDashboard();
    }
  });
});

document.querySelectorAll('[data-view="dashboard"]').forEach(function (botao) {
  botao.addEventListener("click", agendarDashboard);
});

limparDashboard();
// FIM DA PARTE 8

// ===== PARTE 9: ARYA Pulso (inteligência com dados reais) =====
titulos.intelligence = "ARYA Pulso";

let puView = document.getElementById("view-intelligence");
if (!puView) {
  puView = document.createElement("section");
  puView.className = "view";
  puView.id = "view-intelligence";
  document.querySelector(".main").appendChild(puView);
}

puView.innerHTML = `
  <article class="card pulso-hero">
    <p class="pulso-marca">✦ ARYA Pulso</p>
    <p class="pulso-sub">Recomendações baseadas nos dados reais da sua loja. Cada uma mostra de onde veio.</p>
    <div class="pulso-stats">
      <div><p class="pulso-stat-label">Últimos 7 dias</p><p class="pulso-stat-valor" id="puSemana">—</p><p class="pulso-stat-hint" id="puComparativo"></p></div>
      <div><p class="pulso-stat-label">Recomendações</p><p class="pulso-stat-valor" id="puQtd">—</p><p class="pulso-stat-hint" id="puAtualizado"></p></div>
    </div>
  </article>
  <div id="puLista"></div>
`;

const estiloPulso = document.createElement("style");
estiloPulso.textContent = `
  .pulso-hero { background: var(--text); border-color: var(--text); color: #fff; margin-bottom: 16px; padding: 26px; }
  .pulso-marca { font-family: var(--font-brand); font-size: 18px; letter-spacing: .12em; }
  .pulso-sub { color: #a1a1aa; font-size: 14px; margin-top: 6px; }
  .pulso-stats { display: flex; gap: 40px; flex-wrap: wrap; margin-top: 22px; padding-top: 18px; border-top: 1px solid #27272a; }
  .pulso-stat-label { color: #a1a1aa; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .09em; }
  .pulso-stat-valor { font-size: 28px; font-weight: 600; letter-spacing: -.03em; margin-top: 4px; }
  .pulso-stat-hint { color: #a1a1aa; font-size: 12px; }
  .pulso-card { margin-bottom: 14px; }
  .pulso-topo { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
  .pulso-tag { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--muted);
    border: 1px solid var(--border); border-radius: 999px; padding: 2px 10px; }
  .pulso-prio { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
  .pulso-prio::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
  .pulso-prio.alta { color: var(--danger); }
  .pulso-prio.media { color: #d97706; }
  .pulso-prio.oportunidade { color: var(--success); }
  .pulso-titulo { font-size: 17px; font-weight: 600; letter-spacing: -.01em; }
  .pulso-bloco { margin-top: 12px; }
  .pulso-bloco-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--subtle); margin-bottom: 2px; }
  .pulso-bloco p:last-child { color: var(--text); font-size: 14px; }
  .pulso-itens { margin-top: 12px; border-top: 1px solid var(--border); }
  .pulso-acoes { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
  a.btn { text-decoration: none; }
`;
document.head.appendChild(estiloPulso);

const PU_DIA_MS = 86400000;
const PU_ORDEM = { alta: 0, media: 1, oportunidade: 2 };
const PU_PRIO_NOME = { alta: "Prioridade alta", media: "Atenção", oportunidade: "Oportunidade" };

function puEl(tag, classe, texto) {
  const e = document.createElement(tag);
  if (classe) e.className = classe;
  if (texto !== undefined) e.textContent = texto;
  return e;
}

function puIr(view) {
  const botao = document.querySelector('[data-view="' + view + '"]');
  if (botao) botao.click();
}

function puWhats(telefone, nome) {
  let d = String(telefone || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12) return null;
  const primeiro = String(nome || "").trim().split(" ")[0];
  const msg = "Oi, " + primeiro + "! Tudo bem? Sentimos sua falta por aqui. Chegaram novidades que têm a sua cara!";
  return "https://wa.me/" + d + "?text=" + encodeURIComponent(msg);
}

async function puBuscarItens(cliente, ids) {
  let todos = [];
  for (let i = 0; i < ids.length; i += 150) {
    const r = await cliente
      .from("sale_items")
      .select("sale_id, product_id, quantity")
      .in("sale_id", ids.slice(i, i + 150));
    if (r.error) throw r.error;
    todos = todos.concat(r.data || []);
  }
  return todos;
}

function puMensagem(texto) {
  const lista = document.getElementById("puLista");
  lista.innerHTML = "";
  const aviso = puEl("div", "empty", texto);
  lista.appendChild(aviso);
}

function limparPulso() {
  document.getElementById("puSemana").textContent = "—";
  document.getElementById("puComparativo").textContent = "";
  document.getElementById("puQtd").textContent = "—";
  document.getElementById("puAtualizado").textContent = "";
  puMensagem("Entre na sua conta para ver as recomendações.");
}

function puDesenhar(insights) {
  const lista = document.getElementById("puLista");
  lista.innerHTML = "";

  if (insights.length === 0) {
    puMensagem("✦ Nenhum alerta agora. Continue registrando vendas: quanto mais dados, mais o Pulso enxerga.");
    return;
  }

  insights.sort(function (a, b) { return PU_ORDEM[a.prio] - PU_ORDEM[b.prio]; });

  insights.forEach(function (ins) {
    const card = puEl("article", "card pulso-card");

    const topo = puEl("div", "pulso-topo");
    topo.appendChild(puEl("span", "pulso-prio " + ins.prio, PU_PRIO_NOME[ins.prio]));
    topo.appendChild(puEl("span", "pulso-tag", ins.tag));
    card.appendChild(topo);

    card.appendChild(puEl("p", "pulso-titulo", "✦ " + ins.titulo));

    const viu = puEl("div", "pulso-bloco");
    viu.appendChild(puEl("p", "pulso-bloco-label", "O que eu vi"));
    viu.appendChild(puEl("p", "", ins.viu));
    card.appendChild(viu);

    const sug = puEl("div", "pulso-bloco");
    sug.appendChild(puEl("p", "pulso-bloco-label", "Sugestão"));
    sug.appendChild(puEl("p", "", ins.sugestao));
    card.appendChild(sug);

    if (ins.itens && ins.itens.length) {
      const itens = puEl("div", "pulso-itens");
      ins.itens.slice(0, 5).forEach(function (it) {
        const linha = puEl("div", "list-item");
        const info = puEl("div");
        info.appendChild(puEl("p", "item-title", it.titulo));
        info.appendChild(puEl("p", "item-sub", it.sub));
        linha.appendChild(info);
        if (it.link) {
          const a = puEl("a", "btn btn-ghost btn-small", "WhatsApp");
          a.href = it.link;
          a.target = "_blank";
          a.rel = "noopener";
          linha.appendChild(a);
        }
        itens.appendChild(linha);
      });
      if (ins.itens.length > 5) {
        itens.appendChild(puEl("p", "item-sub", "+ " + (ins.itens.length - 5) + " outro(s)"));
      }
      card.appendChild(itens);
    }

    if (ins.acao) {
      const acoes = puEl("div", "pulso-acoes");
      acoes.appendChild(criarBotao(ins.acao.texto, "btn btn-small", function () { puIr(ins.acao.view); }));
      card.appendChild(acoes);
    }

    lista.appendChild(card);
  });
}

async function carregarPulso() {
  puMensagem("✦ Analisando os dados da sua loja...");

  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      limparPulso();
      return;
    }

    const hoje0 = new Date();
    hoje0.setHours(0, 0, 0, 0);
    const desde = new Date(hoje0.getTime() - 89 * PU_DIA_MS);

    function diasAtras(data) {
      const d = new Date(data);
      d.setHours(0, 0, 0, 0);
      return Math.round((hoje0 - d) / PU_DIA_MS);
    }

    const respostas = await Promise.all([
      cliente.from("sales")
        .select("id, total, customer_id, created_at")
        .gte("created_at", desde.toISOString())
        .neq("status", "cancelled"),
      cliente.from("products").select("id, name, stock_quantity, min_stock, cost_price, sale_price, created_at"),
      cliente.from("customers").select("id, name, phone")
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    const vendas = respostas[0].data || [];
    const produtos = respostas[1].data || [];
    const clientes = respostas[2].data || [];

    // Resumo da semana
    let semana = 0;
    let anterior = 0;
    const diasPorVenda = {};
    vendas.forEach(function (v) {
      const d = diasAtras(v.created_at);
      diasPorVenda[v.id] = d;
      if (d <= 6) semana += Number(v.total);
      else if (d <= 13) anterior += Number(v.total);
    });
    document.getElementById("puSemana").textContent = moeda(semana);
    let comparativo = "Sem vendas na semana anterior para comparar.";
    if (anterior > 0) {
      const pct = Math.round(100 * (semana - anterior) / anterior);
      comparativo = (pct >= 0 ? "▲ " : "▼ ") + Math.abs(pct) + "% vs. semana anterior (" + moeda(anterior) + ")";
    }
    document.getElementById("puComparativo").textContent = comparativo;

    // Quanto cada produto vendeu em 30 dias
    const itens = vendas.length ? await puBuscarItens(cliente, vendas.map(function (v) { return v.id; })) : [];
    const vendido30 = {};
    itens.forEach(function (i) {
      if (!i.product_id) return;
      if (diasPorVenda[i.sale_id] <= 29) {
        vendido30[i.product_id] = (vendido30[i.product_id] || 0) + i.quantity;
      }
    });

    const insights = [];

    // 1) Repor estoque
    const baixos = produtos.filter(function (p) {
      return p.min_stock > 0 && p.stock_quantity <= p.min_stock;
    });
    if (baixos.length) {
      const zerados = baixos.filter(function (p) { return p.stock_quantity <= 0; }).length;
      insights.push({
        prio: zerados ? "alta" : "media",
        tag: "Estoque",
        titulo: baixos.length + " produto(s) precisam de reposição",
        viu: "Estes produtos estão com o estoque igual ou abaixo do mínimo que você definiu" +
          (zerados ? ", e " + zerados + " já estão zerados." : "."),
        sugestao: "Faça o pedido ao fornecedor antes de perder vendas. Comece pelos que mais vendem.",
        itens: baixos
          .map(function (p) {
            const vendeu = vendido30[p.id] || 0;
            const porDia = vendeu / 30;
            let sub = "Estoque " + p.stock_quantity + " · mínimo " + p.min_stock + " · vendeu " + vendeu + " un. em 30 dias";
            if (porDia > 0 && p.stock_quantity > 0) {
              sub += " · dura cerca de " + Math.max(1, Math.round(p.stock_quantity / porDia)) + " dia(s)";
            }
            return { titulo: p.name, sub: sub, peso: vendeu };
          })
          .sort(function (a, b) { return b.peso - a.peso; }),
        acao: { texto: "Abrir Produtos", view: "produtos" }
      });
    }

    // 2) Margem: prejuízo ou margem baixa (menos de 20%)
    const prejuizo = [];
    const margemBaixa = [];
    produtos.forEach(function (p) {
      const venda = Number(p.sale_price);
      const custo = Number(p.cost_price);
      if (venda <= 0 || custo <= 0) return;
      const margem = (venda - custo) / venda;
      const item = { titulo: p.name, sub: "Custo " + moeda(custo) + " · venda " + moeda(venda) + " · margem " + Math.round(margem * 100) + "%" };
      if (venda <= custo) prejuizo.push(item);
      else if (margem < 0.2) margemBaixa.push(item);
    });
    if (prejuizo.length) {
      insights.push({
        prio: "alta",
        tag: "Preço",
        titulo: prejuizo.length + " produto(s) vendidos no prejuízo",
        viu: "O preço de venda destes produtos é igual ou menor que o preço de custo cadastrado.",
        sugestao: "Revise o preço ou confira se o custo foi digitado certo. Cada venda deles tira dinheiro do caixa.",
        itens: prejuizo,
        acao: { texto: "Revisar preços", view: "produtos" }
      });
    }
    if (margemBaixa.length) {
      insights.push({
        prio: "media",
        tag: "Preço",
        titulo: margemBaixa.length + " produto(s) com margem abaixo de 20%",
        viu: "Nestes produtos, menos de 20% do preço de venda sobra depois de pagar o custo.",
        sugestao: "Avalie um pequeno reajuste ou negocie um custo melhor com o fornecedor.",
        itens: margemBaixa,
        acao: { texto: "Revisar preços", view: "produtos" }
      });
    }

    // 3) Produtos parados (com estoque, cadastrados há 30+ dias, sem venda em 30 dias)
    const parados = produtos.filter(function (p) {
      return p.stock_quantity > 0 && diasAtras(p.created_at) >= 30 && !vendido30[p.id];
    });
    if (parados.length) {
      const valorParado = parados.reduce(function (s, p) { return s + p.stock_quantity * Number(p.cost_price); }, 0);
      insights.push({
        prio: "media",
        tag: "Estoque",
        titulo: parados.length + " produto(s) parados há 30 dias",
        viu: "Estes produtos têm estoque, mas não tiveram nenhuma venda nos últimos 30 dias. " +
          "Pelo custo cadastrado, são " + moeda(valorParado) + " em mercadoria parada.",
        sugestao: "Experimente destacar nas redes sociais, montar um kit com um produto que vende bem ou fazer uma promoção.",
        itens: parados
          .map(function (p) {
            return { titulo: p.name, sub: p.stock_quantity + " un. em estoque · " + moeda(p.stock_quantity * Number(p.cost_price)) + " de custo", peso: p.stock_quantity * Number(p.cost_price) };
          })
          .sort(function (a, b) { return b.peso - a.peso; })
      });
    }

    // 4) Clientes: reativar e fiéis
    const compras = {};
    vendas.forEach(function (v) {
      if (!v.customer_id) return;
      const d = diasPorVenda[v.id];
      if (!compras[v.customer_id]) compras[v.customer_id] = { qtd: 0, ultima: 999, total: 0 };
      const c = compras[v.customer_id];
      c.qtd += 1;
      c.total += Number(v.total);
      c.ultima = Math.min(c.ultima, d);
    });
    const reativar = [];
    const fieis = [];
    clientes.forEach(function (cl) {
      const c = compras[cl.id];
      if (!c) return;
      if (c.ultima >= 30) {
        reativar.push({
          titulo: cl.name,
          sub: "Última compra há " + c.ultima + " dias · " + c.qtd + " compra(s) · " + moeda(c.total),
          link: puWhats(cl.phone, cl.name),
          peso: c.total
        });
      } else if (c.qtd >= 2) {
        fieis.push({
          titulo: cl.name,
          sub: c.qtd + " compras em 90 dias · " + moeda(c.total),
          link: null,
          peso: c.total
        });
      }
    });
    if (reativar.length) {
      insights.push({
        prio: "media",
        tag: "Clientes",
        titulo: reativar.length + " cliente(s) para reativar",
        viu: "Estes clientes compraram nos últimos 90 dias, mas não voltam há 30 dias ou mais.",
        sugestao: "Mande uma mensagem pessoal com uma novidade ou um mimo. Vender para quem já comprou é mais fácil do que conquistar alguém novo.",
        itens: reativar.sort(function (a, b) { return b.peso - a.peso; }),
        acao: { texto: "Abrir Clientes", view: "clientes" }
      });
    }
    if (fieis.length) {
      insights.push({
        prio: "oportunidade",
        tag: "Clientes",
        titulo: fieis.length + " cliente(s) fiéis",
        viu: "Estes clientes compraram 2 vezes ou mais nos últimos 90 dias.",
        sugestao: "Trate como VIP: agradeça, ofereça prioridade nas novidades ou um desconto de fidelidade.",
        itens: fieis.sort(function (a, b) { return b.peso - a.peso; }),
        acao: { texto: "Abrir Clientes", view: "clientes" }
      });
    }

    // 5) Melhor dia da semana (precisa de pelo menos 5 vendas em 90 dias)
    if (vendas.length >= 5) {
      const nomesDias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      const porDia = [0, 0, 0, 0, 0, 0, 0];
      let totalGeral = 0;
      vendas.forEach(function (v) {
        porDia[new Date(v.created_at).getDay()] += Number(v.total);
        totalGeral += Number(v.total);
      });
      const melhor = porDia.indexOf(Math.max.apply(null, porDia));
      if (totalGeral > 0) {
        insights.push({
          prio: "oportunidade",
          tag: "Vendas",
          titulo: "Seu melhor dia é " + nomesDias[melhor],
          viu: "Nos últimos 90 dias, " + nomesDias[melhor] + " somou " + moeda(porDia[melhor]) +
            " (" + Math.round(100 * porDia[melhor] / totalGeral) + "% do faturamento), com base em " + vendas.length + " vendas.",
          sugestao: "Programe posts, lançamentos e promoções para a véspera e o próprio dia.",
          itens: []
        });
      }
    }

    document.getElementById("puQtd").textContent = String(insights.length);
    document.getElementById("puAtualizado").textContent =
      "Atualizado às " + new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    if (produtos.length === 0 && vendas.length === 0) {
      puMensagem("✦ Cadastre produtos e registre vendas para o Pulso começar a enxergar sua loja.");
      return;
    }
    puDesenhar(insights);
  } catch (e) {
    console.error(e);
    puMensagem("Não foi possível analisar os dados: " + (e.message || e));
  }
}

document.querySelectorAll('[data-view="intelligence"]').forEach(function (botao) {
  botao.addEventListener("click", carregarPulso);
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) limparPulso();
  });
});

limparPulso();
// FIM DA PARTE 9

// ===== PARTE 10: Assinatura da fundadora =====
const NOME_FUNDADORA = "Vitória Gabrielly"; // troque aqui se quiser outro nome

const estiloAssinatura = document.createElement("style");
estiloAssinatura.textContent = `
  .assinatura-menu {
    display: flex; align-items: center; gap: 10px;
    margin: 12px 8px 0; padding: 10px;
    border: 1px solid var(--border); border-radius: 12px;
    background: var(--bg);
  }
  .assinatura-icone {
    width: 30px; height: 30px; flex-shrink: 0; border-radius: 50%;
    display: grid; place-items: center;
    background: var(--text); color: #fff;
    font-family: var(--font-brand); font-size: 12px;
  }
  .assinatura-nome { font-size: 13px; font-weight: 600; line-height: 1.2; }
  .assinatura-cargo { font-size: 11px; color: var(--muted); letter-spacing: .04em; }
  .assinatura-login {
    margin-top: 18px; padding-top: 16px;
    border-top: 1px solid var(--border);
    text-align: center; font-size: 12px; color: var(--muted);
  }
  .assinatura-login strong { color: var(--text); font-weight: 600; }
`;
document.head.appendChild(estiloAssinatura);

// No menu lateral, abaixo do nome da empresa
const rodapeMenu = document.querySelector(".sidebar-foot");
if (rodapeMenu && !document.getElementById("assinaturaMenu")) {
  const caixa = document.createElement("div");
  caixa.id = "assinaturaMenu";
  caixa.className = "assinatura-menu";

  const icone = document.createElement("div");
  icone.className = "assinatura-icone";
  icone.textContent = NOME_FUNDADORA.trim().charAt(0).toUpperCase();

  const textos = document.createElement("div");
  const nome = document.createElement("p");
  nome.className = "assinatura-nome";
  nome.textContent = NOME_FUNDADORA;
  const cargo = document.createElement("p");
  cargo.className = "assinatura-cargo";
  cargo.textContent = "Fundadora · ARYA";
  textos.appendChild(nome);
  textos.appendChild(cargo);

  caixa.appendChild(icone);
  caixa.appendChild(textos);
  rodapeMenu.after(caixa);
}

// Na tela de login, no fim da caixa
const caixaLogin = document.querySelector(".auth-box");
if (caixaLogin && !document.getElementById("assinaturaLogin")) {
  const linha = document.createElement("p");
  linha.id = "assinaturaLogin";
  linha.className = "assinatura-login";
  const forte = document.createElement("strong");
  forte.textContent = NOME_FUNDADORA;
  linha.appendChild(document.createTextNode("Criado por "));
  linha.appendChild(forte);
  linha.appendChild(document.createTextNode(" · Fundadora da ARYA"));
  caixaLogin.appendChild(linha);
}
// FIM DA PARTE 10

// ===== PARTE 11: Configurações (empresa, perfil e senha) =====
titulos.configuracoes = "Configurações";

const cfgView = document.createElement("section");
cfgView.className = "view";
cfgView.id = "view-configuracoes";
cfgView.innerHTML = `
  <div class="cfg-grade">
    <article class="card">
      <div class="card-head"><h2>Empresa</h2></div>
      <div class="field">
        <label for="cfgEmpresa">Nome da empresa</label>
        <input id="cfgEmpresa" type="text" placeholder="Nome da sua empresa" />
      </div>
      <p class="form-error" id="cfgEmpresaErro" role="alert"></p>
      <button class="btn" id="btnSalvarEmpresa" type="button">Salvar empresa</button>
    </article>

    <article class="card">
      <div class="card-head"><h2>Seu perfil</h2><span class="badge" id="cfgCargo">—</span></div>
      <div class="field">
        <label for="cfgNome">Seu nome</label>
        <input id="cfgNome" type="text" placeholder="Como você quer ser chamada" />
      </div>
      <div class="field">
        <label for="cfgEmail">E-mail de acesso</label>
        <input id="cfgEmail" type="email" disabled />
      </div>
      <p class="form-error" id="cfgNomeErro" role="alert"></p>
      <button class="btn" id="btnSalvarNome" type="button">Salvar perfil</button>
    </article>

    <article class="card">
      <div class="card-head"><h2>Segurança</h2></div>
      <div class="field">
        <label for="cfgSenha">Nova senha</label>
        <input id="cfgSenha" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
      </div>
      <div class="field">
        <label for="cfgSenha2">Confirmar nova senha</label>
        <input id="cfgSenha2" type="password" autocomplete="new-password" placeholder="Repita a senha" />
      </div>
      <p class="form-error" id="cfgSenhaErro" role="alert"></p>
      <button class="btn" id="btnSalvarSenha" type="button">Trocar senha</button>
    </article>
  </div>
`;
document.querySelector(".main").appendChild(cfgView);

const estiloCfg = document.createElement("style");
estiloCfg.textContent = `
  .cfg-grade { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; align-items: start; }
  .cfg-grade .card:last-child { grid-column: 1 / -1; max-width: calc(50% - 8px); }
  .field input:disabled { background: var(--surface-2); color: var(--muted); }
  #btnCfgTopo { display: none; }
  @media (max-width: 900px) {
    .cfg-grade { grid-template-columns: 1fr; }
    .cfg-grade .card:last-child { max-width: none; }
  }
  @media (max-width: 768px) {
    #btnCfgTopo { display: inline-flex; }
  }
`;
document.head.appendChild(estiloCfg);

// Item no menu lateral
const navMenu = document.querySelector(".nav");
if (navMenu && !document.getElementById("navConfiguracoes")) {
  const item = document.createElement("button");
  item.id = "navConfiguracoes";
  item.type = "button";
  item.className = "nav-item";
  item.dataset.view = "configuracoes";
  const ico = document.createElement("span");
  ico.className = "ico";
  ico.textContent = "⚙";
  item.appendChild(ico);
  item.appendChild(document.createTextNode("Configurações"));
  navMenu.appendChild(item);
}

// Botão no topo (aparece só em telas estreitas)
const topoBarra = document.querySelector(".topbar");
if (topoBarra && !document.getElementById("btnCfgTopo")) {
  const botaoTopo = document.createElement("button");
  botaoTopo.id = "btnCfgTopo";
  botaoTopo.type = "button";
  botaoTopo.className = "btn btn-ghost";
  botaoTopo.dataset.view = "configuracoes";
  botaoTopo.textContent = "⚙";
  botaoTopo.setAttribute("aria-label", "Configurações");
  topoBarra.appendChild(botaoTopo);
}

const nomesCargo = { owner: "Dona / Dono", admin: "Administrador", seller: "Vendedor", member: "Membro" };
const inCfgEmpresa = document.getElementById("cfgEmpresa");
const inCfgNome = document.getElementById("cfgNome");
const inCfgEmail = document.getElementById("cfgEmail");
const inCfgSenha = document.getElementById("cfgSenha");
const inCfgSenha2 = document.getElementById("cfgSenha2");
let cfgEmpresaId = null;

function cfgBotao(id, ocupado, textoOcupado, textoNormal) {
  const b = document.getElementById(id);
  b.disabled = ocupado;
  b.textContent = ocupado ? textoOcupado : textoNormal;
}

function limparConfiguracoes() {
  cfgEmpresaId = null;
  inCfgEmpresa.value = "";
  inCfgNome.value = "";
  inCfgEmail.value = "";
  inCfgSenha.value = "";
  inCfgSenha2.value = "";
  document.getElementById("cfgCargo").textContent = "—";
  ["cfgEmpresaErro", "cfgNomeErro", "cfgSenhaErro"].forEach(function (id) {
    document.getElementById(id).textContent = "";
  });
}

async function carregarConfiguracoes() {
  try {
    const cliente = await iniciarSupabase();
    const usuario = await cliente.auth.getUser();
    if (usuario.error || !usuario.data.user) {
      limparConfiguracoes();
      return;
    }

    const perfil = await cliente
      .from("profiles")
      .select("full_name, role, companies(id, name)")
      .eq("id", usuario.data.user.id)
      .maybeSingle();
    if (perfil.error) throw perfil.error;

    inCfgEmail.value = usuario.data.user.email || "";
    if (perfil.data) {
      inCfgNome.value = perfil.data.full_name || "";
      document.getElementById("cfgCargo").textContent =
        nomesCargo[perfil.data.role] || perfil.data.role || "—";
      if (perfil.data.companies) {
        cfgEmpresaId = perfil.data.companies.id;
        inCfgEmpresa.value = perfil.data.companies.name || "";
      }
    }
  } catch (e) {
    console.error(e);
    avisar("Não foi possível carregar as configurações: " + (e.message || e));
  }
}

async function salvarEmpresa() {
  const erro = document.getElementById("cfgEmpresaErro");
  erro.textContent = "";
  const nome = inCfgEmpresa.value.trim();
  if (nome.length < 2) {
    erro.textContent = "Informe o nome da empresa (mínimo 2 letras).";
    return;
  }
  if (!cfgEmpresaId) {
    erro.textContent = "Empresa não encontrada. Atualize a página.";
    return;
  }

  cfgBotao("btnSalvarEmpresa", true, "Salvando...", "Salvar empresa");
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente
      .from("companies")
      .update({ name: nome })
      .eq("id", cfgEmpresaId)
      .select("name");
    if (resposta.error) throw resposta.error;
    if (!resposta.data || resposta.data.length === 0) {
      throw new Error("Só a dona/dono ou um administrador pode alterar a empresa.");
    }
    document.querySelector(".sidebar-foot").textContent = resposta.data[0].name;
    avisar("Empresa atualizada: " + resposta.data[0].name);
  } catch (e) {
    console.error(e);
    erro.textContent = e && e.message ? e.message : String(e);
  } finally {
    cfgBotao("btnSalvarEmpresa", false, "", "Salvar empresa");
  }
}

async function salvarNome() {
  const erro = document.getElementById("cfgNomeErro");
  erro.textContent = "";
  const nome = inCfgNome.value.trim();
  if (nome.length < 2) {
    erro.textContent = "Informe o seu nome (mínimo 2 letras).";
    return;
  }

  cfgBotao("btnSalvarNome", true, "Salvando...", "Salvar perfil");
  try {
    const cliente = await iniciarSupabase();
    const usuario = await cliente.auth.getUser();
    if (usuario.error || !usuario.data.user) throw new Error("Sessão inválida. Entre novamente.");

    const resposta = await cliente
      .from("profiles")
      .update({ full_name: nome })
      .eq("id", usuario.data.user.id)
      .select("full_name");
    if (resposta.error) throw resposta.error;
    if (!resposta.data || resposta.data.length === 0) throw new Error("Não foi possível salvar o perfil.");
    avisar("Perfil atualizado.");
  } catch (e) {
    console.error(e);
    erro.textContent = e && e.message ? e.message : String(e);
  } finally {
    cfgBotao("btnSalvarNome", false, "", "Salvar perfil");
  }
}

async function salvarSenha() {
  const erro = document.getElementById("cfgSenhaErro");
  erro.textContent = "";
  if (inCfgSenha.value.length < 8) {
    erro.textContent = "A nova senha precisa ter pelo menos 8 caracteres.";
    return;
  }
  if (inCfgSenha.value !== inCfgSenha2.value) {
    erro.textContent = "As senhas não são iguais.";
    return;
  }

  cfgBotao("btnSalvarSenha", true, "Trocando...", "Trocar senha");
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.auth.updateUser({ password: inCfgSenha.value });
    if (resposta.error) throw resposta.error;
    inCfgSenha.value = "";
    inCfgSenha2.value = "";
    avisar("Senha trocada com sucesso.");
  } catch (e) {
    console.error(e);
    const msg = e && e.message ? e.message : String(e);
    erro.textContent = /different from the old/i.test(msg)
      ? "A nova senha precisa ser diferente da atual."
      : "Não foi possível trocar a senha: " + msg;
  } finally {
    cfgBotao("btnSalvarSenha", false, "", "Trocar senha");
  }
}

document.getElementById("btnSalvarEmpresa").addEventListener("click", salvarEmpresa);
document.getElementById("btnSalvarNome").addEventListener("click", salvarNome);
document.getElementById("btnSalvarSenha").addEventListener("click", salvarSenha);

document.querySelectorAll('[data-view="configuracoes"]').forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarTela("configuracoes");
    carregarConfiguracoes();
  });
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) limparConfiguracoes();
  });
});
// FIM DA PARTE 11

// ===== PARTE 12: Fornecedores (banco real) =====
titulos.fornecedores = "Fornecedores";

const foView = document.createElement("section");
foView.className = "view";
foView.id = "view-fornecedores";
foView.innerHTML = `
  <article class="card wide">
    <div class="card-head">
      <h2>Fornecedores</h2>
      <button class="btn" id="btnNovoFornecedor" type="button">+ Novo fornecedor</button>
    </div>

    <form class="form-panel" id="formFornecedor" hidden novalidate>
      <h3 id="tituloFormFornecedor">Novo fornecedor</h3>
      <div class="field">
        <label for="foNome">Nome</label>
        <input id="foNome" type="text" placeholder="Ex.: Malharia Silva" />
      </div>
      <div class="field-row">
        <div class="field">
          <label for="foTelefone">Telefone / WhatsApp</label>
          <input id="foTelefone" type="tel" inputmode="tel" placeholder="(11) 99999-9999" />
        </div>
        <div class="field">
          <label for="foEmail">E-mail</label>
          <input id="foEmail" type="email" placeholder="contato@fornecedor.com" />
        </div>
      </div>
      <div class="field">
        <label for="foNotas">Observações</label>
        <input id="foNotas" type="text" placeholder="Ex.: entrega em 5 dias, pedido mínimo R$ 300" />
      </div>
      <p class="form-error" id="foErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnSalvarFornecedor" type="submit">Salvar</button>
        <button class="btn btn-ghost" id="btnCancelarFornecedor" type="button">Cancelar</button>
      </div>
    </form>

    <div class="search-row">
      <input id="foBusca" type="search" placeholder="Pesquisar por nome..." />
    </div>

    <div id="listaFornecedores" class="list">
      <div class="empty">Os fornecedores aparecerão aqui.</div>
    </div>
  </article>
`;
document.querySelector(".main").appendChild(foView);

// Item no menu lateral, logo depois de Produtos
const navMenuFo = document.querySelector(".nav");
if (navMenuFo && !document.getElementById("navFornecedores")) {
  const item = document.createElement("button");
  item.id = "navFornecedores";
  item.type = "button";
  item.className = "nav-item";
  item.dataset.view = "fornecedores";
  const ico = document.createElement("span");
  ico.className = "ico";
  ico.textContent = "▤";
  item.appendChild(ico);
  item.appendChild(document.createTextNode("Fornecedores"));
  const depoisDe = navMenuFo.querySelector('[data-view="produtos"]');
  if (depoisDe) depoisDe.after(item);
  else navMenuFo.appendChild(item);
}

const formFornecedor = document.getElementById("formFornecedor");
const listaFornecedoresEl = document.getElementById("listaFornecedores");
const foBuscaEl = document.getElementById("foBusca");
const btnSalvarFornecedor = document.getElementById("btnSalvarFornecedor");
const tituloFormFornecedor = document.getElementById("tituloFormFornecedor");
const foErroEl = document.getElementById("foErro");
const inFoNome = document.getElementById("foNome");
const inFoTelefone = document.getElementById("foTelefone");
const inFoEmail = document.getElementById("foEmail");
const inFoNotas = document.getElementById("foNotas");

let fornecedoresCache = [];
let fornecedorEditandoId = null;
let confirmandoFornecedorId = null;

function foWhats(telefone, nomeFornecedor) {
  let d = String(telefone || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12) return null;
  const empresa = document.querySelector(".sidebar-foot").textContent.trim();
  const msg = "Olá, " + nomeFornecedor + "! Aqui é da " + empresa +
    ". Gostaria de fazer um pedido de reposição. Pode me enviar a disponibilidade e os valores?";
  return "https://wa.me/" + d + "?text=" + encodeURIComponent(msg);
}

function mostrarMensagemFornecedores(texto) {
  listaFornecedoresEl.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  listaFornecedoresEl.appendChild(aviso);
}

function abrirFormFornecedor(f) {
  foErroEl.textContent = "";
  fornecedorEditandoId = f ? f.id : null;
  inFoNome.value = f ? f.name : "";
  inFoTelefone.value = f && f.phone ? f.phone : "";
  inFoEmail.value = f && f.email ? f.email : "";
  inFoNotas.value = f && f.notes ? f.notes : "";
  tituloFormFornecedor.textContent = f ? "Editar fornecedor" : "Novo fornecedor";
  btnSalvarFornecedor.textContent = f ? "Salvar alterações" : "Salvar";
  formFornecedor.hidden = false;
  formFornecedor.scrollIntoView({ behavior: "smooth", block: "start" });
  inFoNome.focus();
}

function fecharFormFornecedor() {
  fornecedorEditandoId = null;
  formFornecedor.reset();
  foErroEl.textContent = "";
  tituloFormFornecedor.textContent = "Novo fornecedor";
  btnSalvarFornecedor.textContent = "Salvar";
  formFornecedor.hidden = true;
}

function desenharFornecedores() {
  const termo = foBuscaEl.value.trim().toLowerCase();
  const filtrados = fornecedoresCache.filter(function (f) {
    return f.name.toLowerCase().includes(termo);
  });

  if (filtrados.length === 0) {
    mostrarMensagemFornecedores(
      fornecedoresCache.length === 0
        ? "Nenhum fornecedor cadastrado ainda."
        : "Nenhum fornecedor encontrado para essa pesquisa."
    );
    return;
  }

  listaFornecedoresEl.innerHTML = "";
  filtrados.forEach(function (f) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = f.name;
    const contato = document.createElement("p");
    contato.className = "item-sub";
    const partes = [f.phone, f.email].filter(Boolean);
    contato.textContent = partes.length ? partes.join(" · ") : "Sem contato";
    info.appendChild(nome);
    info.appendChild(contato);
    if (f.notes) {
      const notas = document.createElement("p");
      notas.className = "item-sub";
      notas.textContent = f.notes;
      info.appendChild(notas);
    }

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (confirmandoFornecedorId === f.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = "Excluir?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        excluirFornecedor(f.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        confirmandoFornecedorId = null;
        desenharFornecedores();
      }));
    } else {
      const link = foWhats(f.phone, f.name);
      if (link) {
        const a = document.createElement("a");
        a.className = "btn btn-small";
        a.href = link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "Pedir no WhatsApp";
        acoes.appendChild(a);
      }
      acoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function () {
        confirmandoFornecedorId = null;
        abrirFormFornecedor(f);
      }));
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        confirmandoFornecedorId = f.id;
        desenharFornecedores();
      }));
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    listaFornecedoresEl.appendChild(linha);
  });
}

async function carregarFornecedores() {
  mostrarMensagemFornecedores("Carregando fornecedores...");
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      mostrarMensagemFornecedores("Entre na sua conta para ver os fornecedores.");
      return;
    }

    const resposta = await cliente
      .from("suppliers")
      .select("id, name, phone, email, notes, created_at")
      .order("name", { ascending: true });
    if (resposta.error) throw resposta.error;

    fornecedoresCache = resposta.data || [];
    confirmandoFornecedorId = null;
    desenharFornecedores();
  } catch (e) {
    console.error(e);
    mostrarMensagemFornecedores("Não foi possível carregar os fornecedores: " + (e.message || e));
  }
}

async function excluirFornecedor(id) {
  try {
    const cliente = await iniciarSupabase();
    const resposta = await cliente.from("suppliers").delete().eq("id", id).select("id");
    if (resposta.error) throw resposta.error;
    if (!resposta.data || resposta.data.length === 0) {
      throw new Error("Sem permissão para excluir (só dono ou admin) ou fornecedor não encontrado.");
    }
    confirmandoFornecedorId = null;
    avisar("Fornecedor excluído.");
    await carregarFornecedores();
  } catch (e) {
    console.error(e);
    confirmandoFornecedorId = null;
    avisar("Não foi possível excluir: " + (e.message || e));
    desenharFornecedores();
  }
}

formFornecedor.addEventListener("submit", async function (evento) {
  evento.preventDefault();
  foErroEl.textContent = "";

  const nome = inFoNome.value.trim();
  const telefone = inFoTelefone.value.trim();
  const email = inFoEmail.value.trim();
  const notas = inFoNotas.value.trim();

  if (nome.length < 2) {
    foErroEl.textContent = "Informe o nome do fornecedor (mínimo 2 letras).";
    return;
  }
  if (email && !emailValido(email)) {
    foErroEl.textContent = "E-mail do fornecedor inválido.";
    return;
  }

  btnSalvarFornecedor.disabled = true;
  btnSalvarFornecedor.textContent = "Salvando...";

  try {
    const cliente = await iniciarSupabase();
    const dados = {
      name: nome,
      phone: telefone || null,
      email: email || null,
      notes: notas || null
    };
    const editando = Boolean(fornecedorEditandoId);
    let resposta;

    if (editando) {
      resposta = await cliente
        .from("suppliers")
        .update(dados)
        .eq("id", fornecedorEditandoId)
        .select()
        .single();
    } else {
      dados.company_id = await obterEmpresaId();
      resposta = await cliente
        .from("suppliers")
        .insert(dados)
        .select()
        .single();
    }
    if (resposta.error) throw resposta.error;

    fecharFormFornecedor();
    avisar((editando ? "Fornecedor atualizado: " : "Fornecedor salvo: ") + resposta.data.name);
    await carregarFornecedores();
  } catch (e) {
    console.error(e);
    foErroEl.textContent = "Não foi possível salvar: " + (e.message || e);
  } finally {
    btnSalvarFornecedor.disabled = false;
    btnSalvarFornecedor.textContent = fornecedorEditandoId ? "Salvar alterações" : "Salvar";
  }
});

document.getElementById("btnNovoFornecedor").addEventListener("click", function () {
  abrirFormFornecedor(null);
});
document.getElementById("btnCancelarFornecedor").addEventListener("click", fecharFormFornecedor);
foBuscaEl.addEventListener("input", desenharFornecedores);

document.querySelectorAll('[data-view="fornecedores"]').forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarTela("fornecedores");
    carregarFornecedores();
  });
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) {
      fornecedoresCache = [];
      confirmandoFornecedorId = null;
      fecharFormFornecedor();
      foBuscaEl.value = "";
      mostrarMensagemFornecedores("Os fornecedores aparecerão aqui.");
    }
  });
});
// FIM DA PARTE 12

// ===== PARTE 13: Histórico do cliente =====
const painelHistorico = document.createElement("div");
painelHistorico.className = "form-panel";
painelHistorico.id = "painelHistorico";
painelHistorico.hidden = true;
painelHistorico.innerHTML = `
  <div class="card-head" style="margin-bottom:12px;">
    <h3 id="hiTitulo" style="margin:0;">Histórico</h3>
    <button class="btn btn-ghost btn-small" id="btnFecharHistorico" type="button">Fechar</button>
  </div>
  <div class="hi-stats">
    <div><p class="label">Total gasto</p><p class="hi-valor" id="hiTotal">—</p></div>
    <div><p class="label">Compras</p><p class="hi-valor" id="hiQtd">—</p></div>
    <div><p class="label">Ticket médio</p><p class="hi-valor" id="hiTicket">—</p></div>
    <div><p class="label">Última compra</p><p class="hi-valor" id="hiUltima">—</p></div>
  </div>
  <p class="item-sub" id="hiFavoritos" style="margin:14px 0 4px;"></p>
  <h3 style="margin-top:14px;">Compras</h3>
  <div id="hiLista" class="list"></div>
`;
formCliente.after(painelHistorico);

const estiloHistorico = document.createElement("style");
estiloHistorico.textContent = `
  .hi-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .hi-stats > div { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; }
  .hi-valor { font-size: 20px; font-weight: 600; letter-spacing: -.02em; margin-top: 4px; font-variant-numeric: tabular-nums; }
  @media (max-width: 700px) { .hi-stats { grid-template-columns: repeat(2, 1fr); } }
`;
document.head.appendChild(estiloHistorico);

function hiMensagem(texto) {
  const lista = document.getElementById("hiLista");
  lista.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  lista.appendChild(aviso);
}

function fecharHistorico() {
  painelHistorico.hidden = true;
}

async function abrirHistorico(c) {
  fecharFormulario();
  painelHistorico.hidden = false;
  document.getElementById("hiTitulo").textContent = "Histórico: " + c.name;
  ["hiTotal", "hiQtd", "hiTicket", "hiUltima"].forEach(function (id) {
    document.getElementById(id).textContent = "—";
  });
  document.getElementById("hiFavoritos").textContent = "";
  hiMensagem("Carregando compras...");
  painelHistorico.scrollIntoView({ behavior: "smooth", block: "start" });

  try {
    const cliente = await iniciarSupabase();
    const vendasResp = await cliente
      .from("sales")
      .select("id, total, status, payment_method, created_at")
      .eq("customer_id", c.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (vendasResp.error) throw vendasResp.error;
    const vendas = vendasResp.data || [];

    if (vendas.length === 0) {
      document.getElementById("hiQtd").textContent = "0";
      hiMensagem("Este cliente ainda não tem compras registradas.");
      return;
    }

    const itensResp = await cliente
      .from("sale_items")
      .select("sale_id, product_name, quantity")
      .in("sale_id", vendas.map(function (v) { return v.id; }));
    if (itensResp.error) throw itensResp.error;

    const itensPorVenda = {};
    (itensResp.data || []).forEach(function (i) {
      if (!itensPorVenda[i.sale_id]) itensPorVenda[i.sale_id] = [];
      itensPorVenda[i.sale_id].push(i);
    });

    // Resumo (sem as canceladas)
    const validas = vendas.filter(function (v) { return v.status !== "cancelled"; });
    const total = validas.reduce(function (s, v) { return s + Number(v.total); }, 0);
    document.getElementById("hiTotal").textContent = moeda(total);
    document.getElementById("hiQtd").textContent = String(validas.length);
    document.getElementById("hiTicket").textContent = validas.length ? moeda(total / validas.length) : "—";

    if (validas.length) {
      const ultima = new Date(validas[0].created_at);
      ultima.setHours(0, 0, 0, 0);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dias = Math.round((hoje - ultima) / 86400000);
      document.getElementById("hiUltima").textContent =
        dias === 0 ? "Hoje" : dias === 1 ? "Ontem" : "Há " + dias + " dias";
    }

    // Favoritos
    const contagem = {};
    validas.forEach(function (v) {
      (itensPorVenda[v.id] || []).forEach(function (i) {
        contagem[i.product_name] = (contagem[i.product_name] || 0) + i.quantity;
      });
    });
    const favoritos = Object.keys(contagem)
      .sort(function (a, b) { return contagem[b] - contagem[a]; })
      .slice(0, 3);
    if (favoritos.length) {
      document.getElementById("hiFavoritos").textContent =
        "✦ Favoritos: " + favoritos.map(function (n) { return n + " (" + contagem[n] + ")"; }).join(" · ");
    }

    // Lista de compras
    const lista = document.getElementById("hiLista");
    lista.innerHTML = "";
    vendas.forEach(function (v) {
      const cancelada = v.status === "cancelled";
      const linha = document.createElement("div");
      linha.className = "list-item";
      if (cancelada) linha.style.opacity = "0.55";

      const info = document.createElement("div");
      const titulo = document.createElement("p");
      titulo.className = "item-title";
      titulo.textContent = moeda(v.total) + (cancelada ? " · Cancelada" : "");
      if (cancelada) titulo.style.textDecoration = "line-through";

      const sub = document.createElement("p");
      sub.className = "item-sub";
      sub.textContent = new Date(v.created_at).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
      }) + " · " + (nomesPagamento[v.payment_method] || v.payment_method);

      const itens = document.createElement("p");
      itens.className = "item-sub";
      const lst = itensPorVenda[v.id] || [];
      itens.textContent = lst.length
        ? lst.map(function (i) { return i.quantity + "× " + i.product_name; }).join(", ")
        : "Sem itens";

      info.appendChild(titulo);
      info.appendChild(sub);
      info.appendChild(itens);
      linha.appendChild(info);
      lista.appendChild(linha);
    });
  } catch (e) {
    console.error(e);
    hiMensagem("Não foi possível carregar o histórico: " + (e.message || e));
  }
}

document.getElementById("btnFecharHistorico").addEventListener("click", fecharHistorico);
btnNovoCliente.addEventListener("click", fecharHistorico);

// Nova versão da lista de clientes, com o botão Histórico (substitui a anterior)
function desenharClientes() {
  const termo = clBuscaEl.value.trim().toLowerCase();
  const filtrados = clientesCache.filter(function (c) {
    return c.name.toLowerCase().includes(termo);
  });

  if (filtrados.length === 0) {
    mostrarMensagemLista(
      clientesCache.length === 0
        ? "Nenhum cliente cadastrado ainda."
        : "Nenhum cliente encontrado para essa pesquisa."
    );
    return;
  }

  listaClientesEl.innerHTML = "";

  filtrados.forEach(function (c) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = c.name;
    const contato = document.createElement("p");
    contato.className = "item-sub";
    const partes = [c.phone, c.email].filter(Boolean);
    contato.textContent = partes.length ? partes.join(" · ") : "Sem contato";
    info.appendChild(nome);
    info.appendChild(contato);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (confirmandoId === c.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = "Excluir?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        excluirCliente(c.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        confirmandoId = null;
        desenharClientes();
      }));
    } else {
      acoes.appendChild(criarBotao("Histórico", "btn btn-small", function () {
        confirmandoId = null;
        abrirHistorico(c);
      }));
      acoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function () {
        confirmandoId = null;
        fecharHistorico();
        abrirFormulario(c);
      }));
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        confirmandoId = c.id;
        desenharClientes();
      }));
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    listaClientesEl.appendChild(linha);
  });
}

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) fecharHistorico();
  });
});
// FIM DA PARTE 13

// ===== PARTE 14: Relatórios completos =====
titulos.relatorios = "Relatórios";
const RL_DIA = 86400000;

const rlView = document.createElement("section");
rlView.className = "view";
rlView.id = "view-relatorios";
rlView.innerHTML = `
  <div class="rl-periodos" id="rlPeriodos">
    <button type="button" data-p="7">7 dias</button>
    <button type="button" data-p="30">30 dias</button>
    <button type="button" data-p="90">90 dias</button>
    <button type="button" data-p="mes">Este mês</button>
    <button type="button" data-p="mespassado">Mês passado</button>
    <button type="button" data-p="ano">Este ano</button>
  </div>

  <div class="grid-4">
    <article class="card"><p class="label">Faturamento</p><p class="value" id="rlFat">—</p><p class="hint" id="rlFatComp"></p></article>
    <article class="card"><p class="label">Lucro bruto</p><p class="value" id="rlLucro">—</p><p class="hint">Faturamento − custo dos produtos</p></article>
    <article class="card"><p class="label">Margem</p><p class="value" id="rlMargem">—</p><p class="hint">Quanto sobra de cada venda</p></article>
    <article class="card"><p class="label">Vendas</p><p class="value" id="rlVendas">—</p><p class="hint">Concluídas no período</p></article>
  </div>
  <div class="grid-4 rl-grid2">
    <article class="card"><p class="label">Ticket médio</p><p class="value" id="rlTicket">—</p><p class="hint">Valor médio por venda</p></article>
    <article class="card"><p class="label">Itens vendidos</p><p class="value" id="rlItens">—</p><p class="hint">Unidades</p></article>
    <article class="card"><p class="label">Descontos</p><p class="value" id="rlDesc">—</p><p class="hint">Total concedido</p></article>
    <article class="card"><p class="label">Cancelamentos</p><p class="value" id="rlCanc">—</p><p class="hint" id="rlCancValor"></p></article>
  </div>

  <article class="card" style="margin-bottom:16px;">
    <div class="card-head"><h2 id="rlGraficoTitulo">Faturamento</h2><p class="item-sub" id="rlPeriodoTexto"></p></div>
    <div id="rlGrafico" class="rl-grafico"></div>
  </article>

  <div class="db-duas">
    <article class="card">
      <div class="card-head"><h2>Formas de pagamento</h2></div>
      <div id="rlPagamentos" class="list"></div>
    </article>
    <article class="card">
      <div class="card-head"><h2>Produtos que mais dão lucro</h2></div>
      <div id="rlTopLucro" class="list"></div>
    </article>
  </div>
  <p class="hint" style="margin-top:14px;">Lucro bruto não inclui despesas como aluguel, salários e taxas. Vendas canceladas não entram nas contas.</p>
`;
document.querySelector(".main").appendChild(rlView);

const estiloRelatorios = document.createElement("style");
estiloRelatorios.textContent = `
  .rl-periodos { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; }
  .rl-periodos button {
    padding: 7px 14px; border-radius: 999px; font-size: 13px; font-weight: 500;
    background: var(--surface); border: 1px solid var(--border); color: var(--muted);
    transition: background .15s ease, color .15s ease;
  }
  .rl-periodos button.ativo { background: var(--text); border-color: var(--text); color: #fff; }
  .rl-grid2 .card:first-child { background: var(--surface); border-color: var(--border); color: var(--text); }
  .rl-grid2 .card:first-child .label { color: var(--muted); }
  .rl-grid2 .card:first-child .hint { color: var(--subtle); }
  .rl-grafico { display: flex; align-items: flex-end; gap: 4px; height: 230px; padding-top: 8px; }
  .rl-col { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }
  .rl-barra { width: 100%; max-width: 48px; min-height: 3px; background: var(--text); border-radius: 6px 6px 3px 3px; transition: height .5s ease; }
  .rl-barra.vazia { background: var(--border); }
  .rl-val { font-size: 10px; font-weight: 600; color: var(--muted); white-space: nowrap; }
  .rl-rot { font-size: 11px; color: var(--muted); white-space: nowrap; text-transform: capitalize; }
  .rl-pos { color: var(--success); }
  .rl-neg { color: var(--danger); }
`;
document.head.appendChild(estiloRelatorios);

// Item no menu, logo depois de Vendas
const navMenuRl = document.querySelector(".nav");
if (navMenuRl && !document.getElementById("navRelatorios")) {
  const item = document.createElement("button");
  item.id = "navRelatorios";
  item.type = "button";
  item.className = "nav-item";
  item.dataset.view = "relatorios";
  const ico = document.createElement("span");
  ico.className = "ico";
  ico.textContent = "▥";
  item.appendChild(ico);
  item.appendChild(document.createTextNode("Relatórios"));
  const depoisDe = navMenuRl.querySelector('[data-view="vendas"]');
  if (depoisDe) depoisDe.after(item);
  else navMenuRl.appendChild(item);
}

let rlPeriodoAtual = "30";

function rlSomaDias(data, n) {
  const d = new Date(data);
  d.setDate(d.getDate() + n);
  return d;
}

function rlPeriodo(codigo) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const amanha = rlSomaDias(hoje, 1);
  const a = hoje.getFullYear();
  const m = hoje.getMonth();
  if (codigo === "7") return { ini: rlSomaDias(hoje, -6), fim: amanha };
  if (codigo === "30") return { ini: rlSomaDias(hoje, -29), fim: amanha };
  if (codigo === "90") return { ini: rlSomaDias(hoje, -89), fim: amanha };
  if (codigo === "mes") return { ini: new Date(a, m, 1), fim: amanha };
  if (codigo === "mespassado") return { ini: new Date(a, m - 1, 1), fim: new Date(a, m, 1) };
  return { ini: new Date(a, 0, 1), fim: amanha };
}

function rlMontarGrupos(ini, fim) {
  const dias = Math.round((fim - ini) / RL_DIA);
  const grupos = [];
  let modo;
  if (dias <= 31) {
    modo = "dia";
    for (let d = new Date(ini); d < fim; d = rlSomaDias(d, 1)) {
      grupos.push({ inicio: new Date(d), rotulo: d.getDate() + "/" + (d.getMonth() + 1), valor: 0 });
    }
  } else if (dias <= 120) {
    modo = "semana";
    for (let d = new Date(ini); d < fim; d = rlSomaDias(d, 7)) {
      grupos.push({ inicio: new Date(d), rotulo: d.getDate() + "/" + (d.getMonth() + 1), valor: 0 });
    }
  } else {
    modo = "mes";
    for (let d = new Date(ini.getFullYear(), ini.getMonth(), 1); d < fim; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      grupos.push({
        inicio: new Date(d),
        rotulo: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        valor: 0
      });
    }
  }
  return { modo: modo, grupos: grupos };
}

function rlAcharGrupo(grupos, data) {
  for (let i = grupos.length - 1; i >= 0; i--) {
    if (data >= grupos[i].inicio) return grupos[i];
  }
  return null;
}

function rlDesenharGrafico(grupos) {
  const el = document.getElementById("rlGrafico");
  el.innerHTML = "";
  const maximo = Math.max.apply(null, grupos.map(function (g) { return g.valor; }).concat([0]));
  const mostrarValor = grupos.length <= 12;
  const passo = Math.ceil(grupos.length / 10);

  grupos.forEach(function (g, i) {
    const col = document.createElement("div");
    col.className = "rl-col";
    col.title = g.rotulo + ": " + moeda(g.valor);

    const val = document.createElement("span");
    val.className = "rl-val";
    val.textContent = mostrarValor && g.valor > 0 ? moedaCurta(g.valor) : "";

    const barra = document.createElement("div");
    barra.className = "rl-barra" + (g.valor > 0 ? "" : " vazia");
    barra.style.height = (maximo > 0 ? Math.max(3, Math.round(160 * g.valor / maximo)) : 3) + "px";

    const rot = document.createElement("span");
    rot.className = "rl-rot";
    rot.textContent = g.rotulo;
    if (i % passo !== 0) rot.style.visibility = "hidden";

    col.appendChild(val);
    col.appendChild(barra);
    col.appendChild(rot);
    el.appendChild(col);
  });
}

function rlLista(id, linhas, vazio) {
  const lista = document.getElementById(id);
  lista.innerHTML = "";
  if (linhas.length === 0) {
    const aviso = document.createElement("div");
    aviso.className = "empty";
    aviso.textContent = vazio;
    lista.appendChild(aviso);
    return;
  }
  linhas.forEach(function (l) { dbLinha(lista, l.titulo, l.sub, l.pct); });
}

async function rlBuscarItens(cliente, ids) {
  let todos = [];
  for (let i = 0; i < ids.length; i += 150) {
    const r = await cliente
      .from("sale_items")
      .select("sale_id, product_name, quantity, total, unit_cost")
      .in("sale_id", ids.slice(i, i + 150));
    if (r.error) throw r.error;
    todos = todos.concat(r.data || []);
  }
  return todos;
}

function rlTexto(id, texto) {
  document.getElementById(id).textContent = texto;
}

async function carregarRelatorios() {
  document.querySelectorAll("#rlPeriodos button").forEach(function (b) {
    b.classList.toggle("ativo", b.dataset.p === rlPeriodoAtual);
  });

  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) return;

    const p = rlPeriodo(rlPeriodoAtual);
    const duracao = p.fim - p.ini;
    const antIni = new Date(p.ini.getTime() - duracao);

    const respostas = await Promise.all([
      cliente.from("sales")
        .select("id, total, discount, payment_method, status, created_at")
        .gte("created_at", p.ini.toISOString())
        .lt("created_at", p.fim.toISOString()),
      cliente.from("sales")
        .select("total")
        .gte("created_at", antIni.toISOString())
        .lt("created_at", p.ini.toISOString())
        .neq("status", "cancelled")
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    const todas = respostas[0].data || [];
    const validas = todas.filter(function (v) { return v.status !== "cancelled"; });
    const canceladas = todas.filter(function (v) { return v.status === "cancelled"; });
    const anterior = (respostas[1].data || []).reduce(function (s, v) { return s + Number(v.total); }, 0);

    const itens = validas.length ? await rlBuscarItens(cliente, validas.map(function (v) { return v.id; })) : [];

    // Indicadores
    const faturamento = validas.reduce(function (s, v) { return s + Number(v.total); }, 0);
    const custo = itens.reduce(function (s, i) { return s + Number(i.unit_cost) * i.quantity; }, 0);
    const lucro = faturamento - custo;
    const descontos = validas.reduce(function (s, v) { return s + Number(v.discount || 0); }, 0);
    const unidades = itens.reduce(function (s, i) { return s + i.quantity; }, 0);

    rlTexto("rlFat", moeda(faturamento));
    const comp = document.getElementById("rlFatComp");
    comp.className = "hint";
    if (anterior > 0) {
      const pct = Math.round(100 * (faturamento - anterior) / anterior);
      comp.textContent = (pct >= 0 ? "▲ " : "▼ ") + Math.abs(pct) + "% vs. período anterior";
    } else {
      comp.textContent = "Sem vendas no período anterior";
    }
    rlTexto("rlLucro", moeda(lucro));
    rlTexto("rlMargem", faturamento > 0 ? Math.round(100 * lucro / faturamento) + "%" : "—");
    rlTexto("rlVendas", String(validas.length));
    rlTexto("rlTicket", validas.length ? moeda(faturamento / validas.length) : "—");
    rlTexto("rlItens", String(unidades));
    rlTexto("rlDesc", moeda(descontos));
    rlTexto("rlCanc", String(canceladas.length));
    rlTexto("rlCancValor", canceladas.length
      ? moeda(canceladas.reduce(function (s, v) { return s + Number(v.total); }, 0)) + " cancelados"
      : "Nenhum cancelamento");

    // Gráfico
    const agrupado = rlMontarGrupos(p.ini, p.fim);
    validas.forEach(function (v) {
      const g = rlAcharGrupo(agrupado.grupos, new Date(v.created_at));
      if (g) g.valor += Number(v.total);
    });
    rlTexto("rlGraficoTitulo",
      "Faturamento por " + (agrupado.modo === "dia" ? "dia" : agrupado.modo === "semana" ? "semana" : "mês"));
    rlTexto("rlPeriodoTexto",
      p.ini.toLocaleDateString("pt-BR") + " a " + rlSomaDias(p.fim, -1).toLocaleDateString("pt-BR"));
    rlDesenharGrafico(agrupado.grupos);

    // Formas de pagamento
    const porPagamento = {};
    validas.forEach(function (v) {
      porPagamento[v.payment_method] = (porPagamento[v.payment_method] || 0) + Number(v.total);
    });
    const pagamentos = Object.keys(porPagamento)
      .sort(function (a, b) { return porPagamento[b] - porPagamento[a]; })
      .map(function (k) {
        const pct = faturamento > 0 ? Math.round(100 * porPagamento[k] / faturamento) : 0;
        return { titulo: (nomesPagamento[k] || k) + " · " + pct + "%", sub: moeda(porPagamento[k]), pct: pct };
      });
    rlLista("rlPagamentos", pagamentos, "Nenhuma venda no período.");

    // Produtos que mais dão lucro
    const porProduto = {};
    itens.forEach(function (i) {
      if (!porProduto[i.product_name]) porProduto[i.product_name] = { lucro: 0, qtd: 0 };
      porProduto[i.product_name].lucro += Number(i.total) - Number(i.unit_cost) * i.quantity;
      porProduto[i.product_name].qtd += i.quantity;
    });
    const ranking = Object.keys(porProduto)
      .sort(function (a, b) { return porProduto[b].lucro - porProduto[a].lucro; })
      .slice(0, 5);
    const maiorLucro = ranking.length ? Math.max(porProduto[ranking[0]].lucro, 1) : 1;
    rlLista("rlTopLucro", ranking.map(function (nome, i) {
      const r = porProduto[nome];
      return {
        titulo: (i + 1) + ". " + nome,
        sub: "Lucro " + moeda(r.lucro) + " · " + r.qtd + " un. vendidas",
        pct: Math.max(0, Math.round(100 * r.lucro / maiorLucro))
      };
    }), "Nenhuma venda no período.");
  } catch (e) {
    console.error(e);
    avisar("Não foi possível carregar os relatórios: " + (e.message || e));
  }
}

document.querySelectorAll("#rlPeriodos button").forEach(function (b) {
  b.addEventListener("click", function () {
    rlPeriodoAtual = b.dataset.p;
    carregarRelatorios();
  });
});

document.querySelectorAll('[data-view="relatorios"]').forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarTela("relatorios");
    carregarRelatorios();
  });
});
// FIM DA PARTE 14

// ===== PARTE 15: Exportar planilhas (CSV) =====
const exCard = document.createElement("article");
exCard.className = "card";
exCard.style.marginTop = "16px";
exCard.innerHTML = `
  <div class="card-head"><h2>Exportar planilhas</h2></div>
  <p class="item-sub" style="margin-bottom:14px;">
    Baixe seus dados para abrir no Excel, Numbers ou Google Planilhas.
    As vendas seguem o período escolhido no topo desta tela.
  </p>
  <div class="form-actions">
    <button class="btn btn-ghost" type="button" data-exportar="clientes">Clientes</button>
    <button class="btn btn-ghost" type="button" data-exportar="produtos">Produtos</button>
    <button class="btn btn-ghost" type="button" data-exportar="vendas">Vendas do período</button>
    <button class="btn btn-ghost" type="button" data-exportar="fornecedores">Fornecedores</button>
  </div>
`;
rlView.appendChild(exCard);

function exCampo(valor) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[";\n\r]/.test(texto)) return '"' + texto.replace(/"/g, '""') + '"';
  return texto;
}

function exNumero(valor) {
  return Number(valor || 0).toFixed(2).replace(".", ",");
}

function exData(valor) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function exBaixar(nomeArquivo, cabecalho, linhas) {
  const conteudo = [cabecalho].concat(linhas)
    .map(function (linha) { return linha.map(exCampo).join(";"); })
    .join("\r\n");
  // O "\uFEFF" faz o Excel reconhecer os acentos
  const arquivo = new Blob(["\uFEFF" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
}

function exHoje() {
  return new Date().toLocaleDateString("sv-SE");
}

async function exportar(tipo, botao) {
  const textoOriginal = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Gerando...";

  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) throw new Error("Entre na sua conta para exportar.");

    if (tipo === "clientes") {
      const r = await cliente.from("customers")
        .select("name, phone, email, notes, created_at")
        .order("name", { ascending: true });
      if (r.error) throw r.error;
      exBaixar("arya-clientes-" + exHoje() + ".csv",
        ["Nome", "Telefone", "E-mail", "Observações", "Cadastrado em"],
        (r.data || []).map(function (c) {
          return [c.name, c.phone, c.email, c.notes, exData(c.created_at)];
        }));
      avisar((r.data || []).length + " cliente(s) exportado(s).");
    }

    if (tipo === "produtos") {
      const respostas = await Promise.all([
        cliente.from("products")
          .select("name, description, category_id, cost_price, sale_price, stock_quantity, min_stock")
          .order("name", { ascending: true }),
        cliente.from("categories").select("id, name")
      ]);
      respostas.forEach(function (r) { if (r.error) throw r.error; });
      const cats = {};
      (respostas[1].data || []).forEach(function (c) { cats[c.id] = c.name; });
      exBaixar("arya-produtos-" + exHoje() + ".csv",
        ["Produto", "Descrição", "Categoria", "Custo (R$)", "Preço de venda (R$)", "Margem (%)", "Estoque", "Estoque mínimo"],
        (respostas[0].data || []).map(function (p) {
          const venda = Number(p.sale_price);
          const margem = venda > 0 ? Math.round(100 * (venda - Number(p.cost_price)) / venda) : "";
          return [p.name, p.description, cats[p.category_id] || "Sem categoria",
            exNumero(p.cost_price), exNumero(p.sale_price), margem, p.stock_quantity, p.min_stock];
        }));
      avisar((respostas[0].data || []).length + " produto(s) exportado(s).");
    }

    if (tipo === "vendas") {
      const p = rlPeriodo(rlPeriodoAtual);
      const respostas = await Promise.all([
        cliente.from("sales")
          .select("id, customer_id, subtotal, discount, total, payment_method, status, notes, created_at")
          .gte("created_at", p.ini.toISOString())
          .lt("created_at", p.fim.toISOString())
          .order("created_at", { ascending: true }),
        cliente.from("customers").select("id, name")
      ]);
      respostas.forEach(function (r) { if (r.error) throw r.error; });
      const vendas = respostas[0].data || [];
      const nomesClientes = {};
      (respostas[1].data || []).forEach(function (c) { nomesClientes[c.id] = c.name; });

      const itensPorVenda = {};
      const ids = vendas.map(function (v) { return v.id; });
      for (let i = 0; i < ids.length; i += 150) {
        const r = await cliente.from("sale_items")
          .select("sale_id, product_name, quantity")
          .in("sale_id", ids.slice(i, i + 150));
        if (r.error) throw r.error;
        (r.data || []).forEach(function (it) {
          if (!itensPorVenda[it.sale_id]) itensPorVenda[it.sale_id] = [];
          itensPorVenda[it.sale_id].push(it.quantity + "x " + it.product_name);
        });
      }

      exBaixar("arya-vendas-" + p.ini.toLocaleDateString("sv-SE") + "-a-" + rlSomaDias(p.fim, -1).toLocaleDateString("sv-SE") + ".csv",
        ["Data", "Cliente", "Pagamento", "Status", "Subtotal (R$)", "Desconto (R$)", "Total (R$)", "Itens", "Observações"],
        vendas.map(function (v) {
          return [exData(v.created_at),
            v.customer_id ? (nomesClientes[v.customer_id] || "") : "Sem cliente",
            nomesPagamento[v.payment_method] || v.payment_method,
            v.status === "cancelled" ? "Cancelada" : "Concluída",
            exNumero(v.subtotal), exNumero(v.discount), exNumero(v.total),
            (itensPorVenda[v.id] || []).join(", "), v.notes];
        }));
      avisar(vendas.length + " venda(s) exportada(s).");
    }

    if (tipo === "fornecedores") {
      const r = await cliente.from("suppliers")
        .select("name, phone, email, notes, created_at")
        .order("name", { ascending: true });
      if (r.error) throw r.error;
      exBaixar("arya-fornecedores-" + exHoje() + ".csv",
        ["Fornecedor", "Telefone", "E-mail", "Observações", "Cadastrado em"],
        (r.data || []).map(function (f) {
          return [f.name, f.phone, f.email, f.notes, exData(f.created_at)];
        }));
      avisar((r.data || []).length + " fornecedor(es) exportado(s).");
    }
  } catch (e) {
    console.error(e);
    avisar("Não foi possível exportar: " + (e.message || e));
  } finally {
    botao.disabled = false;
    botao.textContent = textoOriginal;
  }
}

exCard.querySelectorAll("[data-exportar]").forEach(function (botao) {
  botao.addEventListener("click", function () {
    exportar(botao.dataset.exportar, botao);
  });
});
// FIM DA PARTE 15

// ===== PARTE 16: Orçamentos =====
titulos.orcamentos = "Orçamentos";

const ocView = document.createElement("section");
ocView.className = "view";
ocView.id = "view-orcamentos";
ocView.innerHTML = `
  <article class="card wide">
    <div class="card-head">
      <h2>Orçamentos</h2>
      <button class="btn" id="btnNovoOrcamento" type="button">+ Novo orçamento</button>
    </div>

    <div class="form-panel" id="painelOrcamento" hidden>
      <h3>Novo orçamento</h3>
      <div class="field">
        <label for="ocCliente">Cliente</label>
        <select id="ocCliente"><option value="">Sem cliente</option></select>
      </div>
      <div class="field-row">
        <div class="field">
          <label for="ocProduto">Produto</label>
          <select id="ocProduto"><option value="">Escolha um produto</option></select>
        </div>
        <div class="field">
          <label for="ocQtd">Quantidade</label>
          <input id="ocQtd" type="text" inputmode="numeric" placeholder="1" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-ghost btn-small" id="btnOcAdicionar" type="button">+ Adicionar item</button>
      </div>
      <div id="ocItens" class="list"><div class="empty">Nenhum produto adicionado.</div></div>
      <div class="field-row" style="margin-top:14px;">
        <div class="field">
          <label for="ocDesconto">Desconto (R$)</label>
          <input id="ocDesconto" type="text" inputmode="decimal" placeholder="0,00" />
        </div>
        <div class="field">
          <label for="ocValidade">Validade (dias)</label>
          <input id="ocValidade" type="text" inputmode="numeric" placeholder="7" />
        </div>
      </div>
      <div class="field">
        <label for="ocNotas">Observações</label>
        <input id="ocNotas" type="text" placeholder="Ex.: entrega em até 3 dias" />
      </div>
      <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:12px; flex-wrap:wrap; padding:14px 0; margin:6px 0 10px; border-top:1px solid var(--border);">
        <p class="item-sub" id="ocResumo">Subtotal R$ 0,00 · Desconto R$ 0,00</p>
        <div style="text-align:right;">
          <p class="label">Total</p>
          <p id="ocTotal" style="font-size:28px; font-weight:600; letter-spacing:-.03em;">R$ 0,00</p>
        </div>
      </div>
      <p class="form-error" id="ocErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnOcCriar" type="button">Criar orçamento</button>
        <button class="btn btn-ghost" id="btnOcFechar" type="button">Fechar</button>
      </div>
    </div>

    <div class="rl-periodos" id="ocFiltros" style="margin-bottom:8px;">
      <button type="button" data-f="ativos">Em andamento</button>
      <button type="button" data-f="todos">Todos</button>
      <button type="button" data-f="converted">Viraram venda</button>
      <button type="button" data-f="rejected">Recusados</button>
    </div>

    <div id="listaOrcamentos" class="list"><div class="empty">Os orçamentos aparecerão aqui.</div></div>
  </article>
`;
document.querySelector(".main").appendChild(ocView);

const estiloOrcamentos = document.createElement("style");
estiloOrcamentos.textContent = `
  .oc-status { display: inline-block; font-size: 11px; font-weight: 600; letter-spacing: .04em;
    border-radius: 999px; padding: 2px 10px; margin-left: 8px; vertical-align: middle;
    border: 1px solid var(--border); color: var(--muted); }
  .oc-status.sent { color: #2563eb; border-color: #bfdbfe; }
  .oc-status.accepted { color: var(--success); border-color: #bbf7d0; }
  .oc-status.rejected { color: var(--danger); border-color: #fecaca; }
  .oc-status.converted { color: #fff; background: var(--text); border-color: var(--text); }
  .oc-status.vencido { color: #d97706; border-color: #fde68a; }
  .oc-converter { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .oc-converter select { padding: 6px 10px; border: 1px solid var(--border); border-radius: 8px;
    background: var(--surface); font: inherit; font-size: 13px; }
`;
document.head.appendChild(estiloOrcamentos);

// Item no menu, logo depois de Vendas
const navMenuOc = document.querySelector(".nav");
if (navMenuOc && !document.getElementById("navOrcamentos")) {
  const item = document.createElement("button");
  item.id = "navOrcamentos";
  item.type = "button";
  item.className = "nav-item";
  item.dataset.view = "orcamentos";
  const ico = document.createElement("span");
  ico.className = "ico";
  ico.textContent = "◇";
  item.appendChild(ico);
  item.appendChild(document.createTextNode("Orçamentos"));
  const depoisDe = navMenuOc.querySelector('[data-view="vendas"]');
  if (depoisDe) depoisDe.after(item);
  else navMenuOc.appendChild(item);
}

const OC_STATUS = {
  open: "Aberto", sent: "Enviado", accepted: "Aceito", rejected: "Recusado", converted: "Virou venda"
};

const selOcCliente = document.getElementById("ocCliente");
const selOcProduto = document.getElementById("ocProduto");
const inOcQtd = document.getElementById("ocQtd");
const inOcDesconto = document.getElementById("ocDesconto");
const inOcValidade = document.getElementById("ocValidade");
const inOcNotas = document.getElementById("ocNotas");
const ocErroEl = document.getElementById("ocErro");
const ocItensEl = document.getElementById("ocItens");
const listaOrcamentosEl = document.getElementById("listaOrcamentos");
const painelOrcamento = document.getElementById("painelOrcamento");
const btnOcCriar = document.getElementById("btnOcCriar");

let ocClientes = [];
let ocProdutos = [];
let ocOrcamentos = [];
let ocItensPorOrcamento = {};
let ocCarrinho = [];
let ocFiltro = "ativos";
let ocConvertendoId = null;
let ocConfirmandoExcluirId = null;

function ocVazio(el, texto) {
  el.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  el.appendChild(aviso);
}

function ocProduto(id) { return ocProdutos.find(function (p) { return p.id === id; }); }
function ocCliente(id) { return ocClientes.find(function (c) { return c.id === id; }); }

function ocHoje() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function ocVencido(o) {
  if (!o.valid_until || (o.status !== "open" && o.status !== "sent")) return false;
  return new Date(o.valid_until + "T00:00:00") < ocHoje();
}

function ocDataCurta(dataTexto) {
  return new Date(dataTexto + "T00:00:00").toLocaleDateString("pt-BR");
}

function ocPreencherSelects() {
  const cAtual = selOcCliente.value;
  selOcCliente.innerHTML = "";
  const sem = document.createElement("option");
  sem.value = "";
  sem.textContent = "Sem cliente";
  selOcCliente.appendChild(sem);
  ocClientes.forEach(function (c) {
    const o = document.createElement("option");
    o.value = c.id;
    o.textContent = c.name;
    selOcCliente.appendChild(o);
  });
  selOcCliente.value = ocCliente(cAtual) ? cAtual : "";

  selOcProduto.innerHTML = "";
  const esc = document.createElement("option");
  esc.value = "";
  esc.textContent = "Escolha um produto";
  selOcProduto.appendChild(esc);
  ocProdutos.forEach(function (p) {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.name + " · " + moeda(p.sale_price) + " · estoque " + p.stock_quantity;
    selOcProduto.appendChild(o);
  });
}

function ocSubtotal() {
  return ocCarrinho.reduce(function (s, it) {
    const p = ocProduto(it.product_id);
    return p ? s + Number(p.sale_price) * it.quantity : s;
  }, 0);
}

function ocAtualizarResumo() {
  const sub = ocSubtotal();
  let desc = lerNumero(inOcDesconto.value);
  if (Number.isNaN(desc)) desc = 0;
  document.getElementById("ocResumo").textContent = "Subtotal " + moeda(sub) + " · Desconto " + moeda(desc);
  document.getElementById("ocTotal").textContent = moeda(Math.max(0, sub - desc));
}

function ocDesenharCarrinho() {
  if (ocCarrinho.length === 0) {
    ocVazio(ocItensEl, "Nenhum produto adicionado.");
    ocAtualizarResumo();
    return;
  }
  ocItensEl.innerHTML = "";
  ocCarrinho.forEach(function (it) {
    const p = ocProduto(it.product_id);
    if (!p) return;
    const linha = document.createElement("div");
    linha.className = "list-item";
    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = p.name;
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = it.quantity + " × " + moeda(p.sale_price) + " = " + moeda(Number(p.sale_price) * it.quantity);
    info.appendChild(nome);
    info.appendChild(sub);
    const acoes = document.createElement("div");
    acoes.className = "item-actions";
    acoes.appendChild(criarBotao("Remover", "btn btn-ghost btn-small", function () {
      ocCarrinho = ocCarrinho.filter(function (x) { return x.product_id !== it.product_id; });
      ocDesenharCarrinho();
    }));
    linha.appendChild(info);
    linha.appendChild(acoes);
    ocItensEl.appendChild(linha);
  });
  ocAtualizarResumo();
}

function ocAdicionarItem() {
  ocErroEl.textContent = "";
  const id = selOcProduto.value;
  if (!id) {
    ocErroEl.textContent = "Escolha um produto.";
    return;
  }
  const texto = inOcQtd.value.trim() || "1";
  if (!/^\d+$/.test(texto) || Number(texto) <= 0) {
    ocErroEl.textContent = "Quantidade inválida. Use números inteiros (ex.: 2).";
    return;
  }
  const existente = ocCarrinho.find(function (x) { return x.product_id === id; });
  if (existente) existente.quantity += Number(texto);
  else ocCarrinho.push({ product_id: id, quantity: Number(texto) });
  inOcQtd.value = "";
  selOcProduto.value = "";
  ocDesenharCarrinho();
}

function ocLimparFormulario() {
  ocCarrinho = [];
  selOcCliente.value = "";
  selOcProduto.value = "";
  inOcQtd.value = "";
  inOcDesconto.value = "";
  inOcValidade.value = "";
  inOcNotas.value = "";
  ocErroEl.textContent = "";
  ocDesenharCarrinho();
}

async function ocCriar() {
  ocErroEl.textContent = "";
  if (ocCarrinho.length === 0) {
    ocErroEl.textContent = "Adicione pelo menos um produto ao orçamento.";
    return;
  }
  const desc = lerNumero(inOcDesconto.value);
  if (Number.isNaN(desc)) {
    ocErroEl.textContent = "Desconto inválido. Use números, como 10,00.";
    return;
  }
  if (desc > ocSubtotal()) {
    ocErroEl.textContent = "O desconto não pode ser maior que o valor do orçamento.";
    return;
  }
  const textoValidade = inOcValidade.value.trim() || "7";
  if (!/^\d+$/.test(textoValidade) || Number(textoValidade) < 1 || Number(textoValidade) > 365) {
    ocErroEl.textContent = "Validade inválida. Use de 1 a 365 dias.";
    return;
  }

  btnOcCriar.disabled = true;
  btnOcCriar.textContent = "Criando...";
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.rpc("create_quote", {
      p_items: ocCarrinho.map(function (x) { return { product_id: x.product_id, quantity: x.quantity }; }),
      p_customer_id: selOcCliente.value || null,
      p_discount: desc,
      p_notes: inOcNotas.value.trim() || null,
      p_valid_days: Number(textoValidade)
    });
    if (r.error) throw r.error;
    avisar("Orçamento criado.");
    ocLimparFormulario();
    painelOrcamento.hidden = true;
    ocFiltro = "ativos";
    await carregarOrcamentos();
  } catch (e) {
    console.error(e);
    ocErroEl.textContent = e && e.message ? e.message : String(e);
  } finally {
    btnOcCriar.disabled = false;
    btnOcCriar.textContent = "Criar orçamento";
  }
}

function ocTextoWhats(o) {
  const empresa = document.querySelector(".sidebar-foot").textContent.trim();
  const c = o.customer_id ? ocCliente(o.customer_id) : null;
  const saudacao = c ? "Olá, " + String(c.name).trim().split(" ")[0] + "!" : "Olá!";
  const linhas = [saudacao + " Segue seu orçamento da " + empresa + ":", ""];
  (ocItensPorOrcamento[o.id] || []).forEach(function (i) {
    linhas.push("• " + i.quantity + "x " + i.product_name + " — " + moeda(i.total));
  });
  linhas.push("");
  if (Number(o.discount) > 0) {
    linhas.push("Subtotal: " + moeda(o.subtotal));
    linhas.push("Desconto: " + moeda(o.discount));
  }
  linhas.push("*Total: " + moeda(o.total) + "*");
  if (o.valid_until) linhas.push("Válido até " + ocDataCurta(o.valid_until) + ".");
  if (o.notes) linhas.push(o.notes);
  linhas.push("");
  linhas.push("Qualquer dúvida, é só chamar!");
  return linhas.join("\n");
}

function ocLinkWhats(o) {
  const c = o.customer_id ? ocCliente(o.customer_id) : null;
  let d = c ? String(c.phone || "").replace(/\D/g, "") : "";
  if (d.length === 10 || d.length === 11) d = "55" + d;
  const texto = encodeURIComponent(ocTextoWhats(o));
  return d.length >= 12 ? "https://wa.me/" + d + "?text=" + texto : "https://wa.me/?text=" + texto;
}

async function ocMudarStatus(id, status, mensagem) {
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.rpc("set_quote_status", { p_quote_id: id, p_status: status });
    if (r.error) throw r.error;
    if (mensagem) avisar(mensagem);
    await carregarOrcamentos();
  } catch (e) {
    console.error(e);
    avisar("Não foi possível atualizar: " + (e.message || e));
  }
}

async function ocConverter(id, pagamento) {
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.rpc("convert_quote_to_sale", { p_quote_id: id, p_payment_method: pagamento });
    if (r.error) throw r.error;
    ocConvertendoId = null;
    avisar("Orçamento virou venda! O estoque foi atualizado.");
    await carregarOrcamentos();
  } catch (e) {
    console.error(e);
    avisar("Não foi possível converter: " + (e.message || e));
  }
}

async function ocExcluir(id) {
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.from("quotes").delete().eq("id", id).select("id");
    if (r.error) throw r.error;
    if (!r.data || r.data.length === 0) {
      throw new Error("Só a dona/dono ou um administrador pode excluir orçamentos.");
    }
    ocConfirmandoExcluirId = null;
    avisar("Orçamento excluído.");
    await carregarOrcamentos();
  } catch (e) {
    console.error(e);
    ocConfirmandoExcluirId = null;
    avisar("Não foi possível excluir: " + (e.message || e));
    desenharOrcamentos();
  }
}

function desenharOrcamentos() {
  document.querySelectorAll("#ocFiltros button").forEach(function (b) {
    b.classList.toggle("ativo", b.dataset.f === ocFiltro);
  });

  const lista = ocOrcamentos.filter(function (o) {
    if (ocFiltro === "todos") return true;
    if (ocFiltro === "ativos") return o.status === "open" || o.status === "sent" || o.status === "accepted";
    return o.status === ocFiltro;
  });

  if (lista.length === 0) {
    ocVazio(listaOrcamentosEl, ocOrcamentos.length === 0
      ? "Nenhum orçamento ainda. Toque em + Novo orçamento."
      : "Nenhum orçamento neste filtro.");
    return;
  }

  listaOrcamentosEl.innerHTML = "";
  lista.forEach(function (o) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const titulo = document.createElement("p");
    titulo.className = "item-title";
    titulo.textContent = moeda(o.total);
    const selo = document.createElement("span");
    selo.className = "oc-status " + o.status;
    selo.textContent = OC_STATUS[o.status] || o.status;
    titulo.appendChild(selo);
    if (ocVencido(o)) {
      const vencido = document.createElement("span");
      vencido.className = "oc-status vencido";
      vencido.textContent = "Vencido";
      titulo.appendChild(vencido);
    }

    const c = o.customer_id ? ocCliente(o.customer_id) : null;
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = new Date(o.created_at).toLocaleDateString("pt-BR") + " · " +
      (c ? c.name : "Sem cliente") +
      (o.valid_until ? " · válido até " + ocDataCurta(o.valid_until) : "");

    const itens = document.createElement("p");
    itens.className = "item-sub";
    itens.textContent = (ocItensPorOrcamento[o.id] || [])
      .map(function (i) { return i.quantity + "× " + i.product_name; }).join(", ") || "Sem itens";

    info.appendChild(titulo);
    info.appendChild(sub);
    info.appendChild(itens);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";

    if (ocConfirmandoExcluirId === o.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = "Excluir orçamento?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () { ocExcluir(o.id); }));
      acoes.appendChild(criarBotao("Voltar", "btn btn-ghost btn-small", function () {
        ocConfirmandoExcluirId = null;
        desenharOrcamentos();
      }));
    } else if (ocConvertendoId === o.id) {
      const caixa = document.createElement("div");
      caixa.className = "oc-converter";
      const rotulo = document.createElement("span");
      rotulo.className = "item-sub";
      rotulo.textContent = "Pagamento:";
      const sel = document.createElement("select");
      Object.keys(nomesPagamento).forEach(function (k) {
        const op = document.createElement("option");
        op.value = k;
        op.textContent = nomesPagamento[k];
        sel.appendChild(op);
      });
      sel.value = "pix";
      caixa.appendChild(rotulo);
      caixa.appendChild(sel);
      const confirmar = criarBotao("Confirmar venda", "btn btn-small", function () {
        confirmar.disabled = true;
        confirmar.textContent = "Registrando...";
        ocConverter(o.id, sel.value);
      });
      caixa.appendChild(confirmar);
      caixa.appendChild(criarBotao("Voltar", "btn btn-ghost btn-small", function () {
        ocConvertendoId = null;
        desenharOrcamentos();
      }));
      acoes.appendChild(caixa);
    } else {
      if (o.status !== "converted" && o.status !== "rejected") {
        const a = document.createElement("a");
        a.className = "btn btn-ghost btn-small";
        a.href = ocLinkWhats(o);
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "WhatsApp";
        a.addEventListener("click", function () {
          if (o.status === "open") ocMudarStatus(o.id, "sent", "Marcado como enviado.");
        });
        acoes.appendChild(a);
        acoes.appendChild(criarBotao("Virar venda", "btn btn-small", function () {
          ocConvertendoId = o.id;
          ocConfirmandoExcluirId = null;
          desenharOrcamentos();
        }));
        if (o.status !== "accepted") {
          acoes.appendChild(criarBotao("Aceito", "btn btn-ghost btn-small", function () {
            ocMudarStatus(o.id, "accepted", "Orçamento aceito.");
          }));
        }
        acoes.appendChild(criarBotao("Recusado", "btn btn-ghost btn-small", function () {
          ocMudarStatus(o.id, "rejected", "Orçamento marcado como recusado.");
        }));
      }
      if (o.status === "rejected") {
        acoes.appendChild(criarBotao("Reabrir", "btn btn-ghost btn-small", function () {
          ocMudarStatus(o.id, "open", "Orçamento reaberto.");
        }));
      }
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        ocConfirmandoExcluirId = o.id;
        ocConvertendoId = null;
        desenharOrcamentos();
      }));
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    listaOrcamentosEl.appendChild(linha);
  });
}

async function carregarOrcamentos() {
  ocVazio(listaOrcamentosEl, "Carregando orçamentos...");
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      ocVazio(listaOrcamentosEl, "Entre na sua conta para ver os orçamentos.");
      return;
    }

    const respostas = await Promise.all([
      cliente.from("customers").select("id, name, phone").order("name", { ascending: true }),
      cliente.from("products").select("id, name, sale_price, stock_quantity").order("name", { ascending: true }),
      cliente.from("quotes")
        .select("id, customer_id, status, subtotal, discount, total, notes, valid_until, created_at")
        .order("created_at", { ascending: false })
        .limit(60)
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    ocClientes = respostas[0].data || [];
    ocProdutos = respostas[1].data || [];
    ocOrcamentos = respostas[2].data || [];

    ocItensPorOrcamento = {};
    if (ocOrcamentos.length) {
      const r = await cliente.from("quote_items")
        .select("quote_id, product_name, quantity, total")
        .in("quote_id", ocOrcamentos.map(function (o) { return o.id; }));
      if (r.error) throw r.error;
      (r.data || []).forEach(function (i) {
        if (!ocItensPorOrcamento[i.quote_id]) ocItensPorOrcamento[i.quote_id] = [];
        ocItensPorOrcamento[i.quote_id].push(i);
      });
    }

    ocCarrinho = ocCarrinho.filter(function (x) { return ocProduto(x.product_id); });
    ocConvertendoId = null;
    ocConfirmandoExcluirId = null;
    ocPreencherSelects();
    ocDesenharCarrinho();
    desenharOrcamentos();
  } catch (e) {
    console.error(e);
    ocVazio(listaOrcamentosEl, "Não foi possível carregar os orçamentos: " + (e.message || e));
  }
}

document.getElementById("btnNovoOrcamento").addEventListener("click", function () {
  ocErroEl.textContent = "";
  painelOrcamento.hidden = false;
  painelOrcamento.scrollIntoView({ behavior: "smooth", block: "start" });
});
document.getElementById("btnOcFechar").addEventListener("click", function () {
  painelOrcamento.hidden = true;
});
document.getElementById("btnOcAdicionar").addEventListener("click", ocAdicionarItem);
btnOcCriar.addEventListener("click", ocCriar);
inOcDesconto.addEventListener("input", ocAtualizarResumo);
document.querySelectorAll("#ocFiltros button").forEach(function (b) {
  b.addEventListener("click", function () {
    ocFiltro = b.dataset.f;
    ocConvertendoId = null;
    ocConfirmandoExcluirId = null;
    desenharOrcamentos();
  });
});

document.querySelectorAll('[data-view="orcamentos"]').forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarTela("orcamentos");
    carregarOrcamentos();
  });
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) {
      ocOrcamentos = [];
      ocLimparFormulario();
      painelOrcamento.hidden = true;
      ocVazio(listaOrcamentosEl, "Os orçamentos aparecerão aqui.");
    }
  });
});
// FIM DA PARTE 16

// ===== PARTE 17: Pulso + Orçamentos =====
// Esta versão de puDesenhar substitui a anterior e acrescenta os alertas de orçamentos.
let puOrcToken = 0;

function puCriarCard(ins) {
  const card = puEl("article", "card pulso-card");

  const topo = puEl("div", "pulso-topo");
  topo.appendChild(puEl("span", "pulso-prio " + ins.prio, PU_PRIO_NOME[ins.prio]));
  topo.appendChild(puEl("span", "pulso-tag", ins.tag));
  card.appendChild(topo);

  card.appendChild(puEl("p", "pulso-titulo", "✦ " + ins.titulo));

  const viu = puEl("div", "pulso-bloco");
  viu.appendChild(puEl("p", "pulso-bloco-label", "O que eu vi"));
  viu.appendChild(puEl("p", "", ins.viu));
  card.appendChild(viu);

  const sug = puEl("div", "pulso-bloco");
  sug.appendChild(puEl("p", "pulso-bloco-label", "Sugestão"));
  sug.appendChild(puEl("p", "", ins.sugestao));
  card.appendChild(sug);

  if (ins.itens && ins.itens.length) {
    const itens = puEl("div", "pulso-itens");
    ins.itens.slice(0, 5).forEach(function (it) {
      const linha = puEl("div", "list-item");
      const info = puEl("div");
      info.appendChild(puEl("p", "item-title", it.titulo));
      info.appendChild(puEl("p", "item-sub", it.sub));
      linha.appendChild(info);
      if (it.link) {
        const a = puEl("a", "btn btn-ghost btn-small", "WhatsApp");
        a.href = it.link;
        a.target = "_blank";
        a.rel = "noopener";
        linha.appendChild(a);
      }
      itens.appendChild(linha);
    });
    if (ins.itens.length > 5) {
      itens.appendChild(puEl("p", "item-sub", "+ " + (ins.itens.length - 5) + " outro(s)"));
    }
    card.appendChild(itens);
  }

  if (ins.acao) {
    const acoes = puEl("div", "pulso-acoes");
    acoes.appendChild(criarBotao(ins.acao.texto, "btn btn-small", function () { puIr(ins.acao.view); }));
    card.appendChild(acoes);
  }
  return card;
}

function puDesenhar(insights) {
  const lista = document.getElementById("puLista");
  lista.innerHTML = "";

  if (insights.length === 0) {
    puMensagem("✦ Nenhum alerta agora. Continue registrando vendas: quanto mais dados, mais o Pulso enxerga.");
  } else {
    insights.sort(function (a, b) { return PU_ORDEM[a.prio] - PU_ORDEM[b.prio]; });
    insights.forEach(function (ins) { lista.appendChild(puCriarCard(ins)); });
  }

  puAdicionarOrcamentos(insights.length);
}

function puWhatsSeguimento(c, total) {
  if (!c) return null;
  let d = String(c.phone || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12) return null;
  const msg = "Oi, " + String(c.name).trim().split(" ")[0] +
    "! Tudo bem? Passando para saber se você conseguiu ver o orçamento de " + moeda(total) +
    ". Posso ajudar com alguma dúvida?";
  return "https://wa.me/" + d + "?text=" + encodeURIComponent(msg);
}

async function puAdicionarOrcamentos(qtdBase) {
  const meuToken = ++puOrcToken;
  try {
    const cliente = await iniciarSupabase();
    const desde = new Date(Date.now() - 89 * PU_DIA_MS);
    const respostas = await Promise.all([
      cliente.from("quotes")
        .select("id, customer_id, status, total, valid_until, created_at, updated_at")
        .gte("created_at", desde.toISOString()),
      cliente.from("customers").select("id, name, phone")
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });
    if (meuToken !== puOrcToken) return; // a tela foi recarregada enquanto buscava

    const orcamentos = respostas[0].data || [];
    if (orcamentos.length === 0) return;

    const clientesMap = {};
    (respostas[1].data || []).forEach(function (c) { clientesMap[c.id] = c; });

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    function diasDesde(data) {
      const d = new Date(data);
      d.setHours(0, 0, 0, 0);
      return Math.round((hoje - d) / PU_DIA_MS);
    }
    function nomeCliente(o) {
      return o.customer_id && clientesMap[o.customer_id] ? clientesMap[o.customer_id].name : "Sem cliente";
    }

    const extras = [];

    // 1) Aceitos que ainda não viraram venda
    const aceitos = orcamentos.filter(function (o) { return o.status === "accepted"; });
    if (aceitos.length) {
      const soma = aceitos.reduce(function (s, o) { return s + Number(o.total); }, 0);
      extras.push({
        prio: "alta",
        tag: "Orçamentos",
        titulo: aceitos.length + " orçamento(s) aceitos esperando virar venda",
        viu: "Estes clientes aceitaram o orçamento, mas a venda ainda não foi registrada. São " + moeda(soma) + " a receber.",
        sugestao: "Combine o pagamento e a entrega, e toque em \"Virar venda\" para registrar e dar baixa no estoque.",
        itens: aceitos.map(function (o) {
          return { titulo: nomeCliente(o), sub: moeda(o.total) + " · aceito há " + diasDesde(o.updated_at) + " dia(s)" };
        }),
        acao: { texto: "Abrir Orçamentos", view: "orcamentos" }
      });
    }

    // 2) Enviados sem resposta há 2 dias ou mais
    const semResposta = orcamentos.filter(function (o) {
      return o.status === "sent" && diasDesde(o.updated_at) >= 2;
    });
    if (semResposta.length) {
      extras.push({
        prio: "media",
        tag: "Orçamentos",
        titulo: semResposta.length + " orçamento(s) sem resposta",
        viu: "Estes orçamentos foram enviados há 2 dias ou mais e o cliente ainda não respondeu.",
        sugestao: "Mande uma mensagem curta e gentil perguntando se ficou alguma dúvida. Muitas vendas fecham no acompanhamento.",
        itens: semResposta
          .sort(function (a, b) { return Number(b.total) - Number(a.total); })
          .map(function (o) {
            const c = o.customer_id ? clientesMap[o.customer_id] : null;
            return {
              titulo: nomeCliente(o),
              sub: moeda(o.total) + " · enviado há " + diasDesde(o.updated_at) + " dia(s)",
              link: puWhatsSeguimento(c, o.total)
            };
          }),
        acao: { texto: "Abrir Orçamentos", view: "orcamentos" }
      });
    }

    // 3) Vencendo nos próximos 2 dias
    const vencendo = orcamentos.filter(function (o) {
      if (!o.valid_until || (o.status !== "open" && o.status !== "sent")) return false;
      const faltam = -diasDesde(o.valid_until + "T00:00:00");
      return faltam >= 0 && faltam <= 2;
    });
    if (vencendo.length) {
      extras.push({
        prio: "media",
        tag: "Orçamentos",
        titulo: vencendo.length + " orçamento(s) vencendo em até 2 dias",
        viu: "A validade destes orçamentos termina hoje ou nos próximos 2 dias.",
        sugestao: "Avise o cliente que o preço é garantido só até o vencimento. Isso costuma acelerar a decisão.",
        itens: vencendo.map(function (o) {
          const faltam = -diasDesde(o.valid_until + "T00:00:00");
          return {
            titulo: nomeCliente(o),
            sub: moeda(o.total) + " · " + (faltam === 0 ? "vence hoje" : "vence em " + faltam + " dia(s)")
          };
        }),
        acao: { texto: "Abrir Orçamentos", view: "orcamentos" }
      });
    }

    // 4) Taxa de conversão (com pelo menos 3 orçamentos finalizados)
    const convertidos = orcamentos.filter(function (o) { return o.status === "converted"; }).length;
    const recusados = orcamentos.filter(function (o) { return o.status === "rejected"; }).length;
    const finalizados = convertidos + recusados;
    if (finalizados >= 3) {
      const taxa = Math.round(100 * convertidos / finalizados);
      extras.push({
        prio: "oportunidade",
        tag: "Orçamentos",
        titulo: taxa + "% dos seus orçamentos viram venda",
        viu: "Nos últimos 90 dias, de " + finalizados + " orçamentos finalizados, " + convertidos +
          " viraram venda e " + recusados + " foram recusados.",
        sugestao: taxa >= 50
          ? "Ótima taxa! Mande mais orçamentos: cada um tem boa chance de virar dinheiro."
          : "Pergunte aos clientes que recusaram o motivo (preço, prazo, produto). Isso mostra o que ajustar.",
        itens: []
      });
    }

    if (extras.length === 0 || meuToken !== puOrcToken) return;

    const lista = document.getElementById("puLista");
    if (qtdBase === 0) lista.innerHTML = "";
    extras.sort(function (a, b) { return PU_ORDEM[a.prio] - PU_ORDEM[b.prio]; });

    // Alertas de prioridade alta entram no topo; os demais, no fim
    extras.forEach(function (ins) {
      const card = puCriarCard(ins);
      if (ins.prio === "alta") lista.insertBefore(card, lista.firstChild);
      else lista.appendChild(card);
    });

    document.getElementById("puQtd").textContent = String(qtdBase + extras.length);
  } catch (e) {
    console.error("Pulso (orçamentos):", e);
  }
}
// FIM DA PARTE 17

// ===== PARTE 18: Meta do mês (no Dashboard) =====
const mtCard = document.createElement("article");
mtCard.className = "card";
mtCard.id = "cardMeta";
mtCard.style.marginBottom = "16px";
mtCard.innerHTML = `
  <div class="card-head">
    <h2 id="mtTitulo">Meta do mês</h2>
    <button class="btn btn-ghost btn-small" id="btnMtEditar" type="button">Definir meta</button>
  </div>
  <div id="mtEditor" class="mt-editor" hidden>
    <div class="field" style="margin:0; flex:1; min-width:180px;">
      <label for="mtValor">Meta de faturamento do mês (R$)</label>
      <input id="mtValor" type="text" inputmode="decimal" placeholder="Ex.: 10.000,00" />
    </div>
    <button class="btn" id="btnMtSalvar" type="button">Salvar</button>
    <button class="btn btn-ghost" id="btnMtCancelar" type="button">Cancelar</button>
  </div>
  <p class="form-error" id="mtErro" role="alert"></p>
  <div id="mtConteudo">
    <p class="item-sub">Carregando...</p>
  </div>
`;
const dashGrid = document.querySelector("#view-dashboard .grid-4");
if (dashGrid) dashGrid.after(mtCard);

const estiloMeta = document.createElement("style");
estiloMeta.textContent = `
  .mt-editor { display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
  .mt-editor[hidden] { display: none; }
  .mt-numeros { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
  .mt-grande { font-size: 30px; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .mt-pct { font-size: 30px; font-weight: 600; letter-spacing: -.03em; }
  .mt-barra { height: 12px; border-radius: 999px; background: var(--surface-2); overflow: hidden; margin: 12px 0 14px; position: relative; }
  .mt-barra > .mt-feito { height: 100%; background: var(--text); border-radius: 999px; transition: width .6s ease; }
  .mt-barra > .mt-esperado { position: absolute; top: -3px; bottom: -3px; width: 2px; background: var(--subtle); }
  .mt-infos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .mt-infos > div { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 12px 14px; }
  .mt-infos .hi-valor { font-size: 17px; }
  .mt-batida { color: var(--success); font-weight: 600; }
  @media (max-width: 700px) { .mt-infos { grid-template-columns: 1fr; } }
`;
document.head.appendChild(estiloMeta);

let mtEmpresa = null;   // { id, settings }
let mtTimer = null;

function mtMostrarEditor(mostrar) {
  document.getElementById("mtEditor").hidden = !mostrar;
  document.getElementById("mtErro").textContent = "";
  if (mostrar) {
    const atual = mtEmpresa && mtEmpresa.settings ? Number(mtEmpresa.settings.meta_mensal || 0) : 0;
    document.getElementById("mtValor").value = atual > 0 ? numeroParaCampo(atual) : "";
    document.getElementById("mtValor").focus();
  }
}

function mtCaixa(rotulo, valor) {
  const caixa = document.createElement("div");
  const r = document.createElement("p");
  r.className = "label";
  r.textContent = rotulo;
  const v = document.createElement("p");
  v.className = "hi-valor";
  v.textContent = valor;
  caixa.appendChild(r);
  caixa.appendChild(v);
  return caixa;
}

async function carregarMeta() {
  const conteudo = document.getElementById("mtConteudo");
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      conteudo.innerHTML = "";
      return;
    }

    const empresaId = await obterEmpresaId();
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const respostas = await Promise.all([
      cliente.from("companies").select("id, settings").eq("id", empresaId).maybeSingle(),
      cliente.from("sales")
        .select("total")
        .gte("created_at", inicioMes.toISOString())
        .neq("status", "cancelled")
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    mtEmpresa = respostas[0].data || { id: empresaId, settings: {} };
    const meta = Number((mtEmpresa.settings || {}).meta_mensal || 0);
    const vendido = (respostas[1].data || []).reduce(function (s, v) { return s + Number(v.total); }, 0);

    const nomeMes = agora.toLocaleDateString("pt-BR", { month: "long" });
    document.getElementById("mtTitulo").textContent =
      "Meta de " + nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1);
    document.getElementById("btnMtEditar").textContent = meta > 0 ? "Alterar meta" : "Definir meta";

    conteudo.innerHTML = "";

    if (meta <= 0) {
      const aviso = document.createElement("div");
      aviso.className = "empty";
      aviso.textContent = "✦ Defina uma meta de faturamento para o mês. A ARYA mostra se você está no caminho e quanto falta por dia.";
      conteudo.appendChild(aviso);
      return;
    }

    const diasNoMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
    const diaHoje = agora.getDate();
    const diasRestantes = diasNoMes - diaHoje + 1; // inclui hoje
    const pct = Math.round(100 * vendido / meta);
    const esperadoPct = Math.round(100 * (diaHoje - 1) / diasNoMes);
    const projecao = diaHoje > 1 ? (vendido / (diaHoje - 1 + (agora.getHours() / 24))) * diasNoMes : null;
    const falta = Math.max(0, meta - vendido);

    // Números principais
    const numeros = document.createElement("div");
    numeros.className = "mt-numeros";
    const esquerda = document.createElement("div");
    const grande = document.createElement("p");
    grande.className = "mt-grande";
    grande.textContent = moeda(vendido);
    const de = document.createElement("p");
    de.className = "item-sub";
    de.textContent = "de " + moeda(meta);
    esquerda.appendChild(grande);
    esquerda.appendChild(de);
    const porcento = document.createElement("p");
    porcento.className = "mt-pct";
    porcento.textContent = pct + "%";
    numeros.appendChild(esquerda);
    numeros.appendChild(porcento);
    conteudo.appendChild(numeros);

    // Barra (a marquinha cinza mostra onde você "deveria" estar hoje)
    const barra = document.createElement("div");
    barra.className = "mt-barra";
    const feito = document.createElement("div");
    feito.className = "mt-feito";
    feito.style.width = Math.min(100, pct) + "%";
    const esperado = document.createElement("div");
    esperado.className = "mt-esperado";
    esperado.style.left = Math.min(100, esperadoPct) + "%";
    esperado.title = "Onde você precisaria estar hoje";
    barra.appendChild(feito);
    barra.appendChild(esperado);
    conteudo.appendChild(barra);

    if (vendido >= meta) {
      const festa = document.createElement("p");
      festa.className = "mt-batida";
      festa.textContent = "✦ Meta batida! Você já vendeu " + moeda(vendido - meta) + " além da meta este mês.";
      conteudo.appendChild(festa);
      return;
    }

    const infos = document.createElement("div");
    infos.className = "mt-infos";
    infos.appendChild(mtCaixa("Falta vender", moeda(falta)));
    infos.appendChild(mtCaixa("Por dia (" + diasRestantes + " dias)", moeda(falta / diasRestantes)));
    infos.appendChild(mtCaixa("Projeção do mês",
      projecao === null ? "Disponível amanhã" : moeda(projecao)));
    conteudo.appendChild(infos);

    if (projecao !== null) {
      const ritmo = document.createElement("p");
      ritmo.className = "item-sub";
      ritmo.style.marginTop = "12px";
      ritmo.textContent = projecao >= meta
        ? "✦ No ritmo atual, você bate a meta. Continue assim!"
        : "✦ No ritmo atual, faltariam " + moeda(meta - projecao) + ". Um orçamento fechado ou uma campanha para clientes inativos pode cobrir essa diferença.";
      conteudo.appendChild(ritmo);
    }
  } catch (e) {
    console.error(e);
    conteudo.innerHTML = "";
    const erro = document.createElement("p");
    erro.className = "item-sub";
    erro.textContent = "Não foi possível carregar a meta: " + (e.message || e);
    conteudo.appendChild(erro);
  }
}

async function salvarMeta() {
  const erro = document.getElementById("mtErro");
  erro.textContent = "";
  const valor = lerNumero(document.getElementById("mtValor").value);
  if (Number.isNaN(valor) || valor < 0) {
    erro.textContent = "Valor inválido. Use números, como 10.000,00.";
    return;
  }
  if (!mtEmpresa || !mtEmpresa.id) {
    erro.textContent = "Empresa não encontrada. Atualize a página.";
    return;
  }

  const botao = document.getElementById("btnMtSalvar");
  botao.disabled = true;
  botao.textContent = "Salvando...";
  try {
    const cliente = await iniciarSupabase();
    // Mantém as outras configurações que já existirem e só troca a meta
    const novas = Object.assign({}, mtEmpresa.settings || {}, { meta_mensal: valor });
    const r = await cliente
      .from("companies")
      .update({ settings: novas })
      .eq("id", mtEmpresa.id)
      .select("id, settings");
    if (r.error) throw r.error;
    if (!r.data || r.data.length === 0) {
      throw new Error("Só a dona/dono ou um administrador pode definir a meta.");
    }
    mtEmpresa = r.data[0];
    mtMostrarEditor(false);
    avisar(valor > 0 ? "Meta salva: " + moeda(valor) : "Meta removida.");
    await carregarMeta();
  } catch (e) {
    console.error(e);
    erro.textContent = e && e.message ? e.message : String(e);
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar";
  }
}

function agendarMeta() {
  clearTimeout(mtTimer);
  mtTimer = setTimeout(carregarMeta, 350);
}

document.getElementById("btnMtEditar").addEventListener("click", function () { mtMostrarEditor(true); });
document.getElementById("btnMtCancelar").addEventListener("click", function () { mtMostrarEditor(false); });
document.getElementById("btnMtSalvar").addEventListener("click", salvarMeta);

document.querySelectorAll('[data-view="dashboard"]').forEach(function (botao) {
  botao.addEventListener("click", agendarMeta);
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (sessao) {
      agendarMeta();
    } else {
      clearTimeout(mtTimer);
      mtEmpresa = null;
      mtMostrarEditor(false);
      document.getElementById("mtConteudo").innerHTML = "";
    }
  });
});
// FIM DA PARTE 18

// ===== PARTE 19: ARYA Cresce (fidelidade e recompra) =====
titulos.cresce = "ARYA Cresce";
const CR_DIA = 86400000;
const CR_PADRAO = { ativo: false, reais_por_ponto: 1, pontos_premio: 100, premio: "R$ 10 de desconto", inicio: null };

const crView = document.createElement("section");
crView.className = "view";
crView.id = "view-cresce";
crView.innerHTML = `
  <article class="card pulso-hero">
    <p class="pulso-marca">✦ ARYA Cresce</p>
    <p class="pulso-sub">Fidelidade e recompra: faça seus clientes voltarem.</p>
    <div class="pulso-stats">
      <div><p class="pulso-stat-label">Clientes no programa</p><p class="pulso-stat-valor" id="crQtdClientes">—</p></div>
      <div><p class="pulso-stat-label">Prêmios disponíveis</p><p class="pulso-stat-valor" id="crQtdPremios">—</p></div>
      <div><p class="pulso-stat-label">Hora de recomprar</p><p class="pulso-stat-valor" id="crQtdRecompra">—</p></div>
    </div>
  </article>

  <article class="card" style="margin-bottom:16px;">
    <div class="card-head">
      <h2>Programa de fidelidade</h2>
      <button class="btn btn-ghost btn-small" id="btnCrRegras" type="button">Regras</button>
    </div>
    <div class="form-panel" id="crRegras" hidden>
      <label style="display:flex; align-items:center; gap:10px; font-weight:500; margin-bottom:14px; cursor:pointer;">
        <input id="crAtivo" type="checkbox" style="width:18px; height:18px; accent-color:#0a0a0a;" />
        Programa ativo
      </label>
      <div class="field-row">
        <div class="field">
          <label for="crReais">Cada quantos R$ vale 1 ponto</label>
          <input id="crReais" type="text" inputmode="decimal" placeholder="1,00" />
        </div>
        <div class="field">
          <label for="crPontos">Pontos para ganhar o prêmio</label>
          <input id="crPontos" type="text" inputmode="numeric" placeholder="100" />
        </div>
      </div>
      <div class="field">
        <label for="crPremio">Prêmio</label>
        <input id="crPremio" type="text" placeholder="Ex.: R$ 10 de desconto" />
      </div>
      <p class="item-sub" style="margin-bottom:10px;">Os pontos contam as vendas a partir do dia em que o programa foi ativado. Vendas canceladas não contam.</p>
      <p class="form-error" id="crErro" role="alert"></p>
      <div class="form-actions">
        <button class="btn" id="btnCrSalvar" type="button">Salvar regras</button>
        <button class="btn btn-ghost" id="btnCrFechar" type="button">Fechar</button>
      </div>
    </div>
    <p class="item-sub" id="crResumoRegras"></p>
    <div id="crRanking" class="list"></div>
  </article>

  <article class="card">
    <div class="card-head"><h2>Hora de recomprar</h2></div>
    <p class="item-sub" style="margin-bottom:6px;">Clientes que já passaram do intervalo em que costumam comprar.</p>
    <div id="crRecompra" class="list"></div>
  </article>
`;
document.querySelector(".main").appendChild(crView);

const estiloCresce = document.createElement("style");
estiloCresce.textContent = `
  .cr-premio { display: inline-block; font-size: 11px; font-weight: 600; color: var(--success);
    border: 1px solid #bbf7d0; border-radius: 999px; padding: 2px 10px; margin-left: 8px; vertical-align: middle; }
  #view-cresce .list-item > div:first-child { flex: 1; min-width: 200px; }
`;
document.head.appendChild(estiloCresce);

// Item no menu, logo depois de Intelligence
const navMenuCr = document.querySelector(".nav");
if (navMenuCr && !document.getElementById("navCresce")) {
  const item = document.createElement("button");
  item.id = "navCresce";
  item.type = "button";
  item.className = "nav-item";
  item.dataset.view = "cresce";
  const ico = document.createElement("span");
  ico.className = "ico";
  ico.textContent = "◎";
  item.appendChild(ico);
  item.appendChild(document.createTextNode("Cresce"));
  const depoisDe = navMenuCr.querySelector('[data-view="intelligence"]');
  if (depoisDe) depoisDe.after(item);
  else navMenuCr.appendChild(item);
}

let crEmpresa = null;
let crConfirmandoResgate = null;

function crRegrasAtuais() {
  const s = crEmpresa && crEmpresa.settings ? crEmpresa.settings.fidelidade : null;
  return Object.assign({}, CR_PADRAO, s || {});
}

function crPrimeiroNome(nome) {
  return String(nome || "").trim().split(" ")[0];
}

function crWhats(telefone, mensagem) {
  let d = String(telefone || "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = "55" + d;
  if (d.length < 12) return null;
  return "https://wa.me/" + d + "?text=" + encodeURIComponent(mensagem);
}

function crVazio(el, texto) {
  el.innerHTML = "";
  const aviso = document.createElement("div");
  aviso.className = "empty";
  aviso.textContent = texto;
  el.appendChild(aviso);
}

function crLinkBotao(texto, href) {
  const a = document.createElement("a");
  a.className = "btn btn-ghost btn-small";
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener";
  a.textContent = texto;
  return a;
}

function crAbrirRegras(abrir) {
  const painel = document.getElementById("crRegras");
  painel.hidden = !abrir;
  document.getElementById("crErro").textContent = "";
  if (abrir) {
    const r = crRegrasAtuais();
    document.getElementById("crAtivo").checked = Boolean(r.ativo);
    document.getElementById("crReais").value = numeroParaCampo(r.reais_por_ponto);
    document.getElementById("crPontos").value = String(r.pontos_premio);
    document.getElementById("crPremio").value = r.premio;
  }
}

async function crSalvarRegras() {
  const erro = document.getElementById("crErro");
  erro.textContent = "";
  const reais = lerNumero(document.getElementById("crReais").value);
  const textoPontos = document.getElementById("crPontos").value.trim();
  const premio = document.getElementById("crPremio").value.trim();
  const ativo = document.getElementById("crAtivo").checked;

  if (Number.isNaN(reais) || reais <= 0) {
    erro.textContent = "Informe quantos reais valem 1 ponto (ex.: 1,00).";
    return;
  }
  if (!/^\d+$/.test(textoPontos) || Number(textoPontos) <= 0) {
    erro.textContent = "Informe os pontos para o prêmio com números inteiros (ex.: 100).";
    return;
  }
  if (premio.length < 2) {
    erro.textContent = "Descreva o prêmio (ex.: R$ 10 de desconto).";
    return;
  }

  const atuais = crRegrasAtuais();
  const novas = {
    ativo: ativo,
    reais_por_ponto: reais,
    pontos_premio: Number(textoPontos),
    premio: premio,
    // Marca o início ao ativar pela primeira vez
    inicio: ativo ? (atuais.inicio || new Date().toISOString()) : atuais.inicio
  };

  const botao = document.getElementById("btnCrSalvar");
  botao.disabled = true;
  botao.textContent = "Salvando...";
  try {
    const cliente = await iniciarSupabase();
    const settings = Object.assign({}, crEmpresa.settings || {}, { fidelidade: novas });
    const r = await cliente.from("companies").update({ settings: settings })
      .eq("id", crEmpresa.id).select("id, settings");
    if (r.error) throw r.error;
    if (!r.data || r.data.length === 0) {
      throw new Error("Só a dona/dono ou um administrador pode alterar o programa.");
    }
    crEmpresa = r.data[0];
    crAbrirRegras(false);
    avisar(ativo ? "Programa de fidelidade ativo!" : "Regras salvas.");
    await carregarCresce();
  } catch (e) {
    console.error(e);
    erro.textContent = e && e.message ? e.message : String(e);
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar regras";
  }
}

async function crResgatar(c, regras) {
  try {
    const cliente = await iniciarSupabase();
    const usuario = await cliente.auth.getUser();
    const r = await cliente.from("activity_log").insert({
      company_id: crEmpresa.id,
      user_id: usuario.data.user.id,
      action: "fidelidade_resgate",
      entity: "customer",
      entity_id: c.id,
      details: { pontos: regras.pontos_premio, premio: regras.premio }
    });
    if (r.error) throw r.error;
    crConfirmandoResgate = null;
    avisar("Prêmio resgatado por " + c.name + ": " + regras.premio);
    await carregarCresce();
  } catch (e) {
    console.error(e);
    crConfirmandoResgate = null;
    avisar("Não foi possível resgatar: " + (e.message || e));
  }
}

async function carregarCresce() {
  const ranking = document.getElementById("crRanking");
  const recompra = document.getElementById("crRecompra");
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      crVazio(ranking, "Entre na sua conta para ver o programa.");
      crVazio(recompra, "Entre na sua conta para ver os lembretes.");
      return;
    }
    crVazio(ranking, "Carregando...");
    crVazio(recompra, "Carregando...");

    const empresaId = await obterEmpresaId();
    const desde = new Date(Date.now() - 365 * CR_DIA);
    const respostas = await Promise.all([
      cliente.from("companies").select("id, name, settings").eq("id", empresaId).maybeSingle(),
      cliente.from("customers").select("id, name, phone"),
      cliente.from("sales").select("customer_id, total, created_at")
        .gte("created_at", desde.toISOString())
        .neq("status", "cancelled")
        .not("customer_id", "is", null)
        .order("created_at", { ascending: true })
    ]);
    respostas.forEach(function (r) { if (r.error) throw r.error; });

    crEmpresa = respostas[0].data || { id: empresaId, settings: {} };
    const nomeEmpresa = crEmpresa.name || document.querySelector(".sidebar-foot").textContent.trim();
    const clientes = respostas[1].data || [];
    const vendas = respostas[2].data || [];
    const regras = crRegrasAtuais();

    // Resgates (só dono/admin conseguem ler o registro de atividades)
    let resgates = [];
    let resgatesVisiveis = true;
    const rr = await cliente.from("activity_log")
      .select("entity_id, details")
      .eq("action", "fidelidade_resgate");
    if (rr.error) resgatesVisiveis = false;
    else resgates = rr.data || [];

    // ---- Fidelidade ----
    const resumo = document.getElementById("crResumoRegras");
    let qtdPremios = 0;
    let qtdNoPrograma = 0;

    if (!regras.ativo) {
      resumo.textContent = "";
      crVazio(ranking, "✦ O programa está desligado. Toque em \"Regras\", defina quanto vale cada ponto e o prêmio, e ative.");
    } else {
      resumo.textContent = "Cada " + moeda(regras.reais_por_ponto) + " = 1 ponto · " +
        regras.pontos_premio + " pontos = " + regras.premio +
        (regras.inicio ? " · desde " + new Date(regras.inicio).toLocaleDateString("pt-BR") : "") +
        (resgatesVisiveis ? "" : " · os resgates só aparecem para a dona/dono ou admin");

      const inicio = regras.inicio ? new Date(regras.inicio) : null;
      const gastoPorCliente = {};
      vendas.forEach(function (v) {
        if (inicio && new Date(v.created_at) < inicio) return;
        gastoPorCliente[v.customer_id] = (gastoPorCliente[v.customer_id] || 0) + Number(v.total);
      });
      const usadoPorCliente = {};
      resgates.forEach(function (r) {
        usadoPorCliente[r.entity_id] = (usadoPorCliente[r.entity_id] || 0) + Number((r.details || {}).pontos || 0);
      });

      const lista = clientes
        .map(function (c) {
          const ganhos = Math.floor((gastoPorCliente[c.id] || 0) / regras.reais_por_ponto);
          return { c: c, pontos: Math.max(0, ganhos - (usadoPorCliente[c.id] || 0)), ganhos: ganhos };
        })
        .filter(function (x) { return x.ganhos > 0; })
        .sort(function (a, b) { return b.pontos - a.pontos; });

      qtdNoPrograma = lista.length;

      if (lista.length === 0) {
        crVazio(ranking, "Nenhum cliente com pontos ainda. Os pontos aparecem quando houver vendas com cliente escolhido.");
      } else {
        ranking.innerHTML = "";
        lista.slice(0, 30).forEach(function (x) {
          const premios = Math.floor(x.pontos / regras.pontos_premio);
          if (premios > 0) qtdPremios += 1;
          const progresso = premios > 0 ? 100 : Math.round(100 * x.pontos / regras.pontos_premio);

          const linha = document.createElement("div");
          linha.className = "list-item";

          const info = document.createElement("div");
          const titulo = document.createElement("p");
          titulo.className = "item-title";
          titulo.textContent = x.c.name;
          if (premios > 0) {
            const selo = document.createElement("span");
            selo.className = "cr-premio";
            selo.textContent = premios > 1 ? premios + " prêmios disponíveis!" : "Prêmio disponível!";
            titulo.appendChild(selo);
          }
          const sub = document.createElement("p");
          sub.className = "item-sub";
          sub.textContent = x.pontos + " ponto(s)" + (premios > 0
            ? ""
            : " · faltam " + (regras.pontos_premio - x.pontos) + " para o prêmio");
          const trilho = document.createElement("div");
          trilho.className = "db-trilho";
          const cheio = document.createElement("div");
          cheio.style.width = Math.max(3, progresso) + "%";
          trilho.appendChild(cheio);
          info.appendChild(titulo);
          info.appendChild(sub);
          info.appendChild(trilho);

          const acoes = document.createElement("div");
          acoes.className = "item-actions";
          if (premios > 0) {
            if (crConfirmandoResgate === x.c.id) {
              const pergunta = document.createElement("span");
              pergunta.className = "item-sub";
              pergunta.textContent = "Usar " + regras.pontos_premio + " pontos?";
              acoes.appendChild(pergunta);
              acoes.appendChild(criarBotao("Confirmar", "btn btn-small", function () { crResgatar(x.c, regras); }));
              acoes.appendChild(criarBotao("Voltar", "btn btn-ghost btn-small", function () {
                crConfirmandoResgate = null;
                carregarCresce();
              }));
            } else {
              const link = crWhats(x.c.phone,
                "Oi, " + crPrimeiroNome(x.c.name) + "! Você juntou " + x.pontos + " pontos na " + nomeEmpresa +
                " e já pode trocar por " + regras.premio + ". Venha aproveitar!");
              if (link) acoes.appendChild(crLinkBotao("Avisar no WhatsApp", link));
              acoes.appendChild(criarBotao("Resgatar", "btn btn-small", function () {
                crConfirmandoResgate = x.c.id;
                carregarCresce();
              }));
            }
          }

          linha.appendChild(info);
          linha.appendChild(acoes);
          ranking.appendChild(linha);
        });
      }
    }

    // ---- Hora de recomprar ----
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const datasPorCliente = {};
    vendas.forEach(function (v) {
      const d = new Date(v.created_at);
      d.setHours(0, 0, 0, 0);
      if (!datasPorCliente[v.customer_id]) datasPorCliente[v.customer_id] = [];
      const lista = datasPorCliente[v.customer_id];
      // Várias compras no mesmo dia contam como uma visita
      if (!lista.length || lista[lista.length - 1].getTime() !== d.getTime()) lista.push(d);
    });

    const atrasados = [];
    clientes.forEach(function (c) {
      const datas = datasPorCliente[c.id];
      if (!datas || datas.length < 2) return;
      const intervalo = Math.round((datas[datas.length - 1] - datas[0]) / CR_DIA / (datas.length - 1));
      if (intervalo < 1) return;
      const semComprar = Math.round((hoje - datas[datas.length - 1]) / CR_DIA);
      if (semComprar > intervalo) {
        atrasados.push({ c: c, intervalo: intervalo, semComprar: semComprar, visitas: datas.length });
      }
    });
    atrasados.sort(function (a, b) { return (b.semComprar - b.intervalo) - (a.semComprar - a.intervalo); });

    if (atrasados.length === 0) {
      crVazio(recompra, "✦ Ninguém atrasado agora. Os lembretes aparecem para clientes com 2 compras ou mais.");
    } else {
      recompra.innerHTML = "";
      atrasados.slice(0, 20).forEach(function (x) {
        const linha = document.createElement("div");
        linha.className = "list-item";
        const info = document.createElement("div");
        const titulo = document.createElement("p");
        titulo.className = "item-title";
        titulo.textContent = x.c.name;
        const sub = document.createElement("p");
        sub.className = "item-sub";
        sub.textContent = "Costuma comprar a cada " + x.intervalo + " dia(s) · está há " + x.semComprar +
          " dia(s) sem comprar · " + x.visitas + " compras no último ano";
        info.appendChild(titulo);
        info.appendChild(sub);

        const acoes = document.createElement("div");
        acoes.className = "item-actions";
        const link = crWhats(x.c.phone,
          "Oi, " + crPrimeiroNome(x.c.name) + "! Tudo bem? Aqui é da " + nomeEmpresa +
          ". Chegaram novidades e lembrei de você. Quer dar uma olhada?");
        if (link) acoes.appendChild(crLinkBotao("WhatsApp", link));

        linha.appendChild(info);
        linha.appendChild(acoes);
        recompra.appendChild(linha);
      });
    }

    document.getElementById("crQtdClientes").textContent = regras.ativo ? String(qtdNoPrograma) : "—";
    document.getElementById("crQtdPremios").textContent = regras.ativo ? String(qtdPremios) : "—";
    document.getElementById("crQtdRecompra").textContent = String(atrasados.length);
  } catch (e) {
    console.error(e);
    crVazio(ranking, "Não foi possível carregar: " + (e.message || e));
    crVazio(recompra, "");
  }
}

document.getElementById("btnCrRegras").addEventListener("click", function () {
  crAbrirRegras(document.getElementById("crRegras").hidden);
});
document.getElementById("btnCrFechar").addEventListener("click", function () { crAbrirRegras(false); });
document.getElementById("btnCrSalvar").addEventListener("click", crSalvarRegras);

document.querySelectorAll('[data-view="cresce"]').forEach(function (botao) {
  botao.addEventListener("click", function () {
    mostrarTela("cresce");
    carregarCresce();
  });
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) {
      crEmpresa = null;
      crConfirmandoResgate = null;
      crAbrirRegras(false);
    }
  });
});
// FIM DA PARTE 19

// ===== PARTE 20: Remove o botão de prévia (entrar sem conta) =====
const botaoPrevia = document.getElementById("abtnPrevia");
if (botaoPrevia) botaoPrevia.remove();
// FIM DA PARTE 20
// ===== PARTE 21: Esqueci minha senha / Nova senha =====
// Guarda se a página foi aberta pelo link do e-mail (antes do Supabase limpar o endereço)
let precisaNovaSenha = /type=recovery/.test(window.location.hash);

const estiloSenha = document.createElement("style");
estiloSenha.textContent = `
  .ns-fundo {
    position: fixed; inset: 0; z-index: 300;
    display: grid; place-items: center; padding: 20px;
    background: rgba(10, 10, 10, .45);
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
  }
  .ns-fundo[hidden] { display: none; }
  .ns-caixa {
    width: 100%; max-width: 400px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 28px 24px; box-shadow: var(--shadow-lg);
  }
  .ns-caixa h2 { font-size: 20px; font-weight: 600; letter-spacing: -.02em; margin-bottom: 6px; }
  .rs-ok { color: var(--success); font-size: 13px; font-weight: 500; margin-top: 10px; text-align: center; }
`;
document.head.appendChild(estiloSenha);

// ---- 1) Link "Esqueci minha senha" na tela de login ----
const linkEsqueci = document.createElement("button");
linkEsqueci.type = "button";
linkEsqueci.className = "link-btn";
linkEsqueci.id = "btnEsqueciSenha";
linkEsqueci.textContent = "Esqueci minha senha";

const rsMensagem = document.createElement("p");
rsMensagem.className = "rs-ok";
rsMensagem.hidden = true;

btnAuth.after(linkEsqueci);
linkEsqueci.after(rsMensagem);

tabEntrar.addEventListener("click", function () { linkEsqueci.hidden = false; rsMensagem.hidden = true; });
tabCriar.addEventListener("click", function () { linkEsqueci.hidden = true; rsMensagem.hidden = true; });

linkEsqueci.addEventListener("click", async function () {
  limparErros();
  rsMensagem.hidden = true;
  const email = inEmail.value.trim();
  if (!emailValido(email)) {
    falha(inEmail, "Digite seu e-mail no campo acima e toque de novo em \"Esqueci minha senha\".");
    return;
  }

  linkEsqueci.disabled = true;
  linkEsqueci.textContent = "Enviando...";
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (r.error) throw r.error;
    rsMensagem.textContent = "Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a caixa de spam.";
    rsMensagem.hidden = false;
  } catch (e) {
    console.error(e);
    const msg = e && e.message ? e.message : String(e);
    authErro.textContent = /security purposes|seconds|rate limit/i.test(msg)
      ? "Aguarde um minuto antes de pedir outro link."
      : "Não foi possível enviar o e-mail: " + msg;
  } finally {
    linkEsqueci.disabled = false;
    linkEsqueci.textContent = "Esqueci minha senha";
  }
});

// ---- 2) Janela "Criar nova senha" (quando a pessoa chega pelo link do e-mail) ----
const nsFundo = document.createElement("div");
nsFundo.className = "ns-fundo";
nsFundo.hidden = true;
nsFundo.innerHTML = `
  <div class="ns-caixa" role="dialog" aria-modal="true" aria-labelledby="nsTitulo">
    <h2 id="nsTitulo">Criar nova senha</h2>
    <p class="item-sub" style="margin-bottom:18px;">Escolha uma nova senha para entrar na ARYA.</p>
    <div class="field">
      <label for="nsSenha">Nova senha</label>
      <input id="nsSenha" type="password" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
    </div>
    <div class="field">
      <label for="nsSenha2">Confirmar nova senha</label>
      <input id="nsSenha2" type="password" autocomplete="new-password" placeholder="Repita a senha" />
    </div>
    <p class="form-error" id="nsErro" role="alert"></p>
    <button class="btn btn-full" id="btnNsSalvar" type="button">Salvar nova senha</button>
  </div>
`;
document.body.appendChild(nsFundo);

function abrirNovaSenha() {
  precisaNovaSenha = false;
  document.getElementById("nsSenha").value = "";
  document.getElementById("nsSenha2").value = "";
  document.getElementById("nsErro").textContent = "";
  nsFundo.hidden = false;
  document.getElementById("nsSenha").focus();
}

document.getElementById("btnNsSalvar").addEventListener("click", async function () {
  const erro = document.getElementById("nsErro");
  const senha = document.getElementById("nsSenha").value;
  const senha2 = document.getElementById("nsSenha2").value;
  erro.textContent = "";

  if (senha.length < 8) {
    erro.textContent = "A senha precisa ter pelo menos 8 caracteres.";
    return;
  }
  if (senha !== senha2) {
    erro.textContent = "As senhas não são iguais.";
    return;
  }

  const botao = document.getElementById("btnNsSalvar");
  botao.disabled = true;
  botao.textContent = "Salvando...";
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.auth.updateUser({ password: senha });
    if (r.error) throw r.error;
    nsFundo.hidden = true;
    avisar("Senha nova salva! Você já está dentro da ARYA.");
  } catch (e) {
    console.error(e);
    const msg = e && e.message ? e.message : String(e);
    erro.textContent = /different from the old/i.test(msg)
      ? "A nova senha precisa ser diferente da antiga."
      : "Não foi possível salvar: " + msg;
  } finally {
    botao.disabled = false;
    botao.textContent = "Salvar nova senha";
  }
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (evento === "PASSWORD_RECOVERY" || (precisaNovaSenha && sessao)) {
      setTimeout(abrirNovaSenha, 400);
    }
  });
});
// FIM DA PARTE 21
// ===== PARTE 22b: Aceite dos Termos no "Criar conta" =====
const TERMOS_VERSAO = "2026-11";

const termosCaixa = document.createElement("label");
termosCaixa.id = "termosCaixa";
termosCaixa.style.cssText = "display:flex; align-items:flex-start; gap:10px; margin:4px 0 14px; font-size:13px; color:var(--muted); line-height:1.4; cursor:pointer;";
termosCaixa.innerHTML = `
  <input id="termosAceite" type="checkbox" style="width:18px; height:18px; flex-shrink:0; margin-top:1px; accent-color:#0a0a0a;" />
  <span>Li e aceito os <a href="termos.html" target="_blank" rel="noopener" style="color:var(--text); font-weight:600;">Termos de Uso</a>
  e a <a href="termos.html#privacidade" target="_blank" rel="noopener" style="color:var(--text); font-weight:600;">Política de Privacidade</a> da ARYA.</span>
`;
fieldConfirma.after(termosCaixa);

const termosAceite = document.getElementById("termosAceite");

// A caixinha aparece junto com o campo "Confirmar senha" (só no Criar conta)
function sincronizarTermos() {
  termosCaixa.style.display = fieldConfirma.hidden ? "none" : "flex";
  if (fieldConfirma.hidden) termosAceite.checked = false;
}
new MutationObserver(sincronizarTermos).observe(fieldConfirma, { attributes: true, attributeFilter: ["hidden"] });
sincronizarTermos();

// Bloqueia o cadastro sem o aceite (roda antes do envio normal do formulário)
let termosPendentes = false;
document.addEventListener("submit", function (evento) {
  if (evento.target !== formAuth || !modoCadastro) return;
  if (!termosAceite.checked) {
    evento.preventDefault();
    evento.stopPropagation();
    authErro.textContent = "Para criar a conta, marque que leu e aceita os Termos de Uso e a Política de Privacidade.";
    termosCaixa.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  termosPendentes = true;
}, true);

// Guarda na conta a data e a versão dos termos aceitos (comprovação para a LGPD)
iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!termosPendentes || !sessao) return;
    termosPendentes = false;
    setTimeout(async function () {
      try {
        const r = await cliente.auth.updateUser({
          data: { termos_aceitos_em: new Date().toISOString(), termos_versao: TERMOS_VERSAO }
        });
        if (r.error) throw r.error;
      } catch (e) {
        console.error("Não foi possível registrar o aceite dos termos:", e);
      }
    }, 0);
  });
});
// FIM DA PARTE 22b
