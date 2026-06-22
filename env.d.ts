/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (Slice 6). Empty when cloud sync isn't configured. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon/public key (Slice 6). */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'world-atlas/*.json' {
  const value: import('topojson-specification').Topology
  export default value
}
