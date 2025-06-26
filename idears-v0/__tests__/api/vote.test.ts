/**
 * @jest-environment node
 */
import type { NextRequest } from "next/server"
import { POST } from "../../app/api/ideas/[id]/vote/route"
import { promises as fs } from "fs"
import jest from "jest"

jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}))

const mockFs = fs as jest.Mocked<typeof fs>

describe("/api/ideas/[id]/vote", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should increment vote count", async () => {
    const mockIdeas = [
      { id: "1", title: "Test Idea", votes: 5 },
      { id: "2", title: "Another Idea", votes: 3 },
    ]

    mockFs.readFile.mockResolvedValue(JSON.stringify(mockIdeas))
    mockFs.writeFile.mockResolvedValue(undefined)

    const mockRequest = {} as NextRequest
    const response = await POST(mockRequest, { params: { id: "1" } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.idea.votes).toBe(6)
    expect(mockFs.writeFile).toHaveBeenCalled()
  })

  it("should return 404 for non-existent idea", async () => {
    const mockIdeas = [{ id: "1", title: "Test Idea", votes: 5 }]

    mockFs.readFile.mockResolvedValue(JSON.stringify(mockIdeas))

    const mockRequest = {} as NextRequest
    const response = await POST(mockRequest, { params: { id: "999" } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe("Idea not found")
  })

  it("should handle file read errors", async () => {
    mockFs.readFile.mockRejectedValue(new Error("File read error"))

    const mockRequest = {} as NextRequest
    const response = await POST(mockRequest, { params: { id: "1" } })

    expect(response.status).toBe(500)
  })
})
