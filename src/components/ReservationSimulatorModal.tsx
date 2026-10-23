import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  CalendarCheck,
  CheckCircle2,
  Users,
  Clock,
  MapPin,
} from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';
import { syncProjectSpotsAndTeams } from '../types/index.ts';

interface ReservationSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReservationSimulatorModal: React.FC<ReservationSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addRsvp, projects } = useClubData();

  const liveProjects = useMemo(
    () => projects.map((p) => syncProjectSpotsAndTeams(p)),
    [projects]
  );

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    liveProjects[0]?.id || 'mais-do-que-esporte-e-vida'
  );
  const selectedProject = useMemo(
    () => liveProjects.find((p) => p.id === selectedProjectId) || liveProjects[0],
    [liveProjects, selectedProjectId]
  );

  const teams = selectedProject?.teams || [];
  const modalities = useMemo(() => {
    if (selectedProject?.modalities && selectedProject.modalities.length > 0) {
      return selectedProject.modalities;
    }
    return Array.from(new Set(teams.map((t) => t.modality).filter(Boolean)));
  }, [selectedProject, teams]);

  const [selectedModality, setSelectedModality] = useState<string>(
    modalities[0] || 'Voleibol'
  );
  const filteredTeams = useMemo(
    () =>
      teams.filter(
        (t) => !selectedModality || t.modality === selectedModality
      ),
    [teams, selectedModality]
  );

  const [selectedTeamId, setSelectedTeamId] = useState<string>(
    filteredTeams[0]?.id || teams[0]?.id || ''
  );

  useEffect(() => {
    if (filteredTeams.length > 0 && !filteredTeams.some((t) => t.id === selectedTeamId)) {
      setSelectedTeamId(filteredTeams[0].id);
    }
  }, [filteredTeams, selectedTeamId]);

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || filteredTeams[0] || teams[0],
    [teams, filteredTeams, selectedTeamId]
  );

  const [participantName, setParticipantName] = useState<string>('');
  const [participantAge, setParticipantAge] = useState<number>(12);
  const [responsibleName, setResponsibleName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [schoolStatus, setSchoolStatus] = useState<string>('Sim, Rede Pública de Cariacica');
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  const handleConfirmEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    const teamLabel = selectedTeam
      ? `${selectedTeam.name} (${selectedTeam.schedule} · ${selectedTeam.polo})`
      : selectedModality;
    const fullNameInfo = responsibleName.trim()
      ? `${participantName.trim()} (${participantAge} anos · Resp: ${responsibleName.trim()})`
      : `${participantName.trim()} (${participantAge} anos)`;

    addRsvp({
      eventId: `inscricao-${selectedProject.id}`,
      eventTitle: `Inscrição no Projeto: ${selectedProject.name}`,
      name: `${fullNameInfo} · ${teamLabel}`,
      phone: phone.trim(),
      notes: `Matrícula escolar: ${schoolStatus}`,
      spots: 1,
      projectId: selectedProject.id,
      teamId: selectedTeam?.id,
      modality: selectedTeam?.modality || selectedModality,
      enrollmentStatus: 'pendente',
      studentName: participantName.trim(),
      studentAge: participantAge,
      responsibleName: responsibleName.trim() || undefined,
      modalityOrClass: teamLabel,
    });
    setIsConfirmed(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a1e36] text-white px-6 py-4 flex items-center justify-between border-b border-sky-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#0284c7] text-white rounded-lg border border-sky-400/40">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wide text-white">
                Inscrição em Projetos, Modalidades e Times • Vitalizar
              </h2>
              <p className="text-xs text-sky-200">
                Pré-matrícula gratuita vinculada diretamente aos Times e Turmas da Associação
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isConfirmed ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-sky-100 text-[#0284c7] rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-[#0a1e36]">
              Pré-Inscrição Confirmada com Sucesso!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              O formulário de <strong>{participantName}</strong> para o{' '}
              <strong>{selectedTeam?.name || selectedModality}</strong> no projeto{' '}
              <strong>{selectedProject?.name}</strong> foi registrado. Nossa equipe entrará em contato via WhatsApp/Telefone.
            </p>

            {selectedTeam && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left text-xs space-y-1">
                <p>• <strong>Projeto:</strong> {selectedProject?.name}</p>
                <p>• <strong>Time / Turma:</strong> {selectedTeam.name} ({selectedTeam.modality})</p>
                <p>• <strong>Horário:</strong> {selectedTeam.schedule}</p>
                <p>• <strong>Local de Treino:</strong> {selectedTeam.polo}</p>
                <p>• <strong>Contato:</strong> {phone}</p>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => {
                  setIsConfirmed(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-[#0a1e36] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#061424] transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmEnrollment} className="p-6 space-y-6">
            {/* Step 1: Project & Modality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0a1e36] uppercase tracking-wider mb-1.5">
                  1. Projeto (Lei de Incentivo):
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {liveProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.availableSpots ?? 300} vagas disp.)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0a1e36] uppercase tracking-wider mb-1.5">
                  2. Modalidade Esportiva:
                </label>
                <div className="flex flex-wrap gap-2">
                  {modalities.map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => setSelectedModality(mod)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedModality === mod
                          ? 'bg-[#0284c7] text-white border-[#0284c7]'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Time / Turma Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#0a1e36] uppercase tracking-wider">
                  3. Selecione o Time / Turma ({selectedModality}):
                </label>
                <span className="text-[10px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded font-bold">
                  {filteredTeams.length} Times disponíveis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                {filteredTeams.map((team) => {
                  const avail =
                    team.availableSpots ??
                    Math.max(0, team.totalSpots - (team.filledSpots || 0));
                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTeamId === team.id
                          ? 'border-[#0284c7] bg-sky-50/70 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-900">
                          {team.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {avail}/{team.totalSpots} vagas
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#0284c7] shrink-0" />
                        <span>{team.schedule}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#0284c7] shrink-0" />
                        <span>{team.polo} · {team.gender} ({team.category})</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Participant details */}
            <div className="border-t border-slate-200 pt-5">
              <label className="block text-xs font-bold text-[#0a1e36] uppercase tracking-wider mb-3">
                4. Dados do Aluno / Participante:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome do Participante *
                  </label>
                  <input
                    type="text"
                    required
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Nome completo do aluno"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Idade do Aluno: <span className="text-[#0284c7] font-bold">{participantAge} anos</span>
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="99"
                    required
                    value={participantAge}
                    onChange={(e) => setParticipantAge(Number(e.target.value))}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Matrícula Escolar Ativa?
                  </label>
                  <select
                    value={schoolStatus}
                    onChange={(e) => setSchoolStatus(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option>Sim, Rede Pública de Cariacica</option>
                    <option>Sim, Rede Estadual / Particular</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Nome do Responsável Legal *
                  </label>
                  <input
                    type="text"
                    required
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                    placeholder="Nome da mãe, pai ou tutor"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Telefone de Contato / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(27) 90000-0000"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-3 text-xs text-sky-900">
              <Users className="w-5 h-5 flex-shrink-0 text-[#0284c7]" />
              <span>
                As turmas e times da Vitalizar contam com uniformes, materiais esportivos e lanche fornecidos gratuitamente aos alunos matriculados.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-3 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer border bg-[#0284c7] hover:bg-[#0369a1] text-white border-sky-300/40"
              >
                Confirmar Pré-Inscrição no Time
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

