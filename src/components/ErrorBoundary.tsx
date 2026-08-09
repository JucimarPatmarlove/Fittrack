import * as Sentry from '@sentry/react';
import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          react: { componentStack: info.componentStack },
        },
      });
    } else {
      console.error('ErrorBoundary caught', error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#080b0f',
            color: '#fff',
            padding: 20,
          }}
        >
          <div style={{ maxWidth: 680, textAlign: 'center' }}>
            <h2 style={{ marginBottom: 8 }}>Ocorreu um erro</h2>
            <p style={{ color: '#bbb', marginBottom: 18 }}>
              Algo falhou ao tentar carregar esta secção. Fecha e abre novamente ou volta ao ecrã
              principal.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#e8c84a',
                  cursor: 'pointer',
                }}
              >
                Recarregar
              </button>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('NAVIGATE_TO', { detail: 'dashboard' }));
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #666',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Voltar ao Dashboard
              </button>
            </div>
            {this.state.error && (
              <pre
                style={{
                  textAlign: 'left',
                  color: '#888',
                  marginTop: 16,
                  fontSize: 12,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {String(this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
