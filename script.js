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
// ===== PARTE 23: Botão "Mais" na barra de baixo (celular) =====
const MAIS_ITENS = [
  { view: "fornecedores", ico: "▤", nome: "Fornecedores" },
  { view: "orcamentos", ico: "◇", nome: "Orçamentos" },
  { view: "relatorios", ico: "▥", nome: "Relatórios" },
  { view: "cresce", ico: "◎", nome: "Cresce" },
  { view: "configuracoes", ico: "⚙", nome: "Configurações" }
];

const estiloMais = document.createElement("style");
estiloMais.textContent = `
  @media (max-width: 768px) {
    .bottombar { grid-template-columns: repeat(6, 1fr) !important; }
  }
  .mais-fundo {
    position: fixed; inset: 0; z-index: 90;
    background: rgba(10, 10, 10, .35);
    -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
  }
  .mais-fundo[hidden] { display: none; }
  .mais-painel {
    position: absolute; left: 0; right: 0; bottom: 0;
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-radius: 20px 20px 0 0;
    padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
    box-shadow: var(--shadow-lg);
    animation: maisSobe .22s ease;
  }
  @keyframes maisSobe { from { transform: translateY(100%); } to { transform: none; } }
  .mais-alca { width: 40px; height: 4px; border-radius: 999px; background: var(--border-strong); margin: 0 auto 14px; }
  .mais-titulo { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .09em; color: var(--muted); margin: 0 4px 8px; }
  .mais-item {
    display: flex; align-items: center; gap: 14px; width: 100%;
    padding: 14px 12px; border-radius: 12px;
    font-size: 16px; font-weight: 500; text-align: left; color: var(--text);
  }
  .mais-item:active { background: var(--surface-2); }
  .mais-item .ico { width: 22px; font-size: 18px; text-align: center; }
  .mais-item.ativo { background: var(--surface-2); font-weight: 600; }
`;
document.head.appendChild(estiloMais);

const barraBaixo = document.querySelector(".bottombar");
if (barraBaixo && !document.getElementById("tabMais")) {
  // Botão "Mais"
  const tabMais = document.createElement("button");
  tabMais.id = "tabMais";
  tabMais.type = "button";
  tabMais.className = "tab";
  tabMais.setAttribute("aria-label", "Mais opções");
  const icoMais = document.createElement("span");
  icoMais.textContent = "⋯";
  icoMais.style.fontSize = "16px";
  tabMais.appendChild(icoMais);
  tabMais.appendChild(document.createTextNode("Mais"));
  barraBaixo.appendChild(tabMais);

  // Painel que sobe de baixo
  const maisFundo = document.createElement("div");
  maisFundo.className = "mais-fundo";
  maisFundo.hidden = true;
  const maisPainel = document.createElement("div");
  maisPainel.className = "mais-painel";
  maisPainel.setAttribute("role", "dialog");
  maisPainel.setAttribute("aria-label", "Mais opções");
  maisPainel.appendChild(Object.assign(document.createElement("div"), { className: "mais-alca" }));
  maisPainel.appendChild(Object.assign(document.createElement("p"), { className: "mais-titulo", textContent: "Mais" }));

  let viewAtualMais = null;

  MAIS_ITENS.forEach(function (it) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "mais-item";
    item.dataset.alvo = it.view;
    const ico = document.createElement("span");
    ico.className = "ico";
    ico.textContent = it.ico;
    item.appendChild(ico);
    item.appendChild(document.createTextNode(it.nome));
    item.addEventListener("click", function () {
      // Usa o mesmo botão do menu lateral, que já carrega os dados da tela
      const original = document.querySelector('.nav [data-view="' + it.view + '"]');
      if (original) original.click();
      else mostrarTela(it.view);
      viewAtualMais = it.view;
      tabMais.classList.add("active");
      fecharMais();
    });
    maisPainel.appendChild(item);
  });

  maisFundo.appendChild(maisPainel);
  document.body.appendChild(maisFundo);

  function abrirMais() {
    maisPainel.querySelectorAll(".mais-item").forEach(function (b) {
      b.classList.toggle("ativo", b.dataset.alvo === viewAtualMais && tabMais.classList.contains("active"));
    });
    maisFundo.hidden = false;
  }
  function fecharMais() {
    maisFundo.hidden = true;
  }

  tabMais.addEventListener("click", function () {
    if (maisFundo.hidden) abrirMais();
    else fecharMais();
  });
  maisFundo.addEventListener("click", function (e) {
    if (e.target === maisFundo) fecharMais();
  });

  // Ao tocar num botão normal da barra (Início, Clientes...), o "Mais" sai do destaque
  barraBaixo.querySelectorAll(".tab[data-view]").forEach(function (b) {
    b.addEventListener("click", function () {
      tabMais.classList.remove("active");
      viewAtualMais = null;
    });
  });
  const cfgTopo = document.getElementById("btnCfgTopo");
  if (cfgTopo) {
    cfgTopo.addEventListener("click", function () {
      viewAtualMais = "configuracoes";
      tabMais.classList.add("active");
    });
  }
}
// FIM DA PARTE 23
// ===== PARTE 24c: Grade de tamanhos e cores (tela de Produtos) =====
const gradePainel = document.createElement("div");
gradePainel.className = "form-panel";
gradePainel.id = "painelGrade";
gradePainel.hidden = true;
gradePainel.innerHTML = `
  <div class="card-head" style="margin-bottom:8px;">
    <h3 id="grTitulo" style="margin:0;">Grade</h3>
    <button class="btn btn-ghost btn-small" id="btnGrFechar" type="button">Fechar</button>
  </div>
  <p class="item-sub" id="grResumo"></p>
  <p class="item-sub" id="grAviso" style="color:#b45309; margin-top:6px;" hidden></p>
  <div id="grLista" class="list"></div>

  <div id="grMov" hidden>
    <h3 style="margin-top:18px;">Movimentar estoque</h3>
    <div class="field">
      <label for="grMovVar">Variação</label>
      <select id="grMovVar"></select>
    </div>
    <div class="form-actions" id="grMovTipos">
      <button class="btn btn-small" type="button" data-tipo="in">Entrada</button>
      <button class="btn btn-ghost btn-small" type="button" data-tipo="out">Saída</button>
      <button class="btn btn-ghost btn-small" type="button" data-tipo="adjustment">Ajuste</button>
    </div>
    <p class="item-sub" id="grMovDica"></p>
    <div class="field-row">
      <div class="field">
        <label for="grMovQtd" id="grMovQtdLabel">Quantidade</label>
        <input id="grMovQtd" type="text" inputmode="numeric" placeholder="0" />
      </div>
      <div class="field">
        <label for="grMovMotivo">Motivo (opcional)</label>
        <input id="grMovMotivo" type="text" placeholder="Ex.: Chegou mercadoria" />
      </div>
    </div>
    <p class="form-error" id="grMovErro" role="alert"></p>
    <div class="form-actions">
      <button class="btn" id="btnGrMovConfirmar" type="button">Confirmar</button>
    </div>
  </div>

  <h3 style="margin-top:18px;">Adicionar variações</h3>
  <p class="item-sub" style="margin:-6px 0 12px;">Separe por vírgula para criar várias de uma vez. Ex.: tamanhos <strong>P, M, G</strong> e cores <strong>Preto, Branco</strong>.</p>
  <div class="field-row">
    <div class="field">
      <label for="grTamanhos">Tamanhos</label>
      <input id="grTamanhos" type="text" placeholder="Ex.: P, M, G, GG" />
    </div>
    <div class="field">
      <label for="grCores">Cores</label>
      <input id="grCores" type="text" placeholder="Ex.: Preto, Branco" />
    </div>
  </div>
  <div class="field">
    <label for="grQtd">Quantidade inicial de cada variação</label>
    <input id="grQtd" type="text" inputmode="numeric" placeholder="0" />
  </div>
  <p class="form-error" id="grErro" role="alert"></p>
  <div class="form-actions">
    <button class="btn" id="btnGrAdicionar" type="button">Adicionar à grade</button>
  </div>
`;
painelEstoque.after(gradePainel);

let gradeCache = {};          // { id do produto: [variações] }
let gradeProdutoId = null;
let grMovTipo = "in";
let grConfirmandoExcluir = null;

function rotuloVariacao(v) {
  return [v.size, v.color].filter(Boolean).join(" / ");
}

async function carregarGrade() {
  const cliente = await iniciarSupabase();
  const sessao = await cliente.auth.getSession();
  if (!sessao.data || !sessao.data.session) {
    gradeCache = {};
    return;
  }
  const r = await cliente
    .from("product_variants")
    .select("id, product_id, size, color, sku, stock_quantity, created_at")
    .order("created_at", { ascending: true });
  if (r.error) throw r.error;
  const mapa = {};
  (r.data || []).forEach(function (v) {
    if (!mapa[v.product_id]) mapa[v.product_id] = [];
    mapa[v.product_id].push(v);
  });
  gradeCache = mapa;
}

function grTexto(id, texto) {
  document.getElementById(id).textContent = texto;
}

function grDefinirTipo(tipo) {
  grMovTipo = tipo;
  document.querySelectorAll("#grMovTipos [data-tipo]").forEach(function (b) {
    b.className = b.dataset.tipo === tipo ? "btn btn-small" : "btn btn-ghost btn-small";
  });
  grTexto("grMovDica", dicasTipo[tipo]);
  grTexto("grMovQtdLabel", tipo === "adjustment" ? "Quantidade contada" : "Quantidade");
  grTexto("grMovErro", "");
}

function desenharGrade() {
  const p = produtosCache.find(function (x) { return x.id === gradeProdutoId; });
  if (!p) return;
  const vars = gradeCache[p.id] || [];

  grTexto("grTitulo", "Grade: " + p.name);
  grTexto("grResumo", vars.length
    ? "Total em estoque: " + p.stock_quantity + " unidade(s) em " + vars.length + " variação(ões)."
    : "Este produto ainda não tem grade.");

  const aviso = document.getElementById("grAviso");
  if (vars.length === 0 && p.stock_quantity > 0) {
    aviso.textContent = "Este produto tem " + p.stock_quantity + " unidade(s) sem grade. Ao criar a grade, " +
      "o estoque passa a ser a soma das variações: informe a quantidade de cada uma.";
    aviso.hidden = false;
  } else {
    aviso.hidden = true;
  }

  const lista = document.getElementById("grLista");
  lista.innerHTML = "";
  if (vars.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "empty";
    vazio.textContent = "Nenhuma variação ainda. Adicione tamanhos e/ou cores abaixo.";
    lista.appendChild(vazio);
  }

  vars.forEach(function (v) {
    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const titulo = document.createElement("p");
    titulo.className = "item-title";
    titulo.textContent = rotuloVariacao(v);
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = "Estoque " + v.stock_quantity +
      (v.stock_quantity <= 0 ? " · ⚠ esgotado" : "") +
      (v.sku ? " · código " + v.sku : "");
    info.appendChild(titulo);
    info.appendChild(sub);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";
    if (grConfirmandoExcluir === v.id) {
      const pergunta = document.createElement("span");
      pergunta.className = "item-sub";
      pergunta.textContent = v.stock_quantity > 0
        ? "Excluir? " + v.stock_quantity + " un. saem do estoque."
        : "Excluir?";
      acoes.appendChild(pergunta);
      acoes.appendChild(criarBotao("Sim, excluir", "btn btn-danger btn-small", function () {
        grExcluir(v.id);
      }));
      acoes.appendChild(criarBotao("Cancelar", "btn btn-ghost btn-small", function () {
        grConfirmandoExcluir = null;
        desenharGrade();
      }));
    } else {
      acoes.appendChild(criarBotao("Movimentar", "btn btn-ghost btn-small", function () {
        document.getElementById("grMovVar").value = v.id;
        document.getElementById("grMov").scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById("grMovQtd").focus();
      }));
      acoes.appendChild(criarBotao("Excluir", "btn btn-ghost btn-small", function () {
        grConfirmandoExcluir = v.id;
        desenharGrade();
      }));
    }

    linha.appendChild(info);
    linha.appendChild(acoes);
    lista.appendChild(linha);
  });

  // Área de movimentação
  const mov = document.getElementById("grMov");
  const sel = document.getElementById("grMovVar");
  mov.hidden = vars.length === 0;
  const atual = sel.value;
  sel.innerHTML = "";
  vars.forEach(function (v) {
    const o = document.createElement("option");
    o.value = v.id;
    o.textContent = rotuloVariacao(v) + " · estoque " + v.stock_quantity;
    sel.appendChild(o);
  });
  if (vars.some(function (v) { return v.id === atual; })) sel.value = atual;
}

