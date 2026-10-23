import type {
  NextFitCsvAthleteRow,
  ProjectParticipant,
  VitalizarProject,
} from '../types/index.ts';

/**
 * Sample Next Fit CSV content (Brazilian Excel semicolon-separated format)
 * Strictly NO contact/phone/email/CPF columns per privacy requirements.
 */
export const NEXTFIT_SAMPLE_CSV_CONTENT = [
  'Codigo NextFit;Nome do Atleta;Data de Nascimento;Idade;Situacao Matricula;Modalidade / Turma;Plano / Contrato;Posicao;Altura (m);Peso (kg);Escola;Observacoes Avaliacao Fisica',
  'NF-1001;Participante Exemplo 1;01/01/2012;14;Ativo;Futsal Iniciação Sub-15;Projeto Social Manhã;Meio-Campista;1,65;55kg;Unidade Escolar;Observação de avaliação física',
  'NF-1002;Participante Exemplo 2;01/01/2013;13;Ativo;Futsal Base Sub-13;Projeto Social Tarde;Defensor;1,60;50kg;Unidade Escolar;Observação de avaliação física',
].join('\r\n');

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80',
];

function stripAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function calculateAgeFromBirthDate(rawDate: string): number | null {
  if (!rawDate) return null;
  const cleaned = rawDate.trim();
  // Match DD/MM/YYYY
  const brMatch = cleaned.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brMatch) {
    const year = Number(brMatch[3]);
    if (year >= 1940 && year <= 2026) {
      return Math.max(4, 2026 - year);
    }
  }
  // Match YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    if (year >= 1940 && year <= 2026) {
      return Math.max(4, 2026 - year);
    }
  }
  // Match just 4-digit year
  const yrOnly = cleaned.match(/^(\d{4})$/);
  if (yrOnly) {
    const year = Number(yrOnly[1]);
    if (year >= 1940 && year <= 2026) {
      return Math.max(4, 2026 - year);
    }
  }
  return null;
}

function normalizeEnrollmentStatus(
  raw: string
): 'ativo' | 'trancado' | 'inativo' | 'pendente' {
  const norm = stripAccents(raw || '');
  if (norm.includes('tranc') || norm.includes('suspens') || norm.includes('congel')) {
    return 'trancado';
  }
  if (
    norm.includes('inativ') ||
    norm.includes('cancel') ||
    norm.includes('encerr') ||
    norm.includes('exclu') ||
    norm.includes('bloque')
  ) {
    return 'inativo';
  }
  if (norm.includes('pendent') || norm.includes('atras') || norm.includes('vencid')) {
    return 'pendente';
  }
  return 'ativo';
}

function inferCategoryFromAgeOrModality(age: number, modality: string): string {
  const modNorm = stripAccents(modality);
  if (modNorm.includes('sub-11') || modNorm.includes('sub 11')) return 'Sub-11';
  if (modNorm.includes('sub-13') || modNorm.includes('sub 13')) return 'Sub-13';
  if (modNorm.includes('sub-15') || modNorm.includes('sub 15')) return 'Sub-15';
  if (modNorm.includes('sub-17') || modNorm.includes('sub 17')) return 'Sub-17';
  if (modNorm.includes('sub-20') || modNorm.includes('sub 20')) return 'Sub-20';
  if (modNorm.includes('terceira idade') || modNorm.includes('60+') || age >= 50) {
    return 'Vida Ativa 60+';
  }
  if (age <= 11) return 'Sub-11';
  if (age <= 13) return 'Sub-13';
  if (age <= 15) return 'Sub-15';
  if (age <= 17) return 'Sub-17';
  if (age <= 20) return 'Sub-20';
  return 'Adulto / Livre';
}

function inferPositionGroup(
  position: string
): 'ataque' | 'meio' | 'defesa' | 'goleiro' {
  const norm = stripAccents(position);
  if (norm.includes('goleir') || norm.includes('arqueir')) return 'goleiro';
  if (
    norm.includes('zagueir') ||
    norm.includes('defens') ||
    norm.includes('lateral') ||
    norm.includes('fixo') ||
    norm.includes('libero')
  ) {
    return 'defesa';
  }
  if (
    norm.includes('atacant') ||
    norm.includes('ponta') ||
    norm.includes('centroavant') ||
    norm.includes('pivo')
  ) {
    return 'ataque';
  }
  return 'meio';
}

