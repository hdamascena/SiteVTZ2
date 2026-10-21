import React, { useState } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Shield,
  FileCheck2,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import { VitalizarProject } from '../types/index.ts';
import { useClubData } from '../context/ClubDataContext.tsx';

interface DirectEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VitalizarProject | null;
}

export const DirectEnrollmentModal: React.FC<DirectEnrollmentModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const { addRsvp, showToast } = useClubData();
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState<number>(12);
  const [responsibleName, setResponsibleName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [turn, setTurn] = useState<'matutino' | 'vespertino'>('matutino');
  const [poloPreference, setPoloPreference] = useState(
    project?.location || 'Polo Central Rio Marinho'
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrollmentProtocol, setEnrollmentProtocol] = useState('');

  if (!isOpen || !project) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim()) return;

    const protocolNum = `VZT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setEnrollmentProtocol(protocolNum);

    const turnLabel = turn === 'matutino' ? 'Manhã' : 'Tarde';
    const detail = responsibleName.trim()
      ? `${studentName.trim()} (${studentAge} anos · Resp: ${responsibleName.trim()} · ${turnLabel})`
      : `${studentName.trim()} (${studentAge} anos · ${turnLabel})`;

    addRsvp({
      eventId: `inscricao-${project.id}`,
      eventTitle: `Inscrição Direta: ${project.name} (${poloPreference})`,
      name: detail,
      phone: phone.trim(),
      spots: 1,
    });

    setIsSuccess(true);
    showToast(`Inscrição realizada com sucesso no ${project.name}! Protocolo: ${protocolNum}`);
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setStudentName('');
    setResponsibleName('');
    setPhone('');
    setEmail('');
    onClose();
  };

  const available = project.availableSpots ?? 20;
  const total = project.totalSpots ?? 100;
  const filled = project.filledSpots ?? (total - available);
  const percentFilled = Math.min(100, Math.round((filled / total) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0284c7] text-white px-6 py-4 flex items-center justify-between border-b border-sky-600">
          <div className="flex items-center gap-3">
            {project.shieldUrl && (
              <img
                src={project.shieldUrl}
                alt="Escudo"
                className="w-8 h-8 object-contain"
              />
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-200 block">
                Cadastro Imediato & Matrícula Gratuita
              </span>
              <h3 className="text-base font-extrabold text-white truncate max-w-xs">
                {project.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-sky-100 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">
              Inscrição Confirmada!
            </h4>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
              <span className="block font-bold">Protocolo de Inscrição:</span>
              <span className="font-mono text-sm font-extrabold text-emerald-900">
                {enrollmentProtocol}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              A vaga para <strong>{studentName}</strong> no projeto{' '}
              <strong>{project.name}</strong> foi pré-reservada gratuitamente.
              Compareça ao polo com documento de identidade e comprovante de frequência escolar para retirar o kit de uniforme oficial.
            </p>
            <div className="pt-2">
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
            {/* Spots Meter Box */}
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-[#0284c7]">
                  <Users className="w-4 h-4" />
                  <span>Vagas Disponíveis em Tempo Real</span>
                </span>
                <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 font-extrabold">
                  {available} vagas abertas
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-[#0284c7] rounded-full transition-all duration-500"
                  style={{ width: `${percentFilled}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{filled} já matriculados</span>
                <span>Capacidade total: {total} vagas</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome Completo do Aluno / Participante *
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Nome do participante"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Idade do Participante *
                  </label>
                  <input
                    type="number"
                    min={4}
                    max={99}
                    required
                    value={studentAge}
                    onChange={(e) => setStudentAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Turno Desejado
                  </label>
                  <select
                    value={turn}
                    onChange={(e) => setTurn(e.target.value as 'matutino' | 'vespertino')}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="matutino">Manhã (08h00 às 10h30)</option>
                    <option value="vespertino">Tarde (14h00 às 16h30)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nome do Responsável Legal (se menor de idade)
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  placeholder="Nome da mãe, pai ou responsável legal"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    WhatsApp / Telefone para Contato *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(27) 99999-9999"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    E-mail do Responsável
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Polo de Treinamento / Atendimento
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={poloPreference}
                    onChange={(e) => setPoloPreference(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Confirmar Inscrição Gratuita</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2">
                As turmas são 100% gratuitas nos termos do Estatuto Social e Marco Regulatório (Lei 13.019/14).
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
