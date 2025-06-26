import { ideas, notes, attachments, type Idea, type Note, type Attachment, type InsertIdea, type InsertNote, type InsertAttachment, type IdeaWithDetails } from "@shared/schema";
import path from "path";
import fs from "fs/promises";

export interface IStorage {
  // Ideas
  getIdeas(): Promise<IdeaWithDetails[]>;
  getIdea(id: number): Promise<IdeaWithDetails | undefined>;
  createIdea(idea: InsertIdea): Promise<Idea>;
  updateIdeaVotes(id: number, votes: number): Promise<Idea | undefined>;
  
  // Notes
  addNote(note: InsertNote): Promise<Note>;
  getNotes(ideaId: number): Promise<Note[]>;
  
  // Attachments
  addAttachment(attachment: InsertAttachment): Promise<Attachment>;
  getAttachments(ideaId: number): Promise<Attachment[]>;
  getAttachment(id: number): Promise<Attachment | undefined>;
  
  // Stats
  getStats(): Promise<{
    totalIdeas: number;
    totalVotes: number;
    thisWeek: number;
    topIdea: { votes: number } | null;
  }>;
}

export class MemStorage implements IStorage {
  private ideas: Map<number, Idea>;
  private notes: Map<number, Note>;
  private attachments: Map<number, Attachment>;
  private currentIdeaId: number;
  private currentNoteId: number;
  private currentAttachmentId: number;
  private uploadsDir: string;

  constructor() {
    this.ideas = new Map();
    this.notes = new Map();
    this.attachments = new Map();
    this.currentIdeaId = 1;
    this.currentNoteId = 1;
    this.currentAttachmentId = 1;
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }

  async getIdeas(): Promise<IdeaWithDetails[]> {
    const allIdeas = Array.from(this.ideas.values());
    const ideasWithDetails: IdeaWithDetails[] = [];
    
    for (const idea of allIdeas) {
      const ideaNotes = await this.getNotes(idea.id);
      const ideaAttachments = await this.getAttachments(idea.id);
      ideasWithDetails.push({
        ...idea,
        notes: ideaNotes,
        attachments: ideaAttachments,
      });
    }
    
    // Sort by votes descending
    return ideasWithDetails.sort((a, b) => b.votes - a.votes);
  }

  async getIdea(id: number): Promise<IdeaWithDetails | undefined> {
    const idea = this.ideas.get(id);
    if (!idea) return undefined;
    
    const ideaNotes = await this.getNotes(id);
    const ideaAttachments = await this.getAttachments(id);
    
    return {
      ...idea,
      notes: ideaNotes,
      attachments: ideaAttachments,
    };
  }

  async createIdea(insertIdea: InsertIdea): Promise<Idea> {
    const id = this.currentIdeaId++;
    const idea: Idea = {
      ...insertIdea,
      id,
      votes: 0,
      createdAt: new Date(),
    };
    this.ideas.set(id, idea);
    return idea;
  }

  async updateIdeaVotes(id: number, votes: number): Promise<Idea | undefined> {
    const idea = this.ideas.get(id);
    if (!idea) return undefined;
    
    const updatedIdea = { ...idea, votes };
    this.ideas.set(id, updatedIdea);
    return updatedIdea;
  }

  async addNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = {
      ...insertNote,
      id,
      createdAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async getNotes(ideaId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter(note => note.ideaId === ideaId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async addAttachment(insertAttachment: InsertAttachment): Promise<Attachment> {
    const id = this.currentAttachmentId++;
    const attachment: Attachment = {
      ...insertAttachment,
      id,
      createdAt: new Date(),
    };
    this.attachments.set(id, attachment);
    return attachment;
  }

  async getAttachments(ideaId: number): Promise<Attachment[]> {
    return Array.from(this.attachments.values())
      .filter(attachment => attachment.ideaId === ideaId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getAttachment(id: number): Promise<Attachment | undefined> {
    return this.attachments.get(id);
  }

  async getStats(): Promise<{
    totalIdeas: number;
    totalVotes: number;
    thisWeek: number;
    topIdea: { votes: number } | null;
  }> {
    const allIdeas = Array.from(this.ideas.values());
    const totalIdeas = allIdeas.length;
    const totalVotes = allIdeas.reduce((sum, idea) => sum + idea.votes, 0);
    
    // Count ideas from this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = allIdeas.filter(idea => idea.createdAt >= weekAgo).length;
    
    // Find top idea by votes
    const topIdea = allIdeas.length > 0 
      ? allIdeas.reduce((max, idea) => idea.votes > max.votes ? idea : max)
      : null;
    
    return {
      totalIdeas,
      totalVotes,
      thisWeek,
      topIdea: topIdea ? { votes: topIdea.votes } : null,
    };
  }
}

export const storage = new MemStorage();
