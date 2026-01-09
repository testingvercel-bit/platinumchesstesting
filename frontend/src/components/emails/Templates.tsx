import * as React from 'react';

interface EmailProps {
  username?: string;
  confirmationLink?: string;
}

export const ConfirmationEmail: React.FC<EmailProps> = ({
  confirmationLink,
}) => (
  <div style={{ fontFamily: 'sans-serif', backgroundColor: '#171717', color: '#eaeaea', padding: '40px', borderRadius: '10px' }}>
    <h1 style={{ color: '#ffffff' }}>Welcome to PlatinumChess</h1>
    <p>Please confirm your email address to get started.</p>
    <a
      href={confirmationLink}
      style={{
        display: 'inline-block',
        backgroundColor: '#ffffff',
        color: '#171717',
        padding: '12px 24px',
        borderRadius: '5px',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginTop: '20px',
      }}
    >
      Confirm Email
    </a>
    <p style={{ marginTop: '30px', fontSize: '12px', color: '#888888' }}>
      If you didn&apos;t request this email, you can safely ignore it.
    </p>
  </div>
);

export const WelcomeEmail: React.FC<EmailProps> = ({
  username,
}) => (
  <div style={{ fontFamily: 'sans-serif', backgroundColor: '#171717', color: '#eaeaea', padding: '40px', borderRadius: '10px' }}>
    <h1 style={{ color: '#ffffff' }}>Welcome, {username}!</h1>
    <p>Your profile has been successfully set up.</p>
    <p>You can now deposit funds and join tournaments to start earning.</p>
    <a
      href="https://platinumchess.com/deposit"
      style={{
        display: 'inline-block',
        backgroundColor: '#10b981',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '5px',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginTop: '20px',
      }}
    >
      Deposit Funds
    </a>
  </div>
);
