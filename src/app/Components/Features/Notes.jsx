import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

function Notes() {
  const [notes, setNotes] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    status: "Active",
  });
  const [editNote, setEditNote] = useState(null);
  const [newlyCreatedId, setNewlyCreatedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toDeleteId, setToDeleteId] = useState(null);

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  useEffect(() => {
    fetch("/api/notes")
      .then((res) => res.json())
      .then(setNotes)
      .catch(() => setError("Failed to fetch notes"));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const payload = {
        ...newNote,
        status: newNote.status || "Active",
        createdAt: now,
        updatedAt: now,
      };

      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Create failed");
      const note = await res.json();
      setNotes((prev) => [...prev, note]);
      setNewlyCreatedId(note.id);
      setTimeout(() => setNewlyCreatedId(null), 8000);
      setNewNote({ title: "", content: "", status: "Active" });
      setModalOpen(false);
    } catch {
      setError("Failed to create note");
    }
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const now = new Date().toISOString();
      const payload = { ...editNote, updatedAt: now };

      const res = await fetch(`/api/notes/${editNote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setEditNote(null);
      setModalOpen(false);
    } catch {
      setError("Failed to update note");
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("Failed to delete note");
    }
    setLoading(false);
  };

  return (
    <div className="container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, delay: 0.05 }}
        className="mb-8"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <div className="hidden sm:block" />

          <div className="flex justify-center">
            <h1 className="text-4xl font-extrabold text-black text-center">
              Notes
            </h1>
          </div>

          <div className="flex justify-end">
            <button
              className="hidden sm:inline-flex btn"
              onClick={() => {
                setModalOpen(true);
                setEditNote(null);
              }}
            >
              + Add Note
            </button>
          </div>

          <div className="flex justify-center sm:hidden mt-2">
            <button
              className="btn"
              onClick={() => {
                setModalOpen(true);
                setEditNote(null);
              }}
            >
              + Add Note
            </button>
          </div>
        </div>
      </motion.div>
      {error && <div className="text-red-600 mb-2 text-center">{error}</div>}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="overflow-x-auto"
      >
        <table className="min-w-full bg-white shadow-sm">
          {notes.length > 0 && (
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">CreatedAt</th>
                <th className="px-6 py-3">UpdatedAt</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200">
            {notes.map((note) => (
              <tr
                key={note.id}
                className={
                  note.id === newlyCreatedId
                    ? "border-b-4 border-primary-500"
                    : ""
                }
              >
                <td className="px-6 py-4 align-top font-semibold max-w-[200px] truncate">
                  <span title={note.title}>{note.title}</span>
                </td>
                <td className="px-6 py-4 align-top max-w-[350px] text-sm text-gray-700 whitespace-pre-line overflow-hidden truncate">
                  <span title={note.content}>{note.content}</span>
                </td>
                <td className="px-6 py-4 align-top max-w-[140px] truncate">
                  <span title={note.status || "—"}>{note.status || "—"}</span>
                </td>
                <td className="px-6 py-4 align-top max-w-[180px] truncate">
                  <span
                    title={
                      note.createdAt
                        ? new Date(note.createdAt).toLocaleString()
                        : "—"
                    }
                  >
                    {formatDate(note.createdAt)}
                  </span>
                </td>
                <td className="px-6 py-4 align-top max-w-[180px] truncate">
                  <span
                    title={
                      note.updatedAt
                        ? new Date(note.updatedAt).toLocaleString()
                        : "—"
                    }
                  >
                    {formatDate(note.updatedAt)}
                  </span>
                </td>
                <td className="px-6 py-4 align-top text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditNote(note);
                        setModalOpen(true);
                      }}
                      className="text-blue-500 hover:text-blue-700 p-2 rounded"
                      aria-label="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => setToDeleteId(note.id)}
                      className="text-red-500 hover:text-red-700 p-2 rounded"
                      aria-label="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative bg-white/90 backdrop-blur-lg border border-gray-200 shadow-2xl rounded-xl p-8 min-w-[340px] max-w-[90vw]"
            >
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-xl"
                onClick={() => {
                  setModalOpen(false);
                  setEditNote(null);
                }}
                aria-label="Close"
              >
                ✕
              </button>
              <h2 className="text-2xl font-bold mb-4 text-center text-primary-700">
                {editNote ? "Edit Note" : "Add Note"}
              </h2>
              <form
                onSubmit={editNote ? handleUpdate : handleCreate}
                className="flex flex-col"
              >
                <label className="text-sm text-gray-600 ml-2">Title</label>
                <input
                  type="text"
                  className="border rounded-sm px-4 py-2 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-600 w-full mb-2"
                  value={editNote ? editNote.title : newNote.title}
                  onChange={(e) =>
                    editNote
                      ? setEditNote({ ...editNote, title: e.target.value })
                      : setNewNote({ ...newNote, title: e.target.value })
                  }
                  required
                />

                <label className="text-sm text-gray-600 ml-2">
                  Description
                </label>
                <textarea
                  className="border rounded-sm px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-600 w-full mb-3"
                  value={editNote ? editNote.content : newNote.content}
                  onChange={(e) =>
                    editNote
                      ? setEditNote({ ...editNote, content: e.target.value })
                      : setNewNote({ ...newNote, content: e.target.value })
                  }
                  required
                  rows={4}
                />

                <label className="text-sm text-gray-600 ml-2">Status</label>
                <select
                  className="border rounded-sm px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-primary-600 w-full mb-3"
                  value={
                    editNote ? editNote.status || "Active" : newNote.status
                  }
                  onChange={(e) =>
                    editNote
                      ? setEditNote({ ...editNote, status: e.target.value })
                      : setNewNote({ ...newNote, status: e.target.value })
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 transition-transform duration-200"
                  disabled={loading}
                >
                  {editNote ? "Update" : "Add"}
                </button>
                {editNote && (
                  <button
                    type="button"
                    className="bg-gray-300 text-gray-800 px-6 py-2 rounded-xl font-semibold"
                    onClick={() => {
                      setEditNote(null);
                      setModalOpen(false);
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
        {toDeleteId && (
          <motion.div
            key="confirm-delete-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-lg p-6 shadow-xl min-w-[280px] max-w-[90vw]"
            >
              <div className="text-lg font-semibold mb-3">Are you sure?</div>
              <div className="text-sm text-gray-600 mb-4">
                This action will permanently delete the note.
              </div>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:scale-105 transition-transform duration-200"
                  onClick={() => setToDeleteId(null)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white hover:scale-105 transition-transform duration-200"
                  onClick={async () => {
                    const id = toDeleteId;
                    setToDeleteId(null);
                    await handleDelete(id);
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Notes;
