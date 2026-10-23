# Transformação em Vitrine Institucional e Esportiva (Associação Vitalizar)

Reestruturação da plataforma para operar exclusivamente como uma vitrine institucional, esportiva e de transparência voltada a empresas patrocinadoras, clubes observadores, atletas e comunidade — removendo o sistema operacional de chamada de quadra, fichas privadas de responsáveis e perfis internos de turmas.

## User Review & Critical Decisions

> [!IMPORTANT]
> As decisões abaixo refletem o alinhamento confirmado para focar o portal como vitrine institucional e esportiva:

- **Remoção Integral do Sistema de Chamada**: Exclusão do módulo de presença em quadra, alertas de faltas e coleções de sessões de chamada, pois o portal não é um diário de classe operacional.
- **Vitrine de Atletas sem Dados Privados de Responsáveis**: Os perfis de atletas nos projetos exibem apenas informações públicas de vitrine esportiva (nome, apelido, categoria, posição, número da camisa, idade, atributos técnicos, destaques e parecer técnico de olheiros), eliminando o armazenamento e a exigência de dados privados sensíveis de responsáveis, saúde/IMC ou códigos internos de catraca.
- **Formulário Público de Interesse em Projetos e Eventos**: Manutenção da captação pública de interessados em projetos sociais, eventos, voluntariado e contato de olheiros/empresas como canal de relacionamento institucional.
- **Simplificação de Perfis do Painel**: Redução dos níveis de acesso para **Super Admin**, **Admin**, **Editor**, **Financeiro** e **Parceiro** (removendo os perfis operacionais `professor`, `visitante` e `apoiador`, e eliminando o cadastro avulso de visitantes no painel administrativo).

---

## 1. Overview & Core Concept

- **O que a Plataforma Faz**: Apresenta os projetos sociais e esportivos da Associação Vitalizar, vitrine técnica de atletas para clubes e olheiros, agenda de eventos, notícias, galeria de fotos, polos esportivos, portal de transparência fiscal e canais diretos para patrocínio empresarial, doações PIX e captação de talentos.
- **Público-Alvo**:
  - **Empresas e Patrocinadores**: Consultam impacto social, relatórios de transparência, marcas parceiras e formas de apoio/incentivo fiscal.
  - **Clubes e Olheiros**: Exploram a vitrine de atletas por projeto e categoria, visualizam indicadores esportivos e enviam solicitações de observação técnica.
  - **Atletas e Comunidade**: Conhecem os polos, horários, modalidades, eventos e manifestam interesse de participação.
- **Valor Principal**: Interface enxuta, rápida e livre de burocracia escolar interna, destacando a credibilidade institucional e o talento esportivo dos participantes.

---

## 2. User Experience & Visual Design

- **Fluxos Principais**:
  1. **Vitrine Pública**: Visitantes, clubes e empresas navegam livremente pelos Projetos, Vitrine de Atletas (cards esportivos com estatísticas e relatório de scout), Notícias, Eventos, Galeria, Polos e Portal da Transparência sem necessidade de criar conta.
  2. **Captação de Interesse e Parcerias**: Formulários diretos permitem manifestar interesse em projetos/eventos, enviar propostas de observação técnica (olheiros), inscrever-se para ações voluntárias ou registrar apoio via PIX.
  3. **Painel de Gestão da Vitrine**: Acesso restrito à equipe institucional (`Super Admin`, `Admin`, `Editor`, `Financeiro` e `Parceiro`), cada um visualizando apenas os módulos pertinentes à sua função.
- **Identidade Visual & Tema**:
  - *Direção Estética*: Editorial esportivo e institucional limpo, combinando superfícies claras de alto contraste (`#F8FAFC` / `#FFFFFF`) e modo escuro opcional no painel (`#0F172A`), com destaque em azul celeste institucional (`#0284C7`) e verde esmeralda (`#059669`).
  - *Tipografia & Hierarquia*: Títulos estruturados com forte presença visual, metadados em texto limpo separado por pontos (`·`) sem excesso de etiquetas decorativas, e números tabulares (`tabular-nums`) em indicadores de vagas, estatísticas de atletas e valores financeiros.
  - *Layout de Painel*: Barra lateral enxuta (`240px`) exibindo apenas os módulos de vitrine e relacionamento institucional, cabeçalho com busca rápida e tabelas de densidade limpa.
