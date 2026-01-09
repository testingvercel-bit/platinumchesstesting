function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function confirmationEmailHtml(confirmationLink: string) {
  const safeLink = escapeHtml(confirmationLink);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirm your PlatinumChess account</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;">
    <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#171717;color:#eaeaea;padding:40px;border-radius:10px;">
        <h1 style="margin:0 0 12px;color:#ffffff;font-size:24px;line-height:1.2;">Welcome to PlatinumChess</h1>
        <p style="margin:0 0 20px;line-height:1.6;">Please confirm your email address to get started.</p>
        <a href="${safeLink}" style="display:inline-block;background:#ffffff;color:#171717;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700;">Confirm Email</a>
        <p style="margin-top:28px;font-size:12px;color:#9a9a9a;line-height:1.6;">
          If you didn&apos;t request this email, you can safely ignore it.
        </p>
      </div>
    </div>
  </body>
</html>`;
}

export function welcomeEmailHtml(username: string) {
  const safeUsername = escapeHtml(username);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Welcome to PlatinumChess</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0b;">
    <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#171717;color:#eaeaea;padding:40px;border-radius:10px;">
        <h1 style="margin:0 0 12px;color:#ffffff;font-size:24px;line-height:1.2;">Welcome, ${safeUsername}!</h1>
        <p style="margin:0 0 10px;line-height:1.6;">Your profile has been successfully set up.</p>
        <p style="margin:0 0 20px;line-height:1.6;">You can now deposit funds and join tournaments to start earning.</p>
        <a href="https://platinumchess.com/deposit" style="display:inline-block;background:#10b981;color:#ffffff;padding:12px 18px;border-radius:6px;text-decoration:none;font-weight:700;">Deposit Funds</a>
      </div>
    </div>
  </body>
</html>`;
}

