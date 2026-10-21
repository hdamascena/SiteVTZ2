# Plano de Reconstrução do Painel Administrativo — Associação Esportiva Vitalizar

## 1. Objetivo e Visão Geral
Reconstruir integralmente o Painel Administrativo em uma arquitetura modular (`src/admin/...`), compacta, rápida e em conformidade com a LGPD para proteção de dados de crianças e adolescentes. O painel contará com controle de acesso baseado em **8 perfis** (equipe interna + comunidade/parceiros), promoção automática/assistida de **Visitante** para **Apoiador** ao realizar doação, área dedicada para **Parceiros**, gestão completa do ciclo de **Inscrições nos Projetos** (da solicitação à matrícula na turma), separação física dos dados sensíveis em coleção privada no Firestore, log de auditoria imutável e alternância entre modo claro e escuro no topo.

---

## 2. Perfis de Acesso (RBAC) e Fluxo de Convites / Cadastro

### 2.1 Perfis da Equipe Interna (`/admins/{uid}`)
- **`super_admin`** (`higor.rock2011@gmail.com`): acesso total, incluindo gestão de todos os usuários, convites, perfis e configurações críticas.
- **`admin`** (coordenação/diretoria): acesso a todo o conteúdo, gestão de inscrições nos projetos, aprovação de doações/apoiadores, parceiros e dados sensíveis. Não pode criar nem alterar `super_admin`.
- **`editor`** (comunicação): gerencia notícias, eventos, galeria, patrocinadores, banners e páginas institucionais. Nunca visualiza dados pessoais ou sensíveis.
- **`professor`**: restrito aos projetos listados em `projectIds`. Visualiza e gerencia as **inscrições nos seus projetos**, edita participantes da turma, realiza chamadas em `attendance_sessions` e consulta `rsvps`. Não importa nem exporta CSV de menores, não apaga registros e não vê doações nem mensagens gerais.
- **`financeiro`**: leitura e conferência de `transparency_docs`, configuração do PIX e gestão/confirmação de registros em `donation_pledges` (incluindo validação que promove o doador ao perfil `apoiador`).

### 2.2 Perfis da Comunidade e Rede Externa (`/admins/{uid}`)
- **`visitante`**:
  - Perfil inicial para qualquer pessoa autenticada sem convite de equipe interna (auto-registro seguro como `role: 'visitante'`).
  - Pode realizar e acompanhar suas próprias **inscrições em projetos e eventos**, atualizar seus dados básicos de contato e registrar doações via PIX.
- **`apoiador`** *(concedido aos visitantes que fizeram doação)*:
  - Quando um `visitante` registra uma doação em `donation_pledges` (automaticamente ao registrar doação vinculada à conta ou ao ter a doação confirmada por `admin`/`financeiro`), seu perfil é atualizado para `apoiador`.
  - Conta com selo oficial **"Apoiador Vitalizar"**, histórico de doações realizadas, recibos/comprovantes de apoio e painel de acompanhamento do impacto social e transparência financeira.
- **`parceiro`** *(patrocinadores, instituições parceiras e clubes/olheiros credenciados)*:
  - Atribuído via convite (`/admin_invites/{email}`) ou promoção por `admin`/`super_admin`.
  - Acessa visão dedicada com indicadores de impacto dos projetos apoiados, documentos de prestação de contas, atualização dos dados institucionais da sua marca parceira e acompanhamento de solicitações técnicas (`scout_inquiries`).

### 2.3 Fluxo de Convite e Auto-Cadastro
- **Equipe e Parceiros via Convite (`/admin_invites/{email}`)**:
  - `admin` ou `super_admin` cadastra o e-mail e o perfil (`admin`, `editor`, `professor`, `financeiro`, `parceiro`) em `/admin_invites/{email}`.
  - No primeiro login com e-mail verificado, o usuário cria `/admins/{uid}` com o perfil exato do convite.
- **Visitante e Promoção para Apoiador**:
  - Usuário autenticado sem convite pode criar seu próprio `/admins/{uid}` apenas com `role: 'visitante'` e `ativo: true`.
  - Ao registrar doação em `donation_pledges` (ou quando `admin`/`financeiro`/`super_admin` confirma a doação), o perfil passa para `role: 'apoiador'`.
- **Bloqueio Imediato**: alterar `ativo: false` bloqueia o acesso imediatamente nas regras do Firestore e na interface.

---

## 3. Gestão Completa de Inscrições nos Projetos
- **Fluxo de Ponta a Ponta (`rsvps` / `project_enrollments`)**:
  - Cada inscrição em projeto armazena: `projectId`, `projectName`, `modalityOrClass`, dados do aluno/participante, responsável (quando menor), contato (mascarado por LGPD), `status` (`pendente` | `em_analise` | `aprovada` | `lista_espera` | `recusada`), `userId` (do visitante/apoiador que inscreveu) e `createdAt`.
- **Painel de Gestão de Inscrições (`src/admin/views/InscricoesProjetosView.tsx`)**:
  - Acessível para `super_admin`, `admin` (todos os projetos) e `professor` (apenas projetos em `projectIds`), além da visão "Minhas Inscrições" para `visitante` e `apoiador`.
  - Filtros rápidos por **Projeto**, **Turma/Modalidade**, **Status da Inscrição** (`Pendente`, `Em Análise`, `Aprovada`, `Lista de Espera`, `Recusada`) e busca por nome/protocolo.
  - **Matrícula em 1 Clique ("Aprovar e Matricular na Turma")**:
    - Ao aprovar uma inscrição de projeto, o sistema cria/atualiza o participante público em `/projects/{projectId}` (atualizando automaticamente a ocupação de vagas `filledSpots` / `availableSpots`) e grava os dados sensíveis em `/participant_private/{participantId}`, registrando a ação em `audit_logs`.
    - Se a turma estiver lotada, permite mover para **Lista de Espera** com registro de prioridade.

---

## 4. Proteção de Dados Pessoais (LGPD) e Classificação da Informação
- **Três níveis de classificação (`público`, `interno`, `sensível`)**:
  - **Selo Visual**: `<SeloSensivel />` ao lado de cada campo sensível (dados de menores, saúde/IMC/peso, escola, data de nascimento, telefone, e-mail, doações e chamada).
  - **Máscara com Auditoria**: Telefone e e-mail ficam ocultos com máscara até o usuário autorizado clicar em **"Mostrar"**, ação que grava imediatamente um registro em `audit_logs`.
- **Separação em Coleção Privada (`/participant_private/{participantId}`)**:
  - `/projects/{projectId}` (público) mantém apenas dados públicos de vitrine dos atletas (nome, apelido, foto, posição, camisa, categoria, atributos esportivos, vídeos e fotos).
  - `/participant_private/{participantId}` (privado) guarda `birthDate`, `weight`, `height`, `bmi`, `schoolInfo`, `nextfitCode`, `planName`, contatos do responsável e observações pedagógicas/saúde.
- **Remoção de Ferramentas de Admin do Site Público**:
  - `ProjectDetailPage.tsx`, `SubpageView.tsx`, `PlayerCard.tsx` e `PlayerScoutModal.tsx` exibem apenas informações públicas para visitantes, removendo importação/exportação CSV, transferência de alunos e tabelas com dados escolares/biométricos.
- **Importação e Exportação CSV (NextFit)**:
  - Restritas exclusivamente a `admin` e `super_admin`, com gravação obrigatória em `audit_logs`.

---

## 5. Regras de Segurança do Firestore (`firestore.rules`)
- Funções centrais:
  - `role()`: lê `/admins/$(request.auth.uid).data.role` (ou `'super_admin'` para `higor.rock2011@gmail.com`).
  - `isActive()`: verifica se o usuário está autenticado e ativo.
  - `hasRole(roles)`: verifica se o perfil ativo pertence à lista `roles`.
  - `teachesProject(projectId)`: verifica se `role() == 'professor'` e `projectId` está em `projectIds`.
- Permissões para os novos perfis:
  - `visitante` e `apoiador`: podem criar inscrições (`rsvps`) e doações (`donation_pledges`) e ler os seus próprios registros (`resource.data.userId == request.auth.uid` ou `resource.data.email == request.auth.token.email`); `visitante` pode atualizar seu próprio perfil para `apoiador` mediante doação registrada, e `admin`/`financeiro`/`super_admin` também podem promover/gerenciar.
  - `parceiro`: lê relatórios de transparência, projetos e acompanha suas solicitações em `scout_inquiries` / parcerias.
  - `professor`: lê e atualiza inscrições (`rsvps`) e dados de participantes dos projetos em que `teachesProject(projectId)` é verdadeiro.
- Tabela completa `perfil × coleção × permissão` documentada em comentário ao final de `firestore.rules` e implantada via deploy de regras.

---

## 6. Arquitetura Modular e Interface (`src/admin/...`)
- **Componentes Reutilizáveis**:
  - `src/admin/components/Tabela.tsx`: tabela compacta com ordenação, busca e filtros.
  - `src/admin/components/PainelLateral.tsx`: edição lateral rápida com indicador `"Salvando…"` / `"Salvo"` por item.
  - `src/admin/components/CampoTexto.tsx`: campo com suporte a `<SeloSensivel />` e máscara auditada.
  - `src/admin/components/ConfirmarExclusao.tsx`: confirmação digitando o nome do item + Toast com **"Desfazer"** por 10 segundos.
- **Telas por Módulo e Perfil**:
  - `DashboardHome.tsx`: visão adaptada para `super_admin`/`admin` (pendências, inscrições novas, mensagens, doações), `professor` ("Minhas turmas hoje", chamada rápida, inscrições pendentes da turma, alunos com faltas recentes), `editor` (rascunhos e publicações), `financeiro` (doações PIX, apoiadores e transparência), `parceiro` (impacto dos projetos, transparência e solicitações técnicas) e `visitante`/`apoiador` (minhas inscrições nos projetos, certificado/selo de Apoiador e histórico de doações).
  - `InscricoesProjetosView.tsx`: gerenciamento completo de inscrições nos projetos, vagas por turma, aprovação com matrícula automática e lista de espera.
  - `ChamadaQuadraView.tsx`: chamada mobile rápida para professores na quadra (1 aluno por linha, botões grandes Presente / Falta / Justificada, salvar com 1 toque).
  - `ParticipantesView.tsx`: fichas completas dos alunos (público + `/participant_private`) e CSV restrito a `admin`/`super_admin`.
  - `ConteudoView.tsx`, `ComunidadeView.tsx` (incluindo gestão de Apoiadores e Parceiros) e `UsuariosLogView.tsx` (gestão de todos os 8 perfis, convites e auditoria filtrável).
