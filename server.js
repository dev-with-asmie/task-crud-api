const express = require("express");
const { Pool } = require("pg");

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./openapi.json");

const app = express();

const PORT = 3000;

// =========================
// PostgreSQL database setup
// =========================

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "dev",
  database: "tasks"
});

// Test database connection
pool
  .query("SELECT NOW()")
  .then(() => {
    console.log("Connected to PostgreSQL");
  })
  .catch((err) => {
    console.error("PostgreSQL connection error:", err.message);
  });

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

// =========================
// GET /tasks
// =========================

app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch tasks"
    });
  }
});

// =========================
// GET /tasks/:id
// =========================

app.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid task ID"
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Task ${id} not found`
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch task"
    });
  }
});

// =========================
// POST /tasks
// =========================

app.post("/tasks", async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({
      error: "Title is required and must be a non-empty string"
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, done)
       VALUES ($1, $2)
       RETURNING *`,
      [title.trim(), false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to create task"
    });
  }
});

// =========================
// PUT /tasks/:id
// =========================

app.put("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid task ID"
    });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res.status(400).json({
      error: "Request body must contain title or done"
    });
  }

  if (
    title !== undefined &&
    (typeof title !== "string" || title.trim() === "")
  ) {
    return res.status(400).json({
      error: "Title must be a non-empty string"
    });
  }

  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({
      error: "Done must be a boolean"
    });
  }

  try {
    // Check whether task exists
    const existingTask = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [id]
    );

    if (existingTask.rows.length === 0) {
      return res.status(404).json({
        error: `Task ${id} not found`
      });
    }

    const currentTask = existingTask.rows[0];

    const updatedTitle =
      title !== undefined ? title.trim() : currentTask.title;

    const updatedDone =
      done !== undefined ? done : currentTask.done;

    const result = await pool.query(
      `UPDATE tasks
       SET title = $1, done = $2
       WHERE id = $3
       RETURNING *`,
      [updatedTitle, updatedDone, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to update task"
    });
  }
});

// =========================
// DELETE /tasks/:id
// =========================

app.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid task ID"
    });
  }

  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `Task ${id} not found`
      });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete task"
    });
  }
});

// =========================
// Start server
// =========================

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});