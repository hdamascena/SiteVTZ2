import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateVitalizarMembership,
  validateActivityEnrollment,
  VITALIZAR_CATEGORIES,
} from './feeCalculator.ts';

test('Vitalizar contribuinte individual monthly fee', () => {
  const result = calculateVitalizarMembership({
    category: 'contribuinte_individual',
  });
  assert.equal(result.monthlyFee, 35.00);
  assert.equal(result.totalMonthly, 35.00);
  assert.equal(result.hasVotingRight, true);
});

test('Vitalizar associado colaborador is exempt according to statute', () => {
  const result = calculateVitalizarMembership({
    category: 'colaborador',
  });
  assert.equal(result.monthlyFee, 0);
  assert.equal(result.totalMonthly, 0);
  assert.equal(result.hasVotingRight, false);
});

test('Vitalizar contribuinte familiar with solidarity donation', () => {
  const result = calculateVitalizarMembership({
    category: 'contribuinte_familiar',
    additionalDonation: 25.00,
  });
  assert.equal(result.monthlyFee, 60.00);
  assert.equal(result.donationFee, 25.00);
  assert.equal(result.totalMonthly, 85.00);
  assert.equal(result.hasVotingRight, true);
});

test('Vitalizar social gratuito for vulnerable families', () => {
  const result = calculateVitalizarMembership({
    category: 'social_gratuito',
  });
  assert.equal(result.monthlyFee, 0);
  assert.equal(result.totalMonthly, 0);
});

test('validate activity enrollment age bounds', () => {
  // Iniciação esportiva is for 6 to 17
  const validYouth = validateActivityEnrollment('iniciacao_esportiva', 10, 15);
  assert.equal(validYouth.valid, true);

  const invalidBaby = validateActivityEnrollment('iniciacao_esportiva', 4, 5);
  assert.equal(invalidBaby.valid, false);

  // Vida ativa idosos is 60+
  const validElder = validateActivityEnrollment('vida_ativa_idosos', 68, 10);
  assert.equal(validElder.valid, true);

  const invalidYouthInElderClass = validateActivityEnrollment('vida_ativa_idosos', 25, 10);
  assert.equal(invalidYouthInElderClass.valid, false);
});

test('validate activity enrollment capacity limit', () => {
  // Max capacity for condicionamento fisico is 25
  const notFull = validateActivityEnrollment('condicionamento_fisico', 30, 20);
  assert.equal(notFull.valid, true);

  const full = validateActivityEnrollment('condicionamento_fisico', 30, 25);
  assert.equal(full.valid, false);
});