function abrirGrade(p) {
  fecharFormProduto();
  fecharEstoque();
  fecharCategorias();
  gradeProdutoId = p.id;
  grConfirmandoExcluir = null;
  ["grTamanhos", "grCores", "grQtd", "grMovQtd", "grMovMotivo"].forEach(function (id) {
    document.getElementById(id).value = "";
  });
  grTexto("grErro", "");
  grDefinirTipo("in");
  desenharGrade();
  gradePainel.hidden = false;
  gradePainel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function fecharGrade() {
  gradeProdutoId = null;
  grConfirmandoExcluir = null;
  gradePainel.hidden = true;
}

async function grRecarregar() {
  await carregarGrade();
  await carregarProdutos();
  desenharGrade();
}

function grLista(texto) {
  return texto.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
}

async function grAdicionar() {
  const erro = document.getElementById("grErro");
  erro.textContent = "";
  const tamanhos = grLista(document.getElementById("grTamanhos").value);
  const cores = grLista(document.getElementById("grCores").value);
  const textoQtd = document.getElementById("grQtd").value.trim();

  if (tamanhos.length === 0 && cores.length === 0) {
    erro.textContent = "Informe pelo menos um tamanho ou uma cor.";
    return;
  }
  if (textoQtd && !/^\d+$/.test(textoQtd)) {
    erro.textContent = "Quantidade inicial deve ser um número inteiro (ex.: 5).";
    return;
  }
  const qtd = textoQtd ? Number(textoQtd) : 0;

  // Todas as combinações de tamanho x cor
  const combinacoes = [];
  if (tamanhos.length && cores.length) {
    tamanhos.forEach(function (t) { cores.forEach(function (c) { combinacoes.push([t, c]); }); });
  } else if (tamanhos.length) {
    tamanhos.forEach(function (t) { combinacoes.push([t, null]); });
  } else {
    cores.forEach(function (c) { combinacoes.push([null, c]); });
  }
  if (combinacoes.length > 60) {
    erro.textContent = "São " + combinacoes.length + " combinações. Crie no máximo 60 de cada vez.";
    return;
  }

  const botao = document.getElementById("btnGrAdicionar");
  botao.disabled = true;
  let criadas = 0;
  const falhas = [];
  try {
    const cliente = await iniciarSupabase();
    for (let i = 0; i < combinacoes.length; i++) {
      botao.textContent = "Criando " + (i + 1) + " de " + combinacoes.length + "...";
      const r = await cliente.rpc("create_variant", {
        p_product_id: gradeProdutoId,
        p_size: combinacoes[i][0],
        p_color: combinacoes[i][1],
        p_initial: qtd
      });
      if (r.error) falhas.push([combinacoes[i][0], combinacoes[i][1]].filter(Boolean).join(" / ") + ": " + r.error.message);
      else criadas += 1;
    }
    document.getElementById("grTamanhos").value = "";
    document.getElementById("grCores").value = "";
    document.getElementById("grQtd").value = "";
    await grRecarregar();
    if (falhas.length) erro.textContent = falhas.length + " não criada(s). " + falhas[0];
    if (criadas) avisar(criadas + " variação(ões) criada(s).");
  } catch (e) {
    console.error(e);
    erro.textContent = "Não foi possível criar: " + (e.message || e);
  } finally {
    botao.disabled = false;
    botao.textContent = "Adicionar à grade";
  }
}

async function grMovimentar() {
  const erro = document.getElementById("grMovErro");
  erro.textContent = "";
  const variante = document.getElementById("grMovVar").value;
  const texto = document.getElementById("grMovQtd").value.trim();

  if (!variante) {
    erro.textContent = "Escolha a variação.";
    return;
  }
  if (!/^\d+$/.test(texto)) {
    erro.textContent = "Digite a quantidade só com números inteiros (ex.: 5).";
    return;
  }
  const quantidade = Number(texto);
  if (grMovTipo !== "adjustment" && quantidade === 0) {
    erro.textContent = "A quantidade precisa ser maior que zero.";
    return;
  }

  const botao = document.getElementById("btnGrMovConfirmar");
  botao.disabled = true;
  botao.textContent = "Salvando...";
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.rpc("adjust_variant_stock", {
      p_variant_id: variante,
      p_type: grMovTipo,
      p_quantity: quantidade,
      p_reason: document.getElementById("grMovMotivo").value.trim() || null
    });
    if (r.error) throw r.error;
    avisar(nomesTipo[grMovTipo] + " registrada. Novo saldo da variação: " + r.data);
    document.getElementById("grMovQtd").value = "";
    document.getElementById("grMovMotivo").value = "";
    await grRecarregar();
  } catch (e) {
    console.error(e);
    erro.textContent = e && e.message ? e.message : String(e);
  } finally {
    botao.disabled = false;
    botao.textContent = "Confirmar";
  }
}

async function grExcluir(id) {
  try {
    const cliente = await iniciarSupabase();
    const r = await cliente.rpc("delete_variant", { p_variant_id: id });
    if (r.error) throw r.error;
    grConfirmandoExcluir = null;
    avisar("Variação excluída.");
    await grRecarregar();
  } catch (e) {
    console.error(e);
    grConfirmandoExcluir = null;
    avisar("Não foi possível excluir: " + (e.message || e));
    desenharGrade();
  }
}

document.getElementById("btnGrFechar").addEventListener("click", fecharGrade);
document.getElementById("btnGrAdicionar").addEventListener("click", grAdicionar);
document.getElementById("btnGrMovConfirmar").addEventListener("click", grMovimentar);
document.querySelectorAll("#grMovTipos [data-tipo]").forEach(function (b) {
  b.addEventListener("click", function () { grDefinirTipo(b.dataset.tipo); });
});
btnNovoProduto.addEventListener("click", fecharGrade);
document.getElementById("btnCategorias").addEventListener("click", fecharGrade);

// Nova versão da lista de produtos: filtros + resumo da grade + botão Grade
// (substitui a anterior; o navegador usa a última)
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
    const vars = gradeCache[p.id] || [];
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
    if (estaComEstoqueBaixo(p)) texto += " · ⚠ Estoque baixo";
    detalhes.textContent = texto;

    info.appendChild(nome);
    info.appendChild(detalhes);

    if (vars.length) {
      const grade = document.createElement("p");
      grade.className = "item-sub";
      const mostrar = vars.slice(0, 8).map(function (v) {
        return rotuloVariacao(v) + " " + v.stock_quantity;
      }).join(" · ");
      const esgotadas = vars.filter(function (v) { return v.stock_quantity <= 0; }).length;
      grade.textContent = "Grade: " + mostrar +
        (vars.length > 8 ? " · +" + (vars.length - 8) : "") +
        (esgotadas ? " · ⚠ " + esgotadas + " esgotada(s)" : "");
      info.appendChild(grade);
    }

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
      if (!vars.length) {
        acoes.appendChild(criarBotao("Estoque", "btn btn-ghost btn-small", function () {
          confirmandoProdutoId = null;
          fecharGrade();
          abrirEstoque(p);
        }));
      }
      acoes.appendChild(criarBotao("Grade", vars.length ? "btn btn-small" : "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        abrirGrade(p);
      }));
      acoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function () {
        confirmandoProdutoId = null;
        fecharEstoque();
        fecharCategorias();
        fecharGrade();
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

// Carrega a grade ao abrir Produtos
document.querySelectorAll('[data-view="produtos"]').forEach(function (botao) {
  botao.addEventListener("click", async function () {
    try {
      await carregarGrade();
      if (produtosCache.length) desenharProdutos();
    } catch (e) {
      console.error("Grade:", e);
    }
  });
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) {
      gradeCache = {};
      fecharGrade();
    }
  });
});
// FIM DA PARTE 24c
// ===== PARTE 24d: Tamanho/cor na Venda e no Orçamento =====
// As funções abaixo substituem as versões anteriores (o navegador usa a última).

function mesmoItem(item, productId, variantId) {
  return item.product_id === productId && (item.variant_id || null) === (variantId || null);
}

function variacoesDe(productId) {
  return gradeCache[productId] || [];
}

function buscarVariacao(productId, variantId) {
  return variacoesDe(productId).find(function (v) { return v.id === variantId; });
}

function nomeComVariacao(nome, rotulo) {
  return rotulo ? nome + " (" + rotulo + ")" : nome;
}

function criarCampoVariacao(id) {
  const campo = document.createElement("div");
  campo.className = "field";
  campo.hidden = true;
  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = "Tamanho / cor";
  const sel = document.createElement("select");
  sel.id = id;
  campo.appendChild(label);
  campo.appendChild(sel);
  return campo;
}

function preencherVariacoes(campo, sel, productId, bloquearEsgotadas) {
  const vars = variacoesDe(productId);
  sel.innerHTML = "";
  if (!productId || vars.length === 0) {
    campo.hidden = true;
    return;
  }
  const vazio = document.createElement("option");
  vazio.value = "";
  vazio.textContent = "Escolha o tamanho/cor";
  sel.appendChild(vazio);
  vars.forEach(function (v) {
    const o = document.createElement("option");
    o.value = v.id;
    o.textContent = rotuloVariacao(v) + " · estoque " + v.stock_quantity;
    if (bloquearEsgotadas && v.stock_quantity <= 0) o.disabled = true;
    sel.appendChild(o);
  });
  campo.hidden = false;
}

// ---------- VENDAS ----------
const vdVarCampo = criarCampoVariacao("vdVariacao");
selVdProduto.closest(".field-row").after(vdVarCampo);
const selVdVariacao = document.getElementById("vdVariacao");

function vdAtualizarVariacoes() {
  preencherVariacoes(vdVarCampo, selVdVariacao, selVdProduto.value, true);
}
selVdProduto.addEventListener("change", vdAtualizarVariacoes);

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
  const vars = variacoesDe(id);
  let variante = null;
  let disponivel = p.stock_quantity;
  let rotulo = "";

  if (vars.length) {
    const vid = selVdVariacao.value;
    if (!vid) {
      vdErroEl.textContent = "Escolha o tamanho/cor de \"" + p.name + "\".";
      return;
    }
    const v = buscarVariacao(id, vid);
    variante = v.id;
    disponivel = v.stock_quantity;
    rotulo = rotuloVariacao(v);
  }

  const existente = vdCarrinho.find(function (x) { return mesmoItem(x, id, variante); });
  const jaNoCarrinho = existente ? existente.quantity : 0;
  if (jaNoCarrinho + qtd > disponivel) {
    vdErroEl.textContent = "Estoque insuficiente para \"" + nomeComVariacao(p.name, rotulo) + "\". Disponível: " + disponivel;
    return;
  }

  if (existente) existente.quantity += qtd;
  else vdCarrinho.push({ product_id: id, variant_id: variante, quantity: qtd });

  inVdQtd.value = "";
  selVdProduto.value = "";
  vdAtualizarVariacoes();
  vdDesenharCarrinho();
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
    const v = item.variant_id ? buscarVariacao(item.product_id, item.variant_id) : null;

    const linha = document.createElement("div");
    linha.className = "list-item";

    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = nomeComVariacao(p.name, v ? rotuloVariacao(v) : "");
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = item.quantity + " × " + moeda(p.sale_price) + " = " +
      moeda(Number(p.sale_price) * item.quantity);
    info.appendChild(nome);
    info.appendChild(sub);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";
    acoes.appendChild(criarBotao("Remover", "btn btn-ghost btn-small", function () {
      vdCarrinho = vdCarrinho.filter(function (x) { return !mesmoItem(x, item.product_id, item.variant_id); });
      vdDesenharCarrinho();
    }));

    linha.appendChild(info);
    linha.appendChild(acoes);
    vdCarrinhoEl.appendChild(linha);
  });
  vdAtualizarResumo();
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
  vdAtualizarVariacoes();
  vdDesenharCarrinho();
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
        const item = { product_id: x.product_id, quantity: x.quantity };
        if (x.variant_id) item.variant_id = x.variant_id;
        return item;
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
    await carregarGrade();

    vdItensPorVenda = {};
    if (vdVendas.length > 0) {
      const ids = vdVendas.map(function (v) { return v.id; });
      const itensResp = await cliente
        .from("sale_items")
        .select("sale_id, product_name, variant_label, quantity, total")
        .in("sale_id", ids);
      if (itensResp.error) throw itensResp.error;
      (itensResp.data || []).forEach(function (i) {
        i.product_name = nomeComVariacao(i.product_name, i.variant_label);
        if (!vdItensPorVenda[i.sale_id]) vdItensPorVenda[i.sale_id] = [];
        vdItensPorVenda[i.sale_id].push(i);
      });
    }

    // Tira do carrinho itens que não existem mais
    vdCarrinho = vdCarrinho.filter(function (x) {
      return vdBuscarProduto(x.product_id) && (!x.variant_id || buscarVariacao(x.product_id, x.variant_id));
    });

    vdConfirmandoCancelId = null;
    vdPreencherSelects();
    vdAtualizarVariacoes();
    vdDesenharCarrinho();
    desenharVendas();
  } catch (e) {
    console.error(e);
    vdMensagem(listaVendasEl, "Não foi possível carregar as vendas: " + (e.message || e));
  }
}

// ---------- ORÇAMENTOS ----------
const ocVarCampo = criarCampoVariacao("ocVariacao");
selOcProduto.closest(".field-row").after(ocVarCampo);
const selOcVariacao = document.getElementById("ocVariacao");

