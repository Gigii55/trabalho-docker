const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());

async function criarTabela() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS clientes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        sobrenome VARCHAR(100) NOT NULL,
        telefone VARCHAR(20),
        email VARCHAR(150) NOT NULL UNIQUE
        )
    `);
}

criarTabela();

app.listen(3003, () => {
    console.log("Clientes rodando na porta 3003");
});