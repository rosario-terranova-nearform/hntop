import '@testing-library/jest-dom/vitest'

// jsdom has no IntersectionObserver; StoryList's infinite scroll needs a stub.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-expect-error partial stub, sufficient for tests
globalThis.IntersectionObserver = IntersectionObserverStub

// Keep the localStorage-backed range preference isolated between tests.
afterEach(() => localStorage.clear())