function formatHeightAndBmi(rawHeight: string, rawWeight: string): {
  heightFormatted: string;
  weightFormatted: string;
  bmiFormatted: string;
} {
  const numH = parseFloat((rawHeight || '').replace(',', '.').replace(/[^0-9.]/g, ''));
  const numW = parseFloat((rawWeight || '').replace(',', '.').replace(/[^0-9.]/g, ''));

  let heightMeters = 1.68;
  if (!Number.isNaN(numH) && numH > 0) {
    heightMeters = numH > 3 ? numH / 100 : numH;
  }
  let weightKg = 58;
  if (!Number.isNaN(numW) && numW > 0) {
    weightKg = numW;
  }

  const bmiVal = weightKg / (heightMeters * heightMeters);
  return {
    heightFormatted: `${heightMeters.toFixed(2).replace('.', ',')}m`,
    weightFormatted: `${Math.round(weightKg)}kg`,
    bmiFormatted: Number.isFinite(bmiVal) ? bmiVal.toFixed(1) : '20.5',
  };
}

export function matchProjectForModality(
  modalityOrClass: string,
  projects: VitalizarProject[]
): string | undefined {
  if (!projects.length) return undefined;
  const modNorm = stripAccents(modalityOrClass);
  if (!modNorm) return projects[0].id;

  for (const proj of projects) {
    const pName = stripAccents(proj.name);
    if (
      pName.includes(modNorm) ||
      modNorm.includes(pName) ||
      (modNorm.includes('futsal') && pName.includes('futsal')) ||
      (modNorm.includes('futebol') && (pName.includes('futebol') || pName.includes('campo') || pName.includes('talento') || pName.includes('campeoes'))) ||
      (modNorm.includes('volei') && pName.includes('volei')) ||
      (modNorm.includes('saude') && pName.includes('saude')) ||
      (modNorm.includes('idos') && pName.includes('ativa'))
    ) {
      return proj.id;
    }
  }
  return projects[0].id;
}

/**
 * Parses a Next Fit CSV export string into sanitized NextFitCsvAthleteRow records.
 * Contact columns (phone, whatsapp, email, cpf, address) are intentionally ignored.
 */
