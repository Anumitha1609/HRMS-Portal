# HRMS Node Backend (replaces EmailJS)

Small Express + Nodemailer backend that sends real payslip emails from the
HRMS Angular app's "Send Mail" button, replacing the browser-side EmailJS
call in `salary-generation.component.ts`. No database — mirrors the pattern
used everywhere else in the app (localStorage for persistence).

## Setup

```bash
cd node-backend
npm install
cp .env.example .env
```

Edit `.env`:
- `EMAIL_USER` — your sending Gmail address
- `EMAIL_PASS` — a Gmail **App Password** (not your normal password). Turn on
  2-Step Verification, then Google Account → Security → App Passwords →
  generate one for "Mail".
- `HRMS_PORTAL_URL` — where the "View / Download Full Payslip" link should
  point (defaults to `http://localhost:4200` for dev).

## Run

```bash
npm run dev     # auto-restart on changes
# or
npm start
```

You should see: `HRMS mail backend running on http://localhost:3000`

## Test it standalone (before touching Angular)

```bash
curl -X POST http://localhost:3000/api/send-mail \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"test@example.com\",\"subject\":\"Test\",\"message\":\"Hello from Nodemailer\"}"
```

Expect `{"success":true,"message":"Mail sent successfully"}`.

## API

### `POST /api/send-mail`
Two ways to call it:

**Plain text:**
```json
{ "to": "a@b.com", "subject": "Hi", "message": "Hello" }
```

**Structured payslip (what the Angular app sends):**
```json
{
  "to": "a@b.com",
  "subject": "Your Payslip - June 2026",
  "payslip": {
    "to_name": "Saravanan T", "emp_code": "EMP009", "designation": "...",
    "net_pay": "31300.00", "payslip_link": "http://localhost:4200/...", "...": "..."
  }
}
```
The server renders this into a formatted HTML payslip email
(`src/templates/payslip-email.js`) — no external template service needed.

Optional PDF attachment: add `"pdfBase64": "<base64 string>"` and
`"pdfFileName": "PaySlip_EMP009.pdf"` to attach the file directly instead of
only linking to the portal.

### `POST /api/save`
Stub endpoint kept for parity with the general Save/Send-Mail pattern;
not currently wired to any button.
