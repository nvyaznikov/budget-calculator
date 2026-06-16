import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getDb } from "./db.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "cash-keeper-dev-secret";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function normalizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return response.status(401).json({ message: "Требуется авторизация" });
  }

  try {
    request.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return response.status(401).json({ message: "Сессия истекла" });
  }
}

function validateTransaction(body) {
  const category = String(body.category || "").trim();
  const date = String(body.date || "").trim();
  const type = String(body.type || "").trim();
  const amount = Number(body.amount);

  if (!["income", "expense", "regular"].includes(type)) {
    return { error: "Некорректный тип операции" };
  }

  if (!category) {
    return { error: "Укажите категорию" };
  }

  if (!amount || amount <= 0) {
    return { error: "Сумма должна быть больше 0" };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { error: "Укажите дату в формате YYYY-MM-DD" };
  }

  return { data: { type, category, amount, date } };
}

app.get("/api/health", (request, response) => {
  response.json({ ok: true });
});

app.post("/api/auth/register", async (request, response) => {
  const db = await getDb();
  const name = String(request.body.name || "").trim();
  const email = String(request.body.email || "").trim().toLowerCase();
  const password = String(request.body.password || "");

  if (!name || !email || password.length < 6) {
    return response.status(400).json({
      message: "Укажите имя, email и пароль минимум из 6 символов",
    });
  }

  const exists = await db.get("SELECT id FROM users WHERE email = ?", email);

  if (exists) {
    return response.status(409).json({
      message: "Пользователь с таким email уже существует",
    });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await db.run(
    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
    name,
    email,
    passwordHash
  );
  const user = await db.get("SELECT id, name, email FROM users WHERE id = ?", result.lastID);

  response.status(201).json({
    token: createToken(user),
    user: normalizeUser(user),
  });
});

app.post("/api/auth/login", async (request, response) => {
  const db = await getDb();
  const email = String(request.body.email || "").trim().toLowerCase();
  const password = String(request.body.password || "");
  const user = await db.get("SELECT * FROM users WHERE email = ?", email);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return response.status(401).json({ message: "Неверный email или пароль" });
  }

  response.json({
    token: createToken(user),
    user: normalizeUser(user),
  });
});

app.get("/api/me", requireAuth, async (request, response) => {
  const db = await getDb();
  const user = await db.get(
    "SELECT id, name, email FROM users WHERE id = ?",
    request.user.id
  );

  if (!user) {
    return response.status(404).json({ message: "Пользователь не найден" });
  }

  response.json({ user: normalizeUser(user) });
});

app.get("/api/transactions", requireAuth, async (request, response) => {
  const db = await getDb();
  const rows = await db.all(
    `SELECT id, type, category, amount, date, created_at, updated_at
     FROM transactions
     WHERE user_id = ?
     ORDER BY date DESC, id DESC`,
    request.user.id
  );

  response.json({ transactions: rows });
});

app.post("/api/transactions", requireAuth, async (request, response) => {
  const validation = validateTransaction(request.body);

  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  const db = await getDb();
  const { type, category, amount, date } = validation.data;
  const result = await db.run(
    `INSERT INTO transactions (user_id, type, category, amount, date)
     VALUES (?, ?, ?, ?, ?)`,
    request.user.id,
    type,
    category,
    amount,
    date
  );
  const transaction = await db.get(
    `SELECT id, type, category, amount, date, created_at, updated_at
     FROM transactions
     WHERE id = ? AND user_id = ?`,
    result.lastID,
    request.user.id
  );

  response.status(201).json({ transaction });
});

app.put("/api/transactions/:id", requireAuth, async (request, response) => {
  const validation = validateTransaction(request.body);

  if (validation.error) {
    return response.status(400).json({ message: validation.error });
  }

  const db = await getDb();
  const { type, category, amount, date } = validation.data;
  const result = await db.run(
    `UPDATE transactions
     SET type = ?, category = ?, amount = ?, date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    type,
    category,
    amount,
    date,
    request.params.id,
    request.user.id
  );

  if (!result.changes) {
    return response.status(404).json({ message: "Операция не найдена" });
  }

  const transaction = await db.get(
    `SELECT id, type, category, amount, date, created_at, updated_at
     FROM transactions
     WHERE id = ? AND user_id = ?`,
    request.params.id,
    request.user.id
  );

  response.json({ transaction });
});

app.delete("/api/transactions/:id", requireAuth, async (request, response) => {
  const db = await getDb();
  const result = await db.run(
    "DELETE FROM transactions WHERE id = ? AND user_id = ?",
    request.params.id,
    request.user.id
  );

  if (!result.changes) {
    return response.status(404).json({ message: "Операция не найдена" });
  }

  response.status(204).send();
});

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).json({ message: "Ошибка сервера" });
});

await getDb();

app.listen(PORT, () => {
  console.log(`Cash Keeper API: http://localhost:${PORT}`);
});
