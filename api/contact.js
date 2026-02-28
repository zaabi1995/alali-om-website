'use strict';

const express = require('express');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = 3458;

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Trust proxy (nginx sits in front)
app.set('trust proxy', 1);

// Rate limiting: max 5 per IP per hour
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many submissions. Please try again later.' }
});

// Email routing — no addresses in HTML
const DEPARTMENT_ROUTES = {
  'General Inquiry': 'info@alali.om',
  'Request for Quotation': 'rfq@alali.om',
  'Tender & Bidding': 'bid@alali.om',
  'Careers': 'cv@alali.om',
};

const CC_ADDRESS = 'ali@alali.om';
const FROM_ADDRESS = 'no-reply@alali.om';

// Nodemailer via localhost Postfix
const transporter = nodemailer.createTransport({
  host: '127.0.0.1',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
});

// Validate email
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Sanitize input
function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\r\n]/g, ' ').substring(0, 2000).trim();
}

app.post('/api/contact', limiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message, honeypot } = req.body;

    // Honeypot spam check (hidden field — bots fill it, humans don't)
    if (honeypot && honeypot.trim() !== '') {
      return res.status(200).json({ success: true });  // Silently succeed
    }

    // Validate required fields
    const cleanName    = sanitize(name);
    const cleanEmail   = sanitize(email);
    const cleanPhone   = sanitize(phone || '');
    const cleanSubject = sanitize(subject);
    const cleanMsg     = sanitize(message);

    if (!cleanName || !cleanEmail || !cleanSubject || !cleanMsg) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email address.' });
    }
    if (!DEPARTMENT_ROUTES[cleanSubject]) {
      return res.status(400).json({ success: false, error: 'Invalid subject selection.' });
    }

    const toAddress = DEPARTMENT_ROUTES[cleanSubject];
    const emailSubject = `[alali.om Contact] ${cleanSubject} — ${cleanName}`;

    const textBody = `New contact form submission from alali.om:

Name:    ${cleanName}
Email:   ${cleanEmail}
Phone:   ${cleanPhone || 'Not provided'}
Subject: ${cleanSubject}

Message:
${cleanMsg}

---
Submitted from alali.om contact form
IP: ${req.ip}`;

    const htmlBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
  <div style="background:#034d57;padding:20px 24px;border-radius:8px 8px 0 0">
    <h2 style="color:#fff;margin:0;font-size:18px">New Contact Form Submission</h2>
    <p style="color:rgba(255,255,255,.7);margin:4px 0 0;font-size:13px">alali.om</p>
  </div>
  <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e5e5;border-top:none">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#666;font-size:13px;width:120px;vertical-align:top"><strong>Name</strong></td><td style="padding:8px 0;color:#222;font-size:14px">${cleanName}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top"><strong>Email</strong></td><td style="padding:8px 0;color:#222;font-size:14px"><a href="mailto:${cleanEmail}">${cleanEmail}</a></td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top"><strong>Phone</strong></td><td style="padding:8px 0;color:#222;font-size:14px">${cleanPhone || 'Not provided'}</td></tr>
      <tr><td style="padding:8px 0;color:#666;font-size:13px;vertical-align:top"><strong>Subject</strong></td><td style="padding:8px 0;color:#034d57;font-size:14px;font-weight:bold">${cleanSubject}</td></tr>
    </table>
    <div style="margin-top:16px;padding:16px;background:#fff;border-radius:6px;border:1px solid #e5e5e5">
      <p style="margin:0 0 8px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:.5px">Message</p>
      <p style="margin:0;color:#222;font-size:14px;white-space:pre-wrap">${cleanMsg}</p>
    </div>
  </div>
  <div style="background:#f0f0f0;padding:12px 24px;border-radius:0 0 8px 8px;font-size:11px;color:#999;border:1px solid #e5e5e5;border-top:none">
    Submitted from alali.om contact form &bull; IP: ${req.ip}
  </div>
</div>`;

    await transporter.sendMail({
      from:     `"Alali Investment" <${FROM_ADDRESS}>`,
      to:       toAddress,
      cc:       CC_ADDRESS,
      replyTo:  cleanEmail,
      subject:  emailSubject,
      text:     textBody,
      html:     htmlBody,
    });

    return res.status(200).json({ success: true, message: 'Message sent successfully.' });

  } catch (err) {
    console.error('[contact-form] Error:', err.message);
    return res.status(500).json({ success: false, error: 'Server error. Please try again later.' });
  }
});

// Health check
app.get('/api/contact', (req, res) => {
  res.json({ status: 'ok', service: 'contact-form' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Contact form API running on http://127.0.0.1:${PORT}`);
});
