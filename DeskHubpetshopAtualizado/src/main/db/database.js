const mysql = require("mysql2/promise");

// Pool único de conexão com o MySQL do XAMPP (porta 3307, sem senha).
// Mesmas credenciais usadas por API/config.php e HubPetShopWebGer/conexao.php.
const pool = mysql.createPool({
    host: "localhost",
    port: 3307,
    user: "root",
    password: "",
    database: "hubpetshop",
    waitForConnections: true,
    connectionLimit: 10,
});

module.exports = pool;
