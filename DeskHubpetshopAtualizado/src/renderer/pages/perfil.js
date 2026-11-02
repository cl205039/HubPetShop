import { mostrarNotificacao } from "../shared/notificacao.js";
import { escaparHtml, DIAS_SEMANA, formatarCnpj, formatarTelefone } from "../shared/ui.js";

const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];

export async function montarPaginaPerfil(container) {
    container.innerHTML = "<p style='padding:20px;'>Carregando perfil...</p>";

    try {
        const perfil = await window.api.obterPerfilPetshop();
        if (!perfil) {
            container.innerHTML = "<p style='color:red; padding:20px;'>Perfil não encontrado.</p>";
            return;
        }
        container.innerHTML = template(perfil);
        document.getElementById("btnSalvarPerfil").addEventListener("click", salvar);
        ligarHorarios();
    } catch (erro) {
        console.error("Erro ao carregar perfil:", erro);
        container.innerHTML = "<p style='color:red; padding:20px;'>Erro ao carregar o perfil.</p>";
    }
}

// Campo do formulário (rótulo + input).
function campo(id, rotulo, valor, { extra = "", largo = false } = {}) {
    return `
        <div class="grupo-formulario ${largo ? "campo-largura-total" : ""}">
            <label for="${id}">${rotulo}</label>
            <input type="text" id="${id}" value="${escaparHtml(valor || "")}" class="input-formulario ${extra.includes("readonly") ? "input-bloqueado" : ""}" ${extra}>
        </div>
    `;
}

function template(p) {
    return `
        <div class="perfil-container">
            <div class="painel">
                <h3 class="divisor-formulario">🔒 Dados de acesso <span class="texto-somente-leitura">(somente leitura)</span></h3>
                <div class="perfil-grade">
                    ${campo("perfilCnpj", "CNPJ", p.cnpj ? formatarCnpj(p.cnpj) : "", { extra: "readonly" })}
                    ${campo("perfilEmail", "E-mail", p.email, { extra: "readonly" })}
                </div>
            </div>

            <div class="painel">
                <h3 class="divisor-formulario">📝 Dados gerais</h3>
                <div class="perfil-grade">
                    ${campo("perfilNome", "Nome do estabelecimento", p.nome)}
                    ${campo("perfilTelefone", "Telefone comercial", p.telefone ? formatarTelefone(p.telefone) : "", { extra: 'placeholder="(00) 00000-0000"' })}
                    ${campo("perfilTipo", "Tipo de estabelecimento", p.tipo, { extra: 'placeholder="Ex.: Pet Shop, Clínica Veterinária, Creche Pet..."', largo: true })}
                    <div class="grupo-formulario campo-largura-total">
                        <label for="perfilDescricao">Descrição</label>
                        <textarea id="perfilDescricao" class="textarea-formulario">${escaparHtml(p.descricao || "")}</textarea>
                    </div>
                </div>
            </div>

            <div class="painel">
                <h3 class="divisor-formulario">📍 Endereço</h3>
                <div class="perfil-grade">
                    ${campo("perfilCep", "CEP", p.cep)}
                    ${campo("perfilRua", "Rua", p.rua)}
                    ${campo("perfilNumero", "Número", p.numero)}
                    ${campo("perfilBairro", "Bairro", p.bairro)}
                    ${campo("perfilCidade", "Cidade", p.cidade)}
                    ${campo("perfilEstado", "Estado (UF)", p.estado, { extra: 'maxlength="2"' })}
                </div>
                <div class="acoes-perfil">
                    <button id="btnSalvarPerfil" class="btn-editar">Salvar dados do perfil</button>
                </div>
            </div>

            <div class="painel">
                <h3 class="divisor-formulario">🕒 Horário de funcionamento</h3>
                <p class="texto-ajuda-horarios">Usado na agenda: os horários livres para agendamento ficam dentro destes intervalos.</p>
                <table class="tabela-horarios">
                    <thead><tr><th>Dia</th><th>Fechado</th><th>Abre</th><th>Fecha</th></tr></thead>
                    <tbody>${ORDEM_DIAS.map((dia) => linhaHorario(p.horarios.find((h) => h.dia_semana === dia))).join("")}</tbody>
                </table>
                <div class="acoes-perfil">
                    <button id="btnSalvarHorarios" class="btn-editar">Salvar horários</button>
                </div>
            </div>
        </div>
    `;
}

function linhaHorario(h) {
    return `
        <tr data-dia="${h.dia_semana}">
            <td>${DIAS_SEMANA[h.dia_semana]}</td>
            <td><input type="checkbox" class="horario-fechado" ${h.fechado ? "checked" : ""}></td>
            <td><input type="time" class="input-formulario horario-abre" value="${escaparHtml(h.hora_abertura || "")}" ${h.fechado ? "disabled" : ""}></td>
            <td><input type="time" class="input-formulario horario-fecha" value="${escaparHtml(h.hora_fechamento || "")}" ${h.fechado ? "disabled" : ""}></td>
        </tr>
    `;
}

function ligarHorarios() {
    document.querySelectorAll(".tabela-horarios tr[data-dia]").forEach((linha) => {
        const fechado = linha.querySelector(".horario-fechado");
        fechado.addEventListener("change", () => {
            linha.querySelectorAll('input[type="time"]').forEach((campo) => { campo.disabled = fechado.checked; });
        });
    });
    document.getElementById("btnSalvarHorarios").addEventListener("click", salvarHorarios);
}

async function salvarHorarios() {
    const horarios = [...document.querySelectorAll(".tabela-horarios tr[data-dia]")].map((linha) => ({
        dia_semana: Number(linha.dataset.dia),
        fechado: linha.querySelector(".horario-fechado").checked,
        hora_abertura: linha.querySelector(".horario-abre").value,
        hora_fechamento: linha.querySelector(".horario-fecha").value
    }));

    try {
        const resultado = await window.api.salvarHorariosPetshop(horarios);
        if (!resultado.sucesso) {
            mostrarNotificacao(resultado.mensagem, false);
            return;
        }
        mostrarNotificacao("Horário de funcionamento salvo!");
    } catch (erro) {
        console.error("Erro ao salvar horários:", erro);
        mostrarNotificacao("Erro ao salvar horários.", false);
    }
}

async function salvar() {
    const botao = document.getElementById("btnSalvarPerfil");
    const dados = {
        nome: document.getElementById("perfilNome").value,
        telefone: document.getElementById("perfilTelefone").value.replace(/\D/g, ""),
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
        const resultado = await window.api.salvarPerfilPetshop(dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Perfil atualizado com sucesso!");
        botao.innerText = "Salvo! ✓";
        setTimeout(() => {
            botao.innerText = "Salvar dados do perfil";
            botao.disabled = false;
        }, 1500);
    } catch (erro) {
        console.error("Erro ao salvar perfil:", erro);
        mostrarNotificacao("Erro ao salvar perfil.", false);
        botao.innerText = "Salvar dados do perfil";
        botao.disabled = false;
    }
}
