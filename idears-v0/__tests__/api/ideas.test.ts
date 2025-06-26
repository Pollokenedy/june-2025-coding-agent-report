/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server"
import { GET, POST } from "../../app/api/ideas/route"
import { promises as fs } from "fs"
import jest from "jest"

// Mock fs
jest.mock("fs", () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}))

const mockFs = fs as jest.Mocked<typeof fs>

describe("/api/ideas", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should return empty array when no ideas exist", async () => {
      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockRejectedValue(new Error("File not found"))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ideas).toEqual([])
    })

    it("should return sorted ideas by votes", async () => {
      const mockIdeas = [
        { id: "1", title: "Idea 1", votes: 5, createdAt: "2023-01-01" },
        { id: "2", title: "Idea 2", votes: 10, createdAt: "2023-01-02" },
      ]

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockIdeas))

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.ideas).toHaveLength(2)
      expect(data.ideas[0].votes).toBe(10) // Higher votes first
      expect(data.ideas[1].votes).toBe(5)
    })
  })

  describe("POST", () => {
    it("should create a new idea", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: "Test Idea",
          description: "Test Description",
        }),
      } as unknown as NextRequest

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockRejectedValue(new Error("File not found"))
      mockFs.writeFile.mockResolvedValue(undefined)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.idea.title).toBe("Test Idea")
      expect(data.idea.description).toBe("Test Description")
      expect(data.idea.votes).toBe(0)
      expect(mockFs.writeFile).toHaveBeenCalled()
    })

    it("should return error for empty title", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: "",
          description: "Test Description",
        }),
      } as unknown as NextRequest

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe("Title is required")
    })

    it("should trim whitespace from title and description", async () => {
      const mockRequest = {
        json: jest.fn().mockResolvedValue({
          title: "  Test Idea  ",
          description: "  Test Description  ",
        }),
      } as unknown as NextRequest

      mockFs.access.mockResolvedValue(undefined)
      mockFs.readFile.mockRejectedValue(new Error("File not found"))
      mockFs.writeFile.mockResolvedValue(undefined)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(data.idea.title).toBe("Test Idea")
      expect(data.idea.description).toBe("Test Description")
    })
  })
})