function ocAtualizarVariacoes() {
  // No orçamento as esgotadas aparecem (dá para orçar para encomenda)
  preencherVariacoes(ocVarCampo, selOcVariacao, selOcProduto.value, false);
}
selOcProduto.addEventListener("change", ocAtualizarVariacoes);

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
  const p = ocProduto(id);
  let variante = null;
  if (variacoesDe(id).length) {
    variante = selOcVariacao.value || null;
    if (!variante) {
      ocErroEl.textContent = "Escolha o tamanho/cor de \"" + p.name + "\".";
      return;
    }
  }

  const existente = ocCarrinho.find(function (x) { return mesmoItem(x, id, variante); });
  if (existente) existente.quantity += Number(texto);
  else ocCarrinho.push({ product_id: id, variant_id: variante, quantity: Number(texto) });

  inOcQtd.value = "";
  selOcProduto.value = "";
  ocAtualizarVariacoes();
  ocDesenharCarrinho();
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
    const v = it.variant_id ? buscarVariacao(it.product_id, it.variant_id) : null;

    const linha = document.createElement("div");
    linha.className = "list-item";
    const info = document.createElement("div");
    const nome = document.createElement("p");
    nome.className = "item-title";
    nome.textContent = nomeComVariacao(p.name, v ? rotuloVariacao(v) : "");
    const sub = document.createElement("p");
    sub.className = "item-sub";
    sub.textContent = it.quantity + " × " + moeda(p.sale_price) + " = " + moeda(Number(p.sale_price) * it.quantity);
    info.appendChild(nome);
    info.appendChild(sub);

    const acoes = document.createElement("div");
    acoes.className = "item-actions";
    acoes.appendChild(criarBotao("Remover", "btn btn-ghost btn-small", function () {
      ocCarrinho = ocCarrinho.filter(function (x) { return !mesmoItem(x, it.product_id, it.variant_id); });
      ocDesenharCarrinho();
    }));
    linha.appendChild(info);
    linha.appendChild(acoes);
    ocItensEl.appendChild(linha);
  });
  ocAtualizarResumo();
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
  ocAtualizarVariacoes();
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
      p_items: ocCarrinho.map(function (x) {
        const item = { product_id: x.product_id, quantity: x.quantity };
        if (x.variant_id) item.variant_id = x.variant_id;
        return item;
      }),
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
    await carregarGrade();

    ocItensPorOrcamento = {};
    if (ocOrcamentos.length) {
      const r = await cliente.from("quote_items")
        .select("quote_id, product_name, variant_label, quantity, total")
        .in("quote_id", ocOrcamentos.map(function (o) { return o.id; }));
      if (r.error) throw r.error;
      (r.data || []).forEach(function (i) {
        i.product_name = nomeComVariacao(i.product_name, i.variant_label);
        if (!ocItensPorOrcamento[i.quote_id]) ocItensPorOrcamento[i.quote_id] = [];
        ocItensPorOrcamento[i.quote_id].push(i);
      });
    }

    ocCarrinho = ocCarrinho.filter(function (x) {
      return ocProduto(x.product_id) && (!x.variant_id || buscarVariacao(x.product_id, x.variant_id));
    });
    ocConvertendoId = null;
    ocConfirmandoExcluirId = null;
    ocPreencherSelects();
    ocAtualizarVariacoes();
    ocDesenharCarrinho();
    desenharOrcamentos();
  } catch (e) {
    console.error(e);
    ocVazio(listaOrcamentosEl, "Não foi possível carregar os orçamentos: " + (e.message || e));
  }
}
// FIM DA PARTE 24d
// ===== PARTE 25: abrir "Criar conta" vindo da página de apresentação =====
if (window.location.hash === "#criar") {
  definirModo(true);
  history.replaceState(null, "", window.location.pathname);
}
// FIM DA PARTE 25
// ===== PARTE 27: Efeitos e animações (login + dentro do sistema) =====
const ARYA_CALMO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const estiloEfeitos = document.createElement("style");
estiloEfeitos.textContent = `
  /* ---------- Login com vitrine animada (telas largas) ---------- */
  .vitrine { display: none; }
  @media (min-width: 960px) {
    .auth { grid-template-columns: 1.05fr 1fr; padding: 0; align-items: stretch; justify-items: stretch; }
    .auth > .auth-box { align-self: center; justify-self: center; margin: 32px; }
    .vitrine {
      display: flex; flex-direction: column; justify-content: space-between;
      position: relative; overflow: hidden; padding: 48px 56px;
      background: radial-gradient(700px 420px at 80% 10%, rgba(255,255,255,.08), transparent 70%), #000;
      color: #fff; min-height: 100vh;
    }
  }
  .vit-topo { display: flex; align-items: center; gap: 12px; position: relative; z-index: 2; }
  .vit-topo svg { width: 40px; height: auto; display: block; color: #fff; }
  .vit-topo span { font-family: var(--font-brand); font-size: 15px; letter-spacing: .38em; }
  .vit-fundo { position: absolute; right: -18%; bottom: -6%; width: 120%; color: rgba(255,255,255,.04); pointer-events: none; }
  .vit-fundo svg { width: 100%; height: auto; display: block; }
  .vit-frase {
    position: relative; z-index: 2;
    font-family: var(--font-brand); font-weight: 400; font-size: clamp(26px, 2.6vw, 40px);
    line-height: 1.2; max-width: 14ch; min-height: 3.6em;
    transition: opacity .45s ease, transform .45s ease;
  }
  .vit-frase.trocando { opacity: 0; transform: translateY(10px); }
  .vit-palco { position: relative; height: 300px; z-index: 2; }
  .vit-card {
    position: absolute; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.14);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
    border-radius: 16px; padding: 12px 16px; font-size: 14px; white-space: nowrap;
    animation: arya-boiar 6s ease-in-out infinite;
  }
  .vit-card small { display: block; color: #a1a1aa; font-size: 12px; }
  .vit-card strong { font-weight: 600; }
  .vc1 { top: 0; left: 0; }
  .vc2 { top: 96px; left: 46%; animation-delay: -2s; }
  .vc3 { top: 196px; left: 8%; animation-delay: -4s; }
  .vit-grafico { position: absolute; right: 0; bottom: 0; display: flex; align-items: flex-end; gap: 6px; height: 110px; }
  .vit-grafico i { width: 14px; background: #fff; border-radius: 5px 5px 2px 2px; transform-origin: bottom; animation: arya-barra 4s ease-in-out infinite; }
  .vit-grafico i:last-child { background: #22c55e; }
  @keyframes arya-barra { 0% { transform: scaleY(.08); } 30%, 80% { transform: scaleY(1); } 100% { transform: scaleY(.08); } }
  @keyframes arya-boiar { 50% { translate: 0 -10px; } }
  .vit-estrela { position: absolute; color: #fff; opacity: 0; animation: arya-brilho 3.8s ease-in-out infinite; pointer-events: none; z-index: 1; }
  @keyframes arya-brilho { 0%, 100% { opacity: 0; transform: scale(.6) rotate(0deg); } 40% { opacity: .9; transform: scale(1) rotate(45deg); } }
  .vit-rodape { position: relative; z-index: 2; color: #71717a; font-size: 13px; }

  /* Brilho suave atrás da caixa de login (celular) */
  @media (max-width: 959px) {
    .auth::before {
      content: ""; position: fixed; left: 50%; top: 18%; width: 520px; height: 520px; translate: -50% 0;
      background: radial-gradient(circle, rgba(10,10,10,.08), transparent 65%);
      animation: arya-respira 6s ease-in-out infinite; pointer-events: none;
    }
    .auth > .auth-box { position: relative; }
  }
  @keyframes arya-respira { 50% { transform: scale(1.12); opacity: .6; } }

  /* ---------- Dentro do sistema ---------- */
  .db-barra, .rl-barra { transform-origin: bottom; animation: arya-crescer .75s cubic-bezier(.2,.8,.2,1) backwards; }
  .db-col:nth-child(2) .db-barra, .rl-col:nth-child(2) .rl-barra { animation-delay: .05s; }
  .db-col:nth-child(3) .db-barra, .rl-col:nth-child(3) .rl-barra { animation-delay: .1s; }
  .db-col:nth-child(4) .db-barra, .rl-col:nth-child(4) .rl-barra { animation-delay: .15s; }
  .db-col:nth-child(5) .db-barra, .rl-col:nth-child(5) .rl-barra { animation-delay: .2s; }
  .db-col:nth-child(6) .db-barra, .rl-col:nth-child(6) .rl-barra { animation-delay: .25s; }
  .db-col:nth-child(7) .db-barra, .rl-col:nth-child(7) .rl-barra { animation-delay: .3s; }
  @keyframes arya-crescer { from { transform: scaleY(0); } }

  .view.active > .card,
  .view.active > article,
  .view.active > .grid-4 > .card,
  .view.active > .db-duas > .card { animation: arya-entra .5s cubic-bezier(.2,.8,.2,1) backwards; }
  .view.active > .grid-4 > .card:nth-child(2) { animation-delay: .06s; }
  .view.active > .grid-4 > .card:nth-child(3) { animation-delay: .12s; }
  .view.active > .grid-4 > .card:nth-child(4) { animation-delay: .18s; }
  .view.active > .db-duas > .card:nth-child(2) { animation-delay: .08s; }
  @keyframes arya-entra { from { opacity: 0; transform: translateY(12px); } }

  @media (prefers-reduced-motion: reduce) {
    .vit-card, .vit-grafico i, .vit-estrela, .auth::before,
    .db-barra, .rl-barra, .view.active > .card, .view.active > article,
    .view.active > .grid-4 > .card, .view.active > .db-duas > .card { animation: none !important; }
    .vit-estrela { opacity: .6; }
  }
`;
document.head.appendChild(estiloEfeitos);

// ---------- Vitrine do login ----------
const authBox = document.querySelector(".auth-box");
if (authBox && !document.getElementById("vitrine")) {
  const vitrine = document.createElement("div");
  vitrine.id = "vitrine";
  vitrine.className = "vitrine";
  vitrine.setAttribute("aria-hidden", "true");
  vitrine.innerHTML = `
    <div class="vit-fundo">${ARYA_SIMBOLO}</div>
    <div class="vit-topo">${ARYA_SIMBOLO}<span>ARYA</span></div>
    <h2 class="vit-frase" id="vitFrase">Sua loja pensa com você.</h2>
    <div class="vit-palco">
      <div class="vit-card vc1"><small>Venda registrada</small><strong>R$ 189,90 no Pix</strong></div>
      <div class="vit-card vc2"><small>✦ ARYA Pulso</small><strong>3 clientes para reativar</strong></div>
      <div class="vit-card vc3"><small>Estoque</small><strong>Camiseta M acabando</strong></div>
      <div class="vit-grafico">
        <i style="height:45%; animation-delay:0s"></i>
        <i style="height:62%; animation-delay:.08s"></i>
        <i style="height:88%; animation-delay:.16s"></i>
        <i style="height:38%; animation-delay:.24s"></i>
        <i style="height:55%; animation-delay:.32s"></i>
        <i style="height:70%; animation-delay:.4s"></i>
        <i style="height:100%; animation-delay:.48s"></i>
      </div>
    </div>
    <p class="vit-rodape">Gestão e inteligência para lojas de roupas e pequenos comércios.</p>
    <span class="vit-estrela" style="top:14%; right:16%; font-size:20px;">✦</span>
    <span class="vit-estrela" style="top:46%; right:8%; font-size:12px; animation-delay:1.3s;">✦</span>
    <span class="vit-estrela" style="bottom:22%; left:44%; font-size:14px; animation-delay:2.4s;">✦</span>
  `;
  authBox.parentElement.insertBefore(vitrine, authBox);

  const VIT_FRASES = [
    "Sua loja pensa com você.",
    "Venda, estoque e clientes num só lugar.",
    "O Pulso diz o que fazer hoje.",
    "Do P ao GG, cada peça no lugar.",
    "Orçamento pronto para o WhatsApp."
  ];
  let vitIndice = 0;
  if (!ARYA_CALMO) {
    setInterval(function () {
      if (authEl.classList.contains("hidden")) return;
      const frase = document.getElementById("vitFrase");
      frase.classList.add("trocando");
      setTimeout(function () {
        vitIndice = (vitIndice + 1) % VIT_FRASES.length;
        frase.textContent = VIT_FRASES[vitIndice];
        frase.classList.remove("trocando");
      }, 450);
    }, 3800);
  }
}

