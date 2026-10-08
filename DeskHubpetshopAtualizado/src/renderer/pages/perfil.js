import { mostrarNotificacao } from "../shared/notificacao.js";

let petshopIdAtual = null;

export async function montarPaginaPerfil(container, petshopId) {
    petshopIdAtual = petshopId;
    container.innerHTML = "<p style='padding:20px;'>Carregando perfil...</p>";

    try {
        const perfil = await window.api.obterPerfilPetshop(petshopId);
        if (!perfil) {
            container.innerHTML = "<p style='color:red; padding:20px;'>Perfil não encontrado.</p>";
            return;
        }
        container.innerHTML = template(perfil);
        document.getElementById("btnSalvarPerfil").addEventListener("click", salvar);
    } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        container.innerHTML = "<p style='color:red; padding:20px;'>Erro ao carregar o perfil.</p>";
    }
}

function template(p) {
    return `
        <div class="painel" style="max-width: 700px;">
            <h2>Meu Perfil</h2>

            <h3 class="divisor-formulario">🔒 Dados de Acesso (Somente Leitura)</h3>
            <div class="grupo-formulario">
                <label>CNPJ:</label>
                <input type="text" id="perfilCnpj" value="${p.cnpj || ""}" class="input-formulario input-bloqueado" readonly>
            </div>
            <div class="grupo-formulario">
                <label>E-mail:</label>
                <input type="text" id="perfilEmail" value="${p.email || ""}" class="input-formulario input-bloqueado" readonly>
            </div>

            <h3 class="divisor-formulario">📝 Dados Gerais</h3>
            <div class="grupo-formulario">
                <label>Nome do Estabelecimento:</label>
                <input type="text" id="perfilNome" value="${p.nome || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Telefone Comercial:</label>
                <input type="text" id="perfilTelefone" value="${p.telefone || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Tipo de Estabelecimento:</label>
                <input type="text" id="perfilTipo" value="${p.tipo || ""}" class="input-formulario" placeholder="Ex.: Pet Shop, Clínica Veterinária, Creche Pet...">
            </div>
            <div class="grupo-formulario">
                <label>Descrição:</label>
                <textarea id="perfilDescricao" class="textarea-formulario">${p.descricao || ""}</textarea>
            </div>

            <h3 class="divisor-formulario">📍 Endereço</h3>
            <div class="grupo-formulario">
                <label>CEP:</label>
                <input type="text" id="perfilCep" value="${p.cep || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Rua:</label>
                <input type="text" id="perfilRua" value="${p.rua || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Número:</label>
                <input type="text" id="perfilNumero" value="${p.numero || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Bairro:</label>
                <input type="text" id="perfilBairro" value="${p.bairro || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Cidade:</label>
                <input type="text" id="perfilCidade" value="${p.cidade || ""}" class="input-formulario">
            </div>
            <div class="grupo-formulario">
                <label>Estado (UF):</label>
                <input type="text" id="perfilEstado" value="${p.estado || ""}" class="input-formulario" maxlength="2">
            </div>

            <button id="btnSalvarPerfil" class="btn-editar btn-salvar-lateral">Salvar Alterações</button>
        </div>
    `;
}

async function salvar() {
    const botao = document.getElementById("btnSalvarPerfil");
    const dados = {
        nome: document.getElementById("perfilNome").value,
        telefone: document.getElementById("perfilTelefone").value,
        tipo: document.getElementById("perfilTipo").value,
        descricao: document.getElementById("perfilDescricao").value,
        endereco: {
            cep: document.getElementById("perfilCep").value,
            rua: document.getElementById("perfilRua").value,
            numero: document.getElementById("perfilNumero").value,
            bairro: document.getElementById("perfilBairro").value,
            cidade: document.getElementById("perfilCidade").value,
            estado: document.getElementById("perfilEstado").value
        }
    };

    botao.disabled = true;
    botao.innerText = "Salvando...";

    try {
        const resultado = await window.api.salvarPerfilPetshop(petshopIdAtual, dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Perfil atualizado com sucesso!");
        botao.innerText = "Salvo! ✓";
        setTimeout(() => {
            botao.innerText = "Salvar Alterações";
            botao.disabled = false;
        }, 1500);
    } catch (erro) {
        console.error("Erro ao salvar perfil:", erro);
        mostrarNotificacao("Erro ao salvar perfil.", false);
        botao.innerText = "Salvar Alterações";
        botao.disabled = false;
    }
}
