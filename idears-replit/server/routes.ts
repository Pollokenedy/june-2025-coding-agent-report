import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertIdeaSchema, insertNoteSchema } from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDFs, documents'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all ideas with details
  app.get("/api/ideas", async (req, res) => {
    try {
      const ideas = await storage.getIdeas();
      res.json(ideas);
    } catch (error) {
      console.error('Failed to get ideas:', error);
      res.status(500).json({ message: "Failed to get ideas" });
    }
  });

  // Get single idea with details
  app.get("/api/ideas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      const idea = await storage.getIdea(id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      res.json(idea);
    } catch (error) {
      console.error('Failed to get idea:', error);
      res.status(500).json({ message: "Failed to get idea" });
    }
  });

  // Create new idea with optional file uploads
  app.post("/api/ideas", upload.array('attachments', 10), async (req, res) => {
    try {
      const ideaData = insertIdeaSchema.parse(req.body);
      const idea = await storage.createIdea(ideaData);
      
      // Handle file attachments if any
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          await storage.addAttachment({
            ideaId: idea.id,
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });
        }
      }
      
      // Return the idea with its details
      const ideaWithDetails = await storage.getIdea(idea.id);
      res.status(201).json(ideaWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid idea data", errors: error.errors });
      }
      console.error('Failed to create idea:', error);
      res.status(500).json({ message: "Failed to create idea" });
    }
  });

  // Vote on an idea (upvote)
  app.post("/api/ideas/:id/vote", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      const idea = await storage.getIdea(id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const updatedIdea = await storage.updateIdeaVotes(id, idea.votes + 1);
      res.json(updatedIdea);
    } catch (error) {
      console.error('Failed to vote on idea:', error);
      res.status(500).json({ message: "Failed to vote on idea" });
    }
  });

  // Downvote an idea
  app.post("/api/ideas/:id/downvote", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      const idea = await storage.getIdea(id);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const newVotes = Math.max(0, idea.votes - 1); // Don't go below 0
      const updatedIdea = await storage.updateIdeaVotes(id, newVotes);
      res.json(updatedIdea);
    } catch (error) {
      console.error('Failed to downvote idea:', error);
      res.status(500).json({ message: "Failed to downvote idea" });
    }
  });

  // Add note to an idea
  app.post("/api/ideas/:id/notes", async (req, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      if (isNaN(ideaId)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      const idea = await storage.getIdea(ideaId);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const noteData = insertNoteSchema.parse({ ...req.body, ideaId });
      const note = await storage.addNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid note data", errors: error.errors });
      }
      console.error('Failed to add note:', error);
      res.status(500).json({ message: "Failed to add note" });
    }
  });

  // Add attachments to an idea
  app.post("/api/ideas/:id/attachments", upload.array('files', 10), async (req, res) => {
    try {
      const ideaId = parseInt(req.params.id);
      if (isNaN(ideaId)) {
        return res.status(400).json({ message: "Invalid idea ID" });
      }
      
      const idea = await storage.getIdea(ideaId);
      if (!idea) {
        return res.status(404).json({ message: "Idea not found" });
      }
      
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files provided" });
      }
      
      const attachments = [];
      for (const file of files) {
        const attachment = await storage.addAttachment({
          ideaId,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        });
        attachments.push(attachment);
      }
      
      res.status(201).json(attachments);
    } catch (error) {
      console.error('Failed to add attachments:', error);
      res.status(500).json({ message: "Failed to add attachments" });
    }
  });

  // Download attachment
  app.get("/api/attachments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attachment ID" });
      }
      
      const attachment = await storage.getAttachment(id);
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }
      
      const filePath = path.join(uploadsDir, attachment.filename);
      res.download(filePath, attachment.originalName);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      res.status(500).json({ message: "Failed to download attachment" });
    }
  });

  // Get stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get stats:', error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
