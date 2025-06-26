"use client"

import "@testing-library/jest-dom"
import { jest } from "@jest/globals"
import { beforeEach } from "@jest/globals"

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ""
  },
}))

// Mock fetch
global.fetch = jest.fn()

beforeEach(() => {
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})
