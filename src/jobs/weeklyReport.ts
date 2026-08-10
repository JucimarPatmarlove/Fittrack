// @ts-ignore
import cron from 'node-cron';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

export const startWeeklyReportJob = () => {
  // Corre todos os domingos às 20h00
  cron.schedule('0 20 * * 0', async () => {
    console.log('[Cron Job] A preparar o relatório tático semanal...');

    try {
      // No futuro, podes extrair as métricas reais do utilizador da base de dados aqui
      const xpGained = 1250;
      const workoutsCompleted = 4;

      await resend.emails.send({
        from: 'FitTrack V7 Coach <coach@teudominio.com>', // Precisarás de verificar um domínio no Resend
        to: ['primo@email.com'], // E-mail de destino
        subject: 'FitTrack V7: Relatório Tático Semanal 🛡️',
        html: `
          <div style="font-family: monospace; background-color: #0f172a; color: #38bdf8; padding: 20px; border-radius: 8px;">
            <h2 style="color: #ccff00;">RELATÓRIO TÁTICO CONCLUÍDO</h2>
            <p>Atleta, aqui está a tua telemetria da semana:</p>
            <ul>
              <li><strong>Missões Cumpridas:</strong> ${workoutsCompleted}</li>
              <li><strong>Experiência Adquirida:</strong> ${xpGained} XP</li>
            </ul>
            <p>A matriz de prontidão indica que o teu descanso está otimizado. Prepara-te para a próxima semana.</p>
          </div>
        `,
      });

      console.log('[Cron Job] Relatório semanal disparado com sucesso.');
    } catch (error) {
      console.error('[Cron Job] Falha ao enviar relatório tático:', error);
    }
  });

  console.log('[Cron Job] Sistema de relatórios semanais ativado.');
};
