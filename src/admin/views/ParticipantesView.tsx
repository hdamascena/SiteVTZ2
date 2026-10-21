import React, { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Upload,
  Edit3,
  Trash2,
  FileSpreadsheet,
} from 'lucide-react';
import type { AdminUserProfile, ParticipantPrivateRecord } from '../types.ts';
import {
  canDeleteRecords,
  canExportSensitiveCsv,
  canImportCsv,
  mergeParticipantWithPrivate,
} from '../permissions.ts';
import {
  CampoSensivelMascara,
  CampoTexto,
  CampoUploadImagem,
  SeloSensivel,
} from '../components/CampoTexto.tsx';
import { Tabela, type ColunaTabela } from '../components/Tabela.tsx';
import {
  PainelLateral,
  type SaveIndicatorState,
} from '../components/PainelLateral.tsx';
import { ConfirmarExclusao } from '../components/ConfirmarExclusao.tsx';
import { useClubData } from '../../context/ClubDataContext.tsx';
import type { ProjectParticipant } from '../../types/index.ts';
import {
  NEXTFIT_SAMPLE_CSV_CONTENT,
  parseNextFitCsv,
  mergeNextFitRowsIntoProjects,
} from '../../utils/nextfitCsv.ts';
import { downloadCsvTemplate } from '../../utils/fileUpload.ts';

interface ParticipantesViewProps {
  profile: AdminUserProfile;
  onScheduleUndoDelete: (
    label: string,
    performDelete: () => void,
    undoRestore: () => void
  ) => void;
}

interface EnrichedParticipantRow {
  projectId: string;
  projectName: string;
  participant: ProjectParticipant;
  privateData?: ParticipantPrivateRecord;
}