// ---------- Números do Dashboard subindo ----------
// Esta versão de dbTexto substitui a anterior (o navegador usa a última).
function dbTexto(id, texto) {
  const el = document.getElementById(id);
  if (!el) return;
  const limpo = String(texto).replace(/\u00a0/g, " ").trim();
  const partes = /^(R\$ ?)?(\d{1,3}(?:\.\d{3})*|\d+)(,\d{1,2})?$/.exec(limpo);
  if (el._animacao) cancelAnimationFrame(el._animacao);
  if (!partes || ARYA_CALMO) {
    el.textContent = texto;
    return;
  }
  const alvo = Number(limpo.replace(/R\$ ?/, "").replace(/\./g, "").replace(",", "."));
  const ehMoeda = Boolean(partes[1]);
  const inicio = performance.now();
  const duracao = 900;
  function passo(agora) {
    const p = Math.min(1, (agora - inicio) / duracao);
    const v = alvo * (1 - Math.pow(1 - p, 3));
    if (p < 1) {
      el.textContent = ehMoeda ? moeda(v) : Math.round(v).toLocaleString("pt-BR");
      el._animacao = requestAnimationFrame(passo);
    } else {
      el.textContent = texto;
      el._animacao = null;
    }
  }
  el._animacao = requestAnimationFrame(passo);
}
// FIM DA PARTE 27
// ===== PARTE 28: Boas-vindas, banners animados e comemoração =====
const ARYA_SEM_MOVIMENTO = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const estiloVida = document.createElement("style");
estiloVida.textContent = `
  /* ---------- Boas-vindas ---------- */
  .bv-fundo {
    position: fixed; inset: 0; z-index: 400; background: #000; color: #fff;
    display: grid; place-items: center; text-align: center; padding: 24px;
    transition: opacity .6s ease;
  }
  .bv-fundo.saindo { opacity: 0; pointer-events: none; }
  .bv-simbolo { width: 120px; margin: 0 auto 26px; color: #fff; animation: bv-surge 1s cubic-bezier(.2,.8,.2,1) both; }
  .bv-simbolo svg { width: 100%; height: auto; display: block; }
  .bv-ola { font-family: var(--font-brand); font-size: clamp(24px, 4vw, 40px); line-height: 1.2; animation: bv-sobe .8s ease .35s both; }
  .bv-loja { color: #a1a1aa; margin-top: 10px; font-size: 16px; animation: bv-sobe .8s ease .55s both; }
  .bv-estrela { position: absolute; opacity: 0; animation: bv-brilho 2.4s ease-in-out infinite; }
  @keyframes bv-surge { from { opacity: 0; transform: scale(.7) translateY(14px); } }
  @keyframes bv-sobe { from { opacity: 0; transform: translateY(14px); } }
  @keyframes bv-brilho { 0%, 100% { opacity: 0; transform: scale(.5) rotate(0); } 45% { opacity: 1; transform: scale(1) rotate(45deg); } }

  /* ---------- Banner das telas ---------- */
  .banner {
    position: relative; overflow: hidden; margin-bottom: 16px;
    background: radial-gradient(520px 260px at 85% 20%, rgba(255,255,255,.09), transparent 70%), #000;
    color: #fff; border-radius: var(--radius); padding: 26px 28px;
    display: grid; grid-template-columns: 1fr 220px; gap: 20px; align-items: center; min-height: 190px;
  }
  .banner h2 { font-family: var(--font-brand); font-weight: 400; font-size: clamp(18px, 2.2vw, 24px); line-height: 1.25; }
  .banner .b-sub { color: #a1a1aa; font-size: 14px; margin-top: 6px; max-width: 46ch; }
  .b-stats { display: flex; gap: 28px; flex-wrap: wrap; margin-top: 18px; }
  .b-stat { cursor: default; }
  .b-stat strong { display: block; font-size: 26px; font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .b-stat span { color: #a1a1aa; font-size: 12.5px; }
  .b-arte { position: relative; height: 150px; transition: transform .25s ease-out; }
  @media (max-width: 700px) {
    .banner { grid-template-columns: 1fr; padding: 22px; }
    .b-arte { position: absolute; right: -20px; top: 10px; width: 150px; height: 120px; opacity: .35; }
    .b-stats { gap: 20px; }
    .b-stat strong { font-size: 22px; }
  }

  /* Clientes: órbita */
  .orb-anel { position: absolute; inset: 10px 30px; border: 1px dashed rgba(255,255,255,.25); border-radius: 50%; animation: orb-gira 14s linear infinite; }
  .orb-anel i { position: absolute; width: 30px; height: 30px; border-radius: 50%; background: #fff; color: #000; font-size: 12px; font-weight: 700; display: grid; place-items: center; font-style: normal; }
  .orb-anel i:nth-child(1) { top: -15px; left: calc(50% - 15px); }
  .orb-anel i:nth-child(2) { bottom: -15px; left: calc(50% - 15px); background: #22c55e; color: #fff; }
  .orb-anel i:nth-child(3) { top: calc(50% - 15px); left: -15px; background: #3f3f46; color: #fff; }
  .orb-anel i:nth-child(4) { top: calc(50% - 15px); right: -15px; }
  .orb-anel i { animation: orb-contra 14s linear infinite; }
  .orb-centro { position: absolute; left: 50%; top: 50%; translate: -50% -50%; width: 54px; height: 54px; border-radius: 50%; border: 1px solid rgba(255,255,255,.3); display: grid; place-items: center; font-size: 22px; animation: bv-brilho 3s ease-in-out infinite; opacity: 1; }
  @keyframes orb-gira { to { transform: rotate(360deg); } }
  @keyframes orb-contra { to { transform: rotate(-360deg); } }

  /* Produtos: etiqueta balançando */
  .tag-fio { position: absolute; left: 50%; top: 0; width: 2px; height: 34px; background: rgba(255,255,255,.4); }
  .tag {
    position: absolute; left: calc(50% - 55px); top: 30px; width: 110px; height: 96px;
    background: #fff; color: #000; border-radius: 12px 12px 16px 16px;
    transform-origin: 50% -4px; animation: tag-balanca 3.2s ease-in-out infinite;
    display: grid; place-items: center; font-family: var(--font-brand); font-size: 13px;
  }
  .tag::before { content: ""; position: absolute; top: 8px; left: 50%; width: 10px; height: 10px; margin-left: -5px; border-radius: 50%; background: #000; }
  .tam { position: absolute; width: 30px; height: 30px; border-radius: 9px; border: 1px solid rgba(255,255,255,.35); display: grid; place-items: center; font-size: 12px; font-weight: 600; animation: tam-pula 2.4s ease-in-out infinite; }
  .tam.t1 { left: 4px; bottom: 6px; }
  .tam.t2 { right: 4px; bottom: 26px; animation-delay: .4s; }
  .tam.t3 { right: 34px; top: 4px; animation-delay: .8s; }
  @keyframes tag-balanca { 0%, 100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
  @keyframes tam-pula { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

  /* Vendas: recibo e moedas */
  .recibo {
    position: absolute; left: calc(50% - 50px); bottom: 0; width: 100px; height: 130px;
    background: #fff; border-radius: 8px 8px 0 0; padding: 14px 12px;
    animation: recibo-sai 3.6s ease-in-out infinite;
  }
  .recibo i { display: block; height: 6px; border-radius: 3px; background: #e4e4e7; margin-bottom: 8px; }
  .recibo i:nth-child(2) { width: 70%; }
  .recibo i:nth-child(3) { width: 85%; }
  .recibo b { display: block; margin-top: 12px; color: #16a34a; font-size: 22px; text-align: center; }
  .moeda-anim { position: absolute; width: 24px; height: 24px; border-radius: 50%; background: #fbbf24; color: #78350f; font-size: 12px; font-weight: 800; display: grid; place-items: center; top: -30px; animation: moeda-cai 2.4s ease-in infinite; }
  .moeda-anim.m1 { left: 12px; }
  .moeda-anim.m2 { right: 16px; animation-delay: .8s; }
  .moeda-anim.m3 { left: 46%; animation-delay: 1.6s; }
  @keyframes recibo-sai { 0% { transform: translateY(100%); } 25%, 80% { transform: translateY(0); } 100% { transform: translateY(100%); } }
  @keyframes moeda-cai { 0% { transform: translateY(0) rotate(0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translateY(190px) rotate(320deg); opacity: 0; } }

  /* Orçamentos: balões */
  .balao { position: absolute; padding: 9px 12px; border-radius: 14px; font-size: 12px; line-height: 1.3; color: #000; opacity: 0; animation: balao-ciclo 6s ease infinite; white-space: nowrap; }
  .balao.b1 { left: 0; top: 6px; background: #fff; }
  .balao.b2 { right: 0; top: 56px; background: #d9fdd3; animation-delay: 1.2s; }
  .balao.b3 { left: 14px; top: 108px; background: #fff; animation-delay: 2.4s; }
  @keyframes balao-ciclo { 0% { opacity: 0; transform: translateY(8px) scale(.96); } 10%, 75% { opacity: 1; transform: none; } 90%, 100% { opacity: 0; transform: translateY(-6px); } }

  /* Fornecedores: caminhão */
  .estrada { position: absolute; left: 0; right: 0; bottom: 18px; height: 2px; background: repeating-linear-gradient(90deg, rgba(255,255,255,.45) 0 16px, transparent 16px 30px); animation: estrada-anda .8s linear infinite; }
  .caminhao { position: absolute; bottom: 24px; left: 0; width: 110px; height: 60px; animation: caminhao-vai 7s ease-in-out infinite; }
  .bau { position: absolute; left: 0; bottom: 12px; width: 70px; height: 46px; background: #fff; border-radius: 6px; display: grid; place-items: center; color: #000; font-family: var(--font-brand); font-size: 10px; }
  .cabine { position: absolute; left: 72px; bottom: 12px; width: 34px; height: 32px; background: #a1a1aa; border-radius: 4px 12px 4px 4px; }
  .roda { position: absolute; bottom: 0; width: 18px; height: 18px; border-radius: 50%; background: #000; border: 4px solid #fff; animation: roda-gira .6s linear infinite; }
  .roda.r1 { left: 10px; } .roda.r2 { left: 80px; }
  @keyframes estrada-anda { to { background-position: -30px 0; } }
  @keyframes caminhao-vai { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(100px); } }
  @keyframes roda-gira { to { transform: rotate(360deg); } }

  /* ---------- Comemoração ---------- */
  .festa { position: fixed; inset: 0; z-index: 350; pointer-events: none; display: grid; place-items: center; }
  .festa-check {
    width: 96px; height: 96px; border-radius: 50%; background: #000; color: #fff;
    display: grid; place-items: center; font-size: 46px; font-weight: 700;
    animation: festa-pop 1.1s cubic-bezier(.2,.8,.2,1) forwards;
  }
  .festa i { position: absolute; left: 50%; top: 50%; font-style: normal; font-size: 18px; color: #000; animation: festa-voa 1s ease-out forwards; }
  @keyframes festa-pop { 0% { transform: scale(.3); opacity: 0; } 25% { transform: scale(1.08); opacity: 1; } 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(.9); opacity: 0; } }
  @keyframes festa-voa { from { transform: translate(-50%, -50%) scale(.4); opacity: 1; } to { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(1) rotate(180deg); opacity: 0; } }

  @media (prefers-reduced-motion: reduce) {
    .bv-simbolo, .bv-ola, .bv-loja, .bv-estrela, .orb-anel, .orb-anel i, .orb-centro, .tag, .tam,
    .recibo, .moeda-anim, .balao, .estrada, .caminhao, .roda, .festa-check, .festa i { animation: none !important; }
    .balao, .bv-estrela { opacity: 1; }
    .moeda-anim { display: none; }
  }
`;
document.head.appendChild(estiloVida);

// ---------- Boas-vindas ----------
async function mostrarBoasVindas() {
  try {
    if (sessionStorage.getItem("arya_boas_vindas") === "1") return;
    sessionStorage.setItem("arya_boas_vindas", "1");
  } catch (e) { /* segue mesmo sem sessionStorage */ }

  let nome = "";
  let loja = "";
  try {
    const cliente = await iniciarSupabase();
    const usuario = await cliente.auth.getUser();
    const perfil = await cliente.from("profiles")
      .select("full_name, companies(name)")
      .eq("id", usuario.data.user.id).maybeSingle();
    if (perfil.data) {
      nome = String(perfil.data.full_name || "").trim().split(" ")[0];
      loja = perfil.data.companies ? perfil.data.companies.name : "";
    }
  } catch (e) { console.error(e); }

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  const fundo = document.createElement("div");
  fundo.className = "bv-fundo";
  fundo.innerHTML = `
    <div>
      <div class="bv-simbolo">${ARYA_SIMBOLO}</div>
      <p class="bv-ola"></p>
      <p class="bv-loja"></p>
    </div>
    <span class="bv-estrela" style="top:22%; left:24%; font-size:18px;">✦</span>
    <span class="bv-estrela" style="top:30%; right:22%; font-size:12px; animation-delay:.6s;">✦</span>
    <span class="bv-estrela" style="bottom:26%; left:40%; font-size:14px; animation-delay:1.1s;">✦</span>
  `;
  fundo.querySelector(".bv-ola").textContent = saudacao + (nome ? ", " + nome : "") + ".";
  fundo.querySelector(".bv-loja").textContent = loja ? "Vamos fazer a " + loja + " crescer hoje." : "Vamos fazer sua loja crescer hoje.";
  document.body.appendChild(fundo);

  function fechar() {
    fundo.classList.add("saindo");
    setTimeout(function () { fundo.remove(); }, 650);
  }
  fundo.addEventListener("click", fechar);
  setTimeout(fechar, ARYA_SEM_MOVIMENTO ? 900 : 2200);
}

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (sessao && (evento === "SIGNED_IN" || evento === "INITIAL_SESSION")) {
      setTimeout(mostrarBoasVindas, 0);
    }
    if (!sessao) {
      try { sessionStorage.removeItem("arya_boas_vindas"); } catch (e) {}
    }
  });
});

// ---------- Banners ----------
const BANNERS = {
  clientes: {
    titulo: "Quem compra com você.",
    sub: "Cada cliente com histórico, favoritos e WhatsApp a um toque.",
    arte: '<div class="orb-anel"><i>A</i><i>M</i><i>J</i><i>L</i></div><div class="orb-centro">✦</div>',
    stats: ["Clientes", "Novos este mês", "Com WhatsApp"]
  },
  produtos: {
    titulo: "Sua vitrine, organizada.",
    sub: "Preço, custo, grade de tamanhos e cores, e o estoque sempre certo.",
    arte: '<div class="tag-fio"></div><div class="tag">ARYA</div><span class="tam t1">P</span><span class="tam t2">M</span><span class="tam t3">G</span>',
    stats: ["Produtos", "Peças em estoque", "Esgotados"]
  },
  vendas: {
    titulo: "Cada venda conta.",
    sub: "Registre em segundos. O estoque e os relatórios se atualizam sozinhos.",
    arte: '<div class="recibo"><i></i><i></i><i></i><b>✓</b></div><span class="moeda-anim m1">$</span><span class="moeda-anim m2">$</span><span class="moeda-anim m3">$</span>',
    stats: ["Vendido hoje", "Últimos 7 dias", "Ticket médio (7 dias)"]
  },
  orcamentos: {
    titulo: "Negociação na palma da mão.",
    sub: "Monte, envie pelo WhatsApp e transforme em venda com um toque.",
    arte: '<div class="balao b1">Me passa um orçamento?</div><div class="balao b2">Segue: R$ 349,70 ✓✓</div><div class="balao b3">Fechado! 😍</div>',
    stats: ["Em aberto", "Aceitos", "Em negociação"]
  },
  fornecedores: {
    titulo: "Quem abastece a sua loja.",
    sub: "Contatos e pedidos de reposição pelo WhatsApp, sem procurar número.",
    arte: '<div class="estrada"></div><div class="caminhao"><div class="bau">ARYA</div><div class="cabine"></div><span class="roda r1"></span><span class="roda r2"></span></div>',
    stats: ["Fornecedores"]
  }
};

function contarAte(el, valor, ehMoeda) {
  const final = ehMoeda ? moeda(valor) : Math.round(valor).toLocaleString("pt-BR");
  if (ARYA_SEM_MOVIMENTO || valor === 0) { el.textContent = final; return; }
  const inicio = performance.now();
  function passo(agora) {
    const p = Math.min(1, (agora - inicio) / 900);
    const v = valor * (1 - Math.pow(1 - p, 3));
    el.textContent = p < 1 ? (ehMoeda ? moeda(v) : Math.round(v).toLocaleString("pt-BR")) : final;
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

Object.keys(BANNERS).forEach(function (view) {
  const tela = document.getElementById("view-" + view);
  if (!tela || document.getElementById("banner-" + view)) return;
  const b = BANNERS[view];
  const el = document.createElement("section");
  el.className = "banner";
  el.id = "banner-" + view;
  el.innerHTML =
    '<div><h2></h2><p class="b-sub"></p><div class="b-stats"></div></div>' +
    '<div class="b-arte" aria-hidden="true">' + b.arte + "</div>";
  el.querySelector("h2").textContent = b.titulo;
  el.querySelector(".b-sub").textContent = b.sub;
  const stats = el.querySelector(".b-stats");
  b.stats.forEach(function (rotulo) {
    const s = document.createElement("div");
    s.className = "b-stat";
    s.innerHTML = "<strong>—</strong><span></span>";
    s.querySelector("span").textContent = rotulo;
    stats.appendChild(s);
  });
  tela.insertBefore(el, tela.firstChild);

  // A arte acompanha o dedo/mouse
  const arte = el.querySelector(".b-arte");
  if (!ARYA_SEM_MOVIMENTO) {
    el.addEventListener("pointermove", function (e) {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      arte.style.transform = "translate(" + (x * 18) + "px," + (y * 12) + "px)";
    });
    el.addEventListener("pointerleave", function () { arte.style.transform = ""; });
  }
});

async function bnContar(consulta) {
  const r = await consulta;
  if (r.error) throw r.error;
  return r.count || 0;
}

async function carregarBanner(view) {
  const el = document.getElementById("banner-" + view);
  if (!el) return;
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) return;

    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const mes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const seteDias = new Date(hoje.getTime() - 6 * 86400000);
    let valores = [];
    let moedas = [];

    if (view === "clientes") {
      valores = await Promise.all([
        bnContar(cliente.from("customers").select("id", { count: "exact", head: true })),
        bnContar(cliente.from("customers").select("id", { count: "exact", head: true }).gte("created_at", mes.toISOString())),
        bnContar(cliente.from("customers").select("id", { count: "exact", head: true }).not("phone", "is", null))
      ]);
      moedas = [false, false, false];
    }
    if (view === "produtos") {
      const r = await cliente.from("products").select("stock_quantity");
      if (r.error) throw r.error;
      const lista = r.data || [];
      valores = [
        lista.length,
        lista.reduce(function (s, p) { return s + Number(p.stock_quantity || 0); }, 0),
        lista.filter(function (p) { return Number(p.stock_quantity) <= 0; }).length
      ];
      moedas = [false, false, false];
    }
    if (view === "vendas") {
      const r = await cliente.from("sales").select("total, created_at")
        .gte("created_at", seteDias.toISOString()).neq("status", "cancelled");
      if (r.error) throw r.error;
      const lista = r.data || [];
      const hojeTotal = lista.filter(function (v) { return new Date(v.created_at) >= hoje; })
        .reduce(function (s, v) { return s + Number(v.total); }, 0);
      const semana = lista.reduce(function (s, v) { return s + Number(v.total); }, 0);
      valores = [hojeTotal, semana, lista.length ? semana / lista.length : 0];
      moedas = [true, true, true];
    }
    if (view === "orcamentos") {
      const r = await cliente.from("quotes").select("status, total").in("status", ["open", "sent", "accepted"]);
      if (r.error) throw r.error;
      const lista = r.data || [];
      valores = [
        lista.filter(function (o) { return o.status !== "accepted"; }).length,
        lista.filter(function (o) { return o.status === "accepted"; }).length,
        lista.reduce(function (s, o) { return s + Number(o.total); }, 0)
      ];
      moedas = [false, false, true];
    }
    if (view === "fornecedores") {
      valores = [await bnContar(cliente.from("suppliers").select("id", { count: "exact", head: true }))];
      moedas = [false];
    }

    el.querySelectorAll(".b-stat strong").forEach(function (forte, i) {
      contarAte(forte, valores[i] || 0, moedas[i]);
    });
  } catch (e) {
    console.error("Banner " + view + ":", e);
  }
}

