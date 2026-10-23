# Plano de Reestruturação: Projetos de Incentivo, Modalidades e Times/Turmas

## 1. Visão Geral e Objetivo
Reestruturar os projetos da **Associação Esportiva Vitalizar** para refletir o funcionamento real de projetos submetidos a **Leis de Incentivo ao Esporte**, substituindo os projetos fictícios pelo projeto real **"É Mais do que Esporte, É Vida!" (Nº 2606344)** em Cariacica/ES (Bairro Rio Marinho).

A nova arquitetura organizará cada projeto na hierarquia:
- **Projeto (Lei de Incentivo)** → contém múltiplas **Modalidades Esportivas** e múltiplos **Times / Turmas**.
- **Time / Turma** → pertence a uma modalidade dentro do projeto, pode receber um nome próprio de **Time** (ex.: *Vitalizar Vôlei Sub-16 Feminino / Turma 1*), possui categoria/faixa etária, naipe (Feminino/Masculino/Misto), dias e horários de treino, local/polo de execução e seu próprio limite de vagas (`totalSpots`).
- **Cálculo Automático de Vagas em Cascata**:
  - Os atletas participantes (`participants`) e as inscrições públicas de interesse (`rsvps`) serão vinculados diretamente a um **Time / Turma** (`teamId`).
  - As vagas preenchidas e disponíveis de cada **Time / Turma** são calculadas automaticamente a partir dos atletas vinculados àquele Time.
  - O total de vagas preenchidas e disponíveis de cada **Modalidade** e do **Projeto** é a soma automática das vagas de seus respectivos Times/Turmas.

---

## 2. Estrutura de Dados e Cadastro Oficial ("É Mais do que Esporte, É Vida!")

### 2.1. Modelagem (`src/types/index.ts`)
- Adição da interface `ProjectTeamClass` (Time / Turma):
  - `id`: identificador único da turma/time (ex.: `turma-1-volei-sub16-fem`)
  - `name`: nome do Time ou Turma (ex.: `Turma 1 • Time Vôlei Sub-16 Feminino`)
  - `modality`: modalidade esportiva (`Voleibol`, `Futsal`, etc.)
  - `category`: faixa etária / categoria (`Sub-12`, `Sub-14`, `Sub-16`, `Sub-18`, `14 a 18 anos`)
  - `gender`: `'Feminino' | 'Masculino' | 'Misto'`
  - `schedule`: dias e horários (ex.: `Segundas e quintas-feiras, 19h às 20h30`)
  - `polo`: local de treino (`EMEF São Jorge` ou `EEEFM Alzira Ramos`)
  - `totalSpots`: número total de vagas da turma/time
  - `filledSpots` / `availableSpots`: calculados automaticamente pelos atletas vinculados ao `teamId`
- Atualização de `VitalizarProject`:
  - `incentiveLaw?: string` (ex.: `Lei Federal de Incentivo ao Esporte – Lei nº 11.438/2006`)
  - `projectNumber?: string` (ex.: `2606344`)
  - `modalities?: string[]` (ex.: `['Voleibol', 'Futsal']`)
  - `teams?: ProjectTeamClass[]` (lista de Times/Turmas do projeto)
- Atualização de `ProjectParticipant` e `EventRsvpRecord`:
  - Inclusão de `teamId?: string` e `modality?: string` para vincular o atleta ou inscrição diretamente ao Time/Turma escolhido.

### 2.2. Projeto Real Inicial (`src/data/clubeData.ts`)
Substituição dos projetos fictícios pelo projeto proposto:
- **Projeto**: **É Mais do que Esporte, É Vida!** (Lei de Incentivo ao Esporte)
- **Polos de Treino (Bairro Rio Marinho, Cariacica/ES)**:
  - **EMEF São Jorge** (Avenida Principal, s/n, Rio Marinho)
  - **EEEFM Alzira Ramos** (Avenida Principal, s/n, Rio Marinho)
