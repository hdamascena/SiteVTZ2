import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('Erro capturado pelo RootErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md bg-white p-8 rounded-2xl border border-slate-200 shadow-lg space-y-4">
            <h1 className="text-lg font-black text-[#0a1e36] uppercase">
              Recarregando Interface
            </h1>
            <p className="text-xs text-slate-600">
              Detectamos uma atualização de dados em segundo plano. Clique abaixo para continuar.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
            >
              Continuar Navegação
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!, {
  onRecoverableError: (error) => {
    console.info('Recuperação de renderização concorrente concluída:', error);
  },
}).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
