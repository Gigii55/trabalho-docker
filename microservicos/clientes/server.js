const express = require("express");
const db = require("./db");

const app = express();

app.use(express.json());

app.get("/clientes", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT * FROM clientes ORDER BY id"
        );

        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao buscar clientes"
        });
    }
});

app.get("/clientes/:id", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT * FROM clientes WHERE id = $1",
            [req.params.id]
        );

        const cliente = resultado.rows[0];

        if (!cliente) {
            return res.status(404).json({
                erro: "Cliente não encontrado"
            });
        }

        res.json(cliente);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao buscar cliente"
        });
    }
});

app.post("/clientes", async (req, res) => {
    const { nome, sobrenome, telefone, email } = req.body;

    if (!nome || !sobrenome || !email) {
        return res.status(400).json({
            erro: "Nome, sobrenome e email são obrigatórios"
        });
    }

    try {
        const resultado = await db.query(
            `INSERT INTO clientes (nome, sobrenome, telefone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [nome, sobrenome, telefone, email]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        if (erro.code === "23505") {
            return res.status(409).json({
                erro: "Email já cadastrado"
            });
        }

        res.status(500).json({
            erro: "Erro ao criar cliente"
        });
    }
});

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

    console.log("Tabela de clientes pronta");
}

criarTabela();

app.listen(3003, () => {
    console.log("Clientes rodando na porta 3003");
});