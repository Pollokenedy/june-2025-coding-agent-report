import { apiRequest } from "./queryClient";
import type { InsertIdea, InsertNote, IdeaWithDetails, Note, Attachment } from "@shared/schema";

export const api = {
  // Ideas
  getIdeas: async (): Promise<IdeaWithDetails[]> => {
    const response = await apiRequest("GET", "/api/ideas");
    return response.json();
  },

  getIdea: async (id: number): Promise<IdeaWithDetails> => {
    const response = await apiRequest("GET", `/api/ideas/${id}`);
    return response.json();
  },

  createIdea: async (idea: InsertIdea, files?: File[]): Promise<IdeaWithDetails> => {
    const formData = new FormData();
    formData.append("title", idea.title);
    formData.append("description", idea.description);
    formData.append("author", idea.author);
    formData.append("priority", idea.priority);
    
    if (files) {
      files.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    const response = await fetch("/api/ideas", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const text = (await response.text()) || response.statusText;
      throw new Error(`${response.status}: ${text}`);
    }

    return response.json();
  },

  voteIdea: async (id: number): Promise<void> => {
    await apiRequest("POST", `/api/ideas/${id}/vote`);
  },

  downvoteIdea: async (id: number): Promise<void> => {
    await apiRequest("POST", `/api/ideas/${id}/downvote`);
  },

  // Notes  
  addNote: async (ideaId: number, content: string): Promise<Note> => {
    const response = await apiRequest("POST", `/api/ideas/${ideaId}/notes`, { content });
    return response.json();
  },

  // Attachments
  addAttachments: async (ideaId: number, files: File[]): Promise<Attachment[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`/api/ideas/${ideaId}/attachments`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const text = (await response.text()) || response.statusText;
      throw new Error(`${response.status}: ${text}`);
    }

    return response.json();
  },

  downloadAttachment: (id: number): string => {
    return `/api/attachments/${id}`;
  },

  // Stats
  getStats: async (): Promise<{
    totalIdeas: number;
    totalVotes: number;
    thisWeek: number;
    topIdea: { votes: number } | null;
  }> => {
    const response = await apiRequest("GET", "/api/stats");
    return response.json();
  },
};