Object.keys(BANNERS).forEach(function (view) {
  document.querySelectorAll('[data-view="' + view + '"]').forEach(function (botao) {
    botao.addEventListener("click", function () { setTimeout(function () { carregarBanner(view); }, 150); });
  });
});

// ---------- Comemoração ----------
function celebrar() {
  if (ARYA_SEM_MOVIMENTO) return;
  const festa = document.createElement("div");
  festa.className = "festa";
  festa.innerHTML = '<div class="festa-check">✓</div>';
  for (let i = 0; i < 16; i++) {
    const estrela = document.createElement("i");
    const angulo = (Math.PI * 2 * i) / 16;
    const dist = 110 + Math.random() * 90;
    estrela.textContent = "✦";
    estrela.style.setProperty("--x", Math.cos(angulo) * dist + "px");
    estrela.style.setProperty("--y", Math.sin(angulo) * dist + "px");
    estrela.style.animationDelay = (Math.random() * 0.15) + "s";
    festa.appendChild(estrela);
  }
  document.body.appendChild(festa);
  setTimeout(function () { festa.remove(); }, 1300);
}

// Esta versão de avisar substitui a anterior: mostra o aviso e comemora as conquistas.
function avisar(mensagem) {
  toastEl.textContent = mensagem;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove("show");
  }, 2600);
  if (/^(Venda registrada|Orçamento virou venda|Meta salva|Prêmio resgatado|Conta e empresa criadas)/.test(String(mensagem))) {
    celebrar();
  }
}
// FIM DA PARTE 28
// ===== PARTE 29: Vitrine de produtos, foto em tela cheia e fotos no banner =====
const SEM_MOV_29 = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const estiloVitrine = document.createElement("style");
estiloVitrine.textContent = `
  .vt-modos { display: inline-flex; gap: 4px; padding: 4px; border-radius: 12px; background: var(--surface-2); border: 1px solid var(--border); margin: 4px 0 12px; }
  .vt-modos button { padding: 7px 16px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--muted); }
  .vt-modos button.ativo { background: var(--surface); color: var(--text); box-shadow: var(--shadow-sm); }
  .vt-grade { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 16px; margin-top: 6px; }
  .vt-grade[hidden] { display: none; }
  .vt-cena { perspective: 1000px; }
  .vt-cartao {
    position: relative; height: 330px; border-radius: 18px; cursor: pointer;
    transform-style: preserve-3d; transition: transform .6s cubic-bezier(.2,.8,.2,1);
  }
  .vt-cartao.virado { transform: rotateY(180deg) !important; }
  .vt-face {
    position: absolute; inset: 0; border-radius: 18px; overflow: hidden;
    -webkit-backface-visibility: hidden; backface-visibility: hidden;
    border: 1px solid var(--border); background: var(--surface);
    box-shadow: 0 18px 40px -28px rgba(0,0,0,.45);
  }
  .vt-foto { height: 236px; background: var(--surface-2); position: relative; overflow: hidden; }
  .vt-foto img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
  .vt-cartao:hover .vt-foto img { transform: scale(1.06); }
  .vt-inicial {
    width: 100%; height: 100%; display: grid; place-items: center;
    background: radial-gradient(circle at 30% 20%, #3f3f46, #000 70%); color: #fff;
    font-family: var(--font-brand); font-size: 54px;
  }
  .vt-brilho { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(circle at var(--bx, 50%) var(--by, 0%), rgba(255,255,255,.28), transparent 45%); opacity: 0; transition: opacity .3s ease; }
  .vt-cartao:hover .vt-brilho { opacity: 1; }
  .vt-selo { position: absolute; top: 10px; left: 10px; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,.92); color: #000; }
  .vt-selo.alerta { background: #fff7ed; color: #c2410c; }
  .vt-info { padding: 12px 14px; }
  .vt-nome { font-weight: 600; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vt-preco { font-size: 18px; font-weight: 600; letter-spacing: -.02em; margin-top: 2px; }
  .vt-verso { transform: rotateY(180deg); padding: 18px; display: flex; flex-direction: column; gap: 10px; background: #000; color: #fff; border-color: #000; }
  .vt-verso .vt-nome { white-space: normal; font-size: 16px; }
  .vt-verso p { color: #a1a1aa; font-size: 13px; }
  .vt-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .vt-chips span { font-size: 12px; padding: 4px 9px; border-radius: 8px; border: 1px solid #3f3f46; }
  .vt-chips span.zero { color: #f97316; border-color: #7c2d12; }
  .vt-verso .vt-botoes { margin-top: auto; display: flex; gap: 6px; flex-wrap: wrap; }
  .vt-verso .btn { background: #fff; color: #000; border-color: #fff; }
  .vt-verso .btn-ghost { background: transparent; color: #fff; border-color: #3f3f46; box-shadow: none; }

  /* Foto em tela cheia */
  .lb-fundo { position: fixed; inset: 0; z-index: 380; background: rgba(0,0,0,.94); display: grid; grid-template-rows: auto 1fr auto; color: #fff; touch-action: none; }
  .lb-fundo[hidden] { display: none; }
  .lb-topo { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; padding-top: calc(14px + env(safe-area-inset-top)); }
  .lb-fechar, .lb-seta { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,.12); color: #fff; font-size: 20px; display: grid; place-items: center; }
  .lb-palco { position: relative; overflow: hidden; display: grid; place-items: center; }
  .lb-palco img { max-width: 92vw; max-height: 72vh; object-fit: contain; border-radius: 12px; transition: transform .25s ease, opacity .25s ease; user-select: none; -webkit-user-drag: none; }
  .lb-seta { position: absolute; top: 50%; translate: 0 -50%; }
  .lb-seta.esq { left: 14px; } .lb-seta.dir { right: 14px; }
  .lb-legenda { text-align: center; padding: 14px 18px calc(18px + env(safe-area-inset-bottom)); }
  .lb-legenda strong { display: block; font-size: 17px; }
  .lb-legenda span { color: #a1a1aa; font-size: 14px; }
  @media (max-width: 700px) { .lb-seta { display: none; } }

  /* Polaroids no banner de Produtos */
  .pol { position: absolute; width: 92px; padding: 6px 6px 18px; background: #fff; border-radius: 6px; box-shadow: 0 14px 30px -12px rgba(0,0,0,.6); animation: pol-boia 5s ease-in-out infinite; }
  .pol img { width: 100%; height: 80px; object-fit: cover; border-radius: 3px; display: block; }
  .pol.p1 { left: 4px; top: 14px; rotate: -10deg; }
  .pol.p2 { left: 64px; top: 0; rotate: 6deg; animation-delay: -1.6s; z-index: 2; }
  .pol.p3 { right: 0; top: 40px; rotate: 12deg; animation-delay: -3.2s; }
  @keyframes pol-boia { 50% { translate: 0 -8px; } }

  @media (prefers-reduced-motion: reduce) {
    .vt-cartao, .vt-foto img, .lb-palco img { transition: none !important; }
    .pol { animation: none !important; }
  }
`;
document.head.appendChild(estiloVitrine);

// ---------- Botões Lista | Vitrine ----------
const vtModos = document.createElement("div");
vtModos.className = "vt-modos";
vtModos.setAttribute("role", "group");
vtModos.setAttribute("aria-label", "Modo de exibição");
vtModos.innerHTML = '<button type="button" data-modo="lista" class="ativo">Lista</button><button type="button" data-modo="vitrine">Vitrine</button>';
listaProdutosEl.before(vtModos);

const vtGrade = document.createElement("div");
vtGrade.className = "vt-grade";
vtGrade.hidden = true;
listaProdutosEl.after(vtGrade);

let vtModo = "lista";
try { if (localStorage.getItem("arya_modo_produtos") === "vitrine") vtModo = "vitrine"; } catch (e) {}

function vtAplicarModo() {
  vtModos.querySelectorAll("button").forEach(function (b) { b.classList.toggle("ativo", b.dataset.modo === vtModo); });
  const vitrine = vtModo === "vitrine";
  listaProdutosEl.hidden = vitrine;
  vtGrade.hidden = !vitrine;
  if (vitrine) desenharVitrine();
}
vtModos.querySelectorAll("button").forEach(function (b) {
  b.addEventListener("click", function () {
    vtModo = b.dataset.modo;
    try { localStorage.setItem("arya_modo_produtos", vtModo); } catch (e) {}
    vtAplicarModo();
  });
});

// Mesmos filtros da lista (pesquisa, categoria e estoque baixo)
function vtFiltrados() {
  const termo = prBuscaEl.value.trim().toLowerCase();
  const categoria = selFiltroCategoria.value;
  const soBaixo = chkFiltroBaixo.checked;
  return produtosCache.filter(function (p) {
    if (!p.name.toLowerCase().includes(termo)) return false;
    if (categoria === "__sem__" && p.category_id) return false;
    if (categoria && categoria !== "__sem__" && p.category_id !== categoria) return false;
    if (soBaixo && !estaComEstoqueBaixo(p)) return false;
    return true;
  });
}

function desenharVitrine() {
  vtGrade.innerHTML = "";
  const lista = vtFiltrados();
  if (lista.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "empty";
    vazio.style.gridColumn = "1 / -1";
    vazio.textContent = produtosCache.length ? "Nenhum produto com esses filtros." : "Nenhum produto cadastrado ainda.";
    vtGrade.appendChild(vazio);
    return;
  }

  lista.forEach(function (p) {
    const vars = (typeof gradeCache !== "undefined" && gradeCache[p.id]) || [];
    const cena = document.createElement("div");
    cena.className = "vt-cena";
    const cartao = document.createElement("div");
    cartao.className = "vt-cartao";
    cartao.tabIndex = 0;
    cartao.setAttribute("role", "button");
    cartao.setAttribute("aria-label", p.name + ", toque para ver detalhes");

    // Frente
    const frente = document.createElement("div");
    frente.className = "vt-face";
    const foto = document.createElement("div");
    foto.className = "vt-foto";
    if (p.image_url) {
      const img = document.createElement("img");
      img.src = p.image_url;
      img.alt = p.name;
      img.loading = "lazy";
      foto.appendChild(img);
    } else {
      const ini = document.createElement("div");
      ini.className = "vt-inicial";
      ini.textContent = p.name.trim().charAt(0).toUpperCase();
      foto.appendChild(ini);
    }
    const brilho = document.createElement("div");
    brilho.className = "vt-brilho";
    foto.appendChild(brilho);
    if (p.stock_quantity <= 0 || estaComEstoqueBaixo(p)) {
      const selo = document.createElement("span");
      selo.className = "vt-selo alerta";
      selo.textContent = p.stock_quantity <= 0 ? "Esgotado" : "Estoque baixo";
      foto.appendChild(selo);
    } else if (vars.length) {
      const selo = document.createElement("span");
      selo.className = "vt-selo";
      selo.textContent = vars.length + " variações";
      foto.appendChild(selo);
    }
    const info = document.createElement("div");
    info.className = "vt-info";
    const nome = document.createElement("p");
    nome.className = "vt-nome";
    nome.textContent = p.name;
    const preco = document.createElement("p");
    preco.className = "vt-preco";
    preco.textContent = moeda(p.sale_price);
    info.appendChild(nome);
    info.appendChild(preco);
    frente.appendChild(foto);
    frente.appendChild(info);

    // Verso
    const verso = document.createElement("div");
    verso.className = "vt-face vt-verso";
    const vNome = document.createElement("p");
    vNome.className = "vt-nome";
    vNome.textContent = p.name;
    const vDet = document.createElement("p");
    vDet.textContent = nomeCategoria(p.category_id) + " · Venda " + moeda(p.sale_price) + " · Estoque " + p.stock_quantity;
    verso.appendChild(vNome);
    verso.appendChild(vDet);
    if (vars.length) {
      const chips = document.createElement("div");
      chips.className = "vt-chips";
      vars.slice(0, 12).forEach(function (v) {
        const c = document.createElement("span");
        if (v.stock_quantity <= 0) c.className = "zero";
        c.textContent = rotuloVariacao(v) + " · " + v.stock_quantity;
        chips.appendChild(c);
      });
      verso.appendChild(chips);
    }
    const botoes = document.createElement("div");
    botoes.className = "vt-botoes";
    if (p.image_url) {
      botoes.appendChild(criarBotao("Ver foto", "btn btn-small", function (e) {
        e.stopPropagation();
        abrirFotoGrande(p.id);
      }));
    }
    botoes.appendChild(criarBotao("Grade", "btn btn-ghost btn-small", function (e) {
      e.stopPropagation();
      abrirGrade(p);
    }));
    botoes.appendChild(criarBotao("Editar", "btn btn-ghost btn-small", function (e) {
      e.stopPropagation();
      fecharGrade();
      fecharEstoque();
      fecharCategorias();
      abrirFormProduto(p);
    }));
    verso.appendChild(botoes);

    cartao.appendChild(frente);
    cartao.appendChild(verso);
    cena.appendChild(cartao);
    vtGrade.appendChild(cena);

    // Inclina em 3D acompanhando o dedo/mouse
    if (!SEM_MOV_29) {
      cartao.addEventListener("pointermove", function (e) {
        if (cartao.classList.contains("virado")) return;
        const r = cartao.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        cartao.style.transform = "rotateY(" + ((x - .5) * 18) + "deg) rotateX(" + ((.5 - y) * 14) + "deg)";
        brilho.style.setProperty("--bx", (x * 100) + "%");
        brilho.style.setProperty("--by", (y * 100) + "%");
      });
      cartao.addEventListener("pointerleave", function () {
        if (!cartao.classList.contains("virado")) cartao.style.transform = "";
      });
    }
    // Tocar vira o cartão
    function virar() {
      cartao.style.transform = "";
      cartao.classList.toggle("virado");
    }
    cartao.addEventListener("click", virar);
    cartao.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); virar(); }
    });
  });
}

