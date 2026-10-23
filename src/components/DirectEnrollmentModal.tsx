import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
} from 'lucide-react';
import { VitalizarProject, syncProjectSpotsAndTeams } from '../types/index.ts';
import { useClubData } from '../context/ClubDataContext.tsx';

interface DirectEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VitalizarProject | null;
  initialTeamId?: string;
}

export const DirectEnrollmentModal: React.FC<DirectEnrollmentModalProps> = ({
  isOpen,
  onClose,
  project,
  initialTeamId,
}) => {
  const { addRsvp, showToast } = useClubData();
  const [studentName, setStudentName] = useState('');
  const [studentAge, setStudentAge] = useState<number>(14);
  const [responsibleName, setResponsibleName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [enrollmentProtocol, setEnrollmentProtocol] = useState('');

  const syncedProject = useMemo(
    () => (project ? syncProjectSpotsAndTeams(project) : null),
    [project]
  );

  const teams = useMemo(() => syncedProject?.teams || [], [syncedProject]);
  const modalities = useMemo(
    () =>
      Array.from(
        new Set([
          ...(syncedProject?.modalities || []),
          ...teams.map((t) => t.modality).filter(Boolean),
        ])
      ),
    [syncedProject, teams]
  );

  const filteredTeams = useMemo(
    () =>
      selectedModality === 'all'
        ? teams
        : teams.filter((t) => t.modality === selectedModality),
    [teams, selectedModality]
  );

  useEffect(() => {
    if (!syncedProject) return;
    if (initialTeamId && teams.some((t) => t.id === initialTeamId)) {
      const target = teams.find((t) => t.id === initialTeamId)!;
      setSelectedModality(target.modality || 'all');
      setSelectedTeamId(target.id);
    } else if (teams.length > 0) {
      setSelectedModality('all');
      setSelectedTeamId(teams[0].id);
    } else {
      setSelectedTeamId('');
    }
  }, [syncedProject, initialTeamId, teams]);

  useEffect(() => {
    if (
      filteredTeams.length > 0 &&
      !filteredTeams.some((t) => t.id === selectedTeamId)
    ) {
      setSelectedTeamId(filteredTeams[0].id);
    }
  }, [filteredTeams, selectedTeamId]);

  if (!isOpen || !syncedProject) return null;

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !phone.trim()) return;

    const teamLabel = selectedTeam
      ? `${selectedTeam.name} (${selectedTeam.schedule})`
      : syncedProject.name;
    const detail = responsibleName.trim()
      ? `${studentName.trim()} (${studentAge} anos · Resp: ${responsibleName.trim()} · ${teamLabel})`
      : `${studentName.trim()} (${studentAge} anos · ${teamLabel})`;

    const protocolNum = addRsvp({
      eventId: `inscricao-${syncedProject.id}`,
      eventTitle: `Inscrição: ${syncedProject.name} — ${selectedTeam ? selectedTeam.name : 'Geral'}`,
      name: detail,
      phone: phone.trim(),
      email: email.trim() || undefined,
      spots: 1,
      projectId: syncedProject.id,
      teamId: selectedTeam?.id,
      modality: selectedTeam?.modality,
      enrollmentStatus: 'pendente',
      studentName: studentName.trim(),
      studentAge,
      responsibleName: responsibleName.trim() || undefined,
      modalityOrClass: teamLabel,
    });
    setEnrollmentProtocol(protocolNum);

    setIsSuccess(true);
    showToast(
      `Inscrição realizada em ${selectedTeam ? selectedTeam.name : syncedProject.name}! Protocolo: ${protocolNum}`
    );
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setStudentName('');
    setResponsibleName('');
    setPhone('');
    setEmail('');
    onClose();
  };

  const total = selectedTeam ? selectedTeam.totalSpots : syncedProject.totalSpots ?? 100;
  const filled = selectedTeam
    ? selectedTeam.filledSpots ?? 0
    : syncedProject.filledSpots ?? 0;
  const available = Math.max(0, total - filled);
  const percentFilled = Math.min(100, Math.round((filled / Math.max(1, total)) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0284c7] text-white px-6 py-4 flex items-center justify-between border-b border-sky-600">
          <div className="flex items-center gap-3">
            {syncedProject.shieldUrl && (
              <img
                src={syncedProject.shieldUrl}
                alt="Escudo"
                className="w-8 h-8 object-contain"
              />
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-200 block">
                Inscrição em Time / Turma • 100% Gratuito
              </span>
              <h3 className="text-base font-extrabold text-white truncate max-w-xs">
                {syncedProject.name}
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
              Inscrição Registrada!
            </h4>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
              <span className="block font-bold">Protocolo de Inscrição:</span>
              <span className="font-mono text-sm font-extrabold text-emerald-900">
                {enrollmentProtocol}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
              A solicitação de vaga para <strong>{studentName}</strong> em{' '}
              <strong>{selectedTeam ? selectedTeam.name : syncedProject.name}</strong> foi registrada gratuitamente.
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
            {/* Modality & Team Selection */}
            {teams.length > 0 && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                {modalities.length > 1 && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1.5">
                      1. Filtrar por Modalidade Esportiva
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedModality('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                          selectedModality === 'all'
                            ? 'bg-[#0284c7] text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Todas ({teams.length} Times)
                      </button>
                      {modalities.map((mod) => (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => setSelectedModality(mod)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            selectedModality === mod
                              ? 'bg-[#0284c7] text-white'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {mod} ({teams.filter((t) => t.modality === mod).length})
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    2. Escolha o Time / Turma *
                  </label>
                  <select
                    value={selectedTeam?.id || ''}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-300 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {filteredTeams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.availableSpots ?? t.totalSpots} vagas disp. ({t.schedule})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTeam && (
                  <div className="pt-1 space-y-1 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span>
                        <strong>Horário:</strong> {selectedTeam.schedule}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
                      <span>
                        <strong>Local de Treino:</strong> {selectedTeam.polo}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spots Meter Box */}
            <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-[#0284c7]">
                  <Users className="w-4 h-4" />
                  <span>
                    {selectedTeam ? `Vagas no ${selectedTeam.name.split('•')[0].trim()}` : 'Vagas no Projeto'}
                  </span>
                </span>
                <span className="text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 font-extrabold">
                  {available} vagas abertas
                </span>
              </div>

              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-[#0284c7] rounded-full transition-all duration-500"
                  style={{ width: `${percentFilled}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{filled} atletas vinculados neste Time</span>
                <span>Capacidade do Time: {total} vagas</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">
                    Nome Completo do Atleta / Aluno *
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

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Idade *
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={99}
                    required
                    value={studentAge}
                    onChange={(e) => setStudentAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
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
                    WhatsApp / Telefone *
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
                    E-mail
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
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#0284c7] hover:bg-[#0369a1] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Confirmar Inscrição no Time</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
