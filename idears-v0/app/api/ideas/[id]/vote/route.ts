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
    const ideas = await readIdeas()
    const ideaIndex = ideas.findIndex((idea) => idea.id === params.id)

    if (ideaIndex === -1) {
      return NextResponse.json({ error: "Idea not found" }, { status: 404 })
    }

    ideas[ideaIndex].votes += 1
    await writeIdeas(ideas)

    return NextResponse.json({ idea: ideas[ideaIndex] })
  } catch (error) {
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 })
  }
}