// A vitrine e o banner se atualizam sempre que a lista de produtos muda
new MutationObserver(function () {
  if (vtModo === "vitrine") desenharVitrine();
  atualizarFotosBanner();
}).observe(listaProdutosEl, { childList: true });

// ---------- Foto em tela cheia ----------
const lbFundo = document.createElement("div");
lbFundo.className = "lb-fundo";
lbFundo.hidden = true;
lbFundo.setAttribute("role", "dialog");
lbFundo.setAttribute("aria-modal", "true");
lbFundo.setAttribute("aria-label", "Foto do produto");
lbFundo.innerHTML = `
  <div class="lb-topo"><span id="lbContador" style="color:#a1a1aa; font-size:14px;"></span><button class="lb-fechar" type="button" aria-label="Fechar">✕</button></div>
  <div class="lb-palco">
    <img id="lbImg" alt="" />
    <button class="lb-seta esq" type="button" aria-label="Foto anterior">‹</button>
    <button class="lb-seta dir" type="button" aria-label="Próxima foto">›</button>
  </div>
  <div class="lb-legenda"><strong id="lbNome"></strong><span id="lbPreco"></span></div>
`;
document.body.appendChild(lbFundo);

const lbImg = document.getElementById("lbImg");
let lbLista = [];
let lbIndice = 0;
let lbZoom = 1;
let lbPan = { x: 0, y: 0 };

function lbAplicarTransform() {
  lbImg.style.transform = "translate(" + lbPan.x + "px," + lbPan.y + "px) scale(" + lbZoom + ")";
}

function lbMostrar() {
  const p = lbLista[lbIndice];
  if (!p) return;
  lbZoom = 1;
  lbPan = { x: 0, y: 0 };
  lbAplicarTransform();
  lbImg.style.opacity = 0;
  setTimeout(function () {
    lbImg.src = p.image_url;
    lbImg.alt = p.name;
    lbImg.style.opacity = 1;
  }, 120);
  document.getElementById("lbNome").textContent = p.name;
  document.getElementById("lbPreco").textContent = moeda(p.sale_price) + " · estoque " + p.stock_quantity;
  document.getElementById("lbContador").textContent = (lbIndice + 1) + " de " + lbLista.length;
}

function abrirFotoGrande(productId) {
  lbLista = produtosCache.filter(function (p) { return p.image_url; });
  lbIndice = Math.max(0, lbLista.findIndex(function (p) { return p.id === productId; }));
  if (!lbLista.length) return;
  lbFundo.hidden = false;
  lbMostrar();
}
function fecharFotoGrande() { lbFundo.hidden = true; }
function lbPassar(direcao) {
  if (!lbLista.length) return;
  lbIndice = (lbIndice + direcao + lbLista.length) % lbLista.length;
  lbMostrar();
}

lbFundo.querySelector(".lb-fechar").addEventListener("click", fecharFotoGrande);
lbFundo.querySelector(".lb-seta.esq").addEventListener("click", function () { lbPassar(-1); });
lbFundo.querySelector(".lb-seta.dir").addEventListener("click", function () { lbPassar(1); });
lbFundo.addEventListener("click", function (e) {
  if (e.target === lbFundo || e.target.classList.contains("lb-palco")) fecharFotoGrande();
});
document.addEventListener("keydown", function (e) {
  if (lbFundo.hidden) return;
  if (e.key === "Escape") fecharFotoGrande();
  if (e.key === "ArrowLeft") lbPassar(-1);
  if (e.key === "ArrowRight") lbPassar(1);
});

// Toque duplo = zoom; arrastar = mover (com zoom) ou passar de foto (sem zoom)
let lbUltimoToque = 0;
let lbArraste = null;
lbImg.addEventListener("pointerdown", function (e) {
  const agora = Date.now();
  if (agora - lbUltimoToque < 300) {
    lbZoom = lbZoom > 1 ? 1 : 2.2;
    lbPan = { x: 0, y: 0 };
    lbAplicarTransform();
    lbUltimoToque = 0;
    return;
  }
  lbUltimoToque = agora;
  lbArraste = { x: e.clientX, y: e.clientY, panX: lbPan.x, panY: lbPan.y };
  lbImg.setPointerCapture(e.pointerId);
  lbImg.style.transition = "none";
});
lbImg.addEventListener("pointermove", function (e) {
  if (!lbArraste) return;
  const dx = e.clientX - lbArraste.x;
  const dy = e.clientY - lbArraste.y;
  if (lbZoom > 1) {
    lbPan = { x: lbArraste.panX + dx, y: lbArraste.panY + dy };
  } else {
    lbPan = { x: dx, y: 0 };
  }
  lbAplicarTransform();
});
lbImg.addEventListener("pointerup", function (e) {
  if (!lbArraste) return;
  const dx = e.clientX - lbArraste.x;
  lbImg.style.transition = "";
  lbArraste = null;
  if (lbZoom === 1) {
    lbPan = { x: 0, y: 0 };
    lbAplicarTransform();
    if (Math.abs(dx) > 60) lbPassar(dx < 0 ? 1 : -1);
  }
});

// Tocar na miniatura da lista também abre a foto grande
listaProdutosEl.addEventListener("click", function (e) {
  const img = e.target.closest("img");
  if (!img) return;
  const p = produtosCache.find(function (x) { return x.image_url === img.getAttribute("src"); });
  if (p) abrirFotoGrande(p.id);
});

// ---------- Fotos reais no banner de Produtos ----------
function atualizarFotosBanner() {
  const banner = document.getElementById("banner-produtos");
  if (!banner) return;
  const arte = banner.querySelector(".b-arte");
  const comFoto = produtosCache.filter(function (p) { return p.image_url; }).slice(0, 3);
  if (comFoto.length === 0 || arte.dataset.fotos === comFoto.map(function (p) { return p.id; }).join(",")) return;
  arte.dataset.fotos = comFoto.map(function (p) { return p.id; }).join(",");
  arte.innerHTML = "";
  comFoto.forEach(function (p, i) {
    const pol = document.createElement("div");
    pol.className = "pol p" + (i + 1);
    const img = document.createElement("img");
    img.src = p.image_url;
    img.alt = "";
    pol.appendChild(img);
    arte.appendChild(pol);
  });
}

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (!sessao) {
      fecharFotoGrande();
      vtGrade.innerHTML = "";
    }
  });
});

vtAplicarModo();
// FIM DA PARTE 29
// ===== PARTE 30: Dashboard interativo (abertura, vitrine e gráfico) =====
const SEM_MOV_30 = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const estiloDash = document.createElement("style");
estiloDash.textContent = `
  .dh {
    position: relative; overflow: hidden; margin-bottom: 16px; border-radius: var(--radius);
    background: radial-gradient(560px 300px at 88% 10%, rgba(255,255,255,.10), transparent 70%), #000;
    color: #fff; padding: 28px; display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: center;
    min-height: 220px;
  }
  .dh h2 { font-family: var(--font-brand); font-weight: 400; font-size: clamp(20px, 2.6vw, 30px); line-height: 1.2; }
  .dh-hoje { margin-top: 16px; }
  .dh-hoje span { color: #a1a1aa; font-size: 13px; }
  .dh-hoje strong { display: block; font-size: clamp(30px, 4vw, 42px); font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
  .dh-dica {
    margin-top: 16px; display: inline-flex; align-items: center; gap: 10px; max-width: 100%;
    background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.14);
    border-radius: 999px; padding: 9px 16px; font-size: 14px; text-align: left; color: #fff;
    transition: opacity .35s ease, transform .35s ease, background .2s ease;
  }
  .dh-dica:hover { background: rgba(255,255,255,.14); }
  .dh-dica.trocando { opacity: 0; transform: translateY(6px); }
  .dh-arte { position: relative; height: 180px; transition: transform .25s ease-out; }
  .dh-arte .dh-simbolo { position: absolute; inset: 20px 0; color: #fff; animation: dh-flutua 6s ease-in-out infinite; }
  .dh-arte .dh-simbolo svg { width: 100%; height: 100%; display: block; }
  .dh-arte .dh-estrela { position: absolute; opacity: 0; animation: dh-brilho 3.2s ease-in-out infinite; }
  @keyframes dh-flutua { 50% { translate: 0 -8px; } }
  @keyframes dh-brilho { 0%, 100% { opacity: 0; transform: scale(.5) rotate(0); } 45% { opacity: 1; transform: scale(1) rotate(45deg); } }
  @media (max-width: 700px) {
    .dh { grid-template-columns: 1fr; padding: 22px; }
    .dh-arte { position: absolute; right: -30px; top: 6px; width: 170px; height: 120px; opacity: .25; }
  }

  /* Vitrine dos mais vendidos */
  .vv-card-topo { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
  .vv-setas { display: flex; gap: 6px; }
  .vv-setas button { width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); font-size: 18px; }
  .vv-trilho { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; scrollbar-width: none; }
  .vv-trilho::-webkit-scrollbar { display: none; }
  .vv-item { flex: 0 0 180px; scroll-snap-align: start; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; background: var(--surface); cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
  .vv-item:hover { transform: translateY(-4px); box-shadow: 0 18px 36px -24px rgba(0,0,0,.5); }
  .vv-foto { height: 180px; background: var(--surface-2); overflow: hidden; }
  .vv-foto img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .5s ease; }
  .vv-item:hover .vv-foto img { transform: scale(1.07); }
  .vv-texto { padding: 10px 12px; }
  .vv-texto strong { display: block; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .vv-texto span { font-size: 12.5px; color: var(--muted); }
  .vv-pos { position: absolute; }

  /* Gráfico que responde ao toque */
  .db-col { cursor: pointer; position: relative; }
  .db-col.sel .db-barra { background: #16a34a; }
  .db-dica {
    position: absolute; bottom: calc(100% + 6px); left: 50%; translate: -50% 0; z-index: 3;
    background: #000; color: #fff; font-size: 12px; padding: 6px 10px; border-radius: 9px; white-space: nowrap;
    pointer-events: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .dh-arte .dh-simbolo, .dh-arte .dh-estrela { animation: none !important; }
    .dh-arte .dh-estrela { opacity: .7; }
    .vv-item, .vv-foto img, .dh-dica { transition: none !important; }
  }
`;
document.head.appendChild(estiloDash);

const viewDash = document.getElementById("view-dashboard");

// ---------- Banner de abertura ----------
const dh = document.createElement("section");
dh.className = "dh";
dh.id = "dashHero";
dh.innerHTML = `
  <div>
    <h2 id="dhOla">Olá!</h2>
    <div class="dh-hoje"><span>Vendido hoje</span><strong id="dhHoje">R$ 0,00</strong><span id="dhHojeQtd"></span></div>
    <button class="dh-dica" id="dhDica" type="button"><span>✦</span><span id="dhDicaTexto">Carregando as dicas do Pulso...</span></button>
  </div>
  <div class="dh-arte" id="dhArte" aria-hidden="true">
    <div class="dh-simbolo">${ARYA_SIMBOLO}</div>
    <span class="dh-estrela" style="top:6px; right:30px; font-size:18px;">✦</span>
    <span class="dh-estrela" style="bottom:10px; left:20px; font-size:12px; animation-delay:1.2s;">✦</span>
    <span class="dh-estrela" style="top:50%; right:0; font-size:10px; animation-delay:2.1s;">✦</span>
  </div>
`;
viewDash.insertBefore(dh, viewDash.firstChild);

const dhArte = document.getElementById("dhArte");
if (!SEM_MOV_30) {
  dh.addEventListener("pointermove", function (e) {
    const r = dh.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    dhArte.style.transform = "translate(" + (x * 24) + "px," + (y * 16) + "px) rotate(" + (x * 6) + "deg)";
  });
  dh.addEventListener("pointerleave", function () { dhArte.style.transform = ""; });
}

let dhDicas = [];
let dhIndice = 0;
let dhIntervalo = null;

function dhMostrarDica() {
  const el = document.getElementById("dhDica");
  const texto = document.getElementById("dhDicaTexto");
  if (!dhDicas.length) return;
  el.classList.add("trocando");
  setTimeout(function () {
    texto.textContent = dhDicas[dhIndice % dhDicas.length].texto;
    el.classList.remove("trocando");
  }, 350);
}
document.getElementById("dhDica").addEventListener("click", function () {
  const dica = dhDicas[dhIndice % dhDicas.length];
  if (!dica || !dica.view) return;
  const botao = document.querySelector('.nav [data-view="' + dica.view + '"]');
  if (botao) botao.click();
});

