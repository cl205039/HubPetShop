// Tela de login — um único formulário para admin e petshop.
// O papel (admin/petshop) é decidido pelo backend (src/main/db/auth.js),
// não escolhido aqui.

export function iniciarTelaLogin(aoLogar) {
    const telaLogin = document.getElementById("tela-login");
    const form = document.getElementById("form-login");
    const campoEmail = document.getElementById("loginEmail");
    const campoSenha = document.getElementById("loginSenha");
    const aviso = document.getElementById("loginAviso");
    const btnEntrar = document.getElementById("btnEntrar");

    configurarValidacao(campoEmail, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v));
    configurarValidacao(campoSenha, (v) => v.length > 0);

    function mostrarAviso(mensagem) {
        aviso.innerText = mensagem;
        aviso.style.display = "block";
    }

    function limparAviso() {
        aviso.style.display = "none";
        aviso.innerText = "";
    }

    async function tentarLogin(evento) {
        evento.preventDefault();
        limparAviso();

        const email = campoEmail.value.trim();
        const senha = campoSenha.value;

        btnEntrar.disabled = true;
        btnEntrar.innerText = "Entrando...";

        try {
            const resultado = await window.api.login({ email, senha });

            if (!resultado || !resultado.sucesso) {
                mostrarAviso((resultado && resultado.mensagem) || "Não foi possível entrar. Tente novamente.");
                return;
            }

            campoSenha.value = "";
            telaLogin.style.display = "none";
            aoLogar(resultado.usuario);
        } catch (erro) {
            console.error("Erro ao tentar logar:", erro);
            mostrarAviso("Erro de comunicação com o sistema. Tente novamente.");
        } finally {
            btnEntrar.disabled = false;
            btnEntrar.innerText = "Entrar";
        }
    }

    form.addEventListener("submit", tentarLogin);
}

export function exibirTelaLogin(mensagemAviso) {
    const telaLogin = document.getElementById("tela-login");
    const appPrincipal = document.getElementById("app-principal");
    const campoEmail = document.getElementById("loginEmail");
    const campoSenha = document.getElementById("loginSenha");
    const aviso = document.getElementById("loginAviso");

    appPrincipal.style.display = "none";
    telaLogin.style.display = "flex";
    campoSenha.value = "";
    campoEmail.classList.remove("campo-valido", "campo-invalido");
    campoSenha.classList.remove("campo-valido", "campo-invalido");

    if (mensagemAviso) {
        aviso.innerText = mensagemAviso;
        aviso.style.display = "block";
    } else {
        aviso.style.display = "none";
        aviso.innerText = "";
    }

    campoEmail.focus();
}

function configurarValidacao(campo, ehValido) {
    const verificar = () => {
        const valor = campo.value.trim();
        if (!valor) {
            campo.classList.remove("campo-valido", "campo-invalido");
            return;
        }
        campo.classList.toggle("campo-valido", ehValido(valor));
        campo.classList.toggle("campo-invalido", !ehValido(valor));
    };
    campo.addEventListener("blur", verificar);
    campo.addEventListener("input", verificar);
}
