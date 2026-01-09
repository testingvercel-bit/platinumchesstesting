import { Resend } from 'resend';

// Use a placeholder if the API key is missing during build time
// This allows the build to pass, but email sending will fail at runtime if the key is invalid
export const resend = new Resend(process.env.RESEND_API_KEY || 're_123');

export const getSenderEmail = () => {
  let fromEnv = process.env.RESEND_FROM_EMAIL;
  
  // Strip surrounding quotes if present
  if (fromEnv && (fromEnv.startsWith('"') && fromEnv.endsWith('"') || fromEnv.startsWith("'") && fromEnv.endsWith("'"))) {
    fromEnv = fromEnv.slice(1, -1);
  }

  // Basic validation to check if it looks like "Name <email>" or just "email"
  // If env var is set but invalid (e.g. just "PlatinumChess"), fall back to default
  if (fromEnv && (fromEnv.includes('<') && fromEnv.includes('@') || fromEnv.includes('@'))) {
    return fromEnv;
  }
  
  return 'PlatinumChess <onboarding@resend.dev>';
};