// ---------- Vitrine dos mais vendidos ----------
const vvCard = document.createElement("article");
vvCard.className = "card";
vvCard.id = "cardVitrineDash";
vvCard.style.marginBottom = "16px";
vvCard.hidden = true;
vvCard.innerHTML = `
  <div class="vv-card-topo">
    <h2 id="vvTitulo">Mais vendidos · 30 dias</h2>
    <div class="vv-setas"><button type="button" id="vvEsq" aria-label="Anterior">‹</button><button type="button" id="vvDir" aria-label="Próximo">›</button></div>
  </div>
  <div class="vv-trilho" id="vvTrilho"></div>
`;
const gradeDash = viewDash.querySelector(".grid-4");
if (gradeDash) gradeDash.after(vvCard);
else viewDash.appendChild(vvCard);

const vvTrilho = document.getElementById("vvTrilho");
let vvPausa = false;
let vvAuto = null;
function vvPassar(direcao) {
  const passo = 194;
  const fim = vvTrilho.scrollWidth - vvTrilho.clientWidth - 4;
  if (direcao > 0 && vvTrilho.scrollLeft >= fim) vvTrilho.scrollTo({ left: 0, behavior: "smooth" });
  else vvTrilho.scrollBy({ left: passo * direcao, behavior: "smooth" });
}
document.getElementById("vvEsq").addEventListener("click", function () { vvPassar(-1); });
document.getElementById("vvDir").addEventListener("click", function () { vvPassar(1); });
["pointerdown", "touchstart", "mouseenter"].forEach(function (ev) {
  vvTrilho.addEventListener(ev, function () { vvPausa = true; }, { passive: true });
});
vvTrilho.addEventListener("mouseleave", function () { vvPausa = false; });
vvTrilho.addEventListener("touchend", function () { setTimeout(function () { vvPausa = false; }, 4000); }, { passive: true });

function vvAbrirFoto(lista, indice) {
  if (typeof lbFundo === "undefined") return;
  lbLista = lista;
  lbIndice = indice;
  lbFundo.hidden = false;
  lbMostrar();
}

// ---------- Carregar tudo ----------
let dashInterTimer = null;
async function carregarDashInterativo() {
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) return;

    const usuario = await cliente.auth.getUser();
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const trintaDias = new Date(hoje.getTime() - 29 * 86400000);
    const empresaId = await obterEmpresaId();

    const r = await Promise.all([
      cliente.from("profiles").select("full_name").eq("id", usuario.data.user.id).maybeSingle(),
      cliente.from("sales").select("id, total, created_at").gte("created_at", trintaDias.toISOString()).neq("status", "cancelled"),
      cliente.from("products").select("id, name, sale_price, stock_quantity, min_stock, image_url, created_at"),
      cliente.from("quotes").select("status, total").eq("status", "accepted"),
      cliente.from("companies").select("settings").eq("id", empresaId).maybeSingle()
    ]);
    r.forEach(function (x) { if (x.error) throw x.error; });

    const nome = r[0].data && r[0].data.full_name ? String(r[0].data.full_name).trim().split(" ")[0] : "";
    const vendas = r[1].data || [];
    const produtos = r[2].data || [];
    const aceitos = r[3].data || [];
    const settings = (r[4].data && r[4].data.settings) || {};

    // Saudação e vendido hoje
    const hora = new Date().getHours();
    document.getElementById("dhOla").textContent =
      (hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite") + (nome ? ", " + nome : "") + ".";
    const deHoje = vendas.filter(function (v) { return new Date(v.created_at) >= hoje; });
    const totalHoje = deHoje.reduce(function (s, v) { return s + Number(v.total); }, 0);
    const elHoje = document.getElementById("dhHoje");
    if (typeof contarAte === "function") contarAte(elHoje, totalHoje, true);
    else elHoje.textContent = moeda(totalHoje);
    document.getElementById("dhHojeQtd").textContent =
      deHoje.length === 1 ? "1 venda hoje" : deHoje.length + " vendas hoje";

    // Dicas com números reais
    dhDicas = [];
    const baixos = produtos.filter(function (p) { return p.min_stock > 0 && p.stock_quantity <= p.min_stock; });
    if (baixos.length) dhDicas.push({ texto: baixos.length + " produto(s) com estoque baixo. Toque para ver.", view: "produtos" });
    if (aceitos.length) {
      const soma = aceitos.reduce(function (s, o) { return s + Number(o.total); }, 0);
      dhDicas.push({ texto: aceitos.length + " orçamento(s) aceito(s): " + moeda(soma) + " esperando virar venda.", view: "orcamentos" });
    }
    const meta = Number(settings.meta_mensal || 0);
    if (meta > 0) {
      const doMes = vendas.filter(function (v) { return new Date(v.created_at) >= inicioMes; })
        .reduce(function (s, v) { return s + Number(v.total); }, 0);
      dhDicas.push({ texto: doMes >= meta
        ? "Meta do mês batida! Você já vendeu " + moeda(doMes) + "."
        : "Faltam " + moeda(meta - doMes) + " para a meta do mês.", view: null });
    }
    dhDicas.push({ texto: "Veja todas as recomendações do ARYA Pulso.", view: "intelligence" });
    dhIndice = 0;
    dhMostrarDica();
    clearInterval(dhIntervalo);
    if (!SEM_MOV_30 && dhDicas.length > 1) {
      dhIntervalo = setInterval(function () { dhIndice += 1; dhMostrarDica(); }, 4500);
    }

    // Vitrine: mais vendidos com foto (ou os mais recentes com foto)
    const qtdPorProduto = {};
    if (vendas.length) {
      const ids = vendas.map(function (v) { return v.id; });
      for (let i = 0; i < ids.length; i += 150) {
        const it = await cliente.from("sale_items").select("product_id, quantity").in("sale_id", ids.slice(i, i + 150));
        if (it.error) throw it.error;
        (it.data || []).forEach(function (x) {
          if (x.product_id) qtdPorProduto[x.product_id] = (qtdPorProduto[x.product_id] || 0) + x.quantity;
        });
      }
    }
    const comFoto = produtos.filter(function (p) { return p.image_url; });
    let lista = comFoto.filter(function (p) { return qtdPorProduto[p.id]; })
      .sort(function (a, b) { return qtdPorProduto[b.id] - qtdPorProduto[a.id]; });
    let titulo = "Mais vendidos · 30 dias";
    if (lista.length === 0) {
      lista = comFoto.slice().sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      titulo = "Sua vitrine";
    }
    lista = lista.slice(0, 12);

    vvTrilho.innerHTML = "";
    if (lista.length === 0) {
      vvCard.hidden = true;
    } else {
      document.getElementById("vvTitulo").textContent = titulo;
      lista.forEach(function (p, i) {
        const item = document.createElement("div");
        item.className = "vv-item";
        item.setAttribute("role", "button");
        item.tabIndex = 0;
        item.setAttribute("aria-label", "Ver foto de " + p.name);
        const foto = document.createElement("div");
        foto.className = "vv-foto";
        const img = document.createElement("img");
        img.src = p.image_url;
        img.alt = p.name;
        img.loading = "lazy";
        foto.appendChild(img);
        const texto = document.createElement("div");
        texto.className = "vv-texto";
        const n = document.createElement("strong");
        n.textContent = p.name;
        const s = document.createElement("span");
        s.textContent = qtdPorProduto[p.id]
          ? qtdPorProduto[p.id] + " vendido(s) · " + moeda(p.sale_price)
          : moeda(p.sale_price) + " · estoque " + p.stock_quantity;
        texto.appendChild(n);
        texto.appendChild(s);
        item.appendChild(foto);
        item.appendChild(texto);
        item.addEventListener("click", function () { vvAbrirFoto(lista, i); });
        item.addEventListener("keydown", function (e) { if (e.key === "Enter") vvAbrirFoto(lista, i); });
        vvTrilho.appendChild(item);
      });
      vvCard.hidden = false;
      clearInterval(vvAuto);
      if (!SEM_MOV_30 && lista.length > 2) {
        vvAuto = setInterval(function () { if (!vvPausa && !vvCard.hidden) vvPassar(1); }, 3200);
      }
    }
  } catch (e) {
    console.error("Dashboard interativo:", e);
  }
}

function agendarDashInterativo() {
  clearTimeout(dashInterTimer);
  dashInterTimer = setTimeout(carregarDashInterativo, 350);
}

// ---------- Gráfico que responde ao toque ----------
// Esta versão substitui a anterior: guarda o valor exato de cada dia na barra.
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
    col.dataset.valor = d.total;
    col.dataset.dia = i === 6 ? "Hoje" : d.data.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });

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

document.getElementById("dbGrafico").addEventListener("click", function (e) {
  const col = e.target.closest(".db-col");
  if (!col) return;
  const jaSelecionada = col.classList.contains("sel");
  this.querySelectorAll(".db-col").forEach(function (c) {
    c.classList.remove("sel");
    const antiga = c.querySelector(".db-dica");
    if (antiga) antiga.remove();
  });
  if (jaSelecionada) return;
  col.classList.add("sel");
  const dica = document.createElement("span");
  dica.className = "db-dica";
  dica.textContent = col.dataset.dia + " · " + moeda(Number(col.dataset.valor || 0));
  col.appendChild(dica);
});

document.querySelectorAll('[data-view="dashboard"]').forEach(function (botao) {
  botao.addEventListener("click", agendarDashInterativo);
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (sessao) {
      agendarDashInterativo();
    } else {
      clearInterval(dhIntervalo);
      clearInterval(vvAuto);
      vvCard.hidden = true;
      vvTrilho.innerHTML = "";
    }
  });
});
// FIM DA PARTE 30
// ===== PARTE 32: Dashboard completo (pagamentos, comparação e atividade de hoje) =====
const estilo32 = document.createElement("style");
estilo32.textContent = `
  .d32-linha { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .d32-rosca { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }
  .d32-centro { position: relative; width: 180px; height: 180px; flex-shrink: 0; }
  .d32-centro svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .d32-centro circle { fill: none; stroke-width: 22; cursor: pointer; transition: stroke-dasharray .9s cubic-bezier(.2,.8,.2,1), opacity .2s ease; }
  .d32-txt { position: absolute; inset: 0; display: grid; place-items: center; text-align: center; pointer-events: none; }
  .d32-txt strong { display: block; font-size: 18px; font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
  .d32-txt span { display: block; max-width: 116px; margin: 0 auto; font-size: 11.5px; line-height: 1.3; color: var(--muted); }
  .d32-legenda { display: grid; gap: 4px; flex: 1; min-width: 190px; }
  .d32-leg { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; text-align: left; width: 100%; font-size: 14px; }
  .d32-leg:hover, .d32-leg.ativo { background: var(--surface-2); }
  .d32-leg i { width: 12px; height: 12px; border-radius: 4px; flex-shrink: 0; }
  .d32-leg b { margin-left: auto; font-variant-numeric: tabular-nums; }
  .d32-comp { display: grid; gap: 20px; }
  .d32-comp-topo { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 14px; font-weight: 500; }
  .d32-var { font-weight: 600; font-size: 13px; color: var(--muted); }
  .d32-var.sobe { color: var(--success); }
  .d32-var.desce { color: var(--danger); }
  .d32-barras { display: grid; gap: 6px; margin-top: 8px; }
  .d32-b { display: grid; grid-template-columns: 90px 1fr auto; gap: 10px; align-items: center; font-size: 12px; color: var(--muted); }
  .d32-b .t { height: 10px; border-radius: 999px; background: var(--surface-2); overflow: hidden; }
  .d32-b .t i { display: block; height: 100%; width: 0; border-radius: 999px; background: var(--text); transition: width .9s cubic-bezier(.2,.8,.2,1); }
  .d32-b.antes .t i { background: var(--border-strong); }
  .d32-b .v { font-variant-numeric: tabular-nums; color: var(--text); min-width: 86px; text-align: right; }
  .d32-ev { display: grid; grid-template-columns: 52px 30px 1fr auto; gap: 10px; align-items: center; padding: 11px 0; border-bottom: 1px solid var(--border); animation: d32-entra .4s ease backwards; }
  .d32-ev:last-child { border-bottom: 0; }
  .d32-hora { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; }
  .d32-ic { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-size: 13px; font-weight: 700; background: var(--surface-2); color: var(--text); }
  .d32-ic.venda { background: #000; color: #fff; }
  .d32-ic.ok { background: #dcfce7; color: #15803d; }
  .d32-ic.canc { background: #fee2e2; color: #b91c1c; }
  .d32-ev p { font-size: 14px; font-weight: 500; }
  .d32-ev small { display: block; font-size: 12px; color: var(--muted); font-weight: 400; }
  .d32-ev b { font-variant-numeric: tabular-nums; font-size: 14px; }
  .d32-ev b.riscado { text-decoration: line-through; color: var(--muted); }
  @keyframes d32-entra { from { opacity: 0; transform: translateY(8px); } }
  @media (max-width: 900px) { .d32-linha { grid-template-columns: 1fr; } }
  @media (max-width: 520px) {
    .d32-rosca { justify-content: center; }
    .d32-ev { grid-template-columns: 44px 30px 1fr; }
    .d32-ev b { grid-column: 3; }
  }
  @media (prefers-reduced-motion: reduce) {
    .d32-centro circle, .d32-b .t i { transition: none; }
    .d32-ev { animation: none; }
  }
`;
document.head.appendChild(estilo32);

const d32Linha = document.createElement("div");
d32Linha.className = "d32-linha";
d32Linha.innerHTML = `
  <article class="card">
    <div class="card-head"><h2>Formas de pagamento</h2><span class="item-sub">Este mês</span></div>
    <div class="d32-rosca">
      <div class="d32-centro">
        <svg viewBox="0 0 200 200" id="d32Svg" role="img" aria-label="Gráfico das formas de pagamento"></svg>
        <div class="d32-txt"><div><strong id="d32Centro">—</strong><span id="d32CentroSub">no mês</span></div></div>
      </div>
      <div class="d32-legenda" id="d32Legenda"></div>
    </div>
  </article>
  <article class="card">
    <div class="card-head"><h2>Este mês x mês passado</h2><span class="item-sub" id="d32CompSub"></span></div>
    <div class="d32-comp" id="d32Comp"></div>
  </article>
`;
const d32Tempo = document.createElement("article");
d32Tempo.className = "card";
d32Tempo.style.marginBottom = "16px";
d32Tempo.innerHTML = `
  <div class="card-head"><h2 id="d32TempoTitulo">Hoje na loja</h2><span class="item-sub" id="d32TempoSub"></span></div>
  <div id="d32Lista"></div>
`;
const d32Ancora = document.getElementById("dbGrafico").closest(".card");
d32Ancora.after(d32Linha);
d32Linha.after(d32Tempo);

