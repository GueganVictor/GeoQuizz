// IndexedDB persistence for the append-only review log (DESIGN §7). The log is the
// single source of truth; card state is never stored, only replayed. Raw IndexedDB
// (no dependency) — the schema is one autoincrementing object store.

import type { ReviewEvent } from './types'

const DB_NAME = 'geoquizz'
const DB_VERSION = 1
const STORE = 'reviewLog'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        // `seq` autoincrement key defines the canonical append order.
        const store = db.createObjectStore(STORE, { keyPath: 'seq', autoIncrement: true })
        store.createIndex('cardId', 'cardId', { unique: false })
        store.createIndex('ts', 'ts', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx(db: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
  return db.transaction(STORE, mode).objectStore(STORE)
}

/** Append one event. Resolves with the assigned `seq` (write order key). */
export async function appendEvent(event: ReviewEvent): Promise<number> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    // Never carry a seq into the write — let IndexedDB assign it (append-only).
    const { seq: _seq, ...payload } = event
    const req = tx(db, 'readwrite').add(payload)
    req.onsuccess = () => resolve(req.result as number)
    req.onerror = () => reject(req.error)
  })
}

/** Read the entire log in append order. */
export async function allEvents(): Promise<ReviewEvent[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readonly').getAll()
    req.onsuccess = () => resolve(req.result as ReviewEvent[])
    req.onerror = () => reject(req.error)
  })
}

/** Wipe the log (test/dev reset only). */
export async function clearLog(): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = tx(db, 'readwrite').clear()
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}
