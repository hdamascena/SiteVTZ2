import React, { useState, useMemo } from 'react';
import {
  UserPlus,
  Clock,
  XCircle,
  Plus,
  Users,
  Upload,
  FileSpreadsheet,
  Trash2,
  Calendar,
} from 'lucide-react';
import type {
  AdminUserProfile,
  ProjectEnrollmentStatus,
} from '../types.ts';
import {
  canImportCsv,
  canDeleteRecords,
  resolveProjectIdFromRsvp,
  sanitizeShowcaseParticipant,
} from '../permissions.ts';
import {
  CampoSensivelMascara,
  CampoTexto,
  SeloSensivel,
} from '../components/CampoTexto.tsx';
import { Tabela, type ColunaTabela } from '../components/Tabela.tsx';
import {
  PainelLateral,
  type SaveIndicatorState,
} from '../components/PainelLateral.tsx';
import {
  useClubData,
  type EventRsvpRecord,
} from '../../context/ClubDataContext.tsx';
import {
  syncProjectSpotsAndTeams,
  normalizeParticipantPositionForModality,
  derivePositionGroup,
  type ProjectParticipant,
} from '../../types/index.ts';
import {
  ENROLLMENT_SAMPLE_CSV,
  parseEnrollmentsCsv,
  downloadCsvTemplate,
} from '../../utils/fileUpload.ts';

interface InscricoesProjetosViewProps {
  profile: AdminUserProfile;
  initialStatusFilter?: string;
}

const STATUS_LABELS: Record<ProjectEnrollmentStatus, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aprovada: 'Aprovado na Vitrine',
  lista_espera: 'Lista de Espera',
  recusada: 'Recusada',
};

