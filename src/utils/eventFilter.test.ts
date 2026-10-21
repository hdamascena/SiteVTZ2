import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterEvents,
  sortEventsByDate,
  validateEventRSVP,
  generateGoogleCalendarUrl,
} from './eventFilter.ts';
import type { VitalizarEvent } from '../types/index.ts';

const mockEvents: VitalizarEvent[] = [
  {
    id: 'ev-1',
    title: 'Clínica de Futsal: Transições Ofensivas',
    category: 'clinica_esportiva',
    categoryLabel: 'Clínica Esportiva',
    date: '2026-10-24',
    formattedDate: '24 de Outubro de 2026',
    dayNumber: '24',
    monthShort: 'OUT',
    time: '09:00 às 12:00',
    location: 'Polo Rio Marinho',
    address: 'Rua Quatro, 173',
    targetAudience: 'Jovens de 10 a 16 anos',
    coordinator: 'Prof. Gabriel Guedes Venâncio',
    capacity: 40,
    availableSpots: 12,
    isFree: true,
    description: 'Aprimoramento técnico e tático.',
    status: 'inscricoes_abertas',
  },
  {
    id: 'ev-2',
    title: 'Oficina Comunitária de Primeiros Socorros',
    category: 'oficina_comunitaria',
    categoryLabel: 'Oficina Comunitária',
    date: '2026-11-07',
    formattedDate: '07 de Novembro de 2026',
    dayNumber: '07',
    monthShort: 'NOV',
    time: '14:00 às 17:00',
    location: 'Sede Administrativa',
    address: 'Rua Quatro, 173',
    targetAudience: 'Comunidade geral e voluntários',
    coordinator: 'Dra. Mariana Rezende',
    capacity: 30,
    availableSpots: 5,
    isFree: true,
    description: 'Orientações práticas de segurança esportiva.',
    status: 'vagas_limitadas',
  },
  {
    id: 'ev-3',
    title: 'Assembleia Geral Ordinária (Art. 30)',
    category: 'reuniao_associacao',
    categoryLabel: 'Reunião da Associação',
    date: '2026-10-31',
    formattedDate: '31 de Outubro de 2026',
    dayNumber: '31',
    monthShort: 'OUT',
    time: '19:00 às 21:00',
    location: 'Auditório Comunitário',
    address: 'Rio Marinho, Cariacica',
    targetAudience: 'Associados, conselheiros e voluntários',
    coordinator: 'Diretoria Executiva Vitalizar',
    capacity: 80,
    availableSpots: 0,
    isFree: true,
    description: 'Apresentação das contas e relatórios.',
    status: 'confirmado',
  },
];

test('filters events by category accurately', () => {
  const clinics = filterEvents(mockEvents, { category: 'clinica_esportiva' });
  assert.equal(clinics.length, 1);
  assert.equal(clinics[0].id, 'ev-1');

  const workshops = filterEvents(mockEvents, { category: 'oficina_comunitaria' });
  assert.equal(workshops.length, 1);
  assert.equal(workshops[0].id, 'ev-2');

  const meetings = filterEvents(mockEvents, { category: 'reuniao_associacao' });
  assert.equal(meetings.length, 1);
  assert.equal(meetings[0].id, 'ev-3');

  const all = filterEvents(mockEvents, { category: 'all' });
  assert.equal(all.length, 3);
});

test('filters events by month', () => {
  const october = filterEvents(mockEvents, { month: '10' });
  assert.equal(october.length, 2);

  const november = filterEvents(mockEvents, { month: '11' });
  assert.equal(november.length, 1);
});

test('filters events by text search across title, desc, and coordinator', () => {
  const searchFutsal = filterEvents(mockEvents, { searchQuery: 'futsal' });
  assert.equal(searchFutsal.length, 1);

  const searchMariana = filterEvents(mockEvents, { searchQuery: 'Mariana' });
  assert.equal(searchMariana.length, 1);
  assert.equal(searchMariana[0].id, 'ev-2');

  const noResults = filterEvents(mockEvents, { searchQuery: 'inexistente xyz' });
  assert.equal(noResults.length, 0);
});

test('sorts events chronologically', () => {
  const sortedAsc = sortEventsByDate(mockEvents, true);
  assert.equal(sortedAsc[0].id, 'ev-1'); // Oct 24
  assert.equal(sortedAsc[1].id, 'ev-3'); // Oct 31
  assert.equal(sortedAsc[2].id, 'ev-2'); // Nov 07
});

test('validates event RSVP capacity limits', () => {
  // Available 12, request 2 -> valid
  const res1 = validateEventRSVP(mockEvents[0], 2);
  assert.equal(res1.valid, true);

  // Available 12, request 15 -> invalid
  const res2 = validateEventRSVP(mockEvents[0], 15);
  assert.equal(res2.valid, false);

  // Available 0 -> invalid
  const res3 = validateEventRSVP(mockEvents[2], 1);
  assert.equal(res3.valid, false);

  // Invalid spots 0
  const res4 = validateEventRSVP(mockEvents[0], 0);
  assert.equal(res4.valid, false);
});

test('generates google calendar url containing event details', () => {
  const url = generateGoogleCalendarUrl(mockEvents[0]);
  assert.ok(url.includes('calendar.google.com'));
  assert.ok(url.includes('Vitalizar'));
});
