/** Vercel serverless request bodies are capped (~4.5MB); multipart overhead needs margin. */
export const MAX_LISTING_UPLOAD_BYTES = 4_000_000;
