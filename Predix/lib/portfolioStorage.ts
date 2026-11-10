import type { Position } from './types'

const STORAGE_KEY_PREFIX = 'solstice_user_positions_'

export interface StoredPosition extends Position {
  wallet?: string
  timestamp?: number
  closedAt?: number
  txSig?: string
}

export function saveUserPosition(wallet: string, position: StoredPosition) {
  if (typeof window === 'undefined' || !wallet) return
  try {
    const key = `${STORAGE_KEY_PREFIX}${wallet}`
    const existing = getUserPositions(wallet)
    const index = existing.findIndex((p) => p.id === position.id)
    if (index >= 0) {
      existing[index] = { ...existing[index], ...position }
    } else {
      existing.unshift(position)
    }
    localStorage.setItem(key, JSON.stringify(existing))
  } catch (err) {
    console.warn('Failed to save user position to storage:', err)
  }
}

export function getUserPositions(wallet: string): StoredPosition[] {
  if (typeof window === 'undefined' || !wallet) return []
  try {
    const key = `${STORAGE_KEY_PREFIX}${wallet}`
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as StoredPosition[]
  } catch (err) {
    console.warn('Failed to get user positions from storage:', err)
    return []
  }
}

export function closeUserPosition(wallet: string, positionId: string, finalStatus: 'resolved-won' | 'resolved-lost') {
  if (typeof window === 'undefined' || !wallet) return
  try {
    const key = `${STORAGE_KEY_PREFIX}${wallet}`
    const existing = getUserPositions(wallet)
    const updated = existing.map((p) => {
      if (p.id === positionId || p.id.startsWith(positionId)) {
        return {
          ...p,
          status: finalStatus,
          closedAt: Date.now(),
        }
      }
      return p
    })
    localStorage.setItem(key, JSON.stringify(updated))
  } catch (err) {
    console.warn('Failed to update closed position:', err)
  }
}