const D32_CORES = ["#0a0a0a", "#16a34a", "#71717a", "#a1a1aa", "#d4d4d8"];
const D32_RAIO = 78;
const D32_VOLTA = 2 * Math.PI * D32_RAIO;
let d32Fatias = [];
let d32TotalMes = 0;
let d32Selecionada = null;
let d32Timer = null;

function d32Escrever(el, valor, ehMoeda) {
  if (typeof contarAte === "function") contarAte(el, valor, ehMoeda);
  else el.textContent = ehMoeda ? moeda(valor) : String(valor);
}

function d32Selecionar(chave) {
  d32Selecionada = d32Selecionada === chave ? null : chave;
  document.querySelectorAll("#d32Svg circle[data-chave]").forEach(function (c) {
    c.style.opacity = d32Selecionada && c.dataset.chave !== d32Selecionada ? ".25" : "1";
  });
  document.querySelectorAll(".d32-leg").forEach(function (l) {
    l.classList.toggle("ativo", l.dataset.chave === d32Selecionada);
  });
  const centro = document.getElementById("d32Centro");
  const sub = document.getElementById("d32CentroSub");
  const f = d32Fatias.find(function (x) { return x.chave === d32Selecionada; });
  if (f) {
    centro.textContent = moeda(f.valor);
    sub.textContent = (nomesPagamento[f.chave] || f.chave) + " · " + Math.round(100 * f.valor / d32TotalMes) + "%";
  } else {
    centro.textContent = moeda(d32TotalMes);
    sub.textContent = "no mês";
  }
}

function d32DesenharRosca(vendasMes) {
  const svg = document.getElementById("d32Svg");
  const legenda = document.getElementById("d32Legenda");
  svg.innerHTML = "";
  legenda.innerHTML = "";
  d32Selecionada = null;

  const porPag = {};
  vendasMes.forEach(function (v) {
    porPag[v.payment_method] = (porPag[v.payment_method] || 0) + Number(v.total);
  });
  d32TotalMes = vendasMes.reduce(function (s, v) { return s + Number(v.total); }, 0);
  d32Fatias = Object.keys(porPag)
    .map(function (k) { return { chave: k, valor: porPag[k] }; })
    .sort(function (a, b) { return b.valor - a.valor; });

  const ns = "http://www.w3.org/2000/svg";
  const fundo = document.createElementNS(ns, "circle");
  fundo.setAttribute("cx", "100"); fundo.setAttribute("cy", "100"); fundo.setAttribute("r", String(D32_RAIO));
  fundo.style.stroke = "var(--surface-2)";
  svg.appendChild(fundo);

  if (d32TotalMes <= 0) {
    document.getElementById("d32Centro").textContent = "R$ 0,00";
    document.getElementById("d32CentroSub").textContent = "sem vendas no mês";
    const vazio = document.createElement("p");
    vazio.className = "item-sub";
    vazio.textContent = "Registre vendas para ver como seus clientes pagam.";
    legenda.appendChild(vazio);
    return;
  }

  let deslocamento = 0;
  const espaco = d32Fatias.length > 1 ? 3 : 0;
  d32Fatias.forEach(function (f, i) {
    const cor = D32_CORES[i % D32_CORES.length];
    const tamanho = Math.max(0, D32_VOLTA * f.valor / d32TotalMes - espaco);
    const c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "100"); c.setAttribute("cy", "100"); c.setAttribute("r", String(D32_RAIO));
    c.dataset.chave = f.chave;
    c.style.stroke = cor;
    c.style.strokeDasharray = "0 " + D32_VOLTA;
    c.style.strokeDashoffset = String(-deslocamento);
    c.addEventListener("click", function () { d32Selecionar(f.chave); });
    svg.appendChild(c);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { c.style.strokeDasharray = tamanho + " " + (D32_VOLTA - tamanho); });
    });
    deslocamento += tamanho + espaco;

    const item = document.createElement("button");
    item.type = "button";
    item.className = "d32-leg";
    item.dataset.chave = f.chave;
    const quadrado = document.createElement("i");
    quadrado.style.background = cor;
    const nome = document.createElement("span");
    nome.textContent = (nomesPagamento[f.chave] || f.chave) + " · " + Math.round(100 * f.valor / d32TotalMes) + "%";
    const valor = document.createElement("b");
    valor.textContent = moeda(f.valor);
    item.appendChild(quadrado);
    item.appendChild(nome);
    item.appendChild(valor);
    item.addEventListener("click", function () { d32Selecionar(f.chave); });
    legenda.appendChild(item);
  });

  document.getElementById("d32CentroSub").textContent = "no mês";
  d32Escrever(document.getElementById("d32Centro"), d32TotalMes, true);
}

function d32Variacao(agora, antes) {
  if (antes <= 0) return agora > 0 ? { texto: "novo", classe: "sobe" } : { texto: "—", classe: "" };
  const pct = Math.round(100 * (agora - antes) / antes);
  if (pct === 0) return { texto: "igual", classe: "" };
  return { texto: (pct > 0 ? "▲ " : "▼ ") + Math.abs(pct) + "%", classe: pct > 0 ? "sobe" : "desce" };
}

function d32DesenharComparacao(mes, passado, diaLimite) {
  const area = document.getElementById("d32Comp");
  area.innerHTML = "";
  document.getElementById("d32CompSub").textContent = "Até o dia " + diaLimite + " de cada mês";

  function soma(lista) { return lista.reduce(function (s, v) { return s + Number(v.total); }, 0); }
  const fatA = soma(mes), fatB = soma(passado);
  const linhas = [
    { nome: "Faturamento", a: fatA, b: fatB, moeda: true },
    { nome: "Vendas", a: mes.length, b: passado.length, moeda: false },
    { nome: "Ticket médio", a: mes.length ? fatA / mes.length : 0, b: passado.length ? fatB / passado.length : 0, moeda: true }
  ];

  linhas.forEach(function (l) {
    const bloco = document.createElement("div");
    const topo = document.createElement("div");
    topo.className = "d32-comp-topo";
    const nome = document.createElement("span");
    nome.textContent = l.nome;
    const variacao = d32Variacao(l.a, l.b);
    const v = document.createElement("span");
    v.className = "d32-var " + variacao.classe;
    v.textContent = variacao.texto;
    topo.appendChild(nome);
    topo.appendChild(v);
    bloco.appendChild(topo);

    const barras = document.createElement("div");
    barras.className = "d32-barras";
    const maior = Math.max(l.a, l.b, 0.0001);
    [["Este mês", l.a, ""], ["Mês passado", l.b, " antes"]].forEach(function (par) {
      const linha = document.createElement("div");
      linha.className = "d32-b" + par[2];
      const rot = document.createElement("span");
      rot.textContent = par[0];
      const trilho = document.createElement("div");
      trilho.className = "t";
      const cheio = document.createElement("i");
      trilho.appendChild(cheio);
      const val = document.createElement("span");
      val.className = "v";
      val.textContent = l.moeda ? moeda(par[1]) : String(par[1]);
      linha.appendChild(rot);
      linha.appendChild(trilho);
      linha.appendChild(val);
      barras.appendChild(linha);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { cheio.style.width = Math.round(100 * par[1] / maior) + "%"; });
      });
    });
    bloco.appendChild(barras);
    area.appendChild(bloco);
  });
}

function d32Evento(lista, quando, icone, classe, titulo, detalhe, valor, riscado) {
  lista.push({ quando: new Date(quando), icone: icone, classe: classe, titulo: titulo, detalhe: detalhe, valor: valor, riscado: riscado });
}

function d32DesenharTempo(eventos, soHoje) {
  const area = document.getElementById("d32Lista");
  area.innerHTML = "";
  document.getElementById("d32TempoTitulo").textContent = soHoje ? "Hoje na loja" : "Últimas atividades";
  document.getElementById("d32TempoSub").textContent = soHoje
    ? eventos.length + (eventos.length === 1 ? " acontecimento" : " acontecimentos")
    : "Nada hoje ainda. Veja os últimos 7 dias.";

  if (eventos.length === 0) {
    const vazio = document.createElement("div");
    vazio.className = "empty";
    vazio.textContent = "✦ Nenhuma atividade nos últimos 7 dias. Registre uma venda para começar.";
    area.appendChild(vazio);
    return;
  }

  eventos.slice(0, 10).forEach(function (e, i) {
    const linha = document.createElement("div");
    linha.className = "d32-ev";
    linha.style.animationDelay = (i * 0.05) + "s";

    const hora = document.createElement("span");
    hora.className = "d32-hora";
    hora.textContent = soHoje
      ? e.quando.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      : e.quando.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

    const ic = document.createElement("span");
    ic.className = "d32-ic " + e.classe;
    ic.textContent = e.icone;

    const texto = document.createElement("p");
    texto.textContent = e.titulo;
    const sub = document.createElement("small");
    sub.textContent = e.detalhe;
    texto.appendChild(sub);

    linha.appendChild(hora);
    linha.appendChild(ic);
    linha.appendChild(texto);
    if (e.valor !== null) {
      const v = document.createElement("b");
      if (e.riscado) v.className = "riscado";
      v.textContent = moeda(e.valor);
      linha.appendChild(v);
    }
    area.appendChild(linha);
  });
}

async function carregarDashboardCompleto() {
  try {
    const cliente = await iniciarSupabase();
    const sessao = await cliente.auth.getSession();
    if (!sessao.data || !sessao.data.session) return;

    const agora = new Date();
    const hoje = new Date(agora); hoje.setHours(0, 0, 0, 0);
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const diasPassado = new Date(agora.getFullYear(), agora.getMonth(), 0).getDate();
    const diaLimite = Math.min(agora.getDate(), diasPassado);
    const fimPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, diaLimite,
      agora.getHours(), agora.getMinutes(), agora.getSeconds());
    const seteDias = new Date(hoje.getTime() - 6 * 86400000);
    const desde = inicioPassado < seteDias ? inicioPassado : seteDias;

    const r = await Promise.all([
      cliente.from("sales").select("id, customer_id, total, payment_method, status, created_at")
        .gte("created_at", desde.toISOString()).order("created_at", { ascending: false }),
      cliente.from("customers").select("id, name, created_at"),
      cliente.from("quotes").select("id, customer_id, status, total, created_at, updated_at")
        .gte("updated_at", seteDias.toISOString())
    ]);
    r.forEach(function (x) { if (x.error) throw x.error; });

    const vendas = r[0].data || [];
    const clientes = r[1].data || [];
    const orcamentos = r[2].data || [];
    const nomes = {};
    clientes.forEach(function (c) { nomes[c.id] = c.name; });
    function nomeCli(id) { return id && nomes[id] ? nomes[id] : "Sem cliente"; }

    const validas = vendas.filter(function (v) { return v.status !== "cancelled"; });
    const doMes = validas.filter(function (v) { return new Date(v.created_at) >= inicioMes; });
    const doPassado = validas.filter(function (v) {
      const d = new Date(v.created_at);
      return d >= inicioPassado && d <= fimPassado;
    });

    d32DesenharRosca(doMes);
    d32DesenharComparacao(doMes, doPassado, diaLimite);

    // Linha do tempo
    const eventos = [];
    vendas.forEach(function (v) {
      if (new Date(v.created_at) < seteDias) return;
      if (v.status === "cancelled") {
        d32Evento(eventos, v.created_at, "✕", "canc", "Venda cancelada", nomeCli(v.customer_id), Number(v.total), true);
      } else {
        d32Evento(eventos, v.created_at, "$", "venda", "Venda · " + nomeCli(v.customer_id),
          nomesPagamento[v.payment_method] || v.payment_method, Number(v.total), false);
      }
    });
    orcamentos.forEach(function (o) {
      if (o.status === "converted") {
        d32Evento(eventos, o.updated_at, "✓", "ok", "Orçamento virou venda", nomeCli(o.customer_id), Number(o.total), false);
      } else if (o.status === "accepted") {
        d32Evento(eventos, o.updated_at, "✓", "ok", "Orçamento aceito", nomeCli(o.customer_id), Number(o.total), false);
      } else if (o.status === "rejected") {
        d32Evento(eventos, o.updated_at, "✕", "canc", "Orçamento recusado", nomeCli(o.customer_id), Number(o.total), true);
      } else if (new Date(o.created_at) >= seteDias) {
        d32Evento(eventos, o.created_at, "◇", "", o.status === "sent" ? "Orçamento enviado" : "Orçamento criado",
          nomeCli(o.customer_id), Number(o.total), false);
      }
    });
    clientes.forEach(function (c) {
      if (new Date(c.created_at) >= seteDias) {
        d32Evento(eventos, c.created_at, "+", "", "Novo cliente", c.name, null, false);
      }
    });
    eventos.sort(function (a, b) { return b.quando - a.quando; });

    const deHoje = eventos.filter(function (e) { return e.quando >= hoje; });
    d32DesenharTempo(deHoje.length ? deHoje : eventos, deHoje.length > 0);
  } catch (e) {
    console.error("Dashboard completo:", e);
  }
}

function agendarDashboardCompleto() {
  clearTimeout(d32Timer);
  d32Timer = setTimeout(carregarDashboardCompleto, 450);
}

document.querySelectorAll('[data-view="dashboard"]').forEach(function (botao) {
  botao.addEventListener("click", agendarDashboardCompleto);
});

iniciarSupabase().then(function (cliente) {
  cliente.auth.onAuthStateChange(function (evento, sessao) {
    if (sessao) {
      agendarDashboardCompleto();
    } else {
      clearTimeout(d32Timer);
      document.getElementById("d32Svg").innerHTML = "";
      document.getElementById("d32Legenda").innerHTML = "";
      document.getElementById("d32Comp").innerHTML = "";
      document.getElementById("d32Lista").innerHTML = "";
    }
  });
});
// FIM DA PARTE 32
