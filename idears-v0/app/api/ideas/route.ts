import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const DATA_DIR = path.join(process.cwd(), "data")
const IDEAS_FILE = path.join(DATA_DIR, "ideas.json")

interface Idea {
  id: string
  title: string
  description: string
  votes: number
  notes: string
  files: string[]
  createdAt: string
}

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

async function readIdeas(): Promise<Idea[]> {
  await ensureDataDir()
  try {
    const data = await fs.readFile(IDEAS_FILE, "utf-8")
    const ideas = JSON.parse(data)
    return ideas.sort((a: Idea, b: Idea) => b.votes - a.votes)
  } catch {
    return []
  }
}

async function writeIdeas(ideas: Idea[]) {
  await ensureDataDir()
  await fs.writeFile(IDEAS_FILE, JSON.stringify(ideas, null, 2))
}

export async function GET() {
  try {
    const ideas = await readIdeas()
    return NextResponse.json({ ideas })
  } catch (error) {
    return NextResponse.json({ error: "Failed to read ideas" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const ideas = await readIdeas()
    const newIdea: Idea = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description?.trim() || "",
      votes: 0,
      notes: "",
      files: [],
      createdAt: new Date().toISOString(),
    }

    ideas.push(newIdea)
    await writeIdeas(ideas)

    return NextResponse.json({ idea: newIdea })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 })
  }
}