export const InscricoesProjetosView: React.FC<InscricoesProjetosViewProps> = ({
  profile,
  initialStatusFilter = 'all',
}) => {
  const {
    projects,
    events,
    rsvps,
    addRsvp,
    saveAdminChanges,
    recordAuditEvent,
    showToast,
  } = useClubData();

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);

  // Drawer for new enrollment
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveIndicatorState>('idle');
  const [formProjectId, setFormProjectId] = useState(projects[0]?.id || '');
  const [formTeamId, setFormTeamId] = useState(
    projects[0]?.teams?.[0]?.id || ''
  );
  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentAge, setFormStudentAge] = useState('12');
  const [formResponsible, setFormResponsible] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  const selectedFormProject = useMemo(
    () => projects.find((p) => p.id === formProjectId) || projects[0],
    [projects, formProjectId]
  );

  const visibleEnrollments = useMemo(() => {
    return rsvps.filter((r) => {
      const pid = resolveProjectIdFromRsvp(r, projects);
      const isEventRsvp = !pid && events.some((ev) => ev.id === r.eventId);
      if (projectFilter === 'apenas_projetos' && !pid) return false;
      if (projectFilter === 'apenas_eventos' && !isEventRsvp) return false;
      if (projectFilter.startsWith('evt:')) {
        if (r.eventId !== projectFilter.slice(4)) return false;
      } else if (
        projectFilter !== 'all' &&
        projectFilter !== 'apenas_projetos' &&
        projectFilter !== 'apenas_eventos' &&
        pid !== projectFilter
      ) {
        return false;
      }
      const st = r.enrollmentStatus || 'pendente';
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        (r.studentName || r.name || '').toLowerCase().includes(q) ||
        (r.confirmationCode || '').toLowerCase().includes(q) ||
        (r.eventTitle || '').toLowerCase().includes(q) ||
        (r.modalityOrClass || '').toLowerCase().includes(q)
      );
    });
  }, [rsvps, projects, events, projectFilter, statusFilter, searchQuery]);

  const handleDeleteRsvp = (rsvp: EventRsvpRecord) => {
    const nextRsvps = rsvps.filter((item) => item.id !== rsvp.id);
    saveAdminChanges({
      rsvps: nextRsvps,
      toastMessage: `Inscrição de "${rsvp.studentName || rsvp.name}" removida e vaga liberada.`,
      logDetails: `Inscrição ${rsvp.confirmationCode} excluída.`,
    });
    recordAuditEvent({
      action: 'EXCLUIR_INSCRICAO_RSVP',
      collection: 'rsvps',
      itemId: rsvp.id,
      role: profile.role,
      beforeSummary: rsvp.studentName || rsvp.name,
    });
  };

  const handleUpdateStatus = (
    rsvp: EventRsvpRecord,
    nextStatus: ProjectEnrollmentStatus
  ) => {
    const updatedRsvps = rsvps.map((item) =>
      item.id === rsvp.id ? { ...item, enrollmentStatus: nextStatus } : item
    );
    saveAdminChanges({
      rsvps: updatedRsvps,
      toastMessage: `Status da inscrição atualizado para "${STATUS_LABELS[nextStatus]}".`,
      logDetails: `Inscrição ${rsvp.confirmationCode} alterada para ${nextStatus}.`,
    });
    recordAuditEvent({
      action: 'ATUALIZAR_INSCRICAO_PROJETO',
      collection: 'rsvps',
      itemId: rsvp.id,
      role: profile.role,
      beforeSummary: rsvp.enrollmentStatus || 'pendente',
      afterSummary: nextStatus,
    });
  };

  const handleApproveAndEnrollInProject = async (rsvp: EventRsvpRecord) => {
    const pid =
      resolveProjectIdFromRsvp(rsvp, projects) || projects[0]?.id;
    const targetProject = projects.find((p) => p.id === pid);
    if (!targetProject) {
      showToast('Selecione um projeto válido para integrar o atleta.', 'error');
      return;
    }

    const teams = targetProject.teams || [];
    const matchedTeam =
      teams.find((t) => t.id === rsvp.teamId) ||
      teams.find(
        (t) =>
          rsvp.modalityOrClass &&
          rsvp.modalityOrClass.toLowerCase().includes(t.name.toLowerCase())
      ) ||
      teams[0];

    const cleanName =
      rsvp.studentName || rsvp.name.split('(')[0].trim() || rsvp.name;
    const age = rsvp.studentAge || 12;
    const category =
      matchedTeam?.category ||
      (age <= 11
        ? '9 a 11 anos'
        : age <= 13
        ? '12 a 13 anos'
        : '14 a 15 anos');

    const newParticipantId = `part-${Date.now()}`;
    const resolvedModality = matchedTeam?.modality || rsvp.modality || 'Voleibol';
    const resolvedPosition = normalizeParticipantPositionForModality(
      'Atleta',
      resolvedModality
    );
    const newParticipant: ProjectParticipant = sanitizeShowcaseParticipant({
      id: newParticipantId,
      name: cleanName,
      nickname: cleanName.split(' ')[0],
      enrollmentStatus: 'ativo',
      teamId: matchedTeam?.id,
      modality: resolvedModality,
      modalityOrClass: matchedTeam
        ? `${matchedTeam.name} (${matchedTeam.modality} · ${matchedTeam.polo})`
        : rsvp.modalityOrClass || targetProject.name,
      photoUrl:
        'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80',
      jerseyNumber: ((targetProject.participants?.length || 0) % 99) + 1,
      position: resolvedPosition,
      positionGroup: derivePositionGroup(resolvedPosition, resolvedModality),
      preferredFoot: 'Destro',
      age,
      birthDate: '',
      category,
      height: '',
      weight: '',
      cardTier: 'prata',
      stats: {
        pace: 75,
        shooting: 72,
        passing: 76,
        dribbling: 75,
        defending: 70,
        physical: 74,
        overall: 74,
      },
      schoolInfo: {
        schoolName: '',
        grade: '',
        turn: 'Matutino',
        attendanceRate: '100%',
      },
      highlights: ['Integrado via Vitrine de Projetos Vitalizar'],
      scoutReport: {
        summary: 'Participante integrado regularmente às turmas do projeto.',
        strengths: ['Assiduidade', 'Espírito de equipe'],
        developmentAreas: ['Evolução técnica continuada'],
        scoutRating: 'Em Formação',
      },
      photos: [],
      videos: [],
    });

    const updatedProjects = projects.map((pr) => {
      if (pr.id !== targetProject.id) return syncProjectSpotsAndTeams(pr);
      const nextParticipants = [...(pr.participants || []), newParticipant];
      return syncProjectSpotsAndTeams({
        ...pr,
        participants: nextParticipants,
      });
    });

    const updatedRsvps = rsvps.map((item) =>
      item.id === rsvp.id
        ? {
            ...item,
            projectId: targetProject.id,
            teamId: matchedTeam?.id || item.teamId,
            enrollmentStatus: 'aprovada' as ProjectEnrollmentStatus,
          }
        : item
    );

    saveAdminChanges({
      projects: updatedProjects,
      rsvps: updatedRsvps,
      toastMessage: `${cleanName} aprovado(a) e matriculado(a) no ${matchedTeam?.name || targetProject.name}!`,
      logDetails: `Matrícula confirmada de ${cleanName} no projeto ${targetProject.name} (${matchedTeam?.name || 'Turma'}).`,
    });

    recordAuditEvent({
      action: 'MATRICULAR_INSCRITO_PROJETO',
      collection: 'projects',
      itemId: targetProject.id,
      role: profile.role,
      afterSummary: `Aluno ${cleanName} (${rsvp.confirmationCode}) matriculado em ${matchedTeam?.name || targetProject.name}`,
    });
  };

  const handleCreateEnrollment = (e: React.FormEvent) => {
    e.preventDefault();
    const proj =
      projects.find((p) => p.id === formProjectId) || projects[0];
    if (!proj || !formStudentName.trim() || !formPhone.trim()) return;

    const targetTeam =
      proj.teams?.find((t) => t.id === formTeamId) || proj.teams?.[0];
    const teamLabel = targetTeam
      ? `${targetTeam.name} (${targetTeam.modality} · ${targetTeam.schedule})`
      : proj.name;

    setSaveState('saving');
    addRsvp({
      eventId: `inscricao-${proj.id}`,
      eventTitle: `Inscrição no Projeto: ${proj.name}`,
      name: `${formStudentName.trim()} (${formStudentAge} anos · ${teamLabel})`,
      phone: formPhone.trim(),
      email: formEmail.trim() || undefined,
      spots: 1,
      projectId: proj.id,
      teamId: targetTeam?.id,
      modality: targetTeam?.modality,
      enrollmentStatus: 'pendente',
      studentName: formStudentName.trim(),
      studentAge: Number(formStudentAge) || 12,
      responsibleName: formResponsible.trim() || undefined,
      modalityOrClass: teamLabel,
      userId: profile.uid,
    });

    setTimeout(() => {
      setSaveState('saved');
      setDrawerOpen(false);
      setSaveState('idle');
    }, 300);
  };

  const handleImportEnrollmentsCsv = (file: File) => {
    if (!canImportCsv(profile.role)) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawText = ev.target?.result as string;
      if (!rawText) return;
      const parsed = parseEnrollmentsCsv(rawText);
      if (parsed.error) {
        showToast(parsed.error, 'error');
        return;
      }
      const targetProj =
        projects.find((p) => p.id === projectFilter) || projects[0];
      if (!targetProj) return;

      const defaultTeam = targetProj.teams?.[0];
      const newRecords: EventRsvpRecord[] = parsed.rows.map((row, idx) => ({
        id: `rsvp-${Date.now()}-${idx}`,
        eventId: `inscricao-${targetProj.id}`,
        eventTitle: `Inscrição no Projeto: ${targetProj.name}`,
        name: `${row.studentName} (${row.studentAge} anos · ${row.modalityOrClass})`,
        phone: row.phone,
        email: row.email || undefined,
        spots: 1,
        date: new Date().toLocaleDateString('pt-BR'),
        confirmationCode: `VIT-${Math.floor(1000 + Math.random() * 9000)}`,
        projectId: targetProj.id,
        teamId: defaultTeam?.id,
        modality: defaultTeam?.modality,
        enrollmentStatus: 'pendente',
        studentName: row.studentName,
        studentAge: row.studentAge,
        responsibleName: row.responsibleName || undefined,
        modalityOrClass: row.modalityOrClass,
      }));

      saveAdminChanges({
        rsvps: [...newRecords, ...rsvps],
        toastMessage: `${newRecords.length} inscrições importadas via planilha para ${targetProj.name}!`,
        logDetails: `Importação em lote de ${newRecords.length} inscrições via arquivo ${file.name}.`,
      });
      recordAuditEvent({
        action: 'IMPORTAR_INSCRICOES_CSV',
        collection: 'rsvps',
        itemId: file.name,
        role: profile.role,
        afterSummary: `${newRecords.length} inscrições adicionadas em ${targetProj.name}`,
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const columns: ColunaTabela<EventRsvpRecord>[] = [
    {
      id: 'aluno',
      header: 'Inscrito / Protocolo',
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100 block">
            {r.studentName || r.name}
          </span>
          <span className="font-mono text-[11px] text-[#0284c7] dark:text-sky-400">
            {r.confirmationCode} · {r.date}
          </span>
        </div>
      ),
    },
    {
      id: 'projeto',
      header: 'Vínculo (Projeto / Time ou Evento)',
      render: (r) => {
        const pid = resolveProjectIdFromRsvp(r, projects);
        const proj = projects.find((p) => p.id === pid);
        const linkedTeam = proj?.teams?.find((t) => t.id === r.teamId);
        const linkedEvent = !proj ? events.find((ev) => ev.id === r.eventId) : null;
        return (
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              {proj ? proj.name : linkedEvent ? linkedEvent.title : r.eventTitle}
            </span>
            <span className="text-[11px] text-[#0284c7] dark:text-sky-400 font-medium">
              {linkedTeam
                ? `${linkedTeam.name} (${linkedTeam.modality} · ${linkedTeam.polo})`
                : linkedEvent
                ? `Agenda de Eventos (${r.spots || 1} vaga${(r.spots || 1) > 1 ? 's' : ''} · ${linkedEvent.date})`
                : r.modalityOrClass || 'Inscrição Geral'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'contato',
      header: 'Contato (Sensível LGPD)',
      render: (r) => (
        <div className="space-y-1">
          <div>
            <CampoSensivelMascara
              value={r.phone}
              type="phone"
              itemLabel={r.studentName || r.name}
              collection="rsvps"
              itemId={r.id}
              onRevealAudit={(p) =>
                recordAuditEvent({ ...p, role: profile.role })
              }
            />
          </div>
          {r.email && (
            <div>
              <CampoSensivelMascara
                value={r.email}
                type="email"
                itemLabel={r.studentName || r.name}
                collection="rsvps"
                itemId={r.id}
                onRevealAudit={(p) =>
                  recordAuditEvent({ ...p, role: profile.role })
                }
              />
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Situação',
      render: (r) => {
        const st = r.enrollmentStatus || 'pendente';
        const color =
          st === 'aprovada'
            ? 'text-emerald-600 dark:text-emerald-400'
            : st === 'recusada'
            ? 'text-rose-600 dark:text-rose-400'
            : st === 'lista_espera'
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-sky-600 dark:text-sky-400';
        return (
          <span className={`font-bold text-xs ${color}`}>
            {STATUS_LABELS[st]}
          </span>
        );
      },
    },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (r) => {
        const st = r.enrollmentStatus || 'pendente';
        const pid = resolveProjectIdFromRsvp(r, projects);
        const isEventOnly = !pid && events.some((ev) => ev.id === r.eventId);
        return (
          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
            {!isEventOnly && st !== 'aprovada' && (
              <button
                type="button"
                onClick={() => handleApproveAndEnrollInProject(r)}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                title="Aprovar inscrição e incluir atleta no Time e na vitrine do projeto"
              >
                <UserPlus className="w-3 h-3" />
                <span>Aprovar no Time</span>
              </button>
            )}
            {st !== 'lista_espera' && st !== 'aprovada' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(r, 'lista_espera')}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 text-slate-700 dark:text-slate-300 text-[11px] font-semibold rounded-lg cursor-pointer"
                title="Mover para Lista de Espera"
              >
                <Clock className="w-3 h-3 inline mr-1" />
                Espera
              </button>
            )}
            {st !== 'recusada' && st !== 'aprovada' && (
              <button
                type="button"
                onClick={() => handleUpdateStatus(r, 'recusada')}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold rounded-lg cursor-pointer"
                title="Recusar inscrição e liberar vaga"
              >
                <XCircle className="w-3 h-3 inline mr-1" />
                Recusar
              </button>
            )}
            {canDeleteRecords(profile.role) && (
              <button
                type="button"
                onClick={() => handleDeleteRsvp(r)}
                className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
                title="Excluir registro de inscrição e liberar vaga"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Spots summary per project & teams */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {projects.map((proj) => {
          const synced = syncProjectSpotsAndTeams(proj);
          const total = synced.totalSpots ?? 300;
          const filled = synced.filledSpots ?? 0;
          const avail = synced.availableSpots ?? Math.max(0, total - filled);
          return (
            <div
              key={proj.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-1"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate font-semibold">{proj.name}</span>
                <Users className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />
              </div>
              <div className="flex items-baseline justify-between font-mono tabular-nums">
                <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  {avail} vagas
                </span>
                <span className="text-[11px] text-slate-500">
                  {filled}/{total} ({proj.teams?.length || 0} times)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Tabela
        items={visibleEnrollments}
        columns={columns}
        keyExtractor={(r) => r.id}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar por interessado, time, modalidade ou protocolo..."
        filterControls={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Todos (Projetos & Eventos)</option>
              <option value="apenas_projetos">Apenas Projetos & Times</option>
              <option value="apenas_eventos">Apenas Agenda de Eventos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  Projeto: {p.name}
                </option>
              ))}
              {events.map((ev) => (
                <option key={ev.id} value={`evt:${ev.id}`}>
                  Evento: {ev.title}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_analise">Em Análise</option>
              <option value="aprovada">Aprovados</option>
              <option value="lista_espera">Lista de Espera</option>
              <option value="recusada">Recusadas</option>
            </select>

            <SeloSensivel level="sensível" />
          </div>
        }
        headerActions={
          <div className="flex flex-wrap items-center gap-2">
            {canImportCsv(profile.role) && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsvTemplate(
                      'modelo-inscricoes-vitalizar.csv',
                      ENROLLMENT_SAMPLE_CSV
                    )
                  }
                  className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modelo CSV</span>
                </button>
                <label className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Importar Inscrições (CSV)</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportEnrollmentsCsv(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Inscrição em Time</span>
            </button>
          </div>
        }
        emptyTitle="Nenhuma inscrição encontrada"
        emptyDescription="Use o botão 'Nova Inscrição em Time' para registrar uma solicitação de vaga."
      />

      <PainelLateral
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Nova Inscrição em Projeto e Time"
        subtitle="Solicitação de matrícula gratuita vinculada diretamente aos Times/Turmas da Vitalizar"
        saveState={saveState}
        onSave={handleCreateEnrollment}
        saveLabel="Confirmar Inscrição"
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Projeto Desejado *
            </label>
            <select
              value={formProjectId}
              onChange={(e) => {
                const pid = e.target.value;
                setFormProjectId(pid);
                const nextProj = projects.find((pr) => pr.id === pid);
                if (nextProj?.teams?.[0]) {
                  setFormTeamId(nextProj.teams[0].id);
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {projects.map((p) => {
                const synced = syncProjectSpotsAndTeams(p);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({synced.availableSpots ?? 300} vagas)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Time / Turma e Modalidade *
            </label>
            <select
              value={formTeamId}
              onChange={(e) => setFormTeamId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {(selectedFormProject?.teams || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.modality} ({t.schedule} · {t.polo}) [{t.filledSpots ?? 0}/{t.totalSpots} vagas]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <CampoTexto
                label="Nome Completo do Aluno / Participante"
                value={formStudentName}
                onChange={setFormStudentName}
                required
                classification="sensível"
              />
            </div>
            <CampoTexto
              label="Idade"
              type="number"
              value={formStudentAge}
              onChange={setFormStudentAge}
              required
              classification="sensível"
            />
          </div>

          <CampoTexto
            label="Nome do Responsável Legal (se menor)"
            value={formResponsible}
            onChange={setFormResponsible}
            classification="sensível"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CampoTexto
              label="WhatsApp / Telefone"
              type="tel"
              value={formPhone}
              onChange={setFormPhone}
              required
              classification="sensível"
            />
            <CampoTexto
              label="E-mail"
              type="email"
              value={formEmail}
              onChange={setFormEmail}
              classification="sensível"
            />
          </div>
        </div>
      </PainelLateral>
    </div>
  );
};

