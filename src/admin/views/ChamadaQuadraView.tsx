import React, { useState, useMemo, useEffect } from 'react';
import { Check, Loader2, Calendar, Users, CheckCircle2 } from 'lucide-react';
import type { AdminUserProfile } from '../types.ts';
import { SeloSensivel } from '../components/CampoTexto.tsx';
import { useClubData } from '../../context/ClubDataContext.tsx';
import type { AttendanceEntry, AttendanceSessionRecord } from '../../types/index.ts';

interface ChamadaQuadraViewProps {
  profile: AdminUserProfile;
  initialProjectId?: string;
}

export const ChamadaQuadraView: React.FC<ChamadaQuadraViewProps> = ({
  profile,
  initialProjectId,
}) => {
  const { projects, siteSettings, saveAdminChanges, recordAuditEvent, showToast } =
    useClubData();

  const allowedProjects = useMemo(() => {
    if (profile.role === 'professor') {
      return projects.filter((p) => (profile.projectIds || []).includes(p.id));
    }
    return projects;
  }, [projects, profile.role, profile.projectIds]);

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjectId || allowedProjects[0]?.id || ''
  );
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [classTopic, setClassTopic] = useState<string>(
    'Treinamento Técnico & Cidadania'
  );
  const [statuses, setStatuses] = useState<
    Record<string, 'presente' | 'falta' | 'justificada'>
  >({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const currentProject = useMemo(
    () =>
      allowedProjects.find((p) => p.id === selectedProjectId) ||
      allowedProjects[0] ||
      null,
    [allowedProjects, selectedProjectId]
  );

  const participants = useMemo(
    () =>
      (currentProject?.participants || []).filter(
        (p) => (p.enrollmentStatus || 'ativo') === 'ativo'
      ),
    [currentProject]
  );

  // Initialize all active participants as 'presente' when switching project
  useEffect(() => {
    const next: Record<string, 'presente' | 'falta' | 'justificada'> = {};
    participants.forEach((pt) => {
      next[pt.id] = 'presente';
    });
    setStatuses(next);
    setSaveState('idle');
  }, [currentProject?.id, participants.length]);

  const handleSetStatus = (
    participantId: string,
    status: 'presente' | 'falta' | 'justificada'
  ) => {
    setStatuses((prev) => ({ ...prev, [participantId]: status }));
    setSaveState('idle');
  };

  const handleSaveAttendance = () => {
    if (!currentProject) return;
    setSaveState('saving');

    const entries: AttendanceEntry[] = participants.map((pt) => ({
      participantId: pt.id,
      participantName: pt.name,
      category: pt.category,
      status: statuses[pt.id] || 'presente',
    }));

    const newSession: AttendanceSessionRecord = {
      id: `chamada-${currentProject.id}-${sessionDate}-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      date: sessionDate,
      classTopic: classTopic.trim() || 'Aula Regular',
      coordinator: profile.nome || currentProject.coordinator,
      entries,
      createdAt: new Date().toLocaleString('pt-BR'),
    };

    const existingSessions = siteSettings.attendanceSessions || [];
    const updatedSessions = [newSession, ...existingSessions];

    saveAdminChanges({
      siteSettings: {
        ...siteSettings,
        attendanceSessions: updatedSessions,
      },
      toastMessage: `Chamada de "${currentProject.name}" salva com sucesso!`,
      logDetails: `Chamada registrada em ${currentProject.name} (${entries.length} alunos).`,
    });

    recordAuditEvent({
      action: 'CHAMADA_REGISTRADA',
      collection: 'attendance_sessions',
      itemId: newSession.id,
      role: profile.role,
      afterSummary: `${currentProject.name} (${sessionDate}): ${
        entries.filter((e) => e.status === 'presente').length
      } presentes, ${entries.filter((e) => e.status === 'falta').length} faltas`,
    });

    setTimeout(() => {
      setSaveState('saved');
    }, 300);
  };

  const counts = useMemo(() => {
    let presente = 0;
    let falta = 0;
    let justificada = 0;
    participants.forEach((p) => {
      const st = statuses[p.id] || 'presente';
      if (st === 'presente') presente += 1;
      else if (st === 'falta') falta += 1;
      else justificada += 1;
    });
    return { presente, falta, justificada };
  }, [participants, statuses]);

  const recentSessions = useMemo(
    () =>
      (siteSettings.attendanceSessions || [])
        .filter((s) => !currentProject || s.projectId === currentProject.id)
        .slice(0, 6),
    [siteSettings.attendanceSessions, currentProject]
  );

  if (allowedProjects.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-xs text-slate-500">
        Nenhuma turma vinculada ao seu perfil para realização de chamada.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Chamada Rápida na Quadra
              </h2>
              <SeloSensivel level="sensível" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Toque em Presente, Falta ou Justificada e salve com um toque.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              P: {counts.presente}
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              F: {counts.falta}
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              J: {counts.justificada}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Turma / Projeto
            </label>
            <select
              value={currentProject?.id || ''}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
            >
              {allowedProjects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Data da Aula
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Tema / Atividade
            </label>
            <input
              type="text"
              value={classTopic}
              onChange={(e) => setClassTopic(e.target.value)}
              placeholder="Ex.: Fundamentos e Coletivo"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Mobile-First Student Rows (1 student per row, large touch buttons) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {participants.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Nenhum aluno ativo cadastrado nesta turma.
          </div>
        ) : (
          participants.map((pt, index) => {
            const st = statuses[pt.id] || 'presente';
            return (
              <div
                key={pt.id}
                className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-mono text-slate-400 tabular-nums shrink-0">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <img
                    src={pt.photoUrl}
                    alt={pt.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {pt.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {pt.category} · Camisa #{pt.jerseyNumber}
                    </p>
                  </div>
                </div>

                {/* Large Court-Side Touch Buttons (min-h 44px for mobile) */}
                <div className="grid grid-cols-3 gap-2 sm:w-80 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(pt.id, 'presente')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      st === 'presente'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    Presente
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(pt.id, 'falta')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      st === 'falta'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50'
                    }`}
                  >
                    Falta
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(pt.id, 'justificada')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-extrabold transition-colors cursor-pointer ${
                      st === 'justificada'
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50'
                    }`}
                  >
                    Justificada
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* One-Tap Sticky Save Bar */}
      {participants.length > 0 && (
        <div className="sticky bottom-4 bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-4">
          <div className="text-xs">
            <span className="font-bold block">{currentProject?.name}</span>
            <span className="text-slate-400 font-mono tabular-nums">
              {counts.presente} presentes · {counts.falta} faltas · {counts.justificada} justificadas
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAttendance}
            disabled={saveState === 'saving'}
            className="min-h-[44px] px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase tracking-wider rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 shrink-0"
          >
            {saveState === 'saving' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando…</span>
              </>
            ) : saveState === 'saved' ? (
              <>
                <Check className="w-4 h-4" />
                <span>Salvo!</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Chamada</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Recent Sessions History */}
      {recentSessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Histórico Recente de Chamadas desta Turma
          </h3>
          <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {recentSessions.map((sess) => {
              const pres = sess.entries.filter((e) => e.status === 'presente').length;
              const falt = sess.entries.filter((e) => e.status === 'falta').length;
              return (
                <div
                  key={sess.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {sess.date} — {sess.classTopic}
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Resp.: {sess.coordinator}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-300">
                    {pres} pres. / {falt} faltas
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
