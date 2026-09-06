const express = require("express");
const Database = require("better-sqlite3");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");

const app = express();

const PORT = 3000;

// =========================
// Database setup
// =========================

const db = new Database("tasks.db");

// Create tasks table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
  )
`);

// Seed three example tasks only if the table is empty
const taskCount = db
  .prepare("SELECT COUNT(*) AS count FROM tasks")
  .get();

if (taskCount.count === 0) {
  const insertTask = db.prepare(
    "INSERT INTO tasks (title, done) VALUES (?, ?)"
  );

  insertTask.run("Learn Express", 0);
  insertTask.run("Build CRUD API", 0);
  insertTask.run("Test API", 1);
}

// =========================
// Middleware
// =========================

app.use(express.json());

// Swagger documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// =========================
// Routes
// =========================

// GET /
app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"]
  });
});

// GET /health
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// GET /tasks
// GET /tasks
app.get("/tasks", (req, res) => {
  const tasks = db
    .prepare("SELECT * FROM tasks")
    .all()
    .map((task) => ({
      ...task,
      done: Boolean(task.done)
    }));

  res.json(tasks);
});

// GET /tasks/:id
app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  res.json({
    ...task,
    done: Boolean(task.done)
  });
});

// POST /tasks
app.post("/tasks", (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required and must be a non-empty string"
    });
  }

  const result = db
    .prepare(
      "INSERT INTO tasks (title, done) VALUES (?, ?)"
    )
    .run(title.trim(), 0);

  const newTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(result.lastInsertRowid);

  res.status(201).json({
    ...newTask,
    done: Boolean(newTask.done)
  });
});

// PUT /tasks/:id
app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({
      error: "Request body must contain title or done"
    });
  }

  let updatedTitle = task.title;
  let updatedDone = Boolean(task.done);

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({
        error: "Title must be a non-empty string"
      });
    }

    updatedTitle = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== "boolean") {
      return res.status(400).json({
        error: "Done must be a boolean"
      });
    }

    updatedDone = done;
  }

  db.prepare(
    "UPDATE tasks SET title = ?, done = ? WHERE id = ?"
  ).run(
    updatedTitle,
    updatedDone ? 1 : 0,
    id
  );

  const updatedTask = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  res.json({
    ...updatedTask,
    done: Boolean(updatedTask.done)
  });
});

// DELETE /tasks/:id
app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const task = db
    .prepare("SELECT * FROM tasks WHERE id = ?")
    .get(id);

  if (!task) {
    return res.status(404).json({
      error: `Task ${id} not found`
    });
  }

  db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

  res.status(204).send();
});

// =========================
// Start server
// =========================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});