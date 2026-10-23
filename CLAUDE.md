# CLAUDE.md — Associação Esportiva Vitalizar

@AGENTS.md

## Comandos do Projeto
- `npm install` — instala dependências
- `npm run dev` — inicia servidor de desenvolvimento na porta 3000 (`http://localhost:3000`)
- `npm run lint` — valida tipagem TypeScript (`tsc --noEmit`)
- `npm run build` — gera build de produção

## Regras Críticas do Firebase (Consistência com o Ambiente Online)
1. **Configuração e Banco Nomeado**:
   - **NUNCA** altere ou apague `firebase-applet-config.json`.
   - O banco Firestore deste projeto **não é o `(default)`**; ele usa o `firestoreDatabaseId` nomeado:
     `ai-studio-remixassociaoesp-12c540e5-8cfd-44ca-b9ab-b7861fb109db` (no projeto GCP `ceremonial-amulet-314dk`).
   - Sempre importe `db` e `auth` de `src/firebase.ts`. Nunca chame `getFirestore(app)` sem passar `firebaseConfig.firestoreDatabaseId`.
2. **Coleções Firestore e Sincronização (`src/context/ClubDataContext.tsx`)**:
   - Coleções ativas (as mesmas de `firestore.rules`):
     - Públicas: `club_info`, `site_settings`, `projects`, `news_articles`, `events`, `gallery_albums`, `sponsors`, `facility_polos`, `transparency_docs`.
     - Envios de visitantes: `rsvps`, `contact_messages`, `scout_inquiries`, `donation_pledges`, `volunteer_applications`.
     - Administração: `admins`, `admin_invites`, `audit_logs`.
   - Para persistir alterações administrativas no Firestore, utilize `saveAdminChanges(...)` do `useClubData()`.
   - Se criar ou alterar campos nas coleções, atualize também `firebase-blueprint.json` e `firestore.rules` (o deploy das regras `firestore.rules` deve ser feito pelo painel online ou via Firebase CLI apontando para o database ID correto).

## Arquitetura Esportiva e Regras de Negócio
- **Objetivo do Site**: Vitrine institucional e esportiva da Associação Esportiva Vitalizar (Cariacica/ES) para empresas patrocinadoras, atletas e clubes (sem sistema de chamada/frequência).
- **Hierarquia Esportiva**: Projetos (Leis de Incentivo) → Modalidades Esportivas → Times / Turmas (`ProjectTeamClass`).
  - Sempre que alterar `project.teams` ou `project.participants`, envolva o projeto atualizado em `syncProjectSpotsAndTeams(project)` (`src/types/index.ts`) para recalcular automaticamente `filledSpots` e `availableSpots` de cada Time e a soma total do Projeto.
- **Painel Administrativo (`src/admin/`)**:
  - Perfis de acesso: `super_admin`, `admin`, `editor`, `financeiro`, `parceiro` (`src/admin/permissions.ts`).
  - Vitrine de atletas (`ParticipantesView.tsx`) armazena apenas dados públicos esportivos (`sanitizeShowcaseParticipant` para conformidade LGPD).

