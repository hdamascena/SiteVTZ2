import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Download,
  Printer,
  ClipboardCheck,
  Users,
  Search,
  Trash2,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import type {
  VitalizarProject,
  AttendanceSessionRecord,
  AttendanceEntry,
} from '../types/index.ts';

interface AttendanceManagerProps {
  projects: VitalizarProject[];
  attendanceSessions: AttendanceSessionRecord[];
  onSaveSessionAndSyncProjects: (
    updatedSessions: AttendanceSessionRecord[],
    updatedProjects: VitalizarProject[],
    toastMessage: string
  ) => void;
  onNotify: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  projects,
  attendanceSessions,
  onSaveSessionAndSyncProjects,
  onNotify,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || 'escolinha-futsal-base'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [classTopic, setClassTopic] = useState<string>(
    'Treinamento Técnico-Pedagógico & Avaliação de Frequência MROSC'
  );
  const [coordinator, setCoordinator] = useState<string>('');
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [statusMap, setStatusMap] = useState<
    Record<string, 'presente' | 'falta' | 'justificada'>
  >({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [viewingSession, setViewingSession] = useState<AttendanceSessionRecord | null>(
    null
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (activeProject) {
      setCoordinator(activeProject.coordinator || 'Coordenação Técnica Vitalizar');
      const nextStatus: Record<string, 'presente' | 'falta' | 'justificada'> = {};
      (activeProject.participants || []).forEach((part) => {
        nextStatus[part.id] = 'presente';
      });
      setStatusMap(nextStatus);
      setNotesMap({});
    }
  }, [activeProject?.id]);

  const projectParticipants = useMemo(() => {
    if (!activeProject) return [];
    const list = activeProject.participants || [];
    const q = searchStudent.trim().toLowerCase();
    return list.filter((p) => {
      if ((p.enrollmentStatus || 'ativo') === 'inativo') return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.nextfitCode || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    });
  }, [activeProject, selectedCategory, searchStudent]);

  const availableCategories = useMemo(() => {
    if (!activeProject) return [];
    const set = new Set<string>();
    (activeProject.participants || []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [activeProject]);

  // Calculate historical attendance rate per participant
  const participantAttendanceStats = useMemo(() => {
    const stats: Record<
      string,
      { totalClasses: number; presentCount: number; rateNumber: number; rateText: string }
    > = {};

    projects.forEach((proj) => {
      const projSessions = attendanceSessions.filter((s) => s.projectId === proj.id);
      (proj.participants || []).forEach((part) => {
        let total = 0;
        let present = 0;
        projSessions.forEach((sess) => {
          const found = sess.entries.find((e) => e.participantId === part.id);
          if (found) {
            total += 1;
            if (found.status === 'presente' || found.status === 'justificada') {
              present += 1;
            }
          }
        });

        if (total > 0) {
          const pct = Math.round((present / total) * 100);
          stats[part.id] = {
            totalClasses: total,
            presentCount: present,
            rateNumber: pct,
            rateText: `${pct}%`,
          };
        } else {
          const rawRate = parseInt(
            (part.schoolInfo?.attendanceRate || '95%').replace(/\D/g, ''),
            10
          );
          const validNum = Number.isNaN(rawRate) ? 95 : rawRate;
          stats[part.id] = {
            totalClasses: 1,
            presentCount: 1,
            rateNumber: validNum,
            rateText: `${validNum}%`,
          };
        }
      });
    });

    return stats;
  }, [projects, attendanceSessions]);

  const handleMarkAll = (status: 'presente' | 'falta' | 'justificada') => {
    const updated = { ...statusMap };
    projectParticipants.forEach((p) => {
      updated[p.id] = status;
    });
    setStatusMap(updated);
    onNotify(
      `Todos os ${projectParticipants.length} alunos listados foram marcados como "${status.toUpperCase()}".`,
      'info'
    );
  };

  const handleSaveAttendanceSession = () => {
    if (!activeProject) return;
    if (projectParticipants.length === 0) {
      onNotify('Não há alunos ativos nesta turma para registrar chamada.', 'error');
      return;
    }

    const entries: AttendanceEntry[] = projectParticipants.map((p) => ({
      participantId: p.id,
      participantName: p.name,
      nextfitCode: p.nextfitCode || 'MANUAL',
      category: p.category || 'Geral',
      status: statusMap[p.id] || 'presente',
      notes: notesMap[p.id] || undefined,
    }));

    const newSession: AttendanceSessionRecord = {
      id: `att-${Date.now()}`,
      projectId: activeProject.id,
      projectName: activeProject.name,
      date: sessionDate,
      classTopic:
        classTopic.trim() || 'Treinamento Regular & Acompanhamento Pedagógico',
      coordinator: coordinator.trim() || activeProject.coordinator,
      entries,
      createdAt: new Date().toLocaleString('pt-BR'),
    };

    const nextSessions = [newSession, ...attendanceSessions];

    // Recalculate attendance rate for participants of this project
    const projSessions = nextSessions.filter((s) => s.projectId === activeProject.id);
    const updatedProjects = projects.map((proj) => {
      if (proj.id !== activeProject.id) return proj;
      const updatedParticipants = (proj.participants || []).map((part) => {
        let total = 0;
        let present = 0;
        projSessions.forEach((sess) => {
          const entry = sess.entries.find((e) => e.participantId === part.id);
          if (entry) {
            total += 1;
            if (entry.status === 'presente' || entry.status === 'justificada') {
              present += 1;
            }
          }
        });
        if (total === 0) return part;
        const pct = Math.round((present / total) * 100);
        return {
          ...part,
          schoolInfo: {
            ...(part.schoolInfo || {
              schoolName: 'Rede Pública de Cariacica',
              grade: 'Ensino Fundamental',
              turn: 'Matutino' as const,
            }),
            attendanceRate: `${pct}%`,
          },
        };
      });
      return {
        ...proj,
        participants: updatedParticipants,
      };
    });

    const presentTotal = entries.filter((e) => e.status === 'presente').length;
    onSaveSessionAndSyncProjects(
      nextSessions,
      updatedProjects,
      `Chamada digital de ${sessionDate} salva (${presentTotal}/${entries.length} presentes) e taxa de assiduidade MROSC atualizada!`
    );
  };

  const handleDeleteSession = (sessionId: string) => {
    const nextSessions = attendanceSessions.filter((s) => s.id !== sessionId);
    onSaveSessionAndSyncProjects(
      nextSessions,
      projects,
      'Registro de chamada removido do histórico.'
    );
    if (viewingSession?.id === sessionId) {
      setViewingSession(null);
    }
  };

  const handleExportMroscCsv = () => {
    const headers = [
      'Data da Aula',
      'Projeto Socioesportivo',
      'Tema / Atividade Pedagógica',
      'Responsável Técnico',
      'Código NextFit',
      'Nome do Participante',
      'Categoria / Turma',
      'Situação na Chamada',
      'Assiduidade Acumulada MROSC',
      'Observações',
    ];

    const rows: string[][] = [];
    attendanceSessions.forEach((sess) => {
      sess.entries.forEach((entry) => {
        const rate = participantAttendanceStats[entry.participantId]?.rateText || '95%';
        rows.push([
          `"${sess.date}"`,
          `"${(sess.projectName || '').replace(/"/g, '""')}"`,
          `"${(sess.classTopic || '').replace(/"/g, '""')}"`,
          `"${(sess.coordinator || '').replace(/"/g, '""')}"`,
          `"${entry.nextfitCode || 'MANUAL'}"`,
          `"${(entry.participantName || '').replace(/"/g, '""')}"`,
          `"${(entry.category || '').replace(/"/g, '""')}"`,
          `"${entry.status.toUpperCase()}"`,
          `"${rate}"`,
          `"${(entry.notes || '').replace(/"/g, '""')}"`,
        ]);
      });
    });

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-frequencia-mrosc-vitalizar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Relatório Oficial de Frequência MROSC (.CSV) exportado com sucesso!', 'success');
  };

  const presentCountCurrent = projectParticipants.filter(
    (p) => (statusMap[p.id] || 'presente') === 'presente'
  ).length;
  const justifiedCountCurrent = projectParticipants.filter(
    (p) => statusMap[p.id] === 'justificada'
  ).length;
  const absentCountCurrent = projectParticipants.filter(
    (p) => statusMap[p.id] === 'falta'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Summary Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0284c7] uppercase tracking-wider">
              <ClipboardCheck className="w-4 h-4" />
              <span>Diário de Classe Digital · Conformidade MROSC (Lei nº 13.019/2014)</span>
            </div>
            <h3 className="text-lg font-black text-[#0a1e36] uppercase mt-1">
              Chamada Digital & Controle de Assiduidade dos Participantes
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 max-w-3xl">
              Realize a chamada das turmas utilizando diretamente a base de atletas importada do{' '}
              <strong>Next Fit (.CSV)</strong>. O sistema atualiza automaticamente a taxa de
              assiduidade individual e gera o relatório exigido na prestação de contas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportMroscCsv}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Relatório MROSC (.CSV)</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Diário / PDF</span>
            </button>
          </div>
        </div>

        {/* Session Setup Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Projeto Socioesportivo
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedCategory('all');
              }}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({(p.participants || []).length} alunos)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Filtrar Turma / Categoria
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todas as Categorias ({projectParticipants.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Data da Aula / Chamada
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Professor / Coordenador
            </label>
            <input
              type="text"
              value={coordinator}
              onChange={(e) => setCoordinator(e.target.value)}
              placeholder="Nome e CREF do responsável"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Conteúdo Pedagógico / Atividade Realizada no Dia
            </label>
            <input
              type="text"
              value={classTopic}
              onChange={(e) => setClassTopic(e.target.value)}
              placeholder="Ex: Fundamentos de passe, roda de conversa cidadã e coletivo..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleMarkAll('presente')}
              className="flex-1 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap"
            >
              Todos Presentes
            </button>
            <button
              type="button"
              onClick={handleSaveAttendanceSession}
              className="flex-1 py-2 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition-colors shadow-xs whitespace-nowrap"
            >
              Salvar Chamada
            </button>
          </div>
        </div>
      </div>

      {/* Live Attendance Roll Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:px-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-black text-[#0a1e36] uppercase">
              Lista de Presença ({projectParticipants.length} alunos ativos)
            </span>
            <span className="text-emerald-700 font-semibold font-mono tabular-nums">
              Presentes: {presentCountCurrent}
            </span>
            <span className="text-amber-700 font-semibold font-mono tabular-nums">
              Justificadas: {justifiedCountCurrent}
            </span>
            <span className="text-rose-700 font-semibold font-mono tabular-nums">
              Faltas: {absentCountCurrent}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Buscar aluno ou código Next Fit..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {projectParticipants.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-800">
              Nenhum participante encontrado para este filtro
            </p>
            <p className="text-xs text-slate-500">
              Importe sua planilha .CSV do Next Fit na aba de Participantes ou altere a categoria selecionada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Código Next Fit</th>
                  <th className="py-3 px-4">Atleta / Participante</th>
                  <th className="py-3 px-4">Categoria / Turma</th>
                  <th className="py-3 px-4">Assiduidade MROSC</th>
                  <th className="py-3 px-4 text-center">Marcação de Presença</th>
                  <th className="py-3 px-4">Observação / Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {projectParticipants.map((student) => {
                  const currentStatus = statusMap[student.id] || 'presente';
                  const stat = participantAttendanceStats[student.id] || {
                    rateNumber: 95,
                    rateText: student.schoolInfo?.attendanceRate || '95%',
                  };
                  const isLowAttendance = stat.rateNumber < 75;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono tabular-nums font-bold text-slate-700 whitespace-nowrap">
                        {student.nextfitCode || 'MANUAL'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover bg-slate-200 shrink-0 border border-slate-300"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {student.name}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {student.age} anos · {student.schoolInfo?.schoolName || 'Rede Pública'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                        {student.category}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                        <span
                          className={`font-bold ${
                            isLowAttendance ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {stat.rateText}
                        </span>
                        {isLowAttendance && (
                          <span className="block text-[10px] text-rose-600 font-sans">
                            Atenção (&lt;75%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setStatusMap((prev) => ({ ...prev, [student.id]: 'presente' }))
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                              currentStatus === 'presente'
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Presente</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setStatusMap((prev) => ({
                                ...prev,
                                [student.id]: 'justificada',
                              }))
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                              currentStatus === 'justificada'
                                ? 'bg-amber-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Justif.</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setStatusMap((prev) => ({ ...prev, [student.id]: 'falta' }))
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                              currentStatus === 'falta'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Falta</span>
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={notesMap[student.id] || ''}
                          onChange={(e) =>
                            setNotesMap((prev) => ({
                              ...prev,
                              [student.id]: e.target.value,
                            }))
                          }
                          placeholder="Atestado médico, aviso familiar..."
                          className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Sessions List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
            <h4 className="text-sm font-black text-[#0a1e36] uppercase">
              Histórico de Chamadas Registradas ({attendanceSessions.length})
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            Registros auditáveis para relatórios de execução física MROSC
          </span>
        </div>

        {attendanceSessions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Nenhuma chamada registrada ainda. Selecione a turma acima e clique em Salvar Chamada.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {attendanceSessions.map((sess) => {
              const pCount = sess.entries.filter((e) => e.status === 'presente').length;
              const jCount = sess.entries.filter((e) => e.status === 'justificada').length;
              const fCount = sess.entries.filter((e) => e.status === 'falta').length;
              const pct =
                sess.entries.length > 0
                  ? Math.round(((pCount + jCount) / sess.entries.length) * 100)
                  : 100;

              return (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
                      <span>Data: {sess.date}</span>
                      <span className="font-bold text-emerald-700">
                        Assiduidade do Dia: {pct}%
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-900">{sess.projectName}</h5>
                    <p className="text-xs text-slate-600">{sess.classTopic}</p>
                    <p className="text-[11px] text-slate-500">
                      Responsável: {sess.coordinator}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="font-mono tabular-nums text-[11px] text-slate-600">
                      <span>{pCount} Pres.</span>
                      <span aria-hidden="true"> · </span>
                      <span>{jCount} Just.</span>
                      <span aria-hidden="true"> · </span>
                      <span>{fCount} Faltas</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setViewingSession(
                            viewingSession?.id === sess.id ? null : sess
                          )
                        }
                        className="text-xs font-bold text-[#0284c7] hover:underline cursor-pointer"
                      >
                        {viewingSession?.id === sess.id ? 'Ocultar' : 'Ver Alunos'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSession(sess.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Excluir registro de chamada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {viewingSession?.id === sess.id && (
                    <div className="pt-2 border-t border-slate-200 space-y-1 max-h-40 overflow-y-auto text-[11px]">
                      {sess.entries.map((ent) => (
                        <div
                          key={ent.participantId}
                          className="flex items-center justify-between py-1 px-2 bg-white rounded border border-slate-200/60"
                        >
                          <span className="font-medium text-slate-800">
                            {ent.participantName}{' '}
                            <span className="text-slate-400 font-mono">
                              ({ent.nextfitCode || 'MANUAL'})
                            </span>
                          </span>
                          <span
                            className={`font-bold uppercase ${
                              ent.status === 'presente'
                                ? 'text-emerald-700'
                                : ent.status === 'justificada'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {ent.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
