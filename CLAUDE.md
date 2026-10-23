# CLAUDE.md — Associação Esportiva Vitalizar

@AGENTS.md

## Comandos do Projeto
- `npm install` — instala dependências
- `npm run dev` — inicia servidor de desenvolvimento (porta 3000)
- `npm run lint` — verifica tipos TypeScript (`tsc --noEmit`)
- `npm run build` — gera build de produção

## Arquitetura Essencial
- **Objetivo do Site**: Vitrine institucional e esportiva da Associação Esportiva Vitalizar (Cariacica/ES) para empresas patrocinadoras, atletas e clubes (sem sistema de chamada/frequência).
- **Hierarquia Esportiva**: Projetos (Leis de Incentivo) → Modalidades Esportivas → Times / Turmas (`ProjectTeamClass`).
  - As vagas preenchidas e disponíveis são calculadas automaticamente por Time e somadas no Projeto via `syncProjectSpotsAndTeams(project)` em `src/types/index.ts`.
- **Estado & Persistência**:
  - `src/context/ClubDataContext.tsx` gerencia o estado global e sincroniza com o Firebase Firestore (`firebase-applet-config.json`).
  - Dados iniciais e do projeto oficial Nº 2606344 ("É Mais do que Esporte, É Vida!") ficam em `src/data/clubeData.ts`.
- **Painel Administrativo (`src/admin/`)**:
  - Perfis de acesso: `super_admin`, `admin`, `editor`, `financeiro`, `parceiro` (`src/admin/permissions.ts`).
  - Vitrine de atletas (`ParticipantesView.tsx`) armazena apenas dados públicos esportivos (conformidade LGPD).
