// Migração de dados/schema: move a entidade de negócio de `parceiros` para
// `petshops` (tabela já usada pela API PHP externa para o app Flutter do
// consumidor). Não é um simples rename — os IDs de `petshops` já existentes
// (catálogo fixo, 2 linhas) não têm relação com os IDs de `parceiros`, então
// cada linha migrada ganha um ID novo e todas as tabelas dependentes são
// remapeadas para esse ID novo, nunca para o ID antigo do parceiro.
//
// DDL (ALTER/RENAME/DROP TABLE) no MySQL faz commit implícito — não é
// reversível dentro de transação. Por isso o script separa DML transacional
// (fase 2) de DDL sequencial e idempotente (fases 1 e 3): cada passo confere
// o estado atual do schema antes de agir, então rodar o script de novo após
// uma falha parcial não duplica dados nem quebra em "coluna já existe".
//
// Uso: node migrations/003_migrar_parceiro_para_petshop.js

const pool = require("../src/main/db/database");

async function columnExists(table, column) {
    const [[row]] = await pool.query(
        "SELECT COUNT(*) c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
        [table, column]
    );
    return row.c > 0;
}

async function tableExists(table) {
    const [[row]] = await pool.query(
        "SELECT COUNT(*) c FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
        [table]
    );
    return row.c > 0;
}

async function fksReferencing(table) {
    const [rows] = await pool.query(
        `SELECT kcu.TABLE_NAME, kcu.COLUMN_NAME, kcu.CONSTRAINT_NAME, rc.DELETE_RULE
         FROM information_schema.KEY_COLUMN_USAGE kcu
         JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
           ON rc.CONSTRAINT_SCHEMA = kcu.TABLE_SCHEMA AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
         WHERE kcu.TABLE_SCHEMA = DATABASE() AND kcu.REFERENCED_TABLE_NAME = ?`,
        [table]
    );
    return rows;
}

function originalRule(fks, table) {
    const f = fks.find((x) => x.TABLE_NAME === table);
    return f ? f.DELETE_RULE : null;
}

async function ensureColumnAdded(table, column, ddl) {
    if (await columnExists(table, column)) {
        console.log(`  [skip] ${table}.${column} já existe`);
        return;
    }
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
    console.log(`  [ok] ${table}.${column} adicionada`);
}

async function ensureFk(table, column, constraintName, onDelete) {
    const existentes = await fksReferencing("petshops");
    const jaTem = existentes.some((f) => f.TABLE_NAME === table && f.COLUMN_NAME === column);
    if (jaTem) {
        console.log(`  [skip] FK ${table}.${column} -> petshops já existe`);
        return;
    }
    await pool.query(
        `ALTER TABLE ${table} ADD CONSTRAINT ${constraintName} FOREIGN KEY (${column}) REFERENCES petshops(id) ON DELETE ${onDelete}`
    );
    console.log(`  [ok] FK ${constraintName} criada (${table}.${column} -> petshops.id, ON DELETE ${onDelete})`);
}

async function fase0Preflight() {
    console.log("\n=== FASE 0: preflight ===");
    const contagens = {};
    for (const t of ["parceiros", "petshops", "enderecos_parceiros", "horarios_funcionamento", "avaliacoes"]) {
        if (await tableExists(t)) {
            const [[{ c }]] = await pool.query(`SELECT COUNT(*) c FROM ${t}`);
            contagens[t] = c;
        } else {
            contagens[t] = null;
        }
    }
    console.log("Contagens:", contagens);

    const fks = await fksReferencing("parceiros");
    console.log("FKs apontando para parceiros:", fks);
    return { fks };
}

async function fase1AlterPetshops() {
    console.log("\n=== FASE 1: alteração aditiva em petshops ===");
    if (!(await tableExists("petshops"))) {
        throw new Error("Tabela petshops não existe — abortando.");
    }
    await ensureColumnAdded("petshops", "email", "email VARCHAR(150) NULL AFTER nome");
    await ensureColumnAdded("petshops", "senha", "senha VARCHAR(255) NULL AFTER email");
    await ensureColumnAdded("petshops", "telefone", "telefone VARCHAR(15) NULL AFTER senha");
    await ensureColumnAdded("petshops", "cnpj", "cnpj VARCHAR(14) NULL AFTER telefone");
    await ensureColumnAdded("petshops", "tipo", "tipo VARCHAR(50) NULL AFTER cnpj");
    await ensureColumnAdded("petshops", "descricao", "descricao TEXT NULL AFTER tipo");
    await ensureColumnAdded("petshops", "logo", "logo VARCHAR(255) NULL AFTER descricao");
    await ensureColumnAdded("petshops", "aprovado", "aprovado TINYINT(1) NOT NULL DEFAULT 0 AFTER logo");
    await ensureColumnAdded("petshops", "bloqueado", "bloqueado TINYINT(1) NOT NULL DEFAULT 0 AFTER aprovado");
    await ensureColumnAdded("petshops", "criado_em", "criado_em DATETIME NULL DEFAULT CURRENT_TIMESTAMP AFTER bloqueado");
}

async function fase2Remap() {
    console.log("\n=== FASE 2: remapeamento de dados (transação) ===");
    if (!(await tableExists("parceiros"))) {
        console.log("  [skip] tabela parceiros já não existe — fase concluída em execução anterior.");
        return null;
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const fksAtuais = await fksReferencing("parceiros");
        for (const fk of fksAtuais) {
            console.log(`  dropando FK ${fk.CONSTRAINT_NAME} em ${fk.TABLE_NAME}`);
            await conn.query(`ALTER TABLE ${fk.TABLE_NAME} DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}`);
        }

        const [parceiros] = await conn.query("SELECT * FROM parceiros");
        const mapping = [];
        for (const p of parceiros) {
            const [existing] = await conn.query("SELECT id FROM petshops WHERE email = ? LIMIT 1", [p.email]);
            let petshopId;
            if (existing.length > 0) {
                petshopId = existing[0].id;
                console.log(`  [reuso] parceiro #${p.id} (${p.email}) -> petshop #${petshopId} (já migrado antes)`);
            } else {
                const [r] = await conn.query(
                    `INSERT INTO petshops (nome, email, senha, telefone, cnpj, tipo, descricao, logo, aprovado, bloqueado, criado_em)
                     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                    [p.nome, p.email, p.senha, p.telefone, p.cnpj, p.tipo, p.descricao, p.logo, p.aprovado, p.bloqueado, p.criado_em]
                );
                petshopId = r.insertId;
                console.log(`  [novo] parceiro #${p.id} (${p.email}) -> petshop #${petshopId}`);
            }
            mapping.push({ parceiroId: p.id, petshopId });
        }

        for (const { parceiroId, petshopId } of mapping) {
            if (await columnExists("produtos", "parceiro_id")) {
                await conn.query("UPDATE produtos SET parceiro_id = ? WHERE parceiro_id = ?", [petshopId, parceiroId]);
            }
            if (await columnExists("pedidos", "parceiro_id")) {
                await conn.query("UPDATE pedidos SET parceiro_id = ? WHERE parceiro_id = ?", [petshopId, parceiroId]);
            }
            if (await tableExists("servicos_parceiro")) {
                await conn.query("UPDATE servicos_parceiro SET parceiro_id = ? WHERE parceiro_id = ?", [petshopId, parceiroId]);
            }
            if (await tableExists("enderecos_parceiros")) {
                await conn.query("UPDATE enderecos_parceiros SET parceiro_id = ? WHERE parceiro_id = ?", [petshopId, parceiroId]);
            }
            if (await columnExists("horarios_funcionamento", "parceiro_id")) {
                await conn.query("UPDATE horarios_funcionamento SET parceiro_id = ? WHERE parceiro_id = ?", [petshopId, parceiroId]);
            }
            if (await columnExists("avaliacoes", "parceiro_id")) {
                await conn.query("UPDATE avaliacoes SET parceiro_id = ? WHERE parceiro_id = ?", [petshopId, parceiroId]);
            }
            if (await columnExists("agendamentos", "parceiro_id")) {
                await conn.query(
                    "UPDATE agendamentos SET petshop_id = ? WHERE parceiro_id = ? AND petshop_id IS NULL",
                    [petshopId, parceiroId]
                );
            }
        }

        const checks = [
            ["produtos", "parceiro_id"],
            ["pedidos", "parceiro_id"],
            ["servicos_parceiro", "parceiro_id"],
            ["enderecos_parceiros", "parceiro_id"],
            ["horarios_funcionamento", "parceiro_id"],
            ["avaliacoes", "parceiro_id"]
        ];
        for (const [table, col] of checks) {
            if (!(await tableExists(table)) || !(await columnExists(table, col))) continue;
            const [[{ orph }]] = await conn.query(
                `SELECT COUNT(*) orph FROM ${table} WHERE ${col} IS NOT NULL AND ${col} NOT IN (SELECT id FROM petshops)`
            );
            if (orph > 0) throw new Error(`órfãos em ${table}.${col}: ${orph}`);
        }

        await conn.commit();
        console.log("  [ok] remapeamento commitado.");
        console.log("  Mapeamento parceiro_id -> petshop_id:", mapping);
        return mapping;
    } catch (err) {
        await conn.rollback();
        console.error("  [ERRO] rollback do DML (FKs já dropadas nesta execução, se houve, permanecem dropadas):", err.message);
        throw err;
    } finally {
        conn.release();
    }
}

async function fase3Ddl(fksOriginais) {
    console.log("\n=== FASE 3: DDL final (rename de colunas/tabelas, novas FKs, drop de parceiros) ===");

    if (await columnExists("agendamentos", "parceiro_id")) {
        await pool.query("ALTER TABLE agendamentos DROP COLUMN parceiro_id");
        console.log("  [ok] agendamentos.parceiro_id removida");
    } else {
        console.log("  [skip] agendamentos.parceiro_id já removida");
    }

    if (await columnExists("produtos", "parceiro_id")) {
        await pool.query("ALTER TABLE produtos CHANGE COLUMN parceiro_id petshop_id INT NULL");
        console.log("  [ok] produtos.parceiro_id -> petshop_id");
    }
    await ensureFk("produtos", "petshop_id", "fk_produtos_petshop", "SET NULL");

    if (await columnExists("pedidos", "parceiro_id")) {
        await pool.query("ALTER TABLE pedidos CHANGE COLUMN parceiro_id petshop_id INT NULL");
        console.log("  [ok] pedidos.parceiro_id -> petshop_id");
    }
    await ensureFk("pedidos", "petshop_id", "fk_pedidos_petshop", "SET NULL");

    if (await tableExists("servicos_parceiro")) {
        await pool.query("RENAME TABLE servicos_parceiro TO servicos_petshop");
        console.log("  [ok] servicos_parceiro -> servicos_petshop");
    }
    if (await columnExists("servicos_petshop", "parceiro_id")) {
        await pool.query("ALTER TABLE servicos_petshop CHANGE COLUMN parceiro_id petshop_id INT NOT NULL");
        console.log("  [ok] servicos_petshop.parceiro_id -> petshop_id");
    }
    await ensureFk("servicos_petshop", "petshop_id", "fk_servicos_petshop", "CASCADE");

    if (await tableExists("enderecos_parceiros")) {
        await pool.query("RENAME TABLE enderecos_parceiros TO enderecos_petshops");
        console.log("  [ok] enderecos_parceiros -> enderecos_petshops");
    }
    if (await columnExists("enderecos_petshops", "parceiro_id")) {
        await pool.query("ALTER TABLE enderecos_petshops CHANGE COLUMN parceiro_id petshop_id INT NOT NULL");
        console.log("  [ok] enderecos_petshops.parceiro_id -> petshop_id");
    }
    await ensureFk("enderecos_petshops", "petshop_id", "fk_enderecos_petshop", originalRule(fksOriginais, "enderecos_parceiros") || "CASCADE");

    if (await columnExists("horarios_funcionamento", "parceiro_id")) {
        await pool.query("ALTER TABLE horarios_funcionamento CHANGE COLUMN parceiro_id petshop_id INT NOT NULL");
        console.log("  [ok] horarios_funcionamento.parceiro_id -> petshop_id");
    }
    await ensureFk("horarios_funcionamento", "petshop_id", "fk_horarios_petshop", originalRule(fksOriginais, "horarios_funcionamento") || "CASCADE");

    if (await columnExists("avaliacoes", "parceiro_id")) {
        await pool.query("ALTER TABLE avaliacoes CHANGE COLUMN parceiro_id petshop_id INT NOT NULL");
        console.log("  [ok] avaliacoes.parceiro_id -> petshop_id");
    }
    await ensureFk("avaliacoes", "petshop_id", "fk_avaliacoes_petshop", originalRule(fksOriginais, "avaliacoes") || "CASCADE");

    if (await tableExists("parceiros")) {
        await pool.query("DROP TABLE parceiros");
        console.log("  [ok] tabela parceiros removida");
    } else {
        console.log("  [skip] tabela parceiros já removida");
    }
}

async function fase4Verificacao() {
    console.log("\n=== FASE 4: verificação final ===");
    const [[{ c: petshopsCount }]] = await pool.query("SELECT COUNT(*) c FROM petshops");
    console.log("petshops:", petshopsCount);

    const [colunasRestantes] = await pool.query(
        "SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND COLUMN_NAME = 'parceiro_id'"
    );
    console.log("colunas parceiro_id restantes (deve ser vazio):", colunasRestantes);

    console.log("tabela parceiros ainda existe?", await tableExists("parceiros"));

    for (const t of ["produtos", "pedidos", "servicos_petshop", "enderecos_petshops", "agendamentos"]) {
        const [[{ c }]] = await pool.query(`SELECT COUNT(*) c FROM ${t}`);
        console.log(`${t}: ${c} linhas`);
    }
}

async function main() {
    try {
        const { fks } = await fase0Preflight();
        await fase1AlterPetshops();
        await fase2Remap();
        await fase3Ddl(fks);
        await fase4Verificacao();
        console.log("\nMigração concluída com sucesso.");
    } catch (err) {
        console.error("\nMigração falhou:", err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
