// dentro POST di notify:
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@spst.it';
if (!RESEND_API_KEY || !EMAIL_FROM || !userEmail) {
  return NextResponse.json({ ok: true, sent: false }, { headers: buildCorsHeaders() });
}

const { Resend } = await import('resend');
const resend = new Resend(RESEND_API_KEY);
await resend.emails.send({ /* ... */ });
