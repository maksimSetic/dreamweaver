import { NextResponse } from "next/server";
import { getNotes, addNote } from "./notesData.js";

// GET /api/notes - Get all notes
export async function GET() {
  return NextResponse.json(getNotes());
}

// POST /api/notes - Create a new note
export async function POST(request) {
  try {
    const { title, content, status, createdAt, updatedAt } =
      await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const noteData = {
      title,
      content,
      status: status || "Active",
      createdAt: createdAt || now,
      updatedAt: updatedAt || now,
    };

    const note = addNote(noteData);
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  }
}
