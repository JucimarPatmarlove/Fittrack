// @ts-nocheck
import { useState } from 'react';

export const BeginnerGuide = ({ onComplete }: { onComplete: () => void }) => {
  const [step, setStep] = useState(0);

  const guides = [
    {
      title: '🎯 Como usar este app',
      content: (
        <div>
          <p>O FITTRACK foi feito para te ajudar a:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10, lineHeight: 1.6 }}>
            <li>✓ Aprender os exercícios corretamente</li>
            <li>✓ Registar o teu progresso</li>
            <li>✓ Evoluir no teu próprio ritmo</li>
          </ul>
        </div>
      ),
    },
    {
      title: '💪 Como escolher o peso',
      content: (
        <div>
          <p>
            <strong>Regra de ouro para iniciantes:</strong>
          </p>
          <p>Escolhe um peso onde consigas fazer:</p>
          <ul style={{ paddingLeft: 20, marginTop: 10, lineHeight: 1.6 }}>
            <li>• 8-12 repetições com boa forma</li>
            <li>• As últimas 2 repetições devem ser difíceis</li>
            <li>• Se conseguires fazer 15+, aumenta o peso</li>
          </ul>
          <div
            style={{
              background: '#e8c84a22',
              color: '#e8c84a',
              padding: 12,
              borderRadius: 8,
              marginTop: 12,
              fontSize: 14,
            }}
          >
            ⚠️ Lembra-te: A forma correta é mais importante que o peso!
          </div>
        </div>
      ),
    },
    {
      title: '📅 Frequência ideal',
      content: (
        <div>
          <p>
            <strong>Para iniciantes:</strong>
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 10, lineHeight: 1.6 }}>
            <li>• Treina 3-4 vezes por semana</li>
            <li>• Descansa 48h entre treinos do mesmo grupo muscular</li>
            <li>• Dorme 7-8h por noite para recuperação</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#080b0f',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>
          {step === 0 && '🎓'}
          {step === 1 && '💪'}
          {step === 2 && '📅'}
        </div>

        <h2 style={{ color: '#e8c84a', marginBottom: 20 }}>{guides[step].title}</h2>

        <div style={{ textAlign: 'left', marginBottom: 30, color: '#eceae4' }}>
          {guides[step].content}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid #1e2832',
                borderRadius: 8,
                padding: 12,
                color: '#55626e',
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => {
              if (step < guides.length - 1) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
            style={{
              flex: 1,
              background: '#e8c84a',
              border: 'none',
              borderRadius: 8,
              padding: 12,
              color: '#000',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {step === guides.length - 1 ? 'Começar a Treinar!' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};
