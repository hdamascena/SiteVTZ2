import React, { useState } from 'react';
import {
  X,
  Crosshair,
  Send,
  CheckCircle2,
  Shield,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
} from 'lucide-react';
import { ProjectParticipant } from '../types/index.ts';
import { useClubData } from '../context/ClubDataContext.tsx';

interface ScoutContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: ProjectParticipant | null;
  projectName?: string;
}

export const ScoutContactModal: React.FC<ScoutContactModalProps> = ({
  isOpen,
  onClose,
  player,
  projectName = 'Projeto Vitalizar',
}) => {
  const { addContactMessage, addScoutInquiry, showToast } = useClubData();
  const [scoutName, setScoutName] = useState('');
  const [scoutOrg, setScoutOrg] = useState('');
  const [scoutRole, setScoutRole] = useState('Olheiro / Observador Técnico');
  const [scoutPhone, setScoutPhone] = useState('');
  const [scoutEmail, setScoutEmail] = useState('');
  const [scoutInterest, setScoutInterest] = useState('Avaliação Técnica / Visita ao Polo');
  const [scoutMessage, setScoutMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || !player) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoutName.trim() || !scoutPhone.trim()) return;

    addScoutInquiry({
      scoutName: scoutName.trim(),
      organization: scoutOrg.trim() || 'Observador Independente',
      role: scoutRole,
      phone: scoutPhone.trim(),
      email: scoutEmail.trim() || 'olheiro@contato.com',
      inquiryType: scoutInterest.toLowerCase().includes('relatório')
        ? 'relatorio_atleta'
        : scoutInterest.toLowerCase().includes('parceria')
        ? 'parceria_base'
        : scoutInterest.toLowerCase().includes('visita')
        ? 'visita_treino'
        : 'avaliacao_clube',
      targetPlayerName: `${player.name}${player.nickname ? ` "${player.nickname}"` : ''} (#${player.jerseyNumber})`,
      targetCategory: player.category || 'Base',
      message: scoutMessage.trim() || `Interesse de avaliação: ${scoutInterest}`,
      projectName,
    });

    addContactMessage({
      name: `${scoutName.trim()} (${scoutOrg.trim() || 'Scout Independente'})`,
      email: scoutEmail.trim() || 'olheiro@contato.com',
      phone: scoutPhone.trim(),
      subject: `[SCOUT / OLHEIRO] Avaliação de Atleta: ${player.name} (${player.position})`,
      message: `Atleta: ${player.name} (Camisa #${player.jerseyNumber} · ${player.position} · ${player.category})\nProjeto: ${projectName}\nOrganização / Clube: ${scoutOrg}\nCargo: ${scoutRole}\nInteresse: ${scoutInterest}\n\nObservações do Olheiro:\n${scoutMessage}`,
    });

    setIsSubmitted(true);
    showToast(`Solicitação para avaliação de ${player.nickname || player.name} enviada com sucesso!`);
  };


  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setScoutName('');
    setScoutOrg('');
    setScoutPhone('');
    setScoutEmail('');
    setScoutMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                Canal Oficial de Olheiros & Clubes
              </span>
              <h3 className="text-base font-extrabold text-white">
                Solicitar Avaliação de Atleta
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">
              Solicitação Enviada à Coordenação!
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              A comissão técnica e a diretoria da Associação Esportiva Vitalizar receberam seu interesse na avaliação do atleta{' '}
              <strong>{player.name}</strong> e entrarão em contato em breve via WhatsApp ou e-mail institucional.
            </p>
            <div className="pt-4">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Player Summary Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={player.photoUrl}
                alt={player.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 block">
                  Atleta Selecionado · OVR {player.stats.overall}
                </span>
                <h5 className="font-extrabold text-sm text-slate-900 truncate">
                  {player.name} {player.nickname ? `("${player.nickname}")` : ''}
                </h5>
                <p className="text-xs text-slate-500">
                  Camisa #{player.jerseyNumber} · {player.position} · {player.category}
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome do Olheiro / Avaliador *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={scoutName}
                    onChange={(e) => setScoutName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Clube / Agência / Entidade *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={scoutOrg}
                      onChange={(e) => setScoutOrg(e.target.value)}
                      placeholder="Ex: Desportiva Ferroviária, Cruzeiro, etc."
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Cargo / Função
                  </label>
                  <select
                    value={scoutRole}
                    onChange={(e) => setScoutRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Olheiro / Observador Técnico">Olheiro / Observador Técnico</option>
                    <option value="Coordenador de Base">Coordenador de Base</option>
                    <option value="Treinador de Categoria">Treinador de Categoria</option>
                    <option value="Agente / Representante Licenciado">Agente / Representante Licenciado</option>
                    <option value="Scout de Dados / Análise">Scout de Dados / Análise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp / Telefone para Retorno *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={scoutPhone}
                      onChange={(e) => setScoutPhone(e.target.value)}
                      placeholder="(27) 99999-9999"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={scoutEmail}
                      onChange={(e) => setScoutEmail(e.target.value)}
                      placeholder="scout@clube.com.br"
                      className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Finalidade da Observação
                </label>
                <select
                  value={scoutInterest}
                  onChange={(e) => setScoutInterest(e.target.value)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Avaliação Técnica / Visita ao Polo">Agendamento de Visita Presencial ao Treino</option>
                  <option value="Convite para Período de Testes na Base">Convite para Período de Testes na Base</option>
                  <option value="Solicitação de Histórico de Jogos e Minutagem">Solicitação de Histórico de Jogos e Minutagem</option>
                  <option value="Contato Institucional com a Diretoria Vitalizar">Contato Institucional com a Diretoria</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Mensagem / Observações Específicas
                </label>
                <textarea
                  rows={3}
                  value={scoutMessage}
                  onChange={(e) => setScoutMessage(e.target.value)}
                  placeholder="Informe detalhes sobre as datas pretendidas, perfil de interesse do clube ou dúvidas sobre a liberação técnica..."
                  className="w-full p-3 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 text-amber-400" />
              <span>Enviar Solicitação ao Coordenador</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