export const ParticipantesView: React.FC<ParticipantesViewProps> = ({
  profile,
  onScheduleUndoDelete,
}) => {
  const {
    projects,
    participantPrivateMap,
    saveParticipantPrivate,
    saveAdminChanges,
    recordAuditEvent,
    showToast,
  } = useClubData();

  const allowedProjects = useMemo(() => {
    if (profile.role === 'professor') {
      return projects.filter((p) => (profile.projectIds || []).includes(p.id));
    }
    return projects;
  }, [projects, profile.role, profile.projectIds]);

  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drawer editing state
  const [editingRow, setEditingRow] = useState<EnrichedParticipantRow | null>(
    null
  );
  const [isNew, setIsNew] = useState(false);
  const [saveState, setSaveState] = useState<SaveIndicatorState>('idle');

  // Form fields
  const [formProjectId, setFormProjectId] = useState('');
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formCategory, setFormCategory] = useState('Sub-15');
  const [formPosition, setFormPosition] = useState('Meia');
  const [formJersey, setFormJersey] = useState('10');
  const [formAge, setFormAge] = useState('14');
  const [formStatus, setFormStatus] = useState<
    'ativo' | 'trancado' | 'inativo' | 'pendente'
  >('ativo');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  // Sensitive fields (stored in /participant_private)
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formHeight, setFormHeight] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formBmi, setFormBmi] = useState('');
  const [formSchoolName, setFormSchoolName] = useState('');
  const [formSchoolGrade, setFormSchoolGrade] = useState('8º Ano');
  const [formNextfitCode, setFormNextfitCode] = useState('');
  const [formResponsible, setFormResponsible] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] =
    useState<EnrichedParticipantRow | null>(null);

  const allRows = useMemo(() => {
    const list: EnrichedParticipantRow[] = [];
    allowedProjects.forEach((proj) => {
      if (projectFilter !== 'all' && proj.id !== projectFilter) return;
      (proj.participants || []).forEach((pt) => {
        const priv = participantPrivateMap[pt.id];
        const merged = mergeParticipantWithPrivate(pt, priv);
        list.push({
          projectId: proj.id,
          projectName: proj.name,
          participant: merged,
          privateData: priv,
        });
      });
    });
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (r) =>
        r.participant.name.toLowerCase().includes(q) ||
        (r.participant.category || '').toLowerCase().includes(q) ||
        (r.participant.nextfitCode || '').toLowerCase().includes(q) ||
        (r.participant.schoolInfo?.schoolName || '').toLowerCase().includes(q)
    );
  }, [allowedProjects, projectFilter, participantPrivateMap, searchQuery]);

  const openEditDrawer = (row: EnrichedParticipantRow) => {
    setIsNew(false);
    setEditingRow(row);
    const p = row.participant;
    const priv = row.privateData;
    setFormProjectId(row.projectId);
    setFormName(p.name);
    setFormNickname(p.nickname || '');
    setFormCategory(p.category || 'Sub-15');
    setFormPosition(p.position || 'Meia');
    setFormJersey(String(p.jerseyNumber || 10));
    setFormAge(String(p.age || 14));
    setFormStatus(p.enrollmentStatus || 'ativo');
    setFormPhotoUrl(p.photoUrl || '');
    setFormBirthDate(priv?.birthDate || p.birthDate || '');
    setFormHeight(priv?.height || p.height || '');
    setFormWeight(priv?.weight || p.weight || '');
    setFormBmi(priv?.bmi || p.bmi || '');
    setFormSchoolName(
      priv?.schoolInfo?.schoolName || p.schoolInfo?.schoolName || ''
    );
    setFormSchoolGrade(
      priv?.schoolInfo?.grade || p.schoolInfo?.grade || '8º Ano'
    );
    setFormNextfitCode(priv?.nextfitCode || p.nextfitCode || '');
    setFormResponsible(priv?.responsibleName || '');
    setFormPhone(priv?.phone || '');
    setFormEmail(priv?.email || '');
    setSaveState('idle');
  };

  const openNewDrawer = () => {
    const defaultProjId =
      projectFilter !== 'all'
        ? projectFilter
        : allowedProjects[0]?.id || '';
    setIsNew(true);
    setEditingRow({
      projectId: defaultProjId,
      projectName:
        allowedProjects.find((p) => p.id === defaultProjId)?.name || '',
      participant: {} as ProjectParticipant,
    });
    setFormProjectId(defaultProjId);
    setFormName('');
    setFormNickname('');
    setFormCategory('Sub-15');
    setFormPosition('Meia');
    setFormJersey('10');
    setFormAge('13');
    setFormStatus('ativo');
    setFormPhotoUrl(
      'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80'
    );
    setFormBirthDate('');
    setFormHeight('');
    setFormWeight('');
    setFormBmi('');
    setFormSchoolName('');
    setFormSchoolGrade('8º Ano');
    setFormNextfitCode('');
    setFormResponsible('');
    setFormPhone('');
    setFormEmail('');
    setSaveState('idle');
  };

  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow || !formName.trim()) return;
    setSaveState('saving');

    const partId = isNew ? `part-${Date.now()}` : editingRow.participant.id;
    const basePart: ProjectParticipant = isNew
      ? {
          id: partId,
          name: formName.trim(),
          nickname: formNickname.trim() || formName.trim().split(' ')[0],
          enrollmentStatus: formStatus,
          photoUrl:
            formPhotoUrl.trim() ||
            'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80',
          jerseyNumber: Number(formJersey) || 10,
          position: formPosition.trim() || 'Atleta',
          positionGroup: 'meio',
          preferredFoot: 'Destro',
          age: Number(formAge) || 13,
          birthDate: '',
          category: formCategory.trim() || 'Sub-15',
          height: '',
          weight: '',
          cardTier: 'prata',
          stats: {
            pace: 76,
            shooting: 74,
            passing: 75,
            dribbling: 76,
            defending: 70,
            physical: 74,
            overall: 75,
          },
          schoolInfo: {
            schoolName: '',
            grade: '',
            turn: 'Matutino',
            attendanceRate: '98%',
          },
          highlights: ['Integrante oficial das turmas Vitalizar'],
          scoutReport: {
            summary: 'Atleta em desenvolvimento técnico e pedagógico.',
            strengths: ['Comprometimento'],
            developmentAreas: ['Aprimoramento contínuo'],
            scoutRating: 'Formação Regular',
          },
          photos: [],
          videos: [],
        }
      : {
          ...editingRow.participant,
          name: formName.trim(),
          nickname: formNickname.trim() || formName.trim().split(' ')[0],
          enrollmentStatus: formStatus,
          photoUrl: formPhotoUrl.trim() || editingRow.participant.photoUrl,
          jerseyNumber: Number(formJersey) || 10,
          position: formPosition.trim(),
          age: Number(formAge) || editingRow.participant.age,
          category: formCategory.trim(),
        };

    const privRecord: ParticipantPrivateRecord = {
      id: partId,
      projectId: formProjectId,
      participantName: formName.trim(),
      birthDate: formBirthDate.trim(),
      height: formHeight.trim(),
      weight: formWeight.trim(),
      bmi: formBmi.trim(),
      nextfitCode: formNextfitCode.trim(),
      schoolInfo: {
        schoolName: formSchoolName.trim(),
        grade: formSchoolGrade.trim() || 'Regular',
        turn: 'Matutino',
        attendanceRate: '98%',
      },
      responsibleName: formResponsible.trim(),
      phone: formPhone.trim(),
      email: formEmail.trim(),
      updatedAt: new Date().toISOString(),
    };

    await saveParticipantPrivate(privRecord).catch(() => {});

    const updatedProjects = projects.map((proj) => {
      const filteredOut = (proj.participants || []).filter(
        (p) => p.id !== partId
      );
      if (proj.id === formProjectId) {
        const nextList = [...filteredOut, basePart];
        return {
          ...proj,
          participants: nextList,
          filledSpots: nextList.length,
        };
      }
      if (proj.id === editingRow.projectId && proj.id !== formProjectId) {
        return {
          ...proj,
          participants: filteredOut,
          filledSpots: filteredOut.length,
        };
      }
      return proj;
    });

    saveAdminChanges({
      projects: updatedProjects,
      toastMessage: `Dados de "${formName.trim()}" salvos com proteção LGPD!`,
      logDetails: `Participante ${formName.trim()} salvo no projeto ${formProjectId}.`,
    });

    recordAuditEvent({
      action: isNew ? 'CRIAR_PARTICIPANTE' : 'EDITAR_PARTICIPANTE',
      collection: 'participant_private',
      itemId: partId,
      role: profile.role,
      beforeSummary: isNew ? 'novo' : editingRow.participant.name,
      afterSummary: `${formName.trim()} (${formCategory})`,
    });

    setTimeout(() => {
      setSaveState('saved');
      setTimeout(() => {
        setEditingRow(null);
        setSaveState('idle');
      }, 400);
    }, 250);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    const snapshotProjects = [...projects];

    const updatedProjects = projects.map((proj) => {
      if (proj.id !== target.projectId) return proj;
      const nextList = (proj.participants || []).filter(
        (p) => p.id !== target.participant.id
      );
      return {
        ...proj,
        participants: nextList,
        filledSpots: nextList.length,
      };
    });

    onScheduleUndoDelete(
      `Participante "${target.participant.name}"`,
      () => {
        saveAdminChanges({
          projects: updatedProjects,
          toastMessage: `Participante "${target.participant.name}" removido.`,
          logDetails: `Exclusão de participante ${target.participant.name}.`,
        });
        recordAuditEvent({
          action: 'EXCLUIR_PARTICIPANTE',
          collection: 'projects',
          itemId: target.participant.id,
          role: profile.role,
          beforeSummary: target.participant.name,
          afterSummary: 'excluído',
        });
      },
      () => {
        saveAdminChanges({
          projects: snapshotProjects,
          toastMessage: `Exclusão de "${target.participant.name}" desfeita!`,
        });
      }
    );
  };

  const handleExportSensitiveCsv = () => {
    if (!canExportSensitiveCsv(profile.role)) {
      showToast('Apenas Admin e Super Admin podem exportar CSV de dados sensíveis.', 'error');
      return;
    }

    const headers = [
      'ID',
      'Codigo NextFit',
      'Nome',
      'Projeto',
      'Categoria',
      'Idade',
      'Data Nascimento (Sensivel)',
      'Altura (Sensivel)',
      'Peso (Sensivel)',
      'IMC (Sensivel)',
      'Escola (Sensivel)',
      'Responsavel (Sensivel)',
      'Telefone (Sensivel)',
    ];

    const rows = allRows.map((r) => {
      const p = r.participant;
      const priv = r.privateData;
      return [
        p.id,
        priv?.nextfitCode || p.nextfitCode || '',
        p.name,
        r.projectName,
        p.category,
        String(p.age || ''),
        priv?.birthDate || p.birthDate || '',
        priv?.height || p.height || '',
        priv?.weight || p.weight || '',
        priv?.bmi || p.bmi || '',
        priv?.schoolInfo?.schoolName || p.schoolInfo?.schoolName || '',
        priv?.responsibleName || '',
        priv?.phone || '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
    });

    const csv = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `participantes-sensivel-vitalizar-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    recordAuditEvent({
      action: 'EXPORTAR_CSV_SENSIVEL',
      collection: 'participant_private',
      itemId: projectFilter,
      role: profile.role,
      afterSummary: `Exportou ${allRows.length} registros sensíveis em CSV`,
    });
    showToast('CSV exportado e registrado no log de auditoria LGPD!');
  };

  const handleImportCsvFile = (file: File) => {
    if (!canImportCsv(profile.role)) {
      showToast('Apenas Admin e Super Admin podem importar planilhas CSV.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rawText = ev.target?.result as string;
      if (!rawText) return;
      const targetProj =
        projectFilter !== 'all' ? projectFilter : allowedProjects[0]?.id;
      const parsed = parseNextFitCsv(rawText, projects, targetProj);
      if (parsed.error) {
        showToast(parsed.error, 'error');
        return;
      }
      const { updatedProjects, addedCount, updatedCount } =
        mergeNextFitRowsIntoProjects(
          projects,
          parsed.rows,
          targetProj || 'auto'
        );

      for (const row of parsed.rows) {
        const pid = row.targetProjectId || targetProj || allowedProjects[0]?.id || '';
        if (!pid) continue;
        await saveParticipantPrivate({
          id: row.id,
          projectId: pid,
          participantName: row.name,
          birthDate: row.birthDate,
          height: row.height,
          weight: row.weight,
          bmi: row.bmi,
          nextfitCode: row.nextfitCode,
          planName: row.planName,
          schoolInfo: {
            schoolName: row.schoolName,
            grade: 'Regular',
            turn: 'Matutino',
            attendanceRate: '98%',
          },
          healthNotes: row.notes,
          updatedAt: new Date().toISOString(),
        }).catch(() => {});
      }

      saveAdminChanges({
        projects: updatedProjects,
        toastMessage: `Planilha importada: ${addedCount} novos e ${updatedCount} atualizados!`,
        logDetails: `Importação CSV NextFit (${file.name}): +${addedCount} / ~${updatedCount}.`,
      });
      recordAuditEvent({
        action: 'IMPORTAR_CSV_SENSIVEL',
        collection: 'participant_private',
        itemId: file.name,
        role: profile.role,
        afterSummary: `${addedCount} adicionados, ${updatedCount} atualizados`,
      });
    };
    reader.readAsText(file, 'UTF-8');
  };

  const columns: ColunaTabela<EnrichedParticipantRow>[] = [
    {
      id: 'nome',
      header: 'Aluno / Participante',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <img
            src={r.participant.photoUrl}
            alt={r.participant.name}
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
          />
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {r.participant.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {r.participant.category} · #{r.participant.jerseyNumber}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'projeto',
      header: 'Turma / Projeto',
      render: (r) => (
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {r.projectName}
        </span>
      ),
    },
    {
      id: 'saude_escola',
      header: 'Saúde & Escola (Sensível)',
      render: (r) => {
        const priv = r.privateData;
        const school =
          priv?.schoolInfo?.schoolName ||
          r.participant.schoolInfo?.schoolName ||
          'Não informada';
        const bio = [
          priv?.birthDate || r.participant.birthDate,
          priv?.height || r.participant.height,
          priv?.weight || r.participant.weight,
          priv?.bmi ? `IMC ${priv.bmi}` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                {school}
              </span>
              <SeloSensivel level="sensível" />
            </div>
            <span className="text-[11px] font-mono text-slate-500 block">
              {bio || 'Dados biométricos protegidos'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'contato',
      header: 'Contato Responsável',
      render: (r) => (
        <div className="space-y-0.5">
          {r.privateData?.phone ? (
            <CampoSensivelMascara
              value={r.privateData.phone}
              type="phone"
              itemLabel={r.participant.name}
              collection="participant_private"
              itemId={r.participant.id}
              onRevealAudit={(p) =>
                recordAuditEvent({ ...p, role: profile.role })
              }
            />
          ) : (
            <span className="text-[11px] text-slate-400">Sem telefone</span>
          )}
        </div>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditDrawer(r)}
            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" />
            <span>Editar</span>
          </button>
          {canDeleteRecords(profile.role) && (
            <button
              type="button"
              onClick={() => setDeleteTarget(r)}
              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer"
              title="Excluir participante"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Tabela
        items={allRows}
        columns={columns}
        keyExtractor={(r) => `${r.projectId}-${r.participant.id}`}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar aluno por nome, categoria, escola ou código..."
        filterControls={
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
          >
            <option value="all">
              Todas as Turmas Permitidas ({allRows.length})
            </option>
            {allowedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        }
        headerActions={
          <>
            {canImportCsv(profile.role) && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    downloadCsvTemplate(
                      'modelo-participantes-vitalizar.csv',
                      NEXTFIT_SAMPLE_CSV_CONTENT
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                  title="Baixar planilha modelo para preenchimento no Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modelo CSV</span>
                </button>
                <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Importar Planilha CSV</span>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportCsvFile(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </>
            )}

            {canExportSensitiveCsv(profile.role) && (
              <button
                type="button"
                onClick={handleExportSensitiveCsv}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
                title="Exportar CSV (registrado em audit_logs)"
              >
                <Download className="w-3.5 h-3.5 text-[#0284c7]" />
                <span>Exportar CSV</span>
              </button>
            )}

            <button
              type="button"
              onClick={openNewDrawer}
              className="px-3.5 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Aluno</span>
            </button>
          </>
        }
      />

      <PainelLateral
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        title={isNew ? 'Cadastrar Novo Participante' : `Editar: ${formName}`}
        subtitle="Dados sensíveis são gravados separadamente em /participant_private (LGPD)"
        saveState={saveState}
        onSave={handleSaveParticipant}
      >
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Projeto / Turma Vinculada *
            </label>
            <select
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {allowedProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CampoTexto
              label="Nome Completo"
              value={formName}
              onChange={setFormName}
              required
              classification="público"
            />
            <CampoTexto
              label="Apelido Esportivo"
              value={formNickname}
              onChange={setFormNickname}
              classification="público"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <CampoTexto
              label="Categoria"
              value={formCategory}
              onChange={setFormCategory}
              classification="público"
            />
            <CampoTexto
              label="Posição"
              value={formPosition}
              onChange={setFormPosition}
              classification="público"
            />
            <CampoTexto
              label="Nº Camisa"
              type="number"
              value={formJersey}
              onChange={setFormJersey}
              classification="público"
            />
          </div>

          <CampoUploadImagem
            label="Foto do Aluno / Atleta"
            value={formPhotoUrl}
            onChange={setFormPhotoUrl}
            classification="público"
          />

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Dados Protegidos de Menor & Saúde (Coleção Privada LGPD)
              </span>
              <SeloSensivel level="sensível" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <CampoTexto
                label="Data de Nascimento"
                type="date"
                value={formBirthDate}
                onChange={setFormBirthDate}
                classification="sensível"
              />
              <CampoTexto
                label="Idade"
                type="number"
                value={formAge}
                onChange={setFormAge}
                classification="sensível"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <CampoTexto
                label="Altura"
                value={formHeight}
                onChange={setFormHeight}
                placeholder="Ex: 1,65m"
                classification="sensível"
              />
              <CampoTexto
                label="Peso"
                value={formWeight}
                onChange={setFormWeight}
                placeholder="Ex: 54kg"
                classification="sensível"
              />
              <CampoTexto
                label="IMC"
                value={formBmi}
                onChange={setFormBmi}
                placeholder="Ex: 19.8"
                classification="sensível"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="Unidade Escolar"
                value={formSchoolName}
                onChange={setFormSchoolName}
                classification="sensível"
              />
              <CampoTexto
                label="Série / Ano Escolar"
                value={formSchoolGrade}
                onChange={setFormSchoolGrade}
                classification="sensível"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="Responsável Legal"
                value={formResponsible}
                onChange={setFormResponsible}
                classification="sensível"
              />
              <CampoTexto
                label="Código NextFit"
                value={formNextfitCode}
                onChange={setFormNextfitCode}
                classification="interno"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CampoTexto
                label="Telefone do Responsável"
                type="tel"
                value={formPhone}
                onChange={setFormPhone}
                classification="sensível"
              />
              <CampoTexto
                label="E-mail do Responsável"
                type="email"
                value={formEmail}
                onChange={setFormEmail}
                classification="sensível"
              />
            </div>
          </div>
        </div>
      </PainelLateral>

      <ConfirmarExclusao
        isOpen={Boolean(deleteTarget)}
        itemName={deleteTarget?.participant.name || ''}
        itemTypeLabel="participante"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
