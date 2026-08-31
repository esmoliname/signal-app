import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock the API module before importing the store.
vi.mock('../services/api.js', () => ({
  fetchHistory: vi.fn(),
  deleteHistoryItem: vi.fn(),
  renameHistoryItem: vi.fn(),
}))

import { useHistoryStore } from '../stores/historyStore'
import {
  fetchHistory,
  deleteHistoryItem,
  renameHistoryItem,
} from '../services/api.js'

const sampleHistory = [
  { id: '1', topic: 'webgpu', title: 'webgpu' },
  { id: '2', topic: 'rust', title: 'rust' },
]

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  fetchHistory.mockResolvedValue(sampleHistory)
  deleteHistoryItem.mockResolvedValue(true)
  renameHistoryItem.mockResolvedValue({ id: '1', topic: 'new title', title: 'new title' })
})

describe('historyStore', () => {
  it('loadHistory populates historyList', async () => {
    const store = useHistoryStore()
    await store.loadHistory()
    expect(fetchHistory).toHaveBeenCalled()
    expect(store.historyList).toHaveLength(2)
    expect(store.historyList[0].id).toBe('1')
  })

  it('removeTask removes item and clears activeTaskId', async () => {
    const store = useHistoryStore()
    await store.loadHistory()
    store.activeTaskId = '1'

    const ok = await store.removeTask('1')

    expect(ok).toBe(true)
    expect(deleteHistoryItem).toHaveBeenCalledWith('1')
    expect(store.historyList.map(i => i.id)).toEqual(['2'])
    expect(store.activeTaskId).toBeNull()
  })

  it('updateTitle updates the matching item in place', async () => {
    const store = useHistoryStore()
    await store.loadHistory()

    const ok = await store.updateTitle('1', 'new title')

    expect(ok).toBe(true)
    expect(renameHistoryItem).toHaveBeenCalledWith('1', 'new title')
    const item = store.historyList.find(i => i.id === '1')
    expect(item.title).toBe('new title')
    expect(item.topic).toBe('new title')
  })

  it('removeTask returns false and logs error on failure', async () => {
    deleteHistoryItem.mockRejectedValue(new Error('boom'))
    const store = useHistoryStore()
    await store.loadHistory()
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ok = await store.removeTask('1')
    expect(ok).toBe(false)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