- **Feedback Interativo**: Indicadores claros de salvamento nos painéis laterais de edição, confirmação de exclusão com opção de desfazer em 10 segundos e atualização imediata da vitrine pública.

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Exclusão da Chamada e de Dados Privados de Responsáveis (`participant_private` e `attendance_sessions`)**
  - *Abordagem Escolhida*: Remover a seção de Chamada na Quadra, remover os alertas de faltas na Visão Geral e simplificar o cadastro de Atletas da Vitrine para conter apenas dados públicos esportivos e pedagógicos gerais (categoria, posição, camisa, idade, atributos técnicos e resumo de scout).
  - *Por quê*: Elimina complexidade operacional desnecessária e reduz drasticamente a superfície de dados pessoais sensíveis (LGPD de menores e responsáveis), alinhando o sistema ao propósito de vitrine.
- **Decisão 2: Simplificação da Matriz de Perfis (5 Perfis Institucionais)**
  - *Abordagem Escolhida*: Manter exclusivamente `super_admin`, `admin`, `editor`, `financeiro` e `parceiro`. Qualquer usuário legado com perfil removido (`professor`, `apoiador`, `visitante`) passa a ser tratado de forma segura ou convertido na gestão de equipe.
  - *Por quê*: Visitantes e apoiadores interagem diretamente pela vitrine pública (sem necessidade de login), enquanto o painel administrativo fica 100% dedicado à equipe de gestão, comunicação, finanças e parceiros.

---

## 4. Technical Architecture & Data Strategy

### Diagrama de Arquitetura e Módulos

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     VITRINE PÚBLICA (Acesso Livre)                           │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌───────────────┐  │
│  │ Projetos &     │ │ Notícias,      │ │ Portal da      │ │ Captação:     │  │
│  │ Vitrine Atletas│ │ Eventos & Polos│ │ Transparência  │ │ Olheiros/PIX  │  │
│  └───────┬────────┘ └───────┬────────┘ └───────┬────────┘ └───────┬───────┘  │
└──────────┼──────────────────┼──────────────────┼──────────────────┼──────────┘
           │                  │                  │                  │
           ▼                  ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 ESTADO CENTRAL & SINCRONIZAÇÃO (SQL + Firestore)             │
│  • Coleções de Vitrine: projects, news_articles, events, gallery_albums,     │
│    sponsors, facility_polos, transparency_docs, club_info, site_settings     │
│  • Coleções de Relacionamento: rsvps (interesse), scout_inquiries,           │
│    contact_messages, donation_pledges, volunteer_applications                │
└──────────┬──────────────────┬──────────────────┬──────────────────┬──────────┘
           │                  │                  │                  │
           ▼                  ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│               PAINEL DE GESTÃO DA VITRINE (RBAC Simplificado)                │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ Super Admin /    │ │ Editor           │ │ Financeiro   │ │ Parceiro     │ │
│  │ Admin            │ │                  │ │              │ │              │ │
│  │ • Controle Total │ │ • Projetos/Atleta│ │ • Doações PIX│ │ • Marcas     │ │
│  │ • Interesses     │ │ • Notícias/Agenda│ │ • Relatórios │ │   Parceiras  │ │
│  │ • Comunidade     │ │ • Galeria/Polos  │ │   Fiscais    │ │ • Captação & │ │
│  │ • Equipe & Logs  │ │ • Avisos do Site │ │ • Chave PIX  │ │   Olheiros   │ │
│  └──────────────────┘ └──────────────────┘ └──────────────┘ └──────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Dados e Mapeamento de Interações

- **Visão Geral do Painel**:
  - Exibe indicadores executivos da vitrine (Projetos Ativos, Atletas na Vitrine, Manifestações de Interesse em Projetos/Eventos, Solicitações de Olheiros, Documentos de Transparência e Doações PIX), com atalhos diretos para cada seção conforme o perfil logado.
- **Gestão de Atletas da Vitrine (antigo Participantes)**:
  - Permite a `Super Admin`, `Admin` e `Editor` adicionar, editar, importar via planilha CSV e remover fichas públicas de atletas nos projetos (nome, apelido, foto, categoria, posição, número da camisa, idade, overall/atributos e destaque para olheiros), atualizando diretamente a lista pública do projeto.
- **Manifestações de Interesse (Inscrições em Projetos e Eventos)**:
  - Registra o interesse enviado pelo formulário público e permite à coordenação (`Super Admin` e `Admin`) acompanhar o status ou converter diretamente um atleta aprovado para a vitrine do projeto.
- **Segurança & Regras de Acesso**:
  - Remoção das rotas e regras de `attendance_sessions` e `participant_private` no cliente, servidor Express/Cloud SQL e `firestore.rules`.
  - Bloqueio do formulário de auto-cadastro de visitantes na tela de login administrativo, mantendo apenas autenticação da equipe autorizada e parceiros convidados.
