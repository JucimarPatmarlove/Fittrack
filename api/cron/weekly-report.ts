import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Segurança: Garante que este endpoint só é chamado pelo motor interno da Vercel
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Acesso não autorizado ao Motor Cron.' });
  }

  try {
    await resend.emails.send({
      from: 'FitTrack V7 Coach <coach@teudominio.com>',
      to: ['primo@email.com'],
      subject: 'FitTrack V7: Relatório Tático Semanal 🛡️',
      html: `<div style="background-color: #0f172a; color: #ccff00; padding: 20px;">Relatório Tático...</div>`,
    });

    return res.status(200).json({ success: true, message: 'Relatórios disparados.' });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao enviar relatórios.' });
  }
}
