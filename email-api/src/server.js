import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { z } from 'zod';

dotenv.config();

const app = express();

app.use(express.json({ limit: '50kb' }));
app.use(morgan('combined'));

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(255),
  body: z.string().min(1).max(10000),
  cc: z.array(z.string().email()).max(20).optional(),
  bcc: z.array(z.string().email()).max(20).optional()
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Trop de requêtes. Réessayez dans une minute.'
  }
});

app.use('/send-email', limiter);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/send-email', async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      status: 'error',
      message: 'Payload invalide.',
      details: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
    });
  }

  const { to, subject, body, cc, bcc } = parsed.data;

  try {
    await transporter.verify();

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      cc,
      bcc,
      subject,
      text: body
    });

    return res.status(200).json({
      status: 'success',
      message: `Email envoyé à ${to}`,
      messageId: info.messageId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(502).json({
      status: 'error',
      message: 'Échec d’envoi de l’email via SMTP.',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route introuvable: ${req.method} ${req.originalUrl}`
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Email API server listening on port ${port}`);
});
