/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Absolute origin of the Express API, e.g. https://eileen-api.onrender.com.
   * Leave unset for local development and ngrok so requests stay relative and
   * Vite's proxy handles them.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
