# Integração Next Fit via CSV & Gestão de Participantes de Projetos

Implementação do fluxo de importação da relação de atletas e alunos do **Next Fit via arquivo `.csv`** (sem necessidade da API paga do Next Fit e **sem exposição ou armazenamento de dados de contato/telefone** dos atletas/participantes), permitindo gerenciar e importar a relação tanto pela **nova sub-aba "Participantes" dentro de Projetos** quanto pela **aba de Importação de Dados (Next Fit)** no Painel do Administrador, além de vincular atletas ao **Elenco Oficial**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> O plano foi revisado para refletir integralmente os seus ajustes:

- **Decisão Confirmada 1 — Sem Dados de Contato dos Atletas/Participantes (Privacidade)**:
  Foram **removidos todos os campos de telefone, WhatsApp, e-mail e documentos pessoais** dos atletas e participantes importados do Next Fit e da listagem de participantes de projetos. Serão mantidos apenas dados esportivos, físicos e de matrícula: **Código Next Fit, Nome, Foto, Data de Nascimento / Idade, Modalidade/Turma, Status da Matrícula (`Ativo`, `Trancado`, `Inativo`, `Pendente`) e Dados Físicos (`Peso`, `Altura`, `IMC`, `Avaliação`)**.
- **Decisão Confirmada 2 — Foco 100% em Upload de Planilha `.CSV` do Next Fit (Sem Dependência de API Paga)**:
  O fluxo principal foi desenhado para leitura direta de arquivos `.csv` (padrão Excel `;` ou `,`) exportados gratuitamente do Next Fit, com download de planilha-modelo `.csv` e pré-visualização imediata das colunas mapeadas. (Uma seção recolhida opcional fica reservada caso no futuro o clube decida ativar um token de API, sem ocupar espaço ou exigir configuração agora).
- **Decisão Confirmada 3 — Sub-aba Separada de "Participantes" dentro de Projetos + Central na Aba de Importação de Dados**:
  1. **Dentro da aba "Projetos" no Admin**: Criação de uma **navegação interna em duas sub-abas**:
     - **Sub-aba 1: `Projetos & Estrutura`** (cadastro dos projetos, horários, locais e comissão técnica).
     - **Sub-aba 2: `Participantes & Atletas`** (aba exclusiva e separada para gerenciar todos os participantes por projeto, subir arquivo `.csv` do Next Fit diretamente para um projeto ou distribuir por turma, filtrar por status/idade e editar fichas).
  2. **Pela aba de "Importação de Dados / Next Fit"**: Permite subir o `.csv` geral do Next Fit em um único lugar, visualizar a relação completa de alunos importados e enviá-los individualmente ou em lote tanto para os **Participantes de qualquer Projeto** quanto para o **Elenco Oficial do Clube**.

---

## 1. Overview & Core Concept

- **O Que Faz**: Permite que a administração da Associação Esportiva Vitalizar exporte a relação de alunos do **Next Fit em formato `.csv`** e faça a carga diretamente no Painel Admin — seja dentro da nova sub-aba **Projetos → Participantes**, seja pela aba **Importação de Dados (Next Fit)** — populando automaticamente os participantes dos projetos sociais/base e o elenco oficial do clube com dados de matrícula e avaliação física, sem expor informações de contato pessoal.
- **Público-Alvo / Persona**: Administradores, coordenadores de projetos esportivos e comissão técnica da Associação Esportiva Vitalizar.
- **Valor Principal**: Agilidade total para atualizar a relação de alunos do Next Fit sem custo adicional de API, privacidade garantida (zero dados de contato como telefone/WhatsApp nos registros de atletas/participantes) e visão dedicada de **Participantes** separada dentro do módulo de Projetos.

---

## 2. User Experience & Visual Design

