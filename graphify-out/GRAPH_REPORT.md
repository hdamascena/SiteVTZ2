# Graph Report - SiteVTZ2  (2026-10-21)

## Corpus Check
- 46 files · ~92,291 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 1, (none) 1, .lock 1)

## Summary
- 318 nodes · 756 edges · 14 communities (13 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Site Shell & Public Pages
- Seed Data & Community Admin
- Admin Panel & Firebase
- Projects, Athletes & Scouting
- Package Scripts & Build
- Data Context & Sync
- TypeScript Config
- Membership Fees & Reservations
- Events Calendar & RSVP
- Runtime Dependencies
- PIX Donations & QR
- Dev Dependencies
- Firestore Operation Types
- Root Error Boundary

## God Nodes (most connected - your core abstractions)
1. `useClubData()` - 31 edges
2. `react` - 26 edges
3. `lucide-react` - 24 edges
4. `AdminPanel()` - 20 edges
5. `ClubDataProvider()` - 18 edges
6. `VitalizarMainApp()` - 16 edges
7. `compilerOptions` - 16 edges
8. `VitalizarProject` - 15 edges
9. `ClubDataContextType` - 14 edges
10. `parseNextFitCsv()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `VitalizarMainApp()` --calls--> `AdminPanel()`  [EXTRACTED]
  src/App.tsx → src/components/AdminPanel.tsx
- `VitalizarMainApp()` --calls--> `EventsCalendar()`  [EXTRACTED]
  src/App.tsx → src/components/EventsCalendar.tsx
- `App()` --calls--> `ClubDataProvider()`  [EXTRACTED]
  src/App.tsx → src/context/ClubDataContext.tsx
- `AdminCommunityModulesProps` --references--> `SiteSettings`  [EXTRACTED]
  src/components/AdminCommunityModules.tsx → src/types/index.ts
- `AdminPanel()` --calls--> `NextFitParticipantsManager()`  [EXTRACTED]
  src/components/AdminPanel.tsx → src/components/NextFitParticipantsManager.tsx

## Import Cycles
- None detected.

## Communities (14 total, 1 thin omitted)

### Community 0 - "Site Shell & Public Pages"
Cohesion: 0.09
Nodes (38): lucide-react, motion, react, App(), EASE_EDITORIAL, VitalizarMainApp(), CommunityHubView(), CookieBanner() (+30 more)

### Community 1 - "Seed Data & Community Admin"
Cohesion: 0.08
Nodes (37): AdminCommunityModulesProps, AttendanceManagerProps, ClubDataContextType, CLUB_INFO, DEFAULT_SITE_SETTINGS, GALLERY_ITEMS, HERO_BANNERS, NAVIGATION_DATA (+29 more)

### Community 2 - "Admin Panel & Firebase"
Cohesion: 0.13
Nodes (26): firebase, AdminCommunityModules(), AdminPanel(), AdminPanelProps, AttachmentsEditor(), AttachmentsEditorProps, ImageUploadField(), ImageUploadFieldProps (+18 more)

### Community 3 - "Projects, Athletes & Scouting"
Cohesion: 0.14
Nodes (28): DirectEnrollmentModalProps, NextFitParticipantsManager(), NextFitParticipantsManagerProps, PlayerCard(), PlayerCardProps, PlayerScoutModal(), PlayerScoutModalProps, ProjectDetailPage() (+20 more)

### Community 4 - "Package Scripts & Build"
Cohesion: 0.07
Nodes (28): name, private, scripts, build, clean, dev, lint, preview (+20 more)

### Community 5 - "Data Context & Sync"
Cohesion: 0.13
Nodes (27): ClubDataContext, ClubDataProvider(), hydrateFromFirestore(), ContactMessageRecord, EventRsvpRecord, mergeRemoteFirst(), normalizeClubInfo(), normalizeEvents() (+19 more)

### Community 6 - "TypeScript Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 7 - "Membership Fees & Reservations"
Cohesion: 0.17
Nodes (11): MODALITY_NAMES, ReservationSimulatorModalProps, FACILITY_POLOS, ActivityEnrollmentLimit, calculateVitalizarMembership(), MembershipCalculationResult, MembershipInput, MODALITY_LIMITS (+3 more)

### Community 8 - "Events Calendar & RSVP"
Cohesion: 0.33
Nodes (11): EASE_EDITORIAL, EventsCalendar(), EventsCalendarProps, EventCategory, VitalizarEvent, filterEvents(), FilterOptions, generateGoogleCalendarUrl() (+3 more)

### Community 9 - "Runtime Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, dotenv, express, firebase, @google/genai, lucide-react, motion, qrcode (+5 more)

### Community 10 - "PIX Donations & QR"
Cohesion: 0.30
Nodes (9): CommunityHubTab, CommunityHubViewProps, computeCrc16(), formatEmvField(), generatePixBrCode(), generatePixQrMatrix(), PixBrCodeOptions, sanitizeAscii() (+1 more)

### Community 11 - "Dev Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, autoprefixer, esbuild, tailwindcss, tsx, @types/express, @types/node, @types/qrcode (+3 more)

### Community 12 - "Firestore Operation Types"
Cohesion: 0.29
Nodes (7): OperationType, CREATE, DELETE, GET, LIST, UPDATE, WRITE

## Knowledge Gaps
- **19 isolated node(s):** `@google/genai`, `dotenv`, `express`, `@types/node`, `@types/qrcode` (+14 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 126 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Site Shell & Public Pages` to `Seed Data & Community Admin`, `Admin Panel & Firebase`, `Projects, Athletes & Scouting`, `Package Scripts & Build`, `Data Context & Sync`, `Membership Fees & Reservations`, `Events Calendar & RSVP`, `PIX Donations & QR`?**
  _High betweenness centrality (0.153) - this node is a cross-community bridge._
- **What connects `@google/genai`, `dotenv`, `express` to the rest of the system?**
  _19 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Site Shell & Public Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.09294199860237597 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Site Shell & Public Pages` to `Seed Data & Community Admin`, `Admin Panel & Firebase`, `Projects, Athletes & Scouting`, `Package Scripts & Build`, `Membership Fees & Reservations`, `Events Calendar & RSVP`, `PIX Donations & QR`?**
  _High betweenness centrality (0.107) - this node is a cross-community bridge._
- **Should `Seed Data & Community Admin` be split into smaller, more focused modules?**
  _Cohesion score 0.07682926829268293 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Runtime Dependencies` to `Package Scripts & Build`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Should `Admin Panel & Firebase` be split into smaller, more focused modules?**
  _Cohesion score 0.1268939393939394 - nodes in this community are weakly interconnected._