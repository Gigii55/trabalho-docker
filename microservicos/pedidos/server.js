const express = require("express");
const axios = require("axios");
const db = require("./db");

const app = express();

const CLIENTES_URL =
    process.env.CLIENTES_URL || "http://localhost:3003";

const PRODUTOS_URL =
    process.env.PRODUTOS_URL || "http://localhost:3001";

async function criarTabela() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        clienteId INTEGER NOT NULL,
        produtoId INTEGER NOT NULL,
        nomeProduto VARCHAR(100) NOT NULL,
        precoUnitario NUMERIC(10, 2) NOT NULL,
        quantidade INTEGER NOT NULL,
        total NUMERIC(10, 2) NOT NULL
        )
    `);

    console.log("Tabela de pedidos pronta");
}

app.use(express.json());

const pedidos = [];

app.get("/pedidos", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT * FROM pedidos ORDER BY id"
        );

        res.json(resultado.rows);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao buscar pedidos"
        });
    }
});

app.post("/pedidos", async (req, res) => {
    const { clienteId, produtoId, quantidade } = req.body;

    if (!clienteId || !produtoId || !quantidade || quantidade <= 0) {
        return res.status(400).json({
            erro: "clienteId, produtoId e quantidade válida são obrigatórios"
        });
    }

    try {
        await axios.get(
            `${CLIENTES_URL}/clientes/${clienteId}`,
            {
                timeout: 3000
            }
        );

        const resposta = await axios.get(
            `${PRODUTOS_URL}/produtos/${produtoId}`,
            {
                timeout: 3000
            }
        );

        const produto = resposta.data;
        const total = produto.preco * quantidade;

        const resultado = await db.query(
            `INSERT INTO pedidos (
        clienteId,
        produtoId,
        nomeProduto,
        precoUnitario,
        quantidade,
        total
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
            [
                clienteId,
                produto.id,
                produto.nome,
                produto.preco,
                quantidade,
                total
            ]
        );

        res.status(201).json(resultado.rows[0]);
    } catch (erro) {
        if (erro.response?.status === 404) {
            return res.status(400).json({
                erro: "Cliente ou produto não encontrado"
            });
        }

        if (erro.code === "ECONNREFUSED" || erro.code === "ECONNABORTED") {
            return res.status(503).json({
                erro: "Serviço de Clientes ou Produtos indisponível"
            });
        }

        return res.status(500).json({
            erro: "Erro ao criar pedido"
        });
    }
});


app.get("/pedidos/:id", async (req, res) => {
    try {
        const resultado = await db.query(
            "SELECT * FROM pedidos WHERE id = $1",
            [req.params.id]
        );

        const pedido = resultado.rows[0];

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado"
            });
        }

        res.json(pedido);
    } catch (erro) {
        res.status(500).json({
            erro: "Erro ao buscar pedido"
        });
    }
});

criarTabela();

app.listen(3002, () => {
    console.log("Pedidos rodando na porta 3002");
});