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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, delay: 0.05 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
            <div className="hidden sm:block" />

            <div className="flex justify-center">
              <h1 className="text-4xl font-extrabold text-white text-center">
                ✨ Cosmic Notes
              </h1>
            </div>

            <div className="flex justify-end">
              <button
                className="hidden sm:inline-flex bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  setModalOpen(true);
                  setEditNote(null);
                }}
              >
                ✨ Add Note
              </button>
            </div>

            <div className="flex justify-center sm:hidden mt-2">
              <button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  setModalOpen(true);
                  setEditNote(null);
                }}
              >
                ✨ Add Note
              </button>
            </div>
          </div>
        </motion.div>
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200 text-center">{error}</p>
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="overflow-x-auto"
        >
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-purple-800/20 to-blue-800/20 backdrop-blur-sm rounded-xl">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
              <p className="text-purple-200">Loading your cosmic notes...</p>
            </div>
          )}

          {!loading && notes.length === 0 && (
            <div className="bg-gradient-to-r from-purple-800/30 to-blue-800/30 border border-purple-500/30 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No cosmic notes yet
              </h3>
              <p className="text-purple-200 text-lg mb-6">
                Start by creating your first note to capture your thoughts and
                ideas! ✨
              </p>
              <button
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => {
                  setModalOpen(true);
                  setEditNote(null);
                }}
              >
                ✨ Create First Note
              </button>
            </div>
          )}

          {!loading && notes.length > 0 && (
            <table className="min-w-full bg-gradient-to-br from-purple-800/20 to-blue-800/20 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden">
              {notes.length > 0 && (
                <thead className="bg-gradient-to-r from-purple-700/50 to-blue-700/50">
                  <tr className="text-left">
                    <th className="px-6 py-4 text-purple-100 font-semibold">
                      Title
                    </th>
                    <th className="px-6 py-4 text-purple-100 font-semibold">
                      Description
                    </th>
                    <th className="px-6 py-4 text-purple-100 font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-purple-100 font-semibold">
                      CreatedAt
                    </th>
                    <th className="px-6 py-4 text-purple-100 font-semibold">
                      UpdatedAt
                    </th>
                    <th className="px-6 py-4 text-purple-100 font-semibold text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
              )}
              <tbody className="divide-y divide-purple-600/30">
                {notes.map((note) => (
                  <tr
                    key={note.id}
                    className={`hover:bg-purple-700/20 transition-colors ${
                      note.id === newlyCreatedId
                        ? "border-b-4 border-pink-500"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 align-top font-semibold max-w-[200px] truncate text-purple-100">
                      <span title={note.title}>{note.title}</span>
                    </td>
                    <td className="px-6 py-4 align-top max-w-[350px] text-sm text-purple-200 whitespace-pre-line overflow-hidden truncate">
                      <span title={note.content}>{note.content}</span>
                    </td>
                    <td className="px-6 py-4 align-top max-w-[140px] truncate text-purple-200">
                      <span title={note.status || "—"}>
                        {note.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top max-w-[180px] truncate text-purple-200">
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
                    <td className="px-6 py-4 align-top max-w-[180px] truncate text-purple-200">
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
                          className="text-purple-300 hover:text-purple-100 p-2 rounded-lg hover:bg-purple-700/30 transition-colors"
                          aria-label="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setToDeleteId(note.id)}
                          className="text-pink-300 hover:text-pink-100 p-2 rounded-lg hover:bg-red-700/30 transition-colors"
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
          )}
        </motion.div>
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="relative bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-lg border border-purple-500/30 shadow-2xl rounded-xl p-8 min-w-[340px] max-w-[90vw]"
              >
                <button
                  className="absolute top-4 right-4 text-purple-300 hover:text-white text-xl transition-colors"
                  onClick={() => {
                    setModalOpen(false);
                    setEditNote(null);
                  }}
                  aria-label="Close"
                >
                  ✕
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center text-white">
                  ✨ {editNote ? "Edit Note" : "Add Note"}
                </h2>
                <form
                  onSubmit={editNote ? handleUpdate : handleCreate}
                  className="flex flex-col space-y-4"
                >
                  <div>
                    <label className="text-sm text-purple-200 ml-2 block mb-2">
                      ✨ Title
                    </label>
                    <input
                      type="text"
                      className="bg-purple-800/30 border border-purple-500/50 rounded-lg px-4 py-3 text-lg font-semibold text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full backdrop-blur-sm"
                      placeholder="Enter note title..."
                      value={editNote ? editNote.title : newNote.title}
                      onChange={(e) =>
                        editNote
                          ? setEditNote({ ...editNote, title: e.target.value })
                          : setNewNote({ ...newNote, title: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-purple-200 ml-2 block mb-2">
                      📝 Description
                    </label>
                    <textarea
                      className="bg-purple-800/30 border border-purple-500/50 rounded-lg px-4 py-3 text-base text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full backdrop-blur-sm resize-none"
                      placeholder="Write your note content..."
                      value={editNote ? editNote.content : newNote.content}
                      onChange={(e) =>
                        editNote
                          ? setEditNote({
                              ...editNote,
                              content: e.target.value,
                            })
                          : setNewNote({ ...newNote, content: e.target.value })
                      }
                      required
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm text-purple-200 ml-2 block mb-2">
                      🎯 Status
                    </label>
                    <select
                      className="bg-purple-800/30 border border-purple-500/50 rounded-lg px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-full backdrop-blur-sm"
                      value={
                        editNote ? editNote.status || "Active" : newNote.status
                      }
                      onChange={(e) =>
                        editNote
                          ? setEditNote({ ...editNote, status: e.target.value })
                          : setNewNote({ ...newNote, status: e.target.value })
                      }
                    >
                      <option value="Active">✨ Active</option>
                      <option value="Completed">✅ Completed</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      disabled={loading}
                    >
                      {loading
                        ? "⏳ Saving..."
                        : editNote
                          ? "💫 Update"
                          : "✨ Add Note"}
                    </button>
                    {editNote && (
                      <button
                        type="button"
                        className="bg-gray-600/50 hover:bg-gray-600/70 text-gray-200 px-6 py-3 rounded-xl font-semibold transition-colors"
                        onClick={() => {
                          setEditNote(null);
                          setModalOpen(false);
                        }}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.15 }}
                className="bg-gradient-to-br from-red-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-lg border border-red-500/30 rounded-xl p-6 shadow-xl min-w-[280px] max-w-[90vw]"
              >
                <div className="text-lg font-semibold mb-3 text-white">
                  🗑️ Are you sure?
                </div>
                <div className="text-sm text-red-200 mb-4">
                  This action will permanently delete the note and cannot be
                  undone.
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-600/50 hover:bg-gray-600/70 text-gray-200 hover:scale-105 transition-all duration-200"
                    onClick={() => setToDeleteId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white hover:scale-105 transition-all duration-200"
                    onClick={async () => {
                      const id = toDeleteId;
                      setToDeleteId(null);
                      await handleDelete(id);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Notes;
