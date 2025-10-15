const express = require("express");
const router = express.Router();

let notes = [];
let nextId = 1;

router.post("/", (req, res) => {
  const { title, content, status, createdAt, updatedAt } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }
  const now = new Date().toISOString();
  const note = {
    id: nextId++,
    title,
    content,
    status: status || "Active",
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
  };
  notes.push(note);
  res.status(201).json(note);
});

router.get("/", (req, res) => {
  res.json(notes);
});

router.get("/:id", (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id));
  if (!note) return res.status(404).json({ error: "Note not found." });
  res.json(note);
});

router.put("/:id", (req, res) => {
  const note = notes.find((n) => n.id === parseInt(req.params.id));
  if (!note) return res.status(404).json({ error: "Note not found." });
  const { title, content, status, updatedAt } = req.body;
  if (title) note.title = title;
  if (content) note.content = content;
  if (typeof status !== "undefined") note.status = status;
  note.updatedAt = updatedAt || new Date().toISOString();
  res.json(note);
});

router.delete("/:id", (req, res) => {
  const index = notes.findIndex((n) => n.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Note not found." });
  notes.splice(index, 1);
  res.status(204).end();
});

module.exports = router;
