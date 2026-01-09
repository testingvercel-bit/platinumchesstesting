import { Resend } from 'resend';

// Use a placeholder if the API key is missing during build time
// This allows the build to pass, but email sending will fail at runtime if the key is invalid
export const resend = new Resend(process.env.RESEND_API_KEY || 're_123');