- **Fluxos Principais do Usuário**:
  1. **Fluxo A — Gestão e Importação pela Sub-aba `Projetos > Participantes` (Novo)**:
     - Ao abrir **Projetos** no menu lateral do Admin, o topo exibe o seletor de sub-abas: **`Projetos Cadastrados`** e **`Participantes dos Projetos (Next Fit / CSV)`**.
     - Na sub-aba **`Participantes dos Projetos`**:
       - Seletor do Projeto alvo (ex.: *Todos os Projetos*, *Projeto Vitalizar Sub-15*, *Escolinha Comunitária*) + contadores rápidos (Total de Participantes, Matrículas Ativas, Idade Média).
       - Botão direto **"Importar CSV Next Fit neste Projeto"** e botão **"Puxar da Base Next Fit Importada"** (além de **"Baixar Modelo .CSV"** e **"+ Adicionar Participante Manual"**).
       - Tabela limpa de participantes contendo: **Foto, Nome, Idade / Nascimento, Função/Posição, Turma Next Fit, Dados Físicos (Altura · Peso · IMC), Status da Matrícula (`Ativo`, `Trancado`, `Inativo`) e Projeto vinculado** — sem qualquer coluna de telefone ou contato.
  2. **Fluxo B — Importação Geral pela Aba `Importação de Dados / Next Fit`**:
     - Permite arrastar ou selecionar o arquivo `.csv` exportado do Next Fit contendo todos os alunos da associação.
     - Reconhecimento automático das colunas do CSV do Next Fit em português: `Código`/`ID`, `Nome`/`Aluno`, `Data de Nascimento`/`Idade`, `Situação`/`Status` (`Ativo`, `Inativo`, `Trancado`), `Modalidade`/`Turma`/`Contrato`, `Peso (kg)`, `Altura (cm/m)`, `Avaliação Física`/`Observações` e `Foto` (ignorando automaticamente colunas de telefone/celular/CPF caso existam na planilha bruta do Next Fit).
     - Permite selecionar atletas (individualmente ou em lote) ou usar o mapeamento automático por **Modalidade/Turma** para enviá-los para:
       - **Participantes de um Projeto Social/Base**; e/ou
       - **Elenco Oficial do Clube (Jogadores)**.