- **Modalidades e Times / Turmas (Total: 300 vagas em 12 Times/Turmas)**:
  - **Voleibol (8 Times / Turmas — 180 vagas)**:
    1. **Turma 1 – Sub-16 Feminino**: Segundas e quintas-feiras, 19h às 20h30 (24 vagas)
    2. **Turma 2 – Sub-18 Feminino**: Segundas e quintas-feiras, 20h30 às 22h (24 vagas)
    3. **Turma 3 – Sub-16 Masculino**: Quartas e sextas-feiras, 19h às 20h30 (24 vagas)
    4. **Turma 4 – Sub-18 Masculino**: Quartas e sextas-feiras, 20h30 às 22h (24 vagas)
    5. **Turma 5 – Sub-14 Feminino**: Sábados e domingos, 14h às 15h30 (24 vagas)
    6. **Turma 6 – Sub-14 Masculino**: Sábados e domingos, 15h30 às 17h (24 vagas)
    7. **Turma 7 – Sub-12 Feminino**: Sábados, 17h às 18h30 (18 vagas)
    8. **Turma 8 – Sub-12 Masculino**: Sábados, 18h30 às 20h (18 vagas)
  - **Futsal (4 Times / Turmas — 120 vagas)**:
    9. **Turma 9 – Feminino (14 a 18 anos)**: Sextas-feiras, 19h às 20h30 (30 vagas)
    10. **Turma 10 – Masculino (14 a 18 anos)**: Sextas-feiras, 20h30 às 22h (30 vagas)
    11. **Turma 11 – Feminino (14 a 18 anos)**: Domingos, 17h às 18h30 (30 vagas)
    12. **Turma 12 – Masculino (14 a 18 anos)**: Domingos, 18h30 às 20h (30 vagas)

---

## 3. Alterações nas Telas Públicas e Painel Administrativo

### 3.1. Vitrine Pública (`ProjectDetailPage.tsx`, `SubpageView.tsx`, `DirectEnrollmentModal.tsx`)
- **Página do Projeto (`ProjectDetailPage.tsx`)**:
  - Exibição limpa e focada nas **Modalidades Esportivas**, **Times / Turmas**, **Vagas (Preenchidas / Disponíveis por Time e Geral)** e **Locais de Treino (Polos)**.
  - Filtro de Times/Turmas por modalidade (ex.: Todos, Voleibol, Futsal) com visualização de horários, faixa etária, vagas restantes em cada Time e botão para inscrição direto naquele Time/Turma.
  - Filtro na Vitrine de Atletas também por Modalidade e por Time/Turma.
- **Modal de Inscrição (`DirectEnrollmentModal.tsx`)**:
  - Ao escolher um projeto, o candidato seleciona a **Modalidade** e o **Time / Turma** específico (exibindo horário e vagas disponíveis daquele Time).
- **Menus e Subpáginas (`clubeData.ts` e `SubpageView.tsx`)**:
  - Atualização da navegação e listagens para exibir o projeto real, suas modalidades, polos (EMEF São Jorge e EEEFM Alzira Ramos) e quadros de horários por Time/Turma.

### 3.2. Painel Administrativo (`ConteudoView.tsx`, `ParticipantesView.tsx`, `InscricoesProjetosView.tsx`)
- **Editor de Projetos (`ConteudoView.tsx`)**:
  - Gerenciador de **Modalidades** e **Times / Turmas** dentro de cada projeto: adicionar, renomear Time/Turma, definir modalidade, categoria, dias/horários, polo e número de vagas (`totalSpots`) de cada Time.
  - O total de vagas do projeto passa a ser calculado automaticamente pela soma das vagas de seus Times/Turmas.
- **Gestão de Atletas (`ParticipantesView.tsx`) e Inscrições (`InscricoesProjetosView.tsx`)**:
  - Seleção de qual **Time / Turma** o atleta pertence ao cadastrar, editar ou aprovar uma inscrição pública.
  - Ao aprovar uma inscrição vinculada a um Time/Turma, o atleta entra automaticamente naquele Time, atualizando na hora as vagas preenchidas/disponíveis do Time e do Projeto.
