/**
 * Regras estatutárias e cálculos da Associação Esportiva Vitalizar
 * Baseado no Estatuto Social (Art. 6º, 9º, 26 e 30) - Cariacica/ES
 */

export interface VitalizarCategoryConfig {
  id: 'contribuinte_individual' | 'contribuinte_familiar' | 'colaborador' | 'social_gratuito' | 'apoiador_master';
  label: string;
  monthlyFee: number;
  description: string;
  includesVotingRights: boolean;
  isExempt: boolean;
}

export const VITALIZAR_CATEGORIES: Record<string, VitalizarCategoryConfig> = {
  contribuinte_individual: {
    id: 'contribuinte_individual',
    label: 'Associado Contribuinte Individual',
    monthlyFee: 35.00,
    description: 'Acesso às atividades esportivas, condicionamento físico e assembleias',
    includesVotingRights: true,
    isExempt: false,
  },
  contribuinte_familiar: {
    id: 'contribuinte_familiar',
    label: 'Associado Contribuinte Familiar',
    monthlyFee: 60.00,
    description: 'Titular e dependentes (cônjuge e filhos) em todas as oficinas e escolinhas',
    includesVotingRights: true,
    isExempt: false,
  },
  colaborador: {
    id: 'colaborador',
    label: 'Associado Colaborador / Voluntário',
    monthlyFee: 0,
    description: 'Atuação voluntária em projetos comunitários (Art. 6º, III do Estatuto)',
    includesVotingRights: false,
    isExempt: true,
  },
  social_gratuito: {
    id: 'social_gratuito',
    label: 'Beneficiário de Projeto Social / Gratuidade',
    monthlyFee: 0,
    description: 'Crianças, adolescentes e famílias em vulnerabilidade social atendidas pelo SUAS/Projetos',
    includesVotingRights: false,
    isExempt: true,
  },
  apoiador_master: {
    id: 'apoiador_master',
    label: 'Associado Mantenedor / Apoiador',
    monthlyFee: 120.00,
    description: 'Contribuição solidária para manutenção das bolsas esportivas comunitárias',
    includesVotingRights: true,
    isExempt: false,
  },
};

export interface MembershipInput {
  category: keyof typeof VITALIZAR_CATEGORIES;
  additionalDonation?: number;
  dependentsCount?: number;
}

export interface MembershipCalculationResult {
  monthlyFee: number;
  donationFee: number;
  totalMonthly: number;
  description: string;
  hasVotingRight: boolean;
  statusText: string;
}

export function calculateVitalizarMembership(input: MembershipInput): MembershipCalculationResult {
  const cat = VITALIZAR_CATEGORIES[input.category] || VITALIZAR_CATEGORIES.contribuinte_individual;
  const donation = Math.max(0, input.additionalDonation || 0);

  const baseMonthly = cat.monthlyFee;
  const total = baseMonthly + donation;

  let statusText = `Categoria ${cat.label}`;
  if (cat.isExempt) {
    statusText = 'Isento de mensalidade estatutária conforme Art. 6º do Estatuto';
  } else if (donation > 0) {
    statusText = `Mensalidade R$ ${baseMonthly.toFixed(2)} + Doação Solidária R$ ${donation.toFixed(2)}`;
  }

  return {
    monthlyFee: baseMonthly,
    donationFee: donation,
    totalMonthly: total,
    description: cat.description,
    hasVotingRight: cat.includesVotingRights,
    statusText,
  };
}

export interface ActivityEnrollmentLimit {
  modalityType: 'iniciacao_esportiva' | 'condicionamento_fisico' | 'danca_cultura' | 'esporte_adaptado' | 'vida_ativa_idosos';
  maxClassCapacity: number;
  minAge: number;
  maxAge: number;
  requiresMedicalClearance: boolean;
}

export const MODALITY_LIMITS: Record<string, ActivityEnrollmentLimit> = {
  iniciacao_esportiva: {
    modalityType: 'iniciacao_esportiva',
    maxClassCapacity: 30,
    minAge: 6,
    maxAge: 17,
    requiresMedicalClearance: true,
  },
  condicionamento_fisico: {
    modalityType: 'condicionamento_fisico',
    maxClassCapacity: 25,
    minAge: 16,
    maxAge: 75,
    requiresMedicalClearance: true,
  },
  danca_cultura: {
    modalityType: 'danca_cultura',
    maxClassCapacity: 20,
    minAge: 5,
    maxAge: 85,
    requiresMedicalClearance: false,
  },
  esporte_adaptado: {
    modalityType: 'esporte_adaptado',
    maxClassCapacity: 15,
    minAge: 5,
    maxAge: 65,
    requiresMedicalClearance: true,
  },
  vida_ativa_idosos: {
    modalityType: 'vida_ativa_idosos',
    maxClassCapacity: 25,
    minAge: 60,
    maxAge: 99,
    requiresMedicalClearance: true,
  },
};

export function validateActivityEnrollment(
  modalityKey: string,
  age: number,
  currentEnrollments: number
): { valid: boolean; reason: string } {
  const limit = MODALITY_LIMITS[modalityKey] || MODALITY_LIMITS.iniciacao_esportiva;

  if (age < limit.minAge || age > limit.maxAge) {
    return {
      valid: false,
      reason: `A idade (${age} anos) deve estar entre ${limit.minAge} e ${limit.maxAge} anos para esta modalidade.`,
    };
  }

  if (currentEnrollments >= limit.maxClassCapacity) {
    return {
      valid: false,
      reason: `Turma lotada! Capacidade máxima de ${limit.maxClassCapacity} vagas atingida. Fila de espera aberta.`,
    };
  }

  return {
    valid: true,
    reason: `Inscrição regular permitida. Vagas disponíveis: ${limit.maxClassCapacity - currentEnrollments}/${limit.maxClassCapacity}.`,
  };
}