export function parseNextFitCsv(
  csvText: string,
  projects: VitalizarProject[],
  defaultProjectId?: string
): {
  rows: NextFitCsvAthleteRow[];
  ignoredContactColumns: string[];
  error?: string;
} {
  const cleanedText = (csvText || '').replace(/^\uFEFF/, '').trim();
  if (!cleanedText) {
    return { rows: [], ignoredContactColumns: [], error: 'O arquivo CSV está vazio.' };
  }

  const rawLines = cleanedText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length < 2) {
    return {
      rows: [],
      ignoredContactColumns: [],
      error: 'O arquivo CSV precisa conter o cabeçalho e pelo menos 1 linha de atleta.',
    };
  }

  const headerLine = rawLines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const tabCount = (headerLine.match(/\t/g) || []).length;

  const delimiter =
    tabCount > semicolonCount && tabCount > commaCount
      ? '\t'
      : semicolonCount >= commaCount
      ? ';'
      : ',';

  const rawHeaders = splitCsvLine(headerLine, delimiter);
  const normHeaders = rawHeaders.map(stripAccents);

  // Track contact/personal columns that are automatically discarded for privacy
  const ignoredContactColumns: string[] = [];
  rawHeaders.forEach((h, i) => {
    const nh = normHeaders[i];
    if (
      nh.includes('telefone') ||
      nh.includes('celular') ||
      nh.includes('whatsapp') ||
      nh.includes('fone') ||
      nh.includes('email') ||
      nh.includes('e-mail') ||
      nh.includes('cpf') ||
      nh.includes('rg') ||
      nh.includes('endereco')
    ) {
      ignoredContactColumns.push(h);
    }
  });

  const findColIndex = (keywords: string[]): number => {
    for (const kw of keywords) {
      const idx = normHeaders.findIndex((h) => h === kw || h.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxCode = findColIndex(['codigo', 'id', 'matricula', 'nextfit']);
  const idxName = findColIndex(['nome', 'atleta', 'aluno', 'participante', 'cliente']);
  const idxBirth = findColIndex(['nascimento', 'data de nasc', 'dt nasc', 'aniversario']);
  const idxAge = findColIndex(['idade', 'anos']);
  const idxStatus = findColIndex(['situacao', 'status', 'status matricula', 'condicao']);
  const idxProject = findColIndex(['projeto vinculado', 'projeto', 'nucleo']);
  const idxModality = findColIndex(['modalidade', 'turma', 'categoria', 'esporte']);
  const idxPlan = findColIndex(['plano', 'contrato', 'bolsa', 'pacote']);
  const idxPos = findColIndex(['posicao', 'funcao', 'atuacao']);
  const idxHeight = findColIndex(['altura', 'estatura']);
  const idxWeight = findColIndex(['peso', 'massa']);
  const idxSchool = findColIndex(['escola', 'colegio', 'ensino', 'instituicao']);
  const idxNotes = findColIndex(['observac', 'avaliacao', 'parecer', 'fisic', 'destaque', 'nota']);
  const idxPhoto = findColIndex(['foto', 'imagem', 'avatar', 'url']);

  const rows: NextFitCsvAthleteRow[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const cols = splitCsvLine(rawLines[i], delimiter);
    if (cols.every((c) => !c)) continue;

    const rawName = idxName !== -1 ? cols[idxName] : cols[1] || cols[0] || '';
    const name = (rawName || '').trim();
    if (!name) continue;

    const rawCode = idxCode !== -1 ? cols[idxCode] : '';
    const nextfitCode = (rawCode || '').trim() || `NF-${1000 + i}`;

    const birthDate = (idxBirth !== -1 ? cols[idxBirth] : '').trim();
    const rawAgeStr = (idxAge !== -1 ? cols[idxAge] : '').replace(/\D/g, '');
    const parsedAge =
      (rawAgeStr ? Number(rawAgeStr) : null) ||
      calculateAgeFromBirthDate(birthDate) ||
      14;

    const enrollmentStatus = normalizeEnrollmentStatus(
      idxStatus !== -1 ? cols[idxStatus] : 'Ativo'
    );
    const explicitProjectCol = (idxProject !== -1 ? cols[idxProject] : '').trim();
    const modalityOrClass =
      (idxModality !== -1 ? cols[idxModality] : explicitProjectCol).trim() ||
      'Formação Esportiva Base';
    const planName =
      (idxPlan !== -1 ? cols[idxPlan] : '').trim() || 'Matrícula Next Fit';
    const position =
      (idxPos !== -1 ? cols[idxPos] : '').trim() || 'Atleta / Polivalente';

    const { heightFormatted, weightFormatted, bmiFormatted } = formatHeightAndBmi(
      idxHeight !== -1 ? cols[idxHeight] : '',
      idxWeight !== -1 ? cols[idxWeight] : ''
    );

    const category = inferCategoryFromAgeOrModality(parsedAge, modalityOrClass);
    const schoolName =
      (idxSchool !== -1 ? cols[idxSchool] : '').trim() ||
      'Rede Municipal de Ensino';
    const notes =
      (idxNotes !== -1 ? cols[idxNotes] : '').trim() ||
      `Sincronizado via planilha Next Fit (${modalityOrClass}).`;
    const photoUrl =
      (idxPhoto !== -1 && cols[idxPhoto]?.startsWith('http')
        ? cols[idxPhoto].trim()
        : '') || DEFAULT_AVATARS[i % DEFAULT_AVATARS.length];

    const matchedTargetProjectId =
      defaultProjectId && defaultProjectId !== 'auto'
        ? defaultProjectId
        : matchProjectForModality(explicitProjectCol || modalityOrClass, projects);

    rows.push({
      id: `nf-row-${Date.now()}-${i}`,
      nextfitCode,
      name,
      age: parsedAge,
      birthDate: birthDate || `${2026 - parsedAge}`,
      enrollmentStatus,
      modalityOrClass,
      planName,
      category,
      position,
      height: heightFormatted,
      weight: weightFormatted,
      bmi: bmiFormatted,
      schoolName,
      notes,
      photoUrl,
      targetProjectId: matchedTargetProjectId,
    });
  }

  if (rows.length === 0) {
    return {
      rows: [],
      ignoredContactColumns,
      error: 'Nenhum atleta válido foi encontrado nas linhas da planilha.',
    };
  }

  return { rows, ignoredContactColumns };
}

/**
 * Converts a NextFitCsvAthleteRow into a complete ProjectParticipant object
 * (strictly without any phone/email/contact information).
 */
export function convertNextFitRowToParticipant(
  row: NextFitCsvAthleteRow,
  indexOffset = 0,
  existingParticipant?: ProjectParticipant
): ProjectParticipant {
  const posGroup = inferPositionGroup(row.position);
  return {
    id: existingParticipant?.id || `ath-nf-${row.nextfitCode.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}-${indexOffset}`,
    name: row.name,
    nickname: existingParticipant?.nickname || row.name.split(' ')[0],
    nextfitCode: row.nextfitCode,
    enrollmentStatus: row.enrollmentStatus,
    modalityOrClass: row.modalityOrClass,
    planName: row.planName,
    bmi: row.bmi,
    lastSyncDate: new Date().toLocaleDateString('pt-BR'),
    photoUrl: existingParticipant?.photoUrl || row.photoUrl,
    jerseyNumber: existingParticipant?.jerseyNumber || ((indexOffset % 18) + 2),
    position: row.position || existingParticipant?.position || 'Meio-Campista',
    positionGroup: posGroup,
    preferredFoot: existingParticipant?.preferredFoot || 'Destro',
    age: row.age || existingParticipant?.age || 14,
    birthDate: row.birthDate || existingParticipant?.birthDate || `${2026 - (row.age || 14)}`,
    category: row.category || existingParticipant?.category || 'Sub-15',
    height: row.height || existingParticipant?.height || '1,68m',
    weight: row.weight || existingParticipant?.weight || '58kg',
    cardTier: row.enrollmentStatus === 'ativo' ? 'destaque' : 'prata',
    stats: existingParticipant?.stats || {
      pace: 82,
      shooting: 78,
      passing: 83,
      dribbling: 81,
      defending: 75,
      physical: 80,
      overall: 81,
    },
    schoolInfo: {
      schoolName: row.schoolName || existingParticipant?.schoolInfo?.schoolName || 'Rede Pública Municipal de Cariacica',
      grade: existingParticipant?.schoolInfo?.grade || 'Ensino Fundamental / Médio',
      turn: existingParticipant?.schoolInfo?.turn || 'Matutino',
      attendanceRate: existingParticipant?.schoolInfo?.attendanceRate || '96%',
    },
    highlights: existingParticipant?.highlights || [
      `${row.modalityOrClass} • Next Fit (${row.nextfitCode})`,
    ],
    scoutReport: existingParticipant?.scoutReport || {
      summary:
        row.notes ||
        `Atleta integrante da turma ${row.modalityOrClass}, com avaliação antropométrica em dia (${row.height}, ${row.weight}, IMC ${row.bmi}).`,
      strengths: ['Comprometimento nos treinos', 'Condicionamento físico', 'Disciplina tática'],
      developmentAreas: ['Evolução contínua de fundamentos'],
      scoutRating: '4.7 / 5.0',
    },
    photos: existingParticipant?.photos || [],
    videos: existingParticipant?.videos || [],
  };
}

/**
 * Merges imported Next Fit rows into existing projects' participants lists.
 * Deduplicates by nextfitCode or case-insensitive name within the target project.
 */
export function mergeNextFitRowsIntoProjects(
  projects: VitalizarProject[],
  rows: NextFitCsvAthleteRow[],
  forcedProjectId?: string
): {
  updatedProjects: VitalizarProject[];
  addedCount: number;
  updatedCount: number;
} {
  let addedCount = 0;
  let updatedCount = 0;

  const projectMap = new Map<string, VitalizarProject>();
  projects.forEach((p) => {
    projectMap.set(p.id, {
      ...p,
      participants: [...(p.participants || [])],
    });
  });

  rows.forEach((row, idx) => {
    const targetId =
      forcedProjectId && forcedProjectId !== 'auto'
        ? forcedProjectId
        : row.targetProjectId || projects[0]?.id;

    if (!targetId || !projectMap.has(targetId)) return;

    const proj = projectMap.get(targetId)!;
    const list = proj.participants || [];
    const existingIdx = list.findIndex(
      (p) =>
        (p.nextfitCode &&
          row.nextfitCode &&
          p.nextfitCode.toLowerCase() === row.nextfitCode.toLowerCase()) ||
        stripAccents(p.name) === stripAccents(row.name)
    );

    const converted = convertNextFitRowToParticipant(row, list.length + idx);

    if (existingIdx !== -1) {
      const prev = list[existingIdx];
      list[existingIdx] = {
        ...prev,
        name: row.name,
        nextfitCode: row.nextfitCode || prev.nextfitCode,
        enrollmentStatus: row.enrollmentStatus,
        modalityOrClass: row.modalityOrClass || prev.modalityOrClass,
        planName: row.planName || prev.planName,
        bmi: row.bmi || prev.bmi,
        lastSyncDate: converted.lastSyncDate,
        age: row.age || prev.age,
        birthDate: row.birthDate || prev.birthDate,
        category: row.category || prev.category,
        position: row.position || prev.position,
        height: row.height || prev.height,
        weight: row.weight || prev.weight,
        schoolInfo: {
          ...prev.schoolInfo,
          schoolName: row.schoolName || prev.schoolInfo?.schoolName || 'Rede Pública Municipal',
        },
        scoutReport: {
          ...prev.scoutReport,
          summary: row.notes || prev.scoutReport?.summary || converted.scoutReport.summary,
        },
      };
      updatedCount++;
    } else {
      list.push(converted);
      addedCount++;
    }

    proj.participants = list;
    proj.filledSpots = list.length;
  });

  return {
    updatedProjects: Array.from(projectMap.values()),
    addedCount,
    updatedCount,
  };
}
