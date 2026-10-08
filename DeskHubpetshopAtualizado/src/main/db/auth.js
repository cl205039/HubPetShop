const bcrypt = require("bcryptjs");
const pool = require("./database");

const ERRO_CREDENCIAIS = "E-mail ou senha incorretos.";

async function login({ email, senha }) {
    if (!email || !senha) {
        return { sucesso: false, mensagem: "Preencha o e-mail e a senha." };
    }

    const [admins] = await pool.query(
        "SELECT id, nome, email, senha FROM admins WHERE email = ? LIMIT 1",
        [email]
    );

    if (admins.length > 0) {
        const admin = admins[0];
        const senhaOk = await bcrypt.compare(senha, admin.senha);
        if (!senhaOk) {
            return { sucesso: false, mensagem: ERRO_CREDENCIAIS };
        }
        return {
            sucesso: true,
            usuario: { tipo: "admin", id: admin.id, nome: admin.nome, email: admin.email }
        };
    }

    const [petshops] = await pool.query(
        "SELECT id, nome, email, senha, aprovado, bloqueado FROM petshops WHERE email = ? LIMIT 1",
        [email]
    );

    if (petshops.length > 0) {
        const petshop = petshops[0];
        const senhaOk = await bcrypt.compare(senha, petshop.senha);
        if (!senhaOk) {
            return { sucesso: false, mensagem: ERRO_CREDENCIAIS };
        }
        if (petshop.bloqueado) {
            return {
                sucesso: false,
                mensagem: "Sua conta está bloqueada. Fale com o administrador."
            };
        }
        if (!petshop.aprovado) {
            return {
                sucesso: false,
                mensagem: "Seu cadastro ainda está aguardando aprovação do administrador."
            };
        }
        return {
            sucesso: true,
            usuario: { tipo: "petshop", id: petshop.id, nome: petshop.nome, email: petshop.email }
        };
    }

    return { sucesso: false, mensagem: ERRO_CREDENCIAIS };
}

function validarCadastroPetshop(dados) {
    if (!dados.nome || !dados.email || !dados.senha || !dados.telefone || !dados.cnpj || !dados.tipo) {
        return "Preencha todos os campos obrigatórios.";
    }
    if (dados.senha.length < 6) {
        return "A senha deve ter no mínimo 6 caracteres.";
    }
    if (!/^\d{14}$/.test(dados.cnpj)) {
        return "O CNPJ deve ter exatamente 14 dígitos.";
    }
    if (!dados.cep || !dados.rua || !dados.numero || !dados.bairro || !dados.cidade || !dados.estado) {
        return "Preencha todos os campos de endereço.";
    }
    if (!/^\d{8}$/.test(dados.cep)) {
        return "O CEP deve ter exatamente 8 dígitos.";
    }
    return null;
}

async function cadastrarPetshop(dados) {
    const erro = validarCadastroPetshop(dados);
    if (erro) {
        return { sucesso: false, mensagem: erro };
    }

    const [existentes] = await pool.query(
        "SELECT id FROM petshops WHERE email = ? LIMIT 1",
        [dados.email]
    );
    if (existentes.length > 0) {
        return { sucesso: false, mensagem: "Já existe um cadastro com este e-mail." };
    }

    const senhaHash = await bcrypt.hash(dados.senha, 10);

    const [resultado] = await pool.query(
        `INSERT INTO petshops (nome, email, senha, telefone, cnpj, tipo, descricao, aprovado, bloqueado)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
        [dados.nome, dados.email, senhaHash, dados.telefone, dados.cnpj, dados.tipo, dados.descricao || null]
    );

    await pool.query(
        `INSERT INTO enderecos_petshops (petshop_id, cep, rua, numero, bairro, cidade, estado)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [resultado.insertId, dados.cep, dados.rua, dados.numero, dados.bairro, dados.cidade, dados.estado]
    );

    return { sucesso: true };
}

module.exports = { login, cadastrarPetshop };
