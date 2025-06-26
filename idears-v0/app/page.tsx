"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ChevronUp, FileText, Plus, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Idea {
  id: string
  title: string
  description: string
  votes: number
  notes: string
  files: string[]
  createdAt: string
}

export default function IdeaCollector() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [newIdea, setNewIdea] = useState({ title: "", description: "" })
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchIdeas()
  }, [])

  const fetchIdeas = async () => {
    try {
      const response = await fetch("/api/ideas")
      const data = await response.json()
      setIdeas(data.ideas || [])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch ideas",
        variant: "destructive",
      })
    }
  }

  const createIdea = async () => {
    if (!newIdea.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an idea title",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newIdea),
      })

      if (response.ok) {
        setNewIdea({ title: "", description: "" })
        fetchIdeas()
        toast({
          title: "Success",
          description: "Idea created successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create idea",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const voteIdea = async (id: string) => {
    try {
      const response = await fetch(`/api/ideas/${id}/vote`, {
        method: "POST",
      })

      if (response.ok) {
        fetchIdeas()
        toast({
          title: "Voted!",
          description: "Your vote has been recorded",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to vote",
        variant: "destructive",
      })
    }
  }

  const updateNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/ideas/${id}/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      })

      if (response.ok) {
        setEditingNotes(null)
        setNoteText("")
        fetchIdeas()
        toast({
          title: "Success",
          description: "Notes updated successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notes",
        variant: "destructive",
      })
    }
  }

  const uploadFile = async (id: string, file: File) => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/ideas/${id}/files`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        fetchIdeas()
        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(id, file)
    }
  }

  const startEditingNotes = (idea: Idea) => {
    setEditingNotes(idea.id)
    setNoteText(idea.notes)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Idea Collector</h1>
        <p className="text-muted-foreground">Collect, vote on, and develop your best ideas</p>
      </div>

      {/* Create New Idea */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Idea
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Idea title..."
            value={newIdea.title}
            onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
          />
          <Textarea
            placeholder="Describe your idea (optional)..."
            value={newIdea.description}
            onChange={(e) => setNewIdea({ ...newIdea, description: e.target.value })}
          />
          <Button onClick={createIdea} disabled={loading}>
            {loading ? "Creating..." : "Create Idea"}
          </Button>
        </CardContent>
      </Card>

      {/* Ideas List */}
      <div className="space-y-4">
        {ideas.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No ideas yet. Create your first idea above!</p>
            </CardContent>
          </Card>
        ) : (
          ideas.map((idea) => (
            <Card key={idea.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{idea.title}</CardTitle>
                    {idea.description && <CardDescription className="mt-2">{idea.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <ChevronUp className="h-3 w-3" />
                      {idea.votes}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => voteIdea(idea.id)}>
                      Vote
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Notes Section */}
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
                  {editingNotes === idea.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add notes about this idea..."
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => updateNotes(idea.id)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNotes(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {idea.notes ? (
                        <p className="text-sm text-muted-foreground mb-2">{idea.notes}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-2 italic">No notes yet</p>
                      )}
                      <Button size="sm" variant="outline" onClick={() => startEditingNotes(idea)}>
                        {idea.notes ? "Edit Notes" : "Add Notes"}
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Files Section */}
                <div>
                  <h4 className="font-medium mb-2">Attachments</h4>
                  {idea.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {idea.files.map((file, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {file}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id={`file-${idea.id}`}
                      className="hidden"
                      onChange={(e) => handleFileUpload(idea.id, e)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => document.getElementById(`file-${idea.id}`)?.click()}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload File
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {new Date(idea.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
