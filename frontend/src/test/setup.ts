import '@testing-library/jest-dom/vitest'

const existingStorage = globalThis.localStorage

if (!existingStorage || typeof existingStorage.clear !== 'function') {
  const values = new Map<string, string>()
  const memoryStorage: Storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, String(value))
    },
    removeItem: key => {
      values.delete(key)
    },
    clear: () => {
      values.clear()
    },
    key: index => Array.from(values.keys())[index] ?? null,
    get length() {
      return values.size
    }
  }

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: memoryStorage
  })
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: memoryStorage
  })
}
