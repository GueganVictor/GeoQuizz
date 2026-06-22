// IndexedDB persistence for the append-only review log (DESIGN §7). The log is the
// single source of truth; card state is never stored, only replayed. Raw IndexedDB
// (no dependency) — the schema is one autoincrementing object store.

import type { ReviewEvent } from './types'

const DB_NAME = 'geoquizz'
// v2 (Slice 6): add the `uid` dedup index and backfill uids onto any pre-existing
// events so an upgraded local log can sync to the cloud.
const DB_VERSION = 2
const STORE = 'reviewLog'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      const db = req.result
      let store: IDBObjectStore
      if (!db.objectStoreNames.contains(STORE)) {
        // `seq` autoincrement key defines the canonical local append order.
        store = db.createObjectStore(STORE, { keyPath: 'seq', autoIncrement: true })
        store.createIndex('cardId', 'cardId', { unique: false })
        store.createIndex('ts', 'ts', { unique: false })
      } else {
        store = req.transaction!.objectStore(STORE)
      }
      if (e.oldVersion < 2) {
        store.createIndex('uid', 'uid', { unique: true })
        // Backfill: stamp a uid on any event written before v2.
        store.openCursor().onsuccess = (ev) => {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue | null>).result
          if (!cursor) return
          const value = cursor.value as ReviewEvent
          if (!value.uid) {
            value.uid = crypto.randomUUID()
            cursor.update(value)
          }
          cursor.continue()
        }
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

/**
 * Merge pulled remote events into the local log, skipping any `uid` already present
 * (append-only, conflict-free per DESIGN §7). Returns the events actually inserted,
 * each stamped with its new local `seq`, so the store can fold them into memory.
 */
export async function mergeEvents(incoming: ReviewEvent[]): Promise<ReviewEvent[]> {
  if (incoming.length === 0) return []
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const store = tx(db, 'readwrite')
    const uidIndex = store.index('uid')
    const inserted: ReviewEvent[] = []
    let pending = incoming.length
    for (const event of incoming) {
      uidIndex.getKey(event.uid).onsuccess = (e) => {
        const exists = (e.target as IDBRequest<IDBValidKey | undefined>).result !== undefined
        if (exists) {
          if (--pending === 0) resolve(inserted)
          return
        }
        const { seq: _seq, ...payload } = event
        const add = store.add(payload)
        add.onsuccess = () => {
          inserted.push({ ...event, seq: add.result as number })
          if (--pending === 0) resolve(inserted)
        }
        add.onerror = () => reject(add.error)
      }
    }
    store.transaction.onerror = () => reject(store.transaction.error)
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
