import type { VitalizarEvent, EventCategory } from '../types/index.ts';

export interface FilterOptions {
  category?: EventCategory | 'all';
  searchQuery?: string;
  month?: string; // e.g., '10', '11', '12' or 'all'
}

export function filterEvents(
  events: VitalizarEvent[],
  options: FilterOptions
): VitalizarEvent[] {
  const { category = 'all', searchQuery = '', month = 'all' } = options;
  const q = searchQuery.trim().toLowerCase();

  return events.filter((ev) => {
    // Category match
    if (category !== 'all' && ev.category !== category) {
      return false;
    }

    // Month match ('YYYY-MM-DD' -> parts[1])
    if (month !== 'all') {
      const eventMonth = ev.date.split('-')[1];
      if (eventMonth !== month) {
        return false;
      }
    }

    // Search query match
    if (q) {
      const matchTitle = ev.title.toLowerCase().includes(q);
      const matchDesc = ev.description.toLowerCase().includes(q);
      const matchLoc = ev.location.toLowerCase().includes(q);
      const matchCoord = ev.coordinator.toLowerCase().includes(q);
      const matchAudience = ev.targetAudience.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchCoord && !matchAudience) {
        return false;
      }
    }

    return true;
  });
}

export function sortEventsByDate(
  events: VitalizarEvent[],
  ascending = true
): VitalizarEvent[] {
  return [...events].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return ascending ? diff : -diff;
  });
}

export function validateEventRSVP(
  event: VitalizarEvent,
  requestedSpots: number = 1
): { valid: boolean; reason: string } {
  if (requestedSpots <= 0) {
    return { valid: false, reason: 'Selecione ao menos 1 vaga.' };
  }

  if (event.availableSpots <= 0) {
    return { valid: false, reason: 'Inscrições encerradas. Capacidade máxima atingida.' };
  }

  if (requestedSpots > event.availableSpots) {
    return {
      valid: false,
      reason: `Restam apenas ${event.availableSpots} vaga(s) disponível(is).`,
    };
  }

  return { valid: true, reason: 'Vagas disponíveis para confirmação imediata.' };
}

export function generateGoogleCalendarUrl(event: VitalizarEvent): string {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const title = encodeURIComponent(`${event.title} - Associação Esportiva Vitalizar`);
  const details = encodeURIComponent(
    `${event.description}\n\nCoordenação: ${event.coordinator}\nPúblico-alvo: ${event.targetAudience}\nLocal: ${event.location} (${event.address})`
  );
  const location = encodeURIComponent(`${event.location}, ${event.address}, Cariacica - ES`);

  // Construct approximate start and end times in ISO format (UTC simple format)
  // Assuming date format YYYY-MM-DD and start hour e.g. 09:00 -> 12:00
  const dateFormatted = event.date.replace(/-/g, '');
  const dates = `${dateFormatted}T120000Z/${dateFormatted}T150000Z`;

  return `${baseUrl}&text=${title}&details=${details}&location=${location}&dates=${dates}`;
}
