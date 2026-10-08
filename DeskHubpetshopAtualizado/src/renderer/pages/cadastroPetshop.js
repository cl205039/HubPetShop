import { mostrarNotificacao } from "../shared/notificacao.js";
import { exibirTelaLogin } from "./login.js";

export function iniciarTelaCadastro() {
    const telaCadastro = document.getElementById("tela-cadastro");
    const telaLogin = document.getElementById("tela-login");
    const linkAbrirCadastro = document.getElementById("linkAbrirCadastro");
    const btnVoltarLogin = document.getElementById("btnVoltarLogin");
    const form = document.getElementById("form-cadastro");
    const aviso = document.getElementById("cadastroAviso");
    const btnCadastrar = document.getElementById("btnCadastrar");

    const campoTelefone = document.getElementById("cadTelefone");
    const campoCnpj = document.getElementById("cadCnpj");
    const campoCep = document.getElementById("cadCep");
    const cepErro = document.getElementById("cadCepErro");
    const campoRua = document.getElementById("cadRua");
    const campoBairro = document.getElementById("cadBairro");
    const campoCidade = document.getElementById("cadCidade");
    const campoEstado = document.getElementById("cadEstado");

    aplicarMascara(campoTelefone, formatarTelefone);
    aplicarMascara(campoCnpj, formatarCnpj);
    somenteDigitos(campoCep, 8);

    configurarValidacao(document.getElementById("cadNome"), (v) => v.length > 0);
    configurarValidacao(document.getElementById("cadEmail"), (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    configurarValidacao(document.getElementById("cadSenha"), (v) => v.length >= 6);
    configurarValidacao(document.getElementById("cadConfirmarSenha"), (v) => v.length >= 6 && v === document.getElementById("cadSenha").value);
    configurarValidacao(campoTelefone, (v) => { const d = digitosSomente(v); return d.length === 10 || d.length === 11; });
    configurarValidacao(campoCnpj, (v) => digitosSomente(v).length === 14);
    configurarValidacao(document.getElementById("cadTipo"), (v) => v.length > 0);
    configurarValidacao(campoCep, (v) => digitosSomente(v).length === 8);
    configurarValidacao(campoRua, (v) => v.length > 0);
    configurarValidacao(document.getElementById("cadNumero"), (v) => v.length > 0);
    configurarValidacao(campoBairro, (v) => v.length > 0);
    configurarValidacao(campoCidade, (v) => v.length > 0);

    campoEstado.addEventListener("change", () => {
        if (campoEstado.value) marcarValido(campoEstado);
        else marcarInvalido(campoEstado);
    });

    campoCep.addEventListener("input", () => buscarEnderecoPorCep(campoCep, cepErro, campoRua, campoBairro, campoCidade, campoEstado));

    configurarStepper();

    linkAbrirCadastro.addEventListener("click", (evento) => {
        evento.preventDefault();
        telaLogin.style.display = "none";
        telaCadastro.style.display = "flex";
        limparAviso();
        document.getElementById("cadNome").focus();
    });

    btnVoltarLogin.addEventListener("click", () => {
        telaCadastro.style.display = "none";
        exibirTelaLogin();
    });

    function mostrarAviso(mensagem) {
        aviso.innerText = mensagem;
        aviso.style.display = "block";
    }

    function limparAviso() {
        aviso.style.display = "none";
        aviso.innerText = "";
    }

    function validarFormulario(dados, confirmarSenha) {
        if (!dados.nome || !dados.email || !dados.senha || !dados.telefone || !dados.cnpj || !dados.tipo) {
            return "Preencha todos os campos obrigatórios.";
        }
        if (dados.senha.length < 6) {
            return "A senha deve ter no mínimo 6 caracteres.";
        }
        if (dados.senha !== confirmarSenha) {
            return "As senhas não conferem.";
        }
        if (dados.cnpj.length !== 14) {
            return "O CNPJ deve ter exatamente 14 dígitos.";
        }
        if (!dados.cep || !dados.rua || !dados.numero || !dados.bairro || !dados.cidade || !dados.estado) {
            return "Preencha todos os campos de endereço.";
        }
        if (dados.cep.length !== 8) {
            return "O CEP deve ter exatamente 8 dígitos.";
        }
        return null;
    }

    async function enviarCadastro(evento) {
        evento.preventDefault();
        limparAviso();

        const dados = {
            nome: document.getElementById("cadNome").value.trim(),
            email: document.getElementById("cadEmail").value.trim(),
            senha: document.getElementById("cadSenha").value,
            telefone: digitosSomente(campoTelefone.value),
            cnpj: digitosSomente(campoCnpj.value),
            tipo: document.getElementById("cadTipo").value.trim(),
            descricao: document.getElementById("cadDescricao").value.trim(),
            cep: digitosSomente(campoCep.value),
            rua: campoRua.value.trim(),
            numero: document.getElementById("cadNumero").value.trim(),
            bairro: campoBairro.value.trim(),
            cidade: campoCidade.value.trim(),
            estado: campoEstado.value
        };
        const confirmarSenha = document.getElementById("cadConfirmarSenha").value;

        const erroValidacao = validarFormulario(dados, confirmarSenha);
        if (erroValidacao) {
            mostrarAviso(erroValidacao);
            return;
        }

        btnCadastrar.disabled = true;
        btnCadastrar.innerText = "Cadastrando...";

        try {
            const resultado = await window.api.cadastrarPetshop(dados);

            if (!resultado || !resultado.sucesso) {
                mostrarAviso((resultado && resultado.mensagem) || "Não foi possível concluir o cadastro. Tente novamente.");
                return;
            }

            form.reset();
            document.querySelectorAll(".campo-valido, .campo-invalido").forEach((campo) => {
                campo.classList.remove("campo-valido", "campo-invalido");
            });
            telaCadastro.style.display = "none";
            exibirTelaLogin();
            mostrarNotificacao("Cadastro enviado! Aguarde a aprovação do administrador.");
        } catch (erro) {
            console.error("Erro ao enviar cadastro:", erro);
            mostrarAviso("Erro de comunicação com o sistema. Tente novamente.");
        } finally {
            btnCadastrar.disabled = false;
            btnCadastrar.innerText = "Cadastrar";
        }
    }

    form.addEventListener("submit", enviarCadastro);
}

function digitosSomente(valor) {
    return (valor || "").replace(/\D/g, "");
}

function somenteDigitos(campo, tamanhoMaximo) {
    campo.addEventListener("input", () => {
        campo.value = digitosSomente(campo.value).slice(0, tamanhoMaximo);
    });
}

function aplicarMascara(campo, formatador) {
    campo.addEventListener("input", () => {
        campo.value = formatador(digitosSomente(campo.value));
    });
}

function formatarTelefone(digitos) {
    digitos = digitos.slice(0, 11);
    if (digitos.length <= 2) return digitos.length ? `(${digitos}` : "";
    if (digitos.length <= 7) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

function formatarCnpj(digitos) {
    digitos = digitos.slice(0, 14);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 5) return `${digitos.slice(0, 2)}.${digitos.slice(2)}`;
    if (digitos.length <= 8) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5)}`;
    if (digitos.length <= 12) return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8)}`;
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

function marcarValido(campo) {
    campo.classList.remove("campo-invalido");
    campo.classList.add("campo-valido");
}

function marcarInvalido(campo) {
    campo.classList.remove("campo-valido");
    campo.classList.add("campo-invalido");
}

function limparValidacao(campo) {
    campo.classList.remove("campo-valido", "campo-invalido");
}

function configurarValidacao(campo, ehValido) {
    const verificar = () => {
        const valor = campo.value.trim();
        if (!valor) {
            limparValidacao(campo);
            return;
        }
        if (ehValido(valor)) marcarValido(campo);
        else marcarInvalido(campo);
    };
    campo.addEventListener("blur", verificar);
    campo.addEventListener("input", verificar);
}

// Consulta o ViaCEP (API pública, sem autenticação) assim que o usuário
// completa os 8 dígitos do CEP, e preenche o resto do endereço sozinho.
async function buscarEnderecoPorCep(campoCep, cepErro, campoRua, campoBairro, campoCidade, campoEstado) {
    const cep = digitosSomente(campoCep.value);
    cepErro.style.display = "none";
    cepErro.innerText = "";

    if (cep.length !== 8) return;

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const dados = await resposta.json();

        if (dados.erro) {
            marcarInvalido(campoCep);
            cepErro.innerText = "CEP não encontrado.";
            cepErro.style.display = "block";
            return;
        }

        campoRua.value = dados.logradouro || "";
        campoBairro.value = dados.bairro || "";
        campoCidade.value = dados.localidade || "";
        campoEstado.value = dados.uf || "";

        marcarValido(campoCep);
        [campoRua, campoBairro, campoCidade].forEach((campo) => {
            if (campo.value.trim()) marcarValido(campo);
        });
        if (campoEstado.value) marcarValido(campoEstado);
    } catch (erro) {
        console.error("Erro ao consultar ViaCEP:", erro);
        cepErro.innerText = "Não foi possível consultar o CEP agora. Preencha o endereço manualmente.";
        cepErro.style.display = "block";
    }
}

function configurarStepper() {
    const secoes = document.querySelectorAll(".secao-cadastro");
    const stepItems = document.querySelectorAll(".step-item");
    const raiz = document.querySelector(".cadastro-card");
    if (!secoes.length || !raiz || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            const step = entrada.target.dataset.step;
            stepItems.forEach((item) => {
                item.classList.toggle("ativo", item.dataset.step === step);
            });
        });
    }, { root: raiz, threshold: 0.3 });

    secoes.forEach((secao) => observer.observe(secao));
}
