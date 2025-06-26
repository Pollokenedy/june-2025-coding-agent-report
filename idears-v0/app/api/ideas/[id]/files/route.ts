import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const IDEAS_FILE = path.join(DATA_DIR, "ideas.json")
const UPLOADS_DIR = path.join(DATA_DIR, "uploads")

interface Idea {
  id: string
  title: string
  description: string
  votes: number
  notes: string
  files: string[]
  createdAt: string
}

async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR)
  } catch {
    await fs.mkdir(UPLOADS_DIR, { recursive: true })
  }
}

async function readIdeas(): Promise<Idea[]> {
  try {
    const data = await fs.readFile(IDEAS_FILE, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeIdeas(ideas: Idea[]) {
  await fs.writeFile(IDEAS_FILE, JSON.stringify(ideas, null, 2))
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureUploadsDir()

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const ideas = await readIdeas()
    const ideaIndex = ideas.findIndex((idea) => idea.id === params.id)

    if (ideaIndex === -1) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const filepath = path.join(UPLOADS_DIR, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(filepath, buffer)

    // Update idea with file reference
    ideas[ideaIndex].files.push(filename)
    await writeIdeas(ideas)

    return NextResponse.json({ idea: ideas[ideaIndex] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
