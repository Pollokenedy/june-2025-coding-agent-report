import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import IdeaCollector from "../../app/page"
import jest from "jest"

// Mock the toast hook
jest.mock("../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock fetch globally
global.fetch = jest.fn()

describe("IdeaCollector", () => {
  beforeEach(() => {
    ;(global.fetch as jest.Mock).mockClear()
  })

  it("renders the main heading", () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ideas: [] }),
    })

    render(<IdeaCollector />)
    expect(screen.getByText("Idea Collector")).toBeInTheDocument()
  })

  it("displays empty state when no ideas exist", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ideas: [] }),
    })

    render(<IdeaCollector />)

    await waitFor(() => {
      expect(screen.getByText("No ideas yet. Create your first idea above!")).toBeInTheDocument()
    })
  })

  it("displays ideas when they exist", async () => {
    const mockIdeas = [
      {
        id: "1",
        title: "Test Idea",
        description: "Test Description",
        votes: 5,
        notes: "Test notes",
        files: [],
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    ](global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ideas: mockIdeas }),
    })

    render(<IdeaCollector />)

    await waitFor(() => {
      expect(screen.getByText("Test Idea")).toBeInTheDocument()
      expect(screen.getByText("Test Description")).toBeInTheDocument()
      expect(screen.getByText("5")).toBeInTheDocument()
    })
  })

  it("creates a new idea when form is submitted", async () => {
    // Mock initial fetch
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: [] }),
      })(
        // Mock create idea
        global.fetch as jest.Mock,
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ idea: { id: "1", title: "New Idea" } }),
      })(
        // Mock refresh fetch
        global.fetch as jest.Mock,
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: [{ id: "1", title: "New Idea", votes: 0 }] }),
      })

    render(<IdeaCollector />)

    const titleInput = screen.getByPlaceholderText("Idea title...")
    const createButton = screen.getByText("Create Idea")

    fireEvent.change(titleInput, { target: { value: "New Idea" } })
    fireEvent.click(createButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Idea", description: "" }),
      })
    })
  })

  it("votes on an idea", async () => {
    const mockIdeas = [
      {
        id: "1",
        title: "Test Idea",
        description: "Test Description",
        votes: 5,
        notes: "",
        files: [],
        createdAt: "2023-01-01T00:00:00.000Z",
      },
    ](
      // Mock initial fetch
      global.fetch as jest.Mock,
    )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: mockIdeas }),
      })(
        // Mock vote
        global.fetch as jest.Mock,
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ idea: { ...mockIdeas[0], votes: 6 } }),
      })(
        // Mock refresh fetch
        global.fetch as jest.Mock,
      )
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ideas: [{ ...mockIdeas[0], votes: 6 }] }),
      })

    render(<IdeaCollector />)

    await waitFor(() => {
      expect(screen.getByText("Test Idea")).toBeInTheDocument()
    })

    const voteButton = screen.getByText("Vote")
    fireEvent.click(voteButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/ideas/1/vote", {
        method: "POST",
      })
    })
  })
})