- **Visual Identity & Theme (`SaaS & Admin Dashboard`)**:
  - **Direção Estética**: Alinhada ao Painel Administrativo da Vitalizar — superfícies brancas e cinza-gelo (`#FFFFFF`, `#F8FAFC`), cabeçalhos em azul-marinho (`#0A1E36`), destaque em azul-celeste (`#0284C7`) e verde (`#16A34A`).
  - **Tipografia & Alinhamento Tabular**: Uso de `tabular-nums` / `font-mono` para códigos Next Fit, idades, alturas (`cm`/`m`), pesos (`kg`) e cálculo de IMC.
  - **Semântica de Status**: Rótulos claros e acessíveis para o status da matrícula no Next Fit (`Ativo`, `Trancado`, `Inativo`, `Pendente`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decisão 1: Descarte Automático de Dados de Contato na Importação `.CSV`**
  - *Abordagem Escolhida*: Mesmo que o arquivo `.csv` exportado do Next Fit possua colunas como `Telefone`, `Celular`, `WhatsApp`, `E-mail` ou `CPF`, o importador descarta essas colunas automaticamente no momento da leitura e não exibe campos de contato em nenhuma tela de atletas ou participantes.
  - *Por quê*: Atende estritamente à diretriz de privacidade solicitada e evita exposição de dados pessoais de atletas (especialmente categorias de base/menores).
- **Decisão 2: Duplo Ponto de Entrada para Importação `.CSV` (Aba Projetos > Participantes + Aba Importação de Dados)**
  - *Abordagem Escolhida*: O componente de leitura e mapeamento de `.csv` do Next Fit estará acessível tanto dentro de **Projetos → aba Participantes** (já vinculando ao projeto selecionado ou mapeando pela coluna `Turma/Modalidade`) quanto na central de **Importação de Dados (Next Fit)**.
  - *Por quê*: Permite que o gestor escolha o caminho mais prático no dia a dia: importar uma planilha específica direto dentro da aba de participantes de um projeto ou subir o relatório geral na aba de importação de dados e distribuir entre projetos e elenco.
- **Decisão 3: Sincronização Rastreável por Código/Nome (`nextfitCode`)**
  - *Abordagem Escolhida*: Ao subir um novo `.csv` atualizado no mês seguinte, o sistema identifica atletas já importados pelo `nextfitCode` (ou nome + data de nascimento) e atualiza seu status de matrícula (`Ativo`/`Trancado`/`Inativo`) e medidas físicas (`Peso`/`Altura`), sem duplicar participantes nos projetos ou no elenco.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   Arquivo .CSV Exportado do Next Fit                       │
│  Colunas lidas: Código, Nome, Nascimento/Idade, Status Matrícula,          │
│  Modalidade/Turma, Peso, Altura, Avaliação Física, Foto                    │
│  (Colunas de Telefone / Contato são descartadas automaticamente)           │
└───────────────────┬────────────────────────────────────┬───────────────────┘
                    │                                    │
                    ▼                                    ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────┐
│ Entrada 1: Aba Importação de Dados   │  │ Entrada 2: Aba Projetos ->       │
│ (Relação Geral Next Fit via .CSV)    │  │ Sub-aba Separada "Participantes" │
│ • Upload .CSV geral + Modelo .CSV    │  │ • Filtro por Projeto / Status    │
│ • Tabela de atletas Next Fit         │  │ • Upload .CSV direto no Projeto  │
│ • Envio em lote p/ Projeto ou Elenco │  │ • Puxar atletas da base Next Fit │
└───────────────────┬──────────────────┘  └──────────────┬───────────────────┘
                    │                                    │
                    └─────────────────┬──────────────────┘
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│             Estado Global & Persistência (ClubDataContext)                 │
│  • nextfitAthletes: NextFitAthleteRecord[] (sem campos de contato)         │
│  • projects[].participants: ProjectParticipant[] (com status/ficha física) │
│  • players: Player[] (Elenco Oficial sincronizado)                         │
└────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State (Sem Campos de Contato)**:
  - `NextFitAthleteRecord`:
    - `id`: identificador interno (`nf-...`)
    - `nextfitCode`: código do aluno no Next Fit (ex.: `NF-1042`)
    - `name`: nome completo do atleta/participante
    - `photoUrl`: URL da foto ou avatar padrão
    - `birthDate`: data de nascimento (`DD/MM/AAAA` ou `YYYY-MM-DD`)
    - `age`: idade calculada
    - `enrollmentStatus`: `'ativo' | 'trancado' | 'inativo' | 'pendente'`
    - `planName`: nome do plano/matrícula no Next Fit
    - `modalityOrClass`: modalidade ou turma no Next Fit (ex.: `Futsal Sub-15`, `Projeto Social Manhã`)
    - `mappedCategory`: categoria esportiva (`Sub-11`, `Sub-13`, `Sub-15`, `Sub-17`, `Sub-20`, `Profissional`)
    - `physicalData`: `{ weightKg?: number; heightCm?: number; bmi?: number; bodyFatPct?: number; lastEvaluationDate?: string; notes?: string }`
    - `linkedPlayerId?: string`: vínculo com atleta no Elenco Oficial
    - `linkedProjectIds: string[]`: lista de IDs dos Projetos em que participa
    - `lastSyncedAt`: data/hora da última importação `.csv`
  - `ProjectParticipant` (expandido, sem telefone/contato):
    - `id`, `name`, `age`, `birthDate`, `role` (posição/função), `photoUrl`
    - `nextfitCode?`: código de vínculo com o Next Fit
    - `enrollmentStatus?`: `'ativo' | 'trancado' | 'inativo' | 'pendente'`
    - `modalityOrClass?`: turma do Next Fit
    - `weightKg?`, `heightCm?`, `physicalNotes?`: medidas físicas importadas
    - `notes?`: observações técnicas/pedagógicas

- **Interactive Component & State Mapping**:
  - **Sub-aba `Participantes` dentro de `Projetos`**:
    - Alternador de visão no topo da aba `Projetos`: `Projetos & Estrutura` vs. `Participantes (Relação & Next Fit)`.
    - Permite selecionar um projeto específico ou visualizar todos os participantes consolidados, filtrar por status de matrícula (`Ativo`, `Trancado`, `Inativo`), buscar por nome/código/turma, adicionar/editar/remover participante, importar `.csv` do Next Fit direto para o projeto selecionado ou sincronizar a partir da base Next Fit já carregada.
  - **Central de Importação `.CSV` Next Fit (na aba de Importação de Dados / Next Fit)**:
    - Leitor de `.csv` com suporte a UTF-8 e ISO-8859-1/Windows-1252 (comum em exportações Excel do Brasil), separador `;` ou `,`, prévia dos registros lidos, botão para carregar planilha de exemplo do Next Fit e ações em lote para **Enviar para Projeto(s)** ou **Enviar para o Elenco Oficial**.
