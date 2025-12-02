// server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mysql = require("mysql2/promise");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// MySQL connection
const db = mysql.createPool({
  host: "localhost",
  user: "usuario_app",
  password: "senha_usuario",
  database: "meu_banco",
});

// ------------------ Usuários ------------------

// Cadastro
app.post("/register", async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ error: "Nome, telefone e senha são obrigatórios" });
    }

    const uuid = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (uuid, name, phone, password) VALUES (?, ?, ?, ?)",
      [uuid, name, phone, hashedPassword],
    );

    res.json({ uuid, name });
  } catch (error) {
    console.error("Erro no registro:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: "Telefone já cadastrado" });
    }
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { uuid, password } = req.body;

    if (!uuid || !password) {
      return res.status(400).json({ error: "UUID e senha são obrigatórios" });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE uuid = ?", [uuid]);

    if (rows.length === 0)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Senha inválida" });

    res.json({ uuid: user.uuid, name: user.name });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

// Criar chat
app.post("/create-chat", async (req, res) => {
  try {
    const { user1_uuid, user2_uuid } = req.body;

    if (!user1_uuid || !user2_uuid) {
      return res.status(400).json({ error: "UUIDs dos usuários são obrigatórios" });
    }

    // Verificar se já existe um chat entre esses usuários
    const [existingChats] = await db.query(
      "SELECT chat_id FROM chats WHERE (user1_uuid = ? AND user2_uuid = ?) OR (user1_uuid = ? AND user2_uuid = ?)",
      [user1_uuid, user2_uuid, user2_uuid, user1_uuid]
    );

    if (existingChats.length > 0) {
      return res.json({ chat_id: existingChats[0].chat_id });
    }

    const chat_id = uuidv4();

    await db.query(
      "INSERT INTO chats (chat_id, user1_uuid, user2_uuid) VALUES (?, ?, ?)",
      [chat_id, user1_uuid, user2_uuid],
    );

    res.json({ chat_id });
  } catch (error) {
    console.error("Erro ao criar chat:", error);
    res.status(500).json({ error: "Erro ao criar chat" });
  }
});

// Buscar chats do usuário
app.get("/user-chats/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;
    const [rows] = await db.query(
      `SELECT c.chat_id, c.user1_uuid, c.user2_uuid, c.created_at,
              u1.name as user1_name, u2.name as user2_name,
              m.text as last_message, m.created_at as last_message_time
       FROM chats c
       LEFT JOIN users u1 ON c.user1_uuid = u1.uuid
       LEFT JOIN users u2 ON c.user2_uuid = u2.uuid
       LEFT JOIN (
         SELECT chat_id, text, created_at,
                ROW_NUMBER() OVER (PARTITION BY chat_id ORDER BY created_at DESC) as rn
         FROM messages
       ) m ON c.chat_id = m.chat_id AND m.rn = 1
       WHERE c.user1_uuid = ? OR c.user2_uuid = ?
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [uuid, uuid],
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar chats:", error);
    res.status(500).json({ error: "Erro ao buscar chats" });
  }
});

// Buscar mensagens de um chat
app.get("/messages/:chat_id", async (req, res) => {
  try {
    const { chat_id } = req.params;
    const [rows] = await db.query(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       LEFT JOIN users u ON m.from_uuid = u.uuid
       WHERE m.chat_id = ?
       ORDER BY m.created_at ASC`,
      [chat_id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

// ------------------ Socket.IO ------------------

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Entrar em um chat específico (recebe chat_id diretamente)
  socket.on("join_chat", (chat_id) => {
    socket.join(chat_id);
    console.log(`${socket.id} joined chat ${chat_id}`);
  });

  // Receber e emitir mensagens
  socket.on("chatMessage", async (msg) => {
    try {
      // msg: { chat_id, from_uuid, to_uuid, text, user }
      await db.query(
        "INSERT INTO messages (chat_id, from_uuid, to_uuid, text) VALUES (?, ?, ?, ?)",
        [msg.chat_id, msg.from_uuid, msg.to_uuid, msg.text],
      );

      // Emitir a mensagem para todos no chat
      io.to(msg.chat_id).emit("chatMessage", {
        _id: Date.now() + Math.random(),
        text: msg.text,
        createdAt: new Date(),
        user: msg.user,
      });

      // Notifica todos os usuários conectados para atualizar inbox
      io.emit("newMessage", { chat_id: msg.chat_id });
    } catch (error) {
      console.error("Erro ao salvar mensagem:", error);
      socket.emit("error", { message: "Erro ao enviar mensagem" });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server rodando na porta 3001");
});

