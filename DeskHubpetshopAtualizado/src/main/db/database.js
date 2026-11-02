const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

// Configuração do banco: config.json na raiz (modelo em config.exemplo.json) ou padrões do XAMPP.
const CONFIG_PADRAO = {
    host: "localhost",
    port: 3307,
    user: "root",
    password: "",
    database: "hubpetshop"
};

function lerConfiguracao() {
    try {
        const caminho = path.join(__dirname, "../../../config.json");
        return { ...CONFIG_PADRAO, ...JSON.parse(fs.readFileSync(caminho, "utf8")) };
    } catch {
        return CONFIG_PADRAO;
    }
}

// Pool único de conexão com o MySQL.
const pool = mysql.createPool({
    ...lerConfiguracao(),
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;
