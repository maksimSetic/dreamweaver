import { NextResponse } from "next/server";
import { findNoteById, updateNote, deleteNote } from "../notesData.js";

// GET /api/notes/[id] - Get a specific note
export async function GET(request, { params }) {
  const note = findNoteById(params.id);

  if (!note) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json(note);
}

// PUT /api/notes/[id] - Update a specific note
export async function PUT(request, { params }) {
  try {
    const { title, content, status, updatedAt } = await request.json();

    const updates = {};
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (typeof status !== "undefined") updates.status = status;
    updates.updatedAt = updatedAt || new Date().toISOString();

    const note = updateNote(params.id, updates);

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  }
}

// DELETE /api/notes/[id] - Delete a specific note
export async function DELETE(request, { params }) {
  const success = deleteNote(params.id);

  if (!success) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
