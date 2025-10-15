// Shared in-memory storage for notes
// In production, you'd replace this with a database
let notes = [];
let nextId = 1;

export function getNotes() {
  return notes;
}

export function setNotes(newNotes) {
  notes = newNotes;
}

export function addNote(note) {
  const noteWithId = {
    ...note,
    id: nextId++,
  };
  notes.push(noteWithId);
  return noteWithId;
}

export function findNoteById(id) {
  return notes.find((n) => n.id === parseInt(id));
}

export function updateNote(id, updates) {
  const note = findNoteById(id);
  if (!note) return null;

  Object.assign(note, updates);
  return note;
}

export function deleteNote(id) {
  const index = notes.findIndex((n) => n.id === parseInt(id));
  if (index === -1) return false;

  notes.splice(index, 1);
  return true;
}

export function getNextId() {
  return nextId;
}
