import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  LayoutDashboard,
  Building2,
  Newspaper,
  CalendarDays,
  FolderKanban,
  FileText,
  Users,
  Mail,
  Save,
  Trash2,
  Plus,
  Edit3,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  Clock,
  ExternalLink,
  Search,
  Menu,
  X,
  FileSpreadsheet,
  Paperclip,
  Image as ImageIcon,
  Copy,
  ArrowUp,
  ArrowDown,
  Camera,
  Check,
  Link2,
  HeartHandshake,
  Cloud,
  Sparkles,
  Award,
  Settings,
  Tag,
  Megaphone,
  Globe,
  MapPin,
  Trophy,
  UserCheck,
  ClipboardList,
} from 'lucide-react';
import { useClubData } from '../context/ClubDataContext.tsx';
import { DEFAULT_SITE_SETTINGS } from '../data/clubeData.ts';
import { NextFitParticipantsManager } from './NextFitParticipantsManager.tsx';
import {
  parseNextFitCsv,
  convertNextFitRowToParticipant,
} from '../utils/nextfitCsv.ts';
import { AttendanceManager } from './AttendanceManager.tsx';
import { AdminCommunityModules } from './AdminCommunityModules.tsx';
import {
  validateAdminCredentials,
  isSessionValid,
  validateSecurityPin,
  validatePasswordStrength,
  AdminCredentials,
  RateLimitState,
  AdminSession,
} from '../utils/adminAuth.ts';
import {
  processImageUpload,
  processAttachmentUpload,
  formatFileSize,
  inferFileTypeBadge,
  parseEventIsoDate,
} from '../utils/fileUpload.ts';
import { auth } from '../firebase.ts';
import {
  loginWithGoogleAdmin,
  loginWithEmailPasswordFirebase,
  verifyFirebaseAdminAccess,
  logoutFirebaseAuth,
  logoutFirebaseAdmin,
} from '../services/firebaseService.ts';
import type {
  NewsArticle,
  VitalizarEvent,
  EventCategory,
  TransparencyDocument,
  VitalizarProject,
  PastEventPhoto,
  AttachedFile,
  Sponsor,
  SponsorTier,
  SiteSettings,
  FacilityPolo,
  ScoutInquiryRecord,
  HeroSlideConfig,
} from '../types/index.ts';

interface AdminPanelProps {
  onClose: () => void;
}

const DEFAULT_ADMIN_CREDS: AdminCredentials = {
  email: 'admin@vitalizar.org.br',
  passwordHashOrPlain: 'vitalizar2026!',
  securityPin: '140926',
};

// ============================================================================
// REUSABLE IMAGE UPLOAD & URL FIELD (WITH DRAG & DROP)
// ============================================================================
interface ImageUploadFieldProps {
  label: string;
  imageUrl: string;
  onChange: (newUrl: string) => void;
  onError?: (msg: string) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  imageUrl,
  onChange,
  onError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    setIsUploading(true);
    try {
      const compressedDataUrl = await processImageUpload(file, 1280, 0.82);
      onChange(compressedDataUrl);
    } catch (err: any) {
      if (onError) onError(err?.message || 'Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file);
    } else if (file && onError) {
      onError('Arraste apenas arquivos de imagem válidos (JPG, PNG, WEBP).');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-bold text-slate-700 uppercase text-xs">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`grid grid-cols-1 sm:grid-cols-12 gap-3 items-start p-2.5 rounded-xl border transition-colors ${
          isDragging ? 'border-[#0284c7] bg-sky-50/70' : 'border-slate-200 bg-slate-50/50'
        }`}
      >
        {/* Preview Thumbnail */}
        <div className="sm:col-span-4 aspect-16/10 rounded-xl overflow-hidden bg-slate-100 border border-slate-300 relative flex items-center justify-center">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Pré-visualização"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80';
              }}
            />
          ) : (
            <div className="text-center p-3 text-slate-400">
              <ImageIcon className="w-6 h-6 mx-auto mb-1" />
              <span className="text-[10px] block">Sem imagem</span>
            </div>
          )}
        </div>

        {/* Upload Button + URL Input */}
        <div className="sm:col-span-8 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="px-3.5 py-2 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
              <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>
                {isUploading ? 'Comprimindo...' : 'Enviar ou Arrastar Imagem do Computador'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            {imageUrl?.startsWith('data:image/') && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                Imagem anexada localmente
              </span>
            )}
          </div>

          <div>
            <span className="text-[11px] text-slate-500 block mb-1">
              Ou informe o link externo (URL) da imagem:
            </span>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://exemplo.com/foto.jpg"
              className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// REUSABLE MULTI-FILE ATTACHMENTS MANAGER
// ============================================================================
interface AttachmentsEditorProps {
  attachments: AttachedFile[];
  onChange: (updated: AttachedFile[]) => void;
  onNotify?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

const AttachmentsEditor: React.FC<AttachmentsEditorProps> = ({
  attachments,
  onChange,
  onNotify,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const processFilesList = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;
    setIsUploading(true);
    try {
      const added: AttachedFile[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const processed = await processAttachmentUpload(file);
        added.push(processed);
      }
      onChange([...attachments, ...added]);
    } catch (err: any) {
      if (onNotify) {
        onNotify(err?.message || 'Erro ao anexar arquivo.', 'error');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await processFilesList(e.target.files);
      e.target.value = '';
    }
  };

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFilesList(e.dataTransfer.files);
    }
  };

  const handleAddExternalLink = () => {
    if (!externalName.trim() || !externalUrl.trim()) return;
    const newAtt: AttachedFile = {
      id: `link-${Date.now()}`,
      name: externalName.trim(),
      size: 'Link Externo',
      type: inferFileTypeBadge(externalUrl, ''),
      mimeType: 'text/uri-list',
      dataUrl: externalUrl.trim(),
      uploadedAt: new Date().toLocaleDateString('pt-BR'),
    };
    onChange([...attachments, newAtt]);
    setExternalName('');
    setExternalUrl('');
    setShowLinkInput(false);
  };

  const handleRemove = (id: string) => {
    onChange(attachments.filter((item) => item.id !== id));
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDropFiles}
      className={`p-4 border rounded-xl space-y-3 transition-colors ${
        isDragging ? 'bg-sky-50 border-[#0284c7]' : 'bg-slate-50 border-slate-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-800 uppercase text-xs flex items-center gap-1.5">
            <Paperclip className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>Arquivos e Documentos Anexados ({attachments.length})</span>
          </span>
          <span className="text-[11px] text-slate-500 block">
            Anexe ou arraste PDFs, editais, regulamentos, planilhas ou imagens (salvos ao clicar em Salvar).
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <label className="px-3 py-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Anexando...' : '+ Anexar Arquivo(s)'}</span>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,image/*"
              onChange={handleFilesSelected}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          <button
            type="button"
            onClick={() => setShowLinkInput(!showLinkInput)}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Link2 className="w-3.5 h-3.5 text-[#0284c7]" />
            <span>+ Link Externo</span>
          </button>
        </div>
      </div>

      {showLinkInput && (
        <div className="p-3 bg-white rounded-lg border border-sky-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              Nome do Documento
            </label>
            <input
              type="text"
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              placeholder="Ex: Regulamento Oficial PDF"
              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-md"
            />
          </div>
          <div className="sm:col-span-5">
            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
              URL do Arquivo
            </label>
            <input
              type="url"
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-md"
            />
          </div>
          <div className="sm:col-span-2 flex gap-1">
            <button
              type="button"
              onClick={handleAddExternalLink}
              className="w-full py-2 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold rounded-md cursor-pointer"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="py-4 text-center border border-dashed border-slate-300 rounded-lg bg-white/60 text-[11px] text-slate-400">
          Nenhum arquivo anexado. Clique em "+ Anexar Arquivo(s)" para enviar documentos do seu computador.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2 shadow-2xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 bg-sky-50 text-[#0284c7] border border-sky-200 rounded text-[10px] font-black shrink-0">
                  {att.type}
                </span>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 truncate block">
                    {att.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {att.size} · {att.uploadedAt}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={att.dataUrl}
                  download={att.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-[#0284c7] hover:bg-sky-50 rounded-md transition-colors"
                  title="Baixar / Visualizar arquivo"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(att.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="Remover anexo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN ADMIN PANEL COMPONENT
// ============================================================================
export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const {
    clubInfo,
    siteSettings,
    newsArticles,
    sponsors,
    events,
    rsvps,
    projects,
    galleryAlbums,
    transparencyDocs,
    facilityPolos,
    scoutInquiries,
    contactMessages,
    auditLogs,
    addAuditLog,
    clearAuditLogs,
    resetAllToDefaults,
    exportDatabaseJson,
    importDatabaseJson,
    saveAdminChanges,
    showToast,
    isFirebaseActive,
  } = useClubData();

  // Authentication State
  const [session, setSession] = useState<AdminSession | null>(() => {
    try {
      const saved = sessionStorage.getItem('vitalizar_admin_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isSessionValid(parsed)) return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [creds, setCreds] = useState<AdminCredentials>(() => {
    try {
      const saved = localStorage.getItem('vitalizar_admin_credentials');
      return saved ? JSON.parse(saved) : DEFAULT_ADMIN_CREDS;
    } catch {
      return DEFAULT_ADMIN_CREDS;
    }
  });

  // Staged / Draft States (Only persisted when pressing Save)
  const [draftClubInfo, setDraftClubInfo] = useState<typeof clubInfo>(() => clubInfo);
  const [draftSiteSettings, setDraftSiteSettings] = useState<SiteSettings>(() => siteSettings);
  const [draftNews, setDraftNews] = useState<NewsArticle[]>(() => newsArticles);
  const [draftSponsors, setDraftSponsors] = useState<Sponsor[]>(() => sponsors);
  const [draftEvents, setDraftEvents] = useState<VitalizarEvent[]>(() => events);
  const [draftProjects, setDraftProjects] = useState<VitalizarProject[]>(() => projects);
  const [draftAlbums, setDraftAlbums] = useState<PastEventPhoto[]>(() => galleryAlbums);
  const [draftDocs, setDraftDocs] = useState<TransparencyDocument[]>(() => transparencyDocs);
  const [draftPolos, setDraftPolos] = useState<FacilityPolo[]>(() => facilityPolos);
  const [draftScoutInquiries, setDraftScoutInquiries] = useState<ScoutInquiryRecord[]>(
    () => scoutInquiries
  );
  const [draftRsvps, setDraftRsvps] = useState(() => rsvps);
  const [draftMessages, setDraftMessages] = useState(() => contactMessages);
  const [draftCreds, setDraftCreds] = useState<AdminCredentials>(() => creds);
  const [unsavedClosePromptOpen, setUnsavedClosePromptOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [isAuthenticatingFirebase, setIsAuthenticatingFirebase] = useState(false);

  // Sync draft states when context data changes externally (e.g. after save, reset, or import)
  useEffect(() => {
    setDraftClubInfo(clubInfo);
  }, [clubInfo]);
  useEffect(() => {
    setDraftSiteSettings(siteSettings);
  }, [siteSettings]);
  useEffect(() => {
    setDraftNews(newsArticles);
  }, [newsArticles]);
  useEffect(() => {
    setDraftSponsors(sponsors);
  }, [sponsors]);
  useEffect(() => {
    setDraftEvents(events);
  }, [events]);
  useEffect(() => {
    setDraftProjects(projects);
  }, [projects]);
  useEffect(() => {
    setDraftAlbums(galleryAlbums);
  }, [galleryAlbums]);
  useEffect(() => {
    setDraftDocs(transparencyDocs);
  }, [transparencyDocs]);
  useEffect(() => {
    setDraftPolos(facilityPolos);
  }, [facilityPolos]);
  useEffect(() => {
    setDraftScoutInquiries(scoutInquiries);
  }, [scoutInquiries]);
  useEffect(() => {
    setDraftRsvps(rsvps);
  }, [rsvps]);
  useEffect(() => {
    setDraftMessages(contactMessages);
  }, [contactMessages]);
  useEffect(() => {
    setDraftCreds(creds);
  }, [creds]);

  // Listen to Firebase Auth state and verify if user has administrative privileges
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const authCheck = await verifyFirebaseAdminAccess(user, creds.email);
        if (authCheck.authorized) {
          setSession((prev) => {
            if (prev && isSessionValid(prev)) return prev;
            const now = Date.now();
            const newSession: AdminSession = {
              token: `FB-ADM-${Math.random().toString(36).slice(2, 10).toUpperCase()}-${now.toString(36).toUpperCase()}`,
              loginTime: now,
              expiresAt: now + 2 * 60 * 60 * 1000,
              adminEmail: user.email || creds.email,
            };
            sessionStorage.setItem('vitalizar_admin_session', JSON.stringify(newSession));
            return newSession;
          });
        }
      }
    });
    return () => unsubscribe();
  }, [creds.email]);

  const [rateLimit, setRateLimit] = useState<RateLimitState>(() => {
    try {
      const saved = localStorage.getItem('vitalizar_admin_ratelimit');
      return saved ? JSON.parse(saved) : { failedAttempts: 0, lockedUntil: null };
    } catch {
      return { failedAttempts: 0, lockedUntil: null };
    }
  });

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Active Tab in Admin
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'configuracoes'
    | 'institucional'
    | 'noticias'
    | 'patrocinadores'
    | 'eventos'
    | 'projetos'
    | 'polos'
    | 'olheiros'
    | 'galeria'
    | 'transparencia'
    | 'inscricoes'
    | 'comunidade_pix'
    | 'mensagens'
    | 'seguranca'
    | 'backup'
  >('dashboard');

  // Site Settings Inputs State (Categories, Tags, Suggestions)
  const [newNewsCategory, setNewNewsCategory] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('');
  const [newGalleryCategory, setNewGalleryCategory] = useState('');
  const [newContactSubject, setNewContactSubject] = useState('');
  const [newSiteTag, setNewSiteTag] = useState('');
  const [newSearchSuggestion, setNewSearchSuggestion] = useState('');
  const [newArticleTagInput, setNewArticleTagInput] = useState('');

  // News Editing & Filtering State
  const [editingNews, setEditingNews] = useState<NewsArticle | null>(null);
  const [isCreatingNews, setIsCreatingNews] = useState(false);
  const [newsEditorMode, setNewsEditorMode] = useState<'blocks' | 'raw' | 'preview'>('blocks');
  const [newsSearch, setNewsSearch] = useState('');
  const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');

  // Events Editing & Filtering State
  const [editingEvent, setEditingEvent] = useState<VitalizarEvent | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all');
  const [newHighlightText, setNewHighlightText] = useState('');
  const [newPrereqText, setNewPrereqText] = useState('');

  // Projects Editing State & Staff/Participants/Attendance Sub-Form State
  const [projectsSubTab, setProjectsSubTab] = useState<
    'projetos' | 'participantes' | 'chamada'
  >('projetos');
  const [projectsParticipantFilter, setProjectsParticipantFilter] = useState<string>('all');
  const [editingProject, setEditingProject] = useState<VitalizarProject | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('');
  const [newStaffLicense, setNewStaffLicense] = useState('');
  const [newStaffBio, setNewStaffBio] = useState('');
  const [newParticipantName, setNewParticipantName] = useState('');
  const [newParticipantAge, setNewParticipantAge] = useState('14');
  const [newParticipantRole, setNewParticipantRole] = useState('');
  const [newParticipantSchool, setNewParticipantSchool] = useState('');
  const [newParticipantBio, setNewParticipantBio] = useState('');
  const [newParticipantHighlight, setNewParticipantHighlight] = useState('');
  const [newRequirementText, setNewRequirementText] = useState('');

  // Polos State
  const [editingPolo, setEditingPolo] = useState<FacilityPolo | null>(null);
  const [isCreatingPolo, setIsCreatingPolo] = useState(false);
  const [newPoloAmenity, setNewPoloAmenity] = useState('');
  const [newPoloRule, setNewPoloRule] = useState('');

  // Scout Inquiries State
  const [editingScoutInq, setEditingScoutInq] = useState<ScoutInquiryRecord | null>(null);
  const [isCreatingScoutInq, setIsCreatingScoutInq] = useState(false);
  const [scoutInqFilter, setScoutInqFilter] = useState<string>('all');
  const [scoutInqSearch, setScoutInqSearch] = useState('');

  // Gallery Editing State
  const [editingAlbum, setEditingAlbum] = useState<PastEventPhoto | null>(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [isUploadingAlbumPhotos, setIsUploadingAlbumPhotos] = useState(false);

  // Transparency Docs Editing & Filtering State
  const [editingDoc, setEditingDoc] = useState<TransparencyDocument | null>(null);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('all');
  const [isUploadingDocFile, setIsUploadingDocFile] = useState(false);

  // Sponsors Editing & Filtering State
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [isCreatingSponsor, setIsCreatingSponsor] = useState(false);
  const [sponsorSearch, setSponsorSearch] = useState('');
  const [sponsorTierFilter, setSponsorTierFilter] = useState('all');

  // RSVPs, Messages & Security UI State
  const [rsvpSearch, setRsvpSearch] = useState('');
  const [rsvpEventFilter, setRsvpEventFilter] = useState('all');
  const [isCreatingRsvp, setIsCreatingRsvp] = useState(false);
  const [editingRsvpItem, setEditingRsvpItem] = useState<{
    id: string;
    eventId: string;
    eventTitle: string;
    name: string;
    phone: string;
    spots: number;
    date: string;
    confirmationCode: string;
  } | null>(null);

  const [msgSearch, setMsgSearch] = useState('');
  const [msgStatusFilter, setMsgStatusFilter] = useState<'all' | 'unread' | 'read'>('all');

  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [importJsonError, setImportJsonError] = useState<string | null>(null);

  // GitHub Repository / File Importer State
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubPath, setGithubPath] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubItems, setGithubItems] = useState<
    Array<{
      name: string;
      path: string;
      type: 'file' | 'dir';
      size: number;
      download_url: string | null;
      html_url: string;
    }>
  >([]);

  // Security confirmation PIN modal
  const [pinPromptOpen, setPinPromptOpen] = useState(false);
  const [pinAction, setPinAction] = useState<(() => void) | null>(null);
  const [inputPin, setInputPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Dirty / Unsaved Changes Detection
  const isClubInfoDirty = JSON.stringify(draftClubInfo) !== JSON.stringify(clubInfo);
  const isSiteSettingsDirty = JSON.stringify(draftSiteSettings) !== JSON.stringify(siteSettings);
  const isNewsDirty = JSON.stringify(draftNews) !== JSON.stringify(newsArticles);
  const isSponsorsDirty = JSON.stringify(draftSponsors) !== JSON.stringify(sponsors);
  const isEventsDirty = JSON.stringify(draftEvents) !== JSON.stringify(events);
  const isProjectsDirty = JSON.stringify(draftProjects) !== JSON.stringify(projects);
  const isAlbumsDirty = JSON.stringify(draftAlbums) !== JSON.stringify(galleryAlbums);
  const isDocsDirty = JSON.stringify(draftDocs) !== JSON.stringify(transparencyDocs);
  const isPolosDirty = JSON.stringify(draftPolos) !== JSON.stringify(facilityPolos);
  const isScoutInquiriesDirty =
    JSON.stringify(draftScoutInquiries) !== JSON.stringify(scoutInquiries);
  const isRsvpsDirty = JSON.stringify(draftRsvps) !== JSON.stringify(rsvps);
  const isMessagesDirty = JSON.stringify(draftMessages) !== JSON.stringify(contactMessages);
  const isCredsDirty = JSON.stringify(draftCreds) !== JSON.stringify(creds);
  const hasOpenModalDraft = Boolean(
    editingNews ||
      editingSponsor ||
      editingEvent ||
      editingProject ||
      editingPolo ||
      editingScoutInq ||
      editingAlbum ||
      editingDoc ||
      editingRsvpItem
  );

  const hasUnsavedChanges =
    isClubInfoDirty ||
    isSiteSettingsDirty ||
    isNewsDirty ||
    isSponsorsDirty ||
    isEventsDirty ||
    isProjectsDirty ||
    isAlbumsDirty ||
    isDocsDirty ||
    isPolosDirty ||
    isScoutInquiriesDirty ||
    isRsvpsDirty ||
    isMessagesDirty ||
    isCredsDirty ||
    hasOpenModalDraft;

  const handleDiscardAllChanges = () => {
    setDraftClubInfo(clubInfo);
    setDraftSiteSettings(siteSettings);
    setDraftNews(newsArticles);
    setDraftSponsors(sponsors);
    setDraftEvents(events);
    setDraftProjects(projects);
    setDraftAlbums(galleryAlbums);
    setDraftDocs(transparencyDocs);
    setDraftPolos(facilityPolos);
    setDraftScoutInquiries(scoutInquiries);
    setDraftRsvps(rsvps);
    setDraftMessages(contactMessages);
    setDraftCreds(creds);
    setEditingNews(null);
    setIsCreatingNews(false);
    setEditingSponsor(null);
    setIsCreatingSponsor(false);
    setEditingEvent(null);
    setIsCreatingEvent(false);
    setNewHighlightText('');
    setNewPrereqText('');
    setEditingProject(null);
    setIsCreatingProject(false);
    setEditingPolo(null);
    setIsCreatingPolo(false);
    setEditingScoutInq(null);
    setIsCreatingScoutInq(false);
    setEditingAlbum(null);
    setIsCreatingAlbum(false);
    setNewPhotoUrl('');
    setNewPhotoCaption('');
    setEditingDoc(null);
    setIsCreatingDoc(false);
    setEditingRsvpItem(null);
    setIsCreatingRsvp(false);
    showToast('Alterações não salvas foram descartadas.', 'info');
  };

  const handleSaveAllAdminChanges = (customToastMessage?: string): boolean => {
    let nextNews = [...draftNews];
    let nextSponsors = [...draftSponsors];
    let nextEvents = [...draftEvents];
    let nextProjects = [...draftProjects];
    let nextAlbums = [...draftAlbums];
    let nextDocs = [...draftDocs];
    let nextPolos = [...draftPolos];
    let nextScoutInquiries = [...draftScoutInquiries];
    let nextRsvps = [...draftRsvps];

    // 1. Validate & commit open News modal if present
    if (editingNews) {
      if (!editingNews.title.trim()) {
        showToast('Informe o título da notícia antes de salvar.', 'error');
        return false;
      }
      const cleanedContent = (editingNews.content || [])
        .map((p) => p.trim())
        .filter(Boolean);
      const finalArticle: NewsArticle = {
        ...editingNews,
        id: isCreatingNews || !editingNews.id ? `noticia-${Date.now()}` : editingNews.id,
        views: editingNews.views ?? 1,
        content: cleanedContent.length > 0 ? cleanedContent : [editingNews.summary],
      };
      if (isCreatingNews || !editingNews.id) {
        nextNews = [finalArticle, ...nextNews];
      } else {
        nextNews = nextNews.map((item) => (item.id === finalArticle.id ? finalArticle : item));
      }
      setDraftNews(nextNews);
      setIsCreatingNews(false);
      setEditingNews(null);
    }

    // 1b. Validate & commit open Sponsor modal if present
    if (editingSponsor) {
      if (!editingSponsor.name.trim()) {
        showToast('Informe o nome da empresa ou parceiro patrocinador.', 'error');
        return false;
      }
      const finalSponsor: Sponsor = {
        ...editingSponsor,
        id: isCreatingSponsor || !editingSponsor.id ? `patrocinador-${Date.now()}` : editingSponsor.id,
        tierLabel:
          editingSponsor.tierLabel ||
          (editingSponsor.tier === 'master'
            ? 'Patrocinador Master'
            : editingSponsor.tier === 'ouro'
            ? 'Patrocinador Ouro'
            : editingSponsor.tier === 'prata'
            ? 'Patrocinador Prata'
            : editingSponsor.tier === 'bronze'
            ? 'Patrocinador Bronze'
            : 'Apoio Institucional'),
      };
      if (isCreatingSponsor || !editingSponsor.id) {
        nextSponsors = [...nextSponsors, finalSponsor];
      } else {
        nextSponsors = nextSponsors.map((s) => (s.id === finalSponsor.id ? finalSponsor : s));
      }
      nextSponsors.sort((a, b) => (a.order || 0) - (b.order || 0));
      setDraftSponsors(nextSponsors);
      setIsCreatingSponsor(false);
      setEditingSponsor(null);
    }

    // 2. Validate & commit open Event modal if present (auto-including any typed highlight/prerequisite)
    if (editingEvent) {
      if (!editingEvent.title.trim()) {
        showToast('Informe o título da atividade antes de salvar.', 'error');
        return false;
      }
      const mergedHighlights = newHighlightText.trim()
        ? [...(editingEvent.scheduleHighlights || []), newHighlightText.trim()]
        : editingEvent.scheduleHighlights || [];
      const mergedPrereqs = newPrereqText.trim()
        ? [...(editingEvent.prerequisites || []), newPrereqText.trim()]
        : editingEvent.prerequisites || [];

      const finalEvent: VitalizarEvent = {
        ...editingEvent,
        id: isCreatingEvent || !editingEvent.id ? `evento-${Date.now()}` : editingEvent.id,
        scheduleHighlights: mergedHighlights,
        prerequisites: mergedPrereqs,
      };
      if (isCreatingEvent || !editingEvent.id) {
        nextEvents = [finalEvent, ...nextEvents];
      } else {
        nextEvents = nextEvents.map((ev) => (ev.id === finalEvent.id ? finalEvent : ev));
      }
      setDraftEvents(nextEvents);
      setNewHighlightText('');
      setNewPrereqText('');
      setIsCreatingEvent(false);
      setEditingEvent(null);
    }

    // 3. Validate & commit open Project modal if present
    if (editingProject) {
      if (!editingProject.name.trim()) {
        showToast('Informe o nome do projeto antes de salvar.', 'error');
        return false;
      }
      const finalProj: VitalizarProject = {
        ...editingProject,
        id: isCreatingProject || !editingProject.id ? `projeto-${Date.now()}` : editingProject.id,
      };
      if (isCreatingProject || !editingProject.id) {
        nextProjects = [finalProj, ...nextProjects];
      } else {
        nextProjects = nextProjects.map((p) => (p.id === finalProj.id ? finalProj : p));
      }
      setDraftProjects(nextProjects);
      setIsCreatingProject(false);
      setEditingProject(null);
    }

    // 3b. Validate & commit open Facility Polo modal if present
    if (editingPolo) {
      if (!editingPolo.name.trim()) {
        showToast('Informe o nome do polo esportivo antes de salvar.', 'error');
        return false;
      }
      const finalPolo: FacilityPolo = {
        ...editingPolo,
        id: isCreatingPolo || !editingPolo.id ? `polo-${Date.now()}` : editingPolo.id,
      };
      if (isCreatingPolo || !editingPolo.id) {
        nextPolos = [...nextPolos, finalPolo];
      } else {
        nextPolos = nextPolos.map((p) => (p.id === finalPolo.id ? finalPolo : p));
      }
      setDraftPolos(nextPolos);
      setIsCreatingPolo(false);
      setEditingPolo(null);
    }

    // 3d. Validate & commit open Scout Inquiry modal if present
    if (editingScoutInq) {
      if (!(editingScoutInq.scoutName || '').trim()) {
        showToast('Informe o nome do avaliador/olheiro.', 'error');
        return false;
      }
      const finalInq: ScoutInquiryRecord = {
        ...editingScoutInq,
        id: isCreatingScoutInq || !editingScoutInq.id ? `scout-${Date.now()}` : editingScoutInq.id,
        protocol:
          editingScoutInq.protocol || `SCT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: editingScoutInq.createdAt || new Date().toLocaleDateString('pt-BR'),
      };
      if (isCreatingScoutInq || !editingScoutInq.id) {
        nextScoutInquiries = [finalInq, ...nextScoutInquiries];
      } else {
        nextScoutInquiries = nextScoutInquiries.map((s) =>
          s.id === finalInq.id ? finalInq : s
        );
      }
      setDraftScoutInquiries(nextScoutInquiries);
      setIsCreatingScoutInq(false);
      setEditingScoutInq(null);
    }

    // 4. Validate & commit open Gallery Album modal if present (auto-including typed photo URL)
    if (editingAlbum) {
      if (!editingAlbum.title.trim()) {
        showToast('Informe o título do álbum antes de salvar.', 'error');
        return false;
      }
      const mergedPhotos = newPhotoUrl.trim()
        ? [
            ...editingAlbum.albumPhotos,
            {
              url: newPhotoUrl.trim(),
              caption: newPhotoCaption.trim() || editingAlbum.title || 'Foto',
            },
          ]
        : editingAlbum.albumPhotos;

      const finalAlbum: PastEventPhoto = {
        ...editingAlbum,
        id: isCreatingAlbum || !editingAlbum.id ? `album-${Date.now()}` : editingAlbum.id,
        albumPhotos:
          mergedPhotos.length > 0
            ? mergedPhotos
            : [
                {
                  url: editingAlbum.coverUrl,
                  caption: editingAlbum.caption || editingAlbum.title,
                },
              ],
      };
      if (isCreatingAlbum || !editingAlbum.id) {
        nextAlbums = [finalAlbum, ...nextAlbums];
      } else {
        nextAlbums = nextAlbums.map((a) => (a.id === finalAlbum.id ? finalAlbum : a));
      }
      setDraftAlbums(nextAlbums);
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      setIsCreatingAlbum(false);
      setEditingAlbum(null);
    }

    // 5. Validate & commit open Transparency Doc modal if present
    if (editingDoc) {
      if (!editingDoc.title.trim()) {
        showToast('Informe o título do documento antes de salvar.', 'error');
        return false;
      }
      const finalDoc: TransparencyDocument = {
        ...editingDoc,
        id: isCreatingDoc || !editingDoc.id ? `doc-${Date.now()}` : editingDoc.id,
      };
      if (isCreatingDoc || !editingDoc.id) {
        nextDocs = [finalDoc, ...nextDocs];
      } else {
        nextDocs = nextDocs.map((d) => (d.id === finalDoc.id ? finalDoc : d));
      }
      setDraftDocs(nextDocs);
      setIsCreatingDoc(false);
      setEditingDoc(null);
    }

    // 6. Validate & commit open RSVP modal if present
    if (editingRsvpItem) {
      if (!editingRsvpItem.name.trim() || !editingRsvpItem.phone.trim()) {
        showToast('Preencha o nome e o telefone do participante.', 'error');
        return false;
      }
      if (isCreatingRsvp || !editingRsvpItem.id) {
        const newRsvp = {
          ...editingRsvpItem,
          id: `rsvp-${Date.now()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          confirmationCode:
            editingRsvpItem.confirmationCode ||
            `VIT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        };
        nextRsvps = [newRsvp, ...nextRsvps];
        nextEvents = nextEvents.map((ev) =>
          ev.id === newRsvp.eventId
            ? { ...ev, availableSpots: Math.max(0, ev.availableSpots - newRsvp.spots) }
            : ev
        );
      } else {
        const previousRsvp = nextRsvps.find((item) => item.id === editingRsvpItem.id);
        nextRsvps = nextRsvps.map((item) =>
          item.id === editingRsvpItem.id ? editingRsvpItem : item
        );
        if (previousRsvp && previousRsvp.spots !== editingRsvpItem.spots) {
          const diff = editingRsvpItem.spots - previousRsvp.spots;
          nextEvents = nextEvents.map((ev) =>
            ev.id === editingRsvpItem.eventId
              ? {
                  ...ev,
                  availableSpots: Math.max(0, Math.min(ev.capacity, ev.availableSpots - diff)),
                }
              : ev
          );
        }
      }
      setDraftRsvps(nextRsvps);
      setDraftEvents(nextEvents);
      setEditingRsvpItem(null);
      setIsCreatingRsvp(false);
    }

    // 7. Validate & Commit Security Credentials if changed
    if (isCredsDirty) {
      if (!draftCreds.email.trim() || !draftCreds.email.includes('@')) {
        showToast('Informe um e-mail institucional válido na aba Segurança.', 'error');
        return false;
      }
      const pwdCheck = validatePasswordStrength(draftCreds.passwordHashOrPlain);
      if (!pwdCheck.valid) {
        showToast(pwdCheck.reason || 'Senha fraca.', 'error');
        return false;
      }
      if (!/^\d{6}$/.test(draftCreds.securityPin.trim())) {
        showToast('O PIN de segurança deve conter exatamente 6 dígitos numéricos.', 'error');
        return false;
      }
      setCreds(draftCreds);
      localStorage.setItem('vitalizar_admin_credentials', JSON.stringify(draftCreds));
    }

    // 8. Persist all data to ClubDataContext, localStorage and Firestore
    const savedOk = saveAdminChanges({
      clubInfo: draftClubInfo,
      siteSettings: draftSiteSettings,
      newsArticles: nextNews,
      sponsors: nextSponsors,
      events: nextEvents,
      projects: nextProjects,
      galleryAlbums: nextAlbums,
      transparencyDocs: nextDocs,
      facilityPolos: nextPolos,
      scoutInquiries: nextScoutInquiries,
      rsvps: nextRsvps,
      contactMessages: draftMessages,
      toastMessage: customToastMessage || 'Alterações salvas no banco de dados e publicadas!',
    });

    return savedOk;
  };

  const handleRequestCloseAdmin = () => {
    if (hasUnsavedChanges) {
      setUnsavedClosePromptOpen(true);
    } else {
      onClose();
    }
  };

  // Auto session expiration check
  useEffect(() => {
    const timer = setInterval(() => {
      if (session && !isSessionValid(session)) {
        setSession(null);
        sessionStorage.removeItem('vitalizar_admin_session');
        showToast('Sessão administrativa expirada por inatividade.', 'info');
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [session, showToast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsAuthenticatingFirebase(true);

    try {
      // 1. Attempt Firebase Email/Password Authentication first if configured
      try {
        const fbUser = await loginWithEmailPasswordFirebase(loginEmail, loginPass);
        if (fbUser) {
          const authCheck = await verifyFirebaseAdminAccess(fbUser, creds.email);
          if (!authCheck.authorized) {
            await logoutFirebaseAdmin();
            setLoginError(
              authCheck.reason ||
                `Acesso restrito: a conta "${fbUser.email}" não possui credenciais administrativas autorizadas.`
            );
            return;
          }
          const now = Date.now();
          const fbSession: AdminSession = {
            token: `FB-ADM-${Math.random().toString(36).slice(2, 10).toUpperCase()}-${now.toString(36).toUpperCase()}`,
            loginTime: now,
            expiresAt: now + 2 * 60 * 60 * 1000,
            adminEmail: fbUser.email || loginEmail.trim(),
          };
          const resetLimit = { failedAttempts: 0, lockedUntil: null };
          setRateLimit(resetLimit);
          localStorage.setItem('vitalizar_admin_ratelimit', JSON.stringify(resetLimit));
          setSession(fbSession);
          sessionStorage.setItem('vitalizar_admin_session', JSON.stringify(fbSession));
          showToast('Autenticado via Firebase Auth! Bem-vindo ao Painel Vitalizar.', 'success');
          return;
        }
      } catch {
        // Fallback to institutional admin credentials check
      }

      // 2. Institutional Admin Credentials Validation with Rate Limiting
      const result = validateAdminCredentials(loginEmail, loginPass, creds, rateLimit);
      setRateLimit(result.updatedRateLimit);
      localStorage.setItem('vitalizar_admin_ratelimit', JSON.stringify(result.updatedRateLimit));

      if (result.success && result.session) {
        setSession(result.session);
        sessionStorage.setItem('vitalizar_admin_session', JSON.stringify(result.session));
        showToast('Bem-vindo ao Painel de Controle Vitalizar!', 'success');
      } else {
        setLoginError(result.reason || 'Credenciais administrativas inválidas.');
      }
    } finally {
      setIsAuthenticatingFirebase(false);
    }
  };

  const handleGoogleAdminLogin = async () => {
    setLoginError(null);
    setIsAuthenticatingFirebase(true);
    try {
      const user = await loginWithGoogleAdmin();
      if (user) {
        const authCheck = await verifyFirebaseAdminAccess(user, creds.email);
        if (!authCheck.authorized) {
          await logoutFirebaseAdmin();
          setLoginError(
            authCheck.reason ||
              `Acesso negado: a conta Google "${user.email}" não possui permissão de administrador neste projeto.`
          );
          return;
        }
        const now = Date.now();
        const googleSession: AdminSession = {
          token: `FB-GGL-${Math.random().toString(36).slice(2, 10).toUpperCase()}-${now.toString(36).toUpperCase()}`,
          loginTime: now,
          expiresAt: now + 2 * 60 * 60 * 1000,
          adminEmail: user.email || creds.email,
        };
        const resetLimit = { failedAttempts: 0, lockedUntil: null };
        setRateLimit(resetLimit);
        localStorage.setItem('vitalizar_admin_ratelimit', JSON.stringify(resetLimit));
        setSession(googleSession);
        sessionStorage.setItem('vitalizar_admin_session', JSON.stringify(googleSession));
        showToast(`Autenticado no Firebase como ${user.email}!`, 'success');
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setLoginError('Não foi possível autenticar com o Google Firebase. Tente novamente.');
      }
    } finally {
      setIsAuthenticatingFirebase(false);
    }
  };

  const handleLogout = async () => {
    await logoutFirebaseAdmin();
    setSession(null);
    sessionStorage.removeItem('vitalizar_admin_session');
    showToast('Sessão administrativa encerrada com segurança.');
  };

  const requestPinProtectedAction = (action: () => void) => {
    setPinAction(() => action);
    setInputPin('');
    setPinError(false);
    setPinPromptOpen(true);
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateSecurityPin(inputPin, creds.securityPin)) {
      setPinPromptOpen(false);
      if (pinAction) pinAction();
      setPinAction(null);
    } else {
      setPinError(true);
    }
  };

  // Helper for uploading a file directly to a Transparency Document (draft only)
  const handleTransparencyFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingDoc) return;

    setIsUploadingDocFile(true);
    try {
      const processed = await processAttachmentUpload(file);
      setEditingDoc({
        ...editingDoc,
        fileName: processed.name,
        fileSize: processed.size,
        fileType: processed.type,
        fileDataUrl: processed.dataUrl,
        title: editingDoc.title || file.name.replace(/\.[^/.]+$/, ''),
      });
    } catch (err: any) {
      showToast(err?.message || 'Erro ao anexar documento.', 'error');
    } finally {
      setIsUploadingDocFile(false);
      e.target.value = '';
    }
  };

  // Helper for uploading multiple photos to a Gallery Album (draft only)
  const handleGalleryPhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !editingAlbum) return;

    setIsUploadingAlbumPhotos(true);
    try {
      const uploadedPhotos: { url: string; caption: string }[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const compressedUrl = await processImageUpload(file, 1280, 0.82);
        const cleanCaption = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        uploadedPhotos.push({
          url: compressedUrl,
          caption: cleanCaption || `Registro fotográfico - ${editingAlbum.title}`,
        });
      }

      const updatedAlbumPhotos = [...editingAlbum.albumPhotos, ...uploadedPhotos];
      setEditingAlbum({
        ...editingAlbum,
        coverUrl: editingAlbum.coverUrl || uploadedPhotos[0]?.url || '',
        albumPhotos: updatedAlbumPhotos,
      });
    } catch (err: any) {
      showToast(err?.message || 'Erro ao processar fotos.', 'error');
    } finally {
      setIsUploadingAlbumPhotos(false);
      e.target.value = '';
    }
  };

  // =========================================================================
  // 1. LOGIN SCREEN (PROTECTION GATE)
  // =========================================================================
  if (!session) {
    const isLocked = rateLimit.lockedUntil && Date.now() < rateLimit.lockedUntil;
    const remainingSec = isLocked ? Math.ceil((rateLimit.lockedUntil! - Date.now()) / 1000) : 0;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-[#061424] via-[#0a1e36] to-[#040d18] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-sky-900/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-[#0a1e36] text-white p-6 sm:p-8 text-center relative border-b border-sky-900">
            <button
              onClick={onClose}
              className="absolute left-4 top-4 p-2 text-sky-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar ao Site</span>
            </button>

            <img
              src="/logo.png"
              alt="Logo Associação Esportiva Vitalizar"
              className="w-20 h-20 object-contain mx-auto drop-shadow-xl mb-3 mt-4"
            />

            <span className="text-[10px] font-black tracking-widest text-[#38bdf8] uppercase bg-sky-950/80 px-2.5 py-1 rounded-full border border-sky-500/30">
              Acesso Restrito • Governança
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase text-white mt-2">
              PAINEL ADMINISTRATIVO
            </h1>
            <p className="text-xs text-sky-200/80 mt-1 max-w-xs mx-auto">
              Associação Esportiva Vitalizar • Gestão de Conteúdo e Arquivos
            </p>
          </div>

          {/* Body / Form */}
          <div className="p-6 sm:p-8 space-y-5">
            {loginError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800 animate-in shake duration-200">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Falha de Autenticação</span>
                  <span>{loginError}</span>
                </div>
              </div>
            )}

            {isLocked ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2 text-xs text-amber-800">
                <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto animate-pulse" />
                <h3 className="font-bold text-sm">Acesso Temporariamente Bloqueado</h3>
                <p>
                  Por medidas de segurança contra invasões e força bruta, o acesso está suspenso.
                </p>
                <div className="font-mono text-base font-black text-amber-900 bg-amber-100/70 p-2 rounded-lg">
                  Aguarde {remainingSec} segundos
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="admin@vitalizar.org.br"
                    className="w-full text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Senha de Administrador *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPass}
                      onChange={(e) => setLoginPass(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full text-xs p-3 pr-10 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticatingFirebase}
                  className="w-full py-3 bg-[#0a1e36] hover:bg-[#0284c7] disabled:opacity-60 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-sky-400/30"
                >
                  <Unlock className="w-4 h-4 text-[#38bdf8]" />
                  <span>
                    {isAuthenticatingFirebase
                      ? 'Verificando Credenciais...'
                      : 'Autenticar com Credenciais'}
                  </span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ou Firebase Auth
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  disabled={isAuthenticatingFirebase}
                  onClick={handleGoogleAdminLogin}
                  className="w-full py-2.5 bg-white hover:bg-slate-50 text-[#0a1e36] font-bold text-xs rounded-xl border border-slate-300 shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Cloud className="w-4 h-4 text-[#0284c7]" />
                  <span>Entrar com Conta Google Admin (Firebase)</span>
                </button>
              </form>
            )}

            {/* Quick Helper for Demo credentials */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acesso Restrito a Administradores</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail(creds.email || 'admin@vitalizar.org.br');
                  setLoginPass(creds.passwordHashOrPlain || 'vitalizar2026!');
                }}
                className="text-[#0284c7] hover:underline font-bold cursor-pointer"
              >
                Preencher Credencial Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-100 flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-[#0a1e36] text-white px-4 sm:px-6 py-3 border-b border-sky-950 flex items-center justify-between shadow-md flex-shrink-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-1.5 text-sky-200 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Menu administrativo"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <img
            src="/logo.png"
            alt="Logo Vitalizar"
            className="w-10 h-10 object-contain drop-shadow-sm flex-shrink-0"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wide">VITALIZAR ADMIN</span>
              <span className="text-[10px] bg-sky-950 text-[#38bdf8] border border-sky-500/40 px-2 py-0.5 rounded-full font-bold uppercase hidden sm:inline">
                CMS & Gestão de Arquivos
              </span>
              {hasUnsavedChanges && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-bold uppercase animate-pulse">
                  Alterações não salvas
                </span>
              )}
            </div>
            <span className="text-[10px] text-sky-200/80 block">
              Conectado como: <strong>{session.adminEmail}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Cloud Connection Badge */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 rounded-lg text-[10px] font-bold"
            title="Conectado ao Firestore: ceremonial-amulet-314dk"
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firestore Conectado</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Firebase Google Auth Button */}
          {firebaseUser ? (
            <div
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-sky-950/70 border border-sky-400/40 text-sky-200 rounded-lg text-[10px] font-semibold"
              title={`Autenticado no Firebase Auth: ${firebaseUser.email}`}
            >
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="max-w-[130px] truncate">{firebaseUser.email}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  const user = await loginWithGoogleAdmin();
                  if (user) {
                    showToast(`Conectado ao Firebase Auth como ${user.email}!`, 'success');
                  }
                } catch (err: any) {
                  showToast('Falha na autenticação Google ou janela fechada.', 'info');
                }
              }}
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white rounded-lg text-[10px] font-bold border border-sky-400/30 cursor-pointer transition-colors"
              title="Conectar com conta Google autorizada no Firebase"
            >
              <ShieldCheck className="w-3 h-3 text-[#38bdf8]" />
              <span>Login Google Cloud</span>
            </button>
          )}

          {hasUnsavedChanges && (
            <button
              type="button"
              onClick={handleDiscardAllChanges}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-200 hover:text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-amber-400/30 hidden md:inline-flex items-center gap-1"
              title="Descartar alterações não salvas"
            >
              <span>Descartar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 hover:text-white text-xs font-bold rounded-lg transition-colors hidden lg:inline-flex items-center gap-1.5 cursor-pointer border border-sky-400/30"
            title="Importar arquivos de repositório GitHub ou Backup JSON"
          >
            <Upload className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Importar do GitHub</span>
          </button>

          <button
            type="button"
            onClick={() => handleSaveAllAdminChanges()}
            className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              hasUnsavedChanges
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white ring-2 ring-emerald-300/60'
                : 'bg-[#0284c7] hover:bg-[#0369a1] text-white'
            }`}
            title="Salvar alterações feitas no painel administrativo"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Salvar Alterações</span>
          </button>

          <button
            onClick={handleRequestCloseAdmin}
            className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
            title="Visualizar site público"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span className="hidden sm:inline">Ver Site Público</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-1.5 bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Encerrar sessão"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Workspace with Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop */}
        {mobileNavOpen && (
          <div
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-2xs"
          />
        )}

        {/* Left Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#0d2746] text-white flex-shrink-0 border-r border-sky-950/80 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ${
            mobileNavOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <nav className="p-3 space-y-4" aria-label="Navegação administrativa">
            {[
              {
                group: 'Governança & Site',
                items: [
                  { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard, badge: null },
                  {
                    id: 'configuracoes',
                    label: 'Configurações do Site',
                    icon: Settings,
                    badge: isSiteSettingsDirty ? '•' : null,
                  },
                  {
                    id: 'institucional',
                    label: 'Dados da Entidade',
                    icon: Building2,
                    badge: isClubInfoDirty ? '•' : null,
                  },
                ],
              },
              {
                group: 'Conteúdo & Portal',
                items: [
                  { id: 'noticias', label: 'Notícias & Anexos', icon: Newspaper, badge: draftNews.length },
                  {
                    id: 'patrocinadores',
                    label: 'Patrocinadores & Apoio',
                    icon: HeartHandshake,
                    badge: draftSponsors.length,
                  },
                  { id: 'eventos', label: 'Calendário & Clínicas', icon: CalendarDays, badge: draftEvents.length },
                  { id: 'projetos', label: 'Projetos & Elenco', icon: FolderKanban, badge: draftProjects.length },
                  {
                    id: 'polos',
                    label: 'Sedes & Polos',
                    icon: MapPin,
                    badge: draftPolos.length,
                  },
                  { id: 'galeria', label: 'Galeria de Fotos', icon: Camera, badge: draftAlbums.length },
                  { id: 'transparencia', label: 'Transparência & PDFs', icon: FileText, badge: draftDocs.length },
                ],
              },
              {
                group: 'Comunidade & Sistema',
                items: [
                  { id: 'inscricoes', label: 'Inscrições & RSVPs', icon: Users, badge: draftRsvps.length },
                  {
                    id: 'comunidade_pix',
                    label: 'PIX, Jogos & Voluntários',
                    icon: Trophy,
                    badge:
                      (draftSiteSettings.volunteers || []).filter((v) => v.status === 'novo')
                        .length ||
                      (draftSiteSettings.donationPledges || []).length ||
                      null,
                  },
                  {
                    id: 'olheiros',
                    label: 'Olheiros & Captação',
                    icon: Trophy,
                    badge:
                      draftScoutInquiries.filter((s) => s.status === 'nova').length ||
                      draftScoutInquiries.length ||
                      null,
                  },
                  {
                    id: 'mensagens',
                    label: 'Contatos & Ouvidoria',
                    icon: Mail,
                    badge: draftMessages.filter((m) => !m.read).length || null,
                  },
                  { id: 'seguranca', label: 'Segurança & Acesso', icon: KeyRound, badge: isCredsDirty ? '•' : null },
                  { id: 'backup', label: 'Importação & Backup', icon: FileSpreadsheet, badge: null },
                ],
              },
            ].map((section) => (
              <div key={section.group} className="space-y-1">
                <span className="px-3 text-[10px] font-black uppercase tracking-widest text-sky-400/70 block">
                  {section.group}
                </span>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setMobileNavOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0284c7] text-white shadow-md'
                          : 'text-sky-100/80 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-sky-300'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            isActive ? 'bg-white text-[#0a1e36]' : 'bg-sky-950 text-sky-300 border border-sky-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Quick System Info in Sidebar Footer */}
          <div className="p-3 border-t border-sky-950/80 text-[10px] text-sky-300/70 space-y-1">
            <span className="block font-bold text-white">Associação Vitalizar</span>
            <span className="block">CNPJ: {draftClubInfo.cnpj}</span>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold pt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>Firebase Firestore Ativo</span>
            </div>
            <span className="block text-sky-400/80 font-mono text-[9px] truncate">
              ceremonial-amulet-314dk
            </span>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 space-y-5">
          {/* Sticky Pending Unsaved Changes Banner */}
          {hasUnsavedChanges && !hasOpenModalDraft && (
            <div className="sticky top-0 z-30 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Alterações pendentes:</strong> As modificações feitas no painel só serão aplicadas ao site público após clicar no botão <strong>Salvar</strong>.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDiscardAllChanges}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Descartar
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAllAdminChanges()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: VISÃO GERAL (DASHBOARD) */}
          {/* ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
                    Painel de Governança & Conteúdo
                  </span>
                  <h2 className="text-2xl font-black text-[#0a1e36] uppercase mt-0.5">
                    Visão Geral das Informações e Arquivos
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Publique matérias com arquivos anexos, atualize projetos esportivos e elencos, gerencie sedes e polos de atendimento, acompanhe olheiros e anexe documentos oficiais MROSC.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('noticias');
                      setIsCreatingNews(true);
                      setNewsEditorMode('blocks');
                      setEditingNews({
                        id: '',
                        title: '',
                        date:
                          new Date().toLocaleDateString('pt-BR') +
                          ' ' +
                          new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        category: 'Institucional',
                        summary: '',
                        content: [''],
                        imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
                        author: 'Comunicação Vitalizar',
                        attachments: [],
                      });
                    }}
                    className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    + Nova Notícia
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('polos');
                    }}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Sedes & Polos ({draftPolos.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('transparencia');
                      setIsCreatingDoc(true);
                      setEditingDoc({
                        id: '',
                        title: '',
                        category: 'estatuto',
                        date: new Date().toLocaleDateString('pt-BR'),
                        description: '',
                        fileType: 'PDF',
                        badge: 'Vigente',
                      });
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>+ Anexar Documento MROSC</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('configuracoes')}
                    className="px-4 py-2 bg-[#0a1e36] hover:bg-[#0d2746] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Configurações & Hero</span>
                  </button>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('eventos')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Eventos & Clínicas</span>
                    <CalendarDays className="w-5 h-5 text-[#0284c7]" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">{draftEvents.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    {draftRsvps.length} inscrições confirmadas
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('projetos')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Projetos & Elenco</span>
                    <FolderKanban className="w-5 h-5 text-[#0284c7]" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">{draftProjects.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    {draftProjects.reduce((acc, p) => acc + (p.participants?.length || 0), 0)} atletas na vitrine •{' '}
                    {draftProjects.reduce((acc, p) => acc + (p.staff?.length || 0), 0)} comissão
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('polos')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Sedes & Polos</span>
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">{draftPolos.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    Unidades de atendimento comunitário
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('olheiros')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Captação & Olheiros</span>
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">
                    {draftScoutInquiries.length}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {draftScoutInquiries.filter((s) => s.status === 'nova').length} novas sondagens de atletas
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('noticias')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Notícias</span>
                    <Newspaper className="w-5 h-5 text-[#0284c7]" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">{draftNews.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    Artigos e comunicados oficiais
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('patrocinadores')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Parcerias</span>
                    <HeartHandshake className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">{draftSponsors.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    {draftSponsors.filter((s) => s.active).length} ativos no portal
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('galeria')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Álbuns de Fotos</span>
                    <Camera className="w-5 h-5 text-[#0284c7]" />
                  </div>
                  <div className="text-3xl font-black text-[#0a1e36]">{draftAlbums.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    {draftAlbums.reduce((acc, a) => acc + a.albumPhotos.length, 0)} fotos publicadas
                  </span>
                </div>

                <div
                  onClick={() => setActiveTab('transparencia')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-300 shadow-xs space-y-2 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-bold uppercase">Transparência</span>
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-black text-emerald-700">{draftDocs.length}</div>
                  <span className="text-[11px] text-slate-500 block">
                    Documentos e arquivos MROSC
                  </span>
                </div>
              </div>

              {/* Recent Activity & Logs */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0284c7]" />
                    <h3 className="font-bold text-sm text-[#0a1e36] uppercase">
                      Registro de Auditoria & Alterações Recentes
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Últimas {auditLogs.length} ações
                    </span>
                    {auditLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAuditLogs}
                        className="text-[11px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer transition-colors"
                      >
                        Limpar Histórico
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-black text-[#0a1e36] uppercase tracking-wide block">
                          {(log.action || 'ACAO').replace(/_/g, ' ')}
                        </span>
                        {log.details && <span className="text-slate-600">{log.details}</span>}
                      </div>
                      <div className="text-right text-[10px] text-slate-400 font-mono flex-shrink-0">
                        <span>{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                        <span className="block">{new Date(log.timestamp).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DADOS INSTITUCIONAIS COMPLETOS (CLUB INFO) */}
          {/* ========================================================================= */}
          {activeTab === 'institucional' && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
                    Cadastro Oficial & Canais
                  </span>
                  <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
                    Dados Institucionais da Associação Vitalizar
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Edite razão social, diretoria, endereço, horários de atendimento e links das redes sociais. As alterações só serão salvas ao clicar em <strong>Salvar Dados Institucionais</strong>.
                  </p>
                </div>
                {isClubInfoDirty && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-bold shrink-0 self-start sm:self-auto">
                    Modificações não salvas
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveAllAdminChanges('Dados institucionais salvos com sucesso!');
                }}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.fullName}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, fullName: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Nome Fantasia / Sigla
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.tradeName}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, tradeName: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      CNPJ Oficial
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.cnpj}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, cnpj: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Presidente em Exercício
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.president}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, president: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Assessoria Jurídica
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.legalCounsel}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, legalCounsel: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Data da Consolidação Estatutária
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.statuteDate}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, statuteDate: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Endereço da Sede
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.address}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, address: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.cep}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, cep: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Município / UF
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.municipality}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, municipality: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Telefones / WhatsApp (Separados por vírgula)
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.phones.join(', ')}
                      onChange={(e) =>
                        setDraftClubInfo({
                          ...draftClubInfo,
                          phones: e.target.value.split(',').map((p) => p.trim()),
                        })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      E-mail Institucional Principal
                    </label>
                    <input
                      type="email"
                      value={draftClubInfo.email}
                      onChange={(e) =>
                        setDraftClubInfo({ ...draftClubInfo, email: e.target.value })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Horários de Funcionamento */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Horário da Secretaria / Atendimento
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.hours?.secretaria || ''}
                      onChange={(e) =>
                        setDraftClubInfo({
                          ...draftClubInfo,
                          hours: { ...draftClubInfo.hours, secretaria: e.target.value },
                        })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Horário das Atividades Esportivas
                    </label>
                    <input
                      type="text"
                      value={draftClubInfo.hours?.activities || ''}
                      onChange={(e) =>
                        setDraftClubInfo({
                          ...draftClubInfo,
                          hours: { ...draftClubInfo.hours, activities: e.target.value },
                        })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Redes Sociais */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Link do Instagram
                    </label>
                    <input
                      type="url"
                      value={draftClubInfo.socials?.instagram || ''}
                      onChange={(e) =>
                        setDraftClubInfo({
                          ...draftClubInfo,
                          socials: { ...draftClubInfo.socials, instagram: e.target.value },
                        })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Link do Facebook
                    </label>
                    <input
                      type="url"
                      value={draftClubInfo.socials?.facebook || ''}
                      onChange={(e) =>
                        setDraftClubInfo({
                          ...draftClubInfo,
                          socials: { ...draftClubInfo.socials, facebook: e.target.value },
                        })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Link do YouTube
                    </label>
                    <input
                      type="url"
                      value={draftClubInfo.socials?.youtube || ''}
                      onChange={(e) =>
                        setDraftClubInfo({
                          ...draftClubInfo,
                          socials: { ...draftClubInfo.socials, youtube: e.target.value },
                        })
                      }
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  {isClubInfoDirty && (
                    <button
                      type="button"
                      onClick={() => setDraftClubInfo(clubInfo)}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Descartar Alterações
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Dados Institucionais</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2B: CONFIGURAÇÕES DO SITE (CATEGORIAS, TAGS, AVISOS E MÓDULOS) */}
          {/* ========================================================================= */}
          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
                    Taxonomia, Módulos & Avisos do Portal
                  </span>
                  <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
                    Configurações Gerais do Site, Categorias e Tags
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Gerencie todas as categorias editoriais, tags, sugestões de busca, assuntos de contato, faixa de aviso no topo e módulos visíveis no portal.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isSiteSettingsDirty && (
                    <button
                      type="button"
                      onClick={() => setDraftSiteSettings(siteSettings)}
                      className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase rounded-xl cursor-pointer"
                    >
                      Descartar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      handleSaveAllAdminChanges('Configurações do site, categorias e tags salvas no Firebase!')
                    }
                    className="px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </button>
                </div>
              </div>

              {/* 1. Banner de Comunicado no Topo */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200 text-[#0284c7] flex items-center justify-center">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-[#0a1e36] uppercase">
                        Faixa de Comunicado / Aviso no Topo do Site
                      </h3>
                      <p className="text-xs text-slate-500">
                        Exibe um alerta oficial acima do cabeçalho em todas as páginas (ex.: abertura de inscrições, editais ou comunicados).
                      </p>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={draftSiteSettings.announcementBanner.enabled}
                      onChange={(e) =>
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          announcementBanner: {
                            ...draftSiteSettings.announcementBanner,
                            enabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 accent-[#0284c7] rounded cursor-pointer"
                    />
                    <span className="text-xs font-bold uppercase text-slate-700">
                      {draftSiteSettings.announcementBanner.enabled ? 'Ativo no Site' : 'Desativado'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                  <div className="md:col-span-6">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Texto do Comunicado
                    </label>
                    <input
                      type="text"
                      value={draftSiteSettings.announcementBanner.text}
                      onChange={(e) =>
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          announcementBanner: {
                            ...draftSiteSettings.announcementBanner,
                            text: e.target.value,
                          },
                        })
                      }
                      placeholder="Ex: Inscrições gratuitas abertas para as turmas de 2026!"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Texto do Botão (Opcional)
                    </label>
                    <input
                      type="text"
                      value={draftSiteSettings.announcementBanner.linkLabel || ''}
                      onChange={(e) =>
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          announcementBanner: {
                            ...draftSiteSettings.announcementBanner,
                            linkLabel: e.target.value,
                          },
                        })
                      }
                      placeholder="Ex: Inscrever-se Agora"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block font-bold text-slate-700 uppercase mb-1">
                      Destino ao Clicar
                    </label>
                    <select
                      value={draftSiteSettings.announcementBanner.linkTarget || 'inscricoes'}
                      onChange={(e) =>
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          announcementBanner: {
                            ...draftSiteSettings.announcementBanner,
                            linkTarget: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    >
                      <option value="inscricoes">Modal de Inscrições / Agendamento</option>
                      <option value="eventos">Página de Calendário & Eventos</option>
                      <option value="projetos">Página de Projetos Esportivos</option>
                      <option value="noticias">Página de Notícias</option>
                      <option value="patrocinadores">Página de Patrocinadores</option>
                      <option value="transparencia">Portal da Transparência</option>
                      <option value="contato">Página Fale Conosco</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Módulos e Recursos Visíveis no Site */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase">
                      Módulos e Seções Disponíveis no Portal
                    </h3>
                    <p className="text-xs text-slate-500">
                      Habilite ou desabilite recursos interativos e seções públicas do site em tempo real.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {[
                    {
                      key: 'enableSponsorsSection' as const,
                      title: 'Seção de Patrocinadores',
                      desc: 'Exibe a vitrine de parceiros e apoiadores na página inicial.',
                    },
                    {
                      key: 'enableFloatingWhatsapp' as const,
                      title: 'Botão Flutuante WhatsApp',
                      desc: 'Exibe o atalho rápido de atendimento via WhatsApp no canto inferior.',
                    },
                    {
                      key: 'enableSearch' as const,
                      title: 'Busca Global Inteligente',
                      desc: 'Permite pesquisar notícias, eventos, projetos, parceiros e PDFs.',
                    },
                    {
                      key: 'enableRsvpModal' as const,
                      title: 'Inscrições Online (RSVP)',
                      desc: 'Habilita o formulário de reserva de vagas para eventos e oficinas.',
                    },
                  ].map((mod) => (
                    <label
                      key={mod.key}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        draftSiteSettings[mod.key]
                          ? 'bg-sky-50/60 border-sky-300'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-[#0a1e36] uppercase">{mod.title}</span>
                        <input
                          type="checkbox"
                          checked={draftSiteSettings[mod.key]}
                          onChange={(e) =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              [mod.key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#0284c7] rounded cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{mod.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Gestão de Categorias e Tags do Site */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Categorias de Notícias */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-[#0284c7]" />
                      <span>Categorias de Notícias ({(draftSiteSettings.newsCategories || []).length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Categorias disponíveis ao publicar matérias e nos filtros de notícias do portal.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNewsCategory}
                      onChange={(e) => setNewNewsCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = newNewsCategory.trim();
                          const list = draftSiteSettings.newsCategories || [];
                          if (val && !list.includes(val)) {
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              newsCategories: [...list, val],
                            });
                            setNewNewsCategory('');
                          }
                        }
                      }}
                      placeholder="Nova categoria de notícia..."
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newNewsCategory.trim();
                        if (!val) return;
                        const list = draftSiteSettings.newsCategories || [];
                        if (list.includes(val)) {
                          showToast('Esta categoria já existe.', 'info');
                          return;
                        }
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          newsCategories: [...list, val],
                        });
                        setNewNewsCategory('');
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(draftSiteSettings.newsCategories || []).map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 text-[#0a1e36] border border-sky-200 rounded-xl text-xs font-bold"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              newsCategories: (draftSiteSettings.newsCategories || []).filter((c) => c !== cat),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                          title="Remover categoria"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags Oficiais do Site */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase flex items-center gap-2">
                      <Tag className="w-4 h-4 text-[#0284c7]" />
                      <span>Tags & Palavras-Chave do Site ({(draftSiteSettings.siteTags || []).length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tags disponíveis para classificar notícias, projetos e indexar na busca global.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSiteTag}
                      onChange={(e) => setNewSiteTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = newSiteTag.trim().replace(/^#/, '');
                          const list = draftSiteSettings.siteTags || [];
                          if (val && !list.includes(val)) {
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              siteTags: [...list, val],
                            });
                            setNewSiteTag('');
                          }
                        }
                      }}
                      placeholder="Nova tag (ex: Futsal, MROSC, Sub-15)..."
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newSiteTag.trim().replace(/^#/, '');
                        if (!val) return;
                        const list = draftSiteSettings.siteTags || [];
                        if (list.includes(val)) {
                          showToast('Esta tag já está cadastrada.', 'info');
                          return;
                        }
                        setDraftSiteSettings({
                          ...draftSiteSettings,
                          siteTags: [...list, val],
                        });
                        setNewSiteTag('');
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(draftSiteSettings.siteTags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold"
                      >
                        <span className="text-[#0284c7]">#</span>
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              siteTags: (draftSiteSettings.siteTags || []).filter((t) => t !== tag),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 font-black cursor-pointer ml-0.5"
                          title="Remover tag"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sugestões Rápidas de Busca */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase flex items-center gap-2">
                      <Search className="w-4 h-4 text-[#0284c7]" />
                      <span>Sugestões Rápidas na Busca ({(draftSiteSettings.searchSuggestions || []).length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Termos em destaque exibidos quando o visitante abre a barra de pesquisa do portal.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSearchSuggestion}
                      onChange={(e) => setNewSearchSuggestion(e.target.value)}
                      placeholder="Novo termo sugerido na busca..."
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newSearchSuggestion.trim();
                        if (!val) return;
                        const list = draftSiteSettings.searchSuggestions || [];
                        if (!list.includes(val)) {
                          setDraftSiteSettings({
                            ...draftSiteSettings,
                            searchSuggestions: [...list, val],
                          });
                        }
                        setNewSearchSuggestion('');
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(draftSiteSettings.searchSuggestions || []).map((sug) => (
                      <span
                        key={sug}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <span>{sug}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              searchSuggestions: (draftSiteSettings.searchSuggestions || []).filter(
                                (s) => s !== sug
                              ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assuntos do Formulário Fale Conosco */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#0284c7]" />
                      <span>Assuntos do Formulário de Contato ({(draftSiteSettings.contactSubjects || []).length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Opções de assunto disponíveis na página Fale Conosco / Ouvidoria.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newContactSubject}
                      onChange={(e) => setNewContactSubject(e.target.value)}
                      placeholder="Novo assunto de atendimento..."
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newContactSubject.trim();
                        if (!val) return;
                        const list = draftSiteSettings.contactSubjects || [];
                        if (!list.includes(val)) {
                          setDraftSiteSettings({
                            ...draftSiteSettings,
                            contactSubjects: [...list, val],
                          });
                        }
                        setNewContactSubject('');
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(draftSiteSettings.contactSubjects || []).map((subj) => (
                      <span
                        key={subj}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold"
                      >
                        <span>{subj}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              contactSubjects: (draftSiteSettings.contactSubjects || []).filter(
                                (s) => s !== subj
                              ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Categorias de Eventos, Projetos e Galeria */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-[#0284c7]" />
                      <span>Categorias de Eventos & Projetos</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Categorias utilizadas na agenda de atividades e nos projetos esportivos.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                        Categorias de Eventos:
                      </span>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newEventCategory}
                          onChange={(e) => setNewEventCategory(e.target.value)}
                          placeholder="Nova categoria de evento..."
                          className="flex-1 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = newEventCategory.trim();
                            const list = draftSiteSettings.eventCategories || [];
                            if (val && !list.includes(val)) {
                              setDraftSiteSettings({
                                ...draftSiteSettings,
                                eventCategories: [...list, val],
                              });
                              setNewEventCategory('');
                            }
                          }}
                          className="px-3 py-1.5 bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(draftSiteSettings.eventCategories || []).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-50 text-[#0a1e36] border border-sky-200 rounded-lg text-xs font-bold"
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftSiteSettings({
                                  ...draftSiteSettings,
                                  eventCategories: (draftSiteSettings.eventCategories || []).filter(
                                    (c) => c !== cat
                                  ),
                                })
                              }
                              className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                        Categorias de Projetos:
                      </span>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newProjectCategory}
                          onChange={(e) => setNewProjectCategory(e.target.value)}
                          placeholder="Nova categoria de projeto..."
                          className="flex-1 text-xs p-2 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = newProjectCategory.trim();
                            const list = draftSiteSettings.projectCategories || [];
                            if (val && !list.includes(val)) {
                              setDraftSiteSettings({
                                ...draftSiteSettings,
                                projectCategories: [...list, val],
                              });
                              setNewProjectCategory('');
                            }
                          }}
                          className="px-3 py-1.5 bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(draftSiteSettings.projectCategories || []).map((cat) => (
                          <span
                            key={cat}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-lg text-xs font-bold"
                          >
                            <span>{cat}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setDraftSiteSettings({
                                  ...draftSiteSettings,
                                  projectCategories: (draftSiteSettings.projectCategories || []).filter(
                                    (c) => c !== cat
                                  ),
                                })
                              }
                              className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categorias da Galeria */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-black text-sm text-[#0a1e36] uppercase flex items-center gap-2">
                      <Camera className="w-4 h-4 text-[#0284c7]" />
                      <span>Categorias da Galeria de Fotos ({(draftSiteSettings.galleryCategories || []).length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Filtros de álbuns fotográficos exibidos na seção de Galeria.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newGalleryCategory}
                      onChange={(e) => setNewGalleryCategory(e.target.value)}
                      placeholder="Nova categoria de álbum..."
                      className="flex-1 text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = newGalleryCategory.trim();
                        const list = draftSiteSettings.galleryCategories || [];
                        if (val && !list.includes(val)) {
                          setDraftSiteSettings({
                            ...draftSiteSettings,
                            galleryCategories: [...list, val],
                          });
                          setNewGalleryCategory('');
                        }
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer"
                    >
                      + Adicionar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(draftSiteSettings.galleryCategories || []).map((cat) => (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setDraftSiteSettings({
                              ...draftSiteSettings,
                              galleryCategories: (draftSiteSettings.galleryCategories || []).filter(
                                (c) => c !== cat
                              ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 font-black cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor de Slides do Carrossel Principal (Hero) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0284c7]">
                      Vitrine Principal da Capa
                    </span>
                    <h3 className="font-black text-base text-[#0a1e36] uppercase mt-0.5">
                      Slides do Carrossel Principal (Hero) ({(draftSiteSettings.heroSlides || []).length})
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Personalize os títulos, chamadas, horários, legendas e fotos de fundo do carrossel principal no topo da página inicial.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const currentSlides = draftSiteSettings.heroSlides || [];
                      const newSlide: HeroSlideConfig = {
                        id: `slide-${Date.now()}`,
                        kicker: 'Associação Esportiva Vitalizar · Cariacica/ES',
                        headline: 'NOVO DESTAQUE INSTITUCIONAL OU PROJETO ESPORTIVO',
                        description:
                          'Descreva o impacto comunitário, horários das turmas ou chamada para inscrições gratuitas.',
                        image:
                          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&q=85',
                        caption: 'Polo Rio Marinho · Cariacica/ES',
                        schedule: 'Segundas a Sextas • Vagas gratuitas',
                        primaryActionLabel: 'Inscrever-se Agora',
                        secondaryLabel: 'Conhecer Projetos',
                        secondaryTarget: '#projetos',
                      };
                      setDraftSiteSettings({
                        ...draftSiteSettings,
                        heroSlides: [...currentSlides, newSlide],
                      });
                    }}
                    className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Adicionar Slide</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {(draftSiteSettings.heroSlides || []).map((slide, sIdx) => (
                    <div
                      key={slide.id || sIdx}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <span className="font-black text-xs uppercase text-[#0a1e36] bg-white px-3 py-1 rounded-lg border border-slate-200">
                          Slide #{sIdx + 1} — {slide.headline.slice(0, 48)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={sIdx === 0}
                            onClick={() => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              const tmp = arr[sIdx - 1];
                              arr[sIdx - 1] = arr[sIdx];
                              arr[sIdx] = tmp;
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg cursor-pointer"
                            title="Mover slide para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={sIdx === (draftSiteSettings.heroSlides?.length || 1) - 1}
                            onClick={() => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              const tmp = arr[sIdx + 1];
                              arr[sIdx + 1] = arr[sIdx];
                              arr[sIdx] = tmp;
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 border border-slate-200 rounded-lg cursor-pointer"
                            title="Mover slide para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          {(draftSiteSettings.heroSlides?.length || 0) > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const arr = (draftSiteSettings.heroSlides || []).filter(
                                  (_, idx) => idx !== sIdx
                                );
                                setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                              }}
                              className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg cursor-pointer"
                              title="Remover slide"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Selo Superior (Kicker)
                          </label>
                          <input
                            type="text"
                            value={slide.kicker}
                            onChange={(e) => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              arr[sIdx] = { ...slide, kicker: e.target.value };
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Título Principal em Caixa Alta (Headline) *
                          </label>
                          <input
                            type="text"
                            value={slide.headline}
                            onChange={(e) => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              arr[sIdx] = { ...slide, headline: e.target.value };
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Descrição do Slide
                        </label>
                        <textarea
                          rows={2}
                          value={slide.description}
                          onChange={(e) => {
                            const arr = [...(draftSiteSettings.heroSlides || [])];
                            arr[sIdx] = { ...slide, description: e.target.value };
                            setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Legenda do Local / Foto
                          </label>
                          <input
                            type="text"
                            value={slide.caption}
                            onChange={(e) => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              arr[sIdx] = { ...slide, caption: e.target.value };
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Resumo de Dias / Horários
                          </label>
                          <input
                            type="text"
                            value={slide.schedule}
                            onChange={(e) => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              arr[sIdx] = { ...slide, schedule: e.target.value };
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Texto do Botão Principal
                          </label>
                          <input
                            type="text"
                            value={slide.primaryActionLabel}
                            onChange={(e) => {
                              const arr = [...(draftSiteSettings.heroSlides || [])];
                              arr[sIdx] = { ...slide, primaryActionLabel: e.target.value };
                              setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <ImageUploadField
                        label={`Imagem de Fundo do Slide #${sIdx + 1}`}
                        imageUrl={slide.image}
                        onChange={(newUrl) => {
                          const arr = [...(draftSiteSettings.heroSlides || [])];
                          arr[sIdx] = { ...slide, image: newUrl };
                          setDraftSiteSettings({ ...draftSiteSettings, heroSlides: arr });
                        }}
                        onError={(msg) => showToast(msg, 'error')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: NOTÍCIAS, MÍDIA & ANEXOS */}
          {/* ========================================================================= */}
          {activeTab === 'noticias' && (() => {
            const filteredNews = draftNews.filter((art) => {
              const matchCat =
                newsCategoryFilter === 'all' || art.category === newsCategoryFilter;
              const matchQuery =
                !newsSearch.trim() ||
                art.title.toLowerCase().includes(newsSearch.toLowerCase()) ||
                art.summary.toLowerCase().includes(newsSearch.toLowerCase());
              return matchCat && matchQuery;
            });

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Notícias, Comunicados & Anexos
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Editor estruturado com upload de fotos de capa, parágrafos ordenáveis e anexos para download ({draftNews.length} artigos).
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsCreatingNews(true);
                      setNewsEditorMode('blocks');
                      setEditingNews({
                        id: '',
                        title: '',
                        date:
                          new Date().toLocaleDateString('pt-BR') +
                          ' ' +
                          new Date().toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          }),
                        category: 'Institucional',
                        summary: '',
                        content: [''],
                        imageUrl:
                          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
                        author: 'Comunicação Vitalizar',
                        attachments: [],
                      });
                    }}
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Notícia / Comunicado</span>
                  </button>
                </div>

                {/* Search & Category Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={newsSearch}
                      onChange={(e) => setNewsSearch(e.target.value)}
                      placeholder="Buscar notícia por título ou resumo..."
                      className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    {newsSearch && (
                      <button
                        onClick={() => setNewsSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-600 whitespace-nowrap">
                      Categoria:
                    </label>
                    <select
                      value={newsCategoryFilter}
                      onChange={(e) => setNewsCategoryFilter(e.target.value)}
                      className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="all">Todas as Categorias</option>
                      {Array.from(
                        new Set([
                          ...(draftSiteSettings.newsCategories || []),
                          ...draftNews.map((n) => n.category),
                        ])
                      ).map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* News Create/Edit Modal with Block Editor, File Attachments & Live Preview */}
                {(isCreatingNews || editingNews) && editingNews && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                            Editor Editorial & Anexos
                          </span>
                          <h3 className="font-black text-base text-[#0a1e36] uppercase">
                            {isCreatingNews ? 'Publicar Nova Matéria' : 'Editar Matéria'}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setNewsEditorMode('blocks')}
                              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                                newsEditorMode === 'blocks'
                                  ? 'bg-[#0a1e36] text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Blocos
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewsEditorMode('raw')}
                              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                                newsEditorMode === 'raw'
                                  ? 'bg-[#0a1e36] text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Texto Livre
                            </button>
                            <button
                              type="button"
                              onClick={() => setNewsEditorMode('preview')}
                              className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                                newsEditorMode === 'preview'
                                  ? 'bg-[#0284c7] text-white'
                                  : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              Pré-visualizar
                            </button>
                          </div>

                          <button
                            onClick={() => {
                              setIsCreatingNews(false);
                              setEditingNews(null);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      {newsEditorMode === 'preview' ? (
                        /* Live Article Preview */
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                          <div className="aspect-16/9 max-h-72 w-full rounded-xl overflow-hidden bg-slate-900">
                            <img
                              src={editingNews.imageUrl}
                              alt={editingNews.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="text-[#0284c7] font-bold">{editingNews.category}</span>
                            <span>·</span>
                            <span>{editingNews.date}</span>
                            <span>·</span>
                            <span>Por {editingNews.author}</span>
                          </div>
                          <h2 className="text-xl font-black text-slate-900">
                            {editingNews.title || 'Título da Matéria'}
                          </h2>
                          <p className="text-sm font-semibold text-slate-600 border-b border-slate-200 pb-3">
                            {editingNews.summary || 'Resumo da matéria...'}
                          </p>
                          <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
                            {(editingNews.content || []).map((p, idx) => (
                              <p key={idx}>{p}</p>
                            ))}
                          </div>
                          {editingNews.attachments && editingNews.attachments.length > 0 && (
                            <div className="pt-3 border-t border-slate-200 space-y-2">
                              <span className="text-xs font-bold uppercase text-slate-700 block">
                                Anexos ({editingNews.attachments.length})
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {editingNews.attachments.map((att) => (
                                  <span
                                    key={att.id}
                                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-[#0284c7] inline-flex items-center gap-1.5"
                                  >
                                    <Paperclip className="w-3.5 h-3.5" />
                                    {att.name} ({att.size})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Editor Form */
                        <div className="space-y-4 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                            <div className="sm:col-span-8">
                              <label className="block font-bold text-slate-700 uppercase mb-1">
                                Título da Matéria *
                              </label>
                              <input
                                type="text"
                                value={editingNews.title}
                                onChange={(e) =>
                                  setEditingNews({ ...editingNews, title: e.target.value })
                                }
                                placeholder="Digite o título principal da notícia..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                              />
                            </div>

                            <div className="sm:col-span-4">
                              <label className="block font-bold text-slate-700 uppercase mb-1">
                                Data / Hora de Publicação
                              </label>
                              <input
                                type="text"
                                value={editingNews.date}
                                onChange={(e) =>
                                  setEditingNews({ ...editingNews, date: e.target.value })
                                }
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-bold text-slate-700 uppercase mb-1">
                                Categoria Editorial *
                              </label>
                              <select
                                value={editingNews.category}
                                onChange={(e) =>
                                  setEditingNews({ ...editingNews, category: e.target.value })
                                }
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                              >
                                {Array.from(
                                  new Set([
                                    ...(draftSiteSettings.newsCategories || []),
                                    editingNews.category,
                                  ].filter(Boolean))
                                ).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block font-bold text-slate-700 uppercase mb-1">
                                Autor / Fonte
                              </label>
                              <input
                                type="text"
                                value={editingNews.author || ''}
                                onChange={(e) =>
                                  setEditingNews({ ...editingNews, author: e.target.value })
                                }
                                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Tags Selection for Article */}
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="block font-bold text-slate-700 uppercase">
                                Tags da Matéria ({(editingNews.tags || []).length} selecionadas)
                              </label>
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={newArticleTagInput}
                                  onChange={(e) => setNewArticleTagInput(e.target.value)}
                                  placeholder="Nova tag..."
                                  className="text-xs px-2.5 py-1 bg-white border border-slate-300 rounded-lg w-36"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = newArticleTagInput.trim().replace(/^#/, '');
                                    if (!val) return;
                                    const currentTags = editingNews.tags || [];
                                    if (!currentTags.includes(val)) {
                                      setEditingNews({
                                        ...editingNews,
                                        tags: [...currentTags, val],
                                      });
                                    }
                                    const siteTagList = draftSiteSettings.siteTags || [];
                                    if (!siteTagList.includes(val)) {
                                      setDraftSiteSettings({
                                        ...draftSiteSettings,
                                        siteTags: [...siteTagList, val],
                                      });
                                    }
                                    setNewArticleTagInput('');
                                  }}
                                  className="px-2.5 py-1 bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  + Tag
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {Array.from(
                                new Set([
                                  ...(draftSiteSettings.siteTags || []),
                                  ...(editingNews.tags || []),
                                ])
                              ).map((tag) => {
                                const isSelected = (editingNews.tags || []).includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => {
                                      const currentTags = editingNews.tags || [];
                                      setEditingNews({
                                        ...editingNews,
                                        tags: isSelected
                                          ? currentTags.filter((t) => t !== tag)
                                          : [...currentTags, tag],
                                      });
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#0284c7] text-white shadow-2xs'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                                    }`}
                                  >
                                    #{tag}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Resumo / Linha Fina (Exibido nos cards da capa) *
                            </label>
                            <textarea
                              rows={2}
                              value={editingNews.summary}
                              onChange={(e) =>
                                setEditingNews({ ...editingNews, summary: e.target.value })
                              }
                              placeholder="Breve síntese da notícia em 1 ou 2 frases..."
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          {/* Cover Image Upload or URL */}
                          <ImageUploadField
                            label="Imagem de Capa da Notícia"
                            imageUrl={editingNews.imageUrl}
                            onChange={(newUrl) =>
                              setEditingNews({ ...editingNews, imageUrl: newUrl })
                            }
                            onError={(msg) => showToast(msg, 'error')}
                          />

                          {/* Content Editor: Blocks Mode vs Raw Text Mode */}
                          <div className="space-y-2 pt-2 border-t border-slate-200">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="block font-bold text-slate-700 uppercase">
                                Corpo da Matéria ({editingNews.content?.length || 0} parágrafos)
                              </label>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingNews({
                                      ...editingNews,
                                      content: [...(editingNews.content || []), ''],
                                    })
                                  }
                                  className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-[#0284c7] border border-sky-200 rounded-md font-bold cursor-pointer"
                                >
                                  + Parágrafo
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingNews({
                                      ...editingNews,
                                      content: [
                                        ...(editingNews.content || []),
                                        '▪ SUBTÍTULO: Digite o subtítulo da seção',
                                      ],
                                    })
                                  }
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold cursor-pointer"
                                >
                                  + Subtítulo
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingNews({
                                      ...editingNews,
                                      content: [
                                        ...(editingNews.content || []),
                                        '“Digite aqui uma citação ou depoimento em destaque da coordenação ou comunidade.”',
                                      ],
                                    })
                                  }
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-bold cursor-pointer"
                                >
                                  + Citação
                                </button>
                              </div>
                            </div>

                            {newsEditorMode === 'blocks' ? (
                              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                {(editingNews.content || ['']).map((paragraph, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200"
                                  >
                                    <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-black text-slate-500 shrink-0 mt-1">
                                      §{pIdx + 1}
                                    </span>
                                    <textarea
                                      rows={2}
                                      value={paragraph}
                                      onChange={(e) => {
                                        const updated = [...(editingNews.content || [])];
                                        updated[pIdx] = e.target.value;
                                        setEditingNews({ ...editingNews, content: updated });
                                      }}
                                      placeholder={`Texto do parágrafo ${pIdx + 1}...`}
                                      className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-xs leading-relaxed"
                                    />
                                    <div className="flex flex-col gap-1 shrink-0">
                                      <button
                                        type="button"
                                        disabled={pIdx === 0}
                                        onClick={() => {
                                          const updated = [...(editingNews.content || [])];
                                          const temp = updated[pIdx - 1];
                                          updated[pIdx - 1] = updated[pIdx];
                                          updated[pIdx] = temp;
                                          setEditingNews({ ...editingNews, content: updated });
                                        }}
                                        className="p-1 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 rounded cursor-pointer"
                                        title="Mover para cima"
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={pIdx === (editingNews.content?.length || 1) - 1}
                                        onClick={() => {
                                          const updated = [...(editingNews.content || [])];
                                          const temp = updated[pIdx + 1];
                                          updated[pIdx + 1] = updated[pIdx];
                                          updated[pIdx] = temp;
                                          setEditingNews({ ...editingNews, content: updated });
                                        }}
                                        className="p-1 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-200 rounded cursor-pointer"
                                        title="Mover para baixo"
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = (editingNews.content || []).filter(
                                            (_, i) => i !== pIdx
                                          );
                                          setEditingNews({
                                            ...editingNews,
                                            content: updated.length ? updated : [''],
                                          });
                                        }}
                                        className="p-1 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded cursor-pointer"
                                        title="Remover parágrafo"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <textarea
                                rows={7}
                                value={editingNews.content?.join('\n\n') || ''}
                                onChange={(e) =>
                                  setEditingNews({
                                    ...editingNews,
                                    content: e.target.value.split('\n\n'),
                                  })
                                }
                                placeholder="Separe os parágrafos com uma linha em branco (Enter duas vezes)..."
                                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs leading-relaxed"
                              />
                            )}
                          </div>

                          {/* Multi-file Attachments Manager */}
                          <AttachmentsEditor
                            attachments={editingNews.attachments || []}
                            onChange={(updatedAtts) =>
                              setEditingNews({ ...editingNews, attachments: updatedAtts })
                            }
                            onNotify={showToast}
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                        <button
                          onClick={() => {
                            setIsCreatingNews(false);
                            setEditingNews(null);
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            handleSaveAllAdminChanges(
                              isCreatingNews
                                ? 'Nova notícia publicada e salva com sucesso!'
                                : 'Notícia atualizada e salva com sucesso!'
                            );
                          }}
                          className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar e Publicar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* News Articles Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNews.map((article) => (
                    <div
                      key={article.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div className="flex gap-3.5">
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          referrerPolicy="no-referrer"
                          className="w-24 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-bold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200 truncate">
                              {article.category}
                            </span>
                            <span className="shrink-0">{article.date.split(' ')[0]}</span>
                          </div>
                          <h3 className="font-bold text-sm text-[#0a1e36] line-clamp-2">
                            {article.title}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {article.summary}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span>Por {article.author}</span>
                          {article.attachments && article.attachments.length > 0 && (
                            <span className="px-2 py-0.5 bg-sky-50 text-[#0284c7] rounded font-bold inline-flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {article.attachments.length} anexo(s)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingNews({ ...article, attachments: article.attachments || [] });
                              setIsCreatingNews(false);
                              setNewsEditorMode('blocks');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-100 text-[#0284c7] rounded-lg cursor-pointer text-xs font-bold inline-flex items-center gap-1"
                            title="Editar notícia"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingNews(true);
                              setNewsEditorMode('blocks');
                              setEditingNews({
                                ...article,
                                id: '',
                                title: `${article.title} (Cópia)`,
                                date: new Date().toLocaleDateString('pt-BR'),
                                attachments: [...(article.attachments || [])],
                              });
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            title="Duplicar notícia (salva ao confirmar no modal)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              requestPinProtectedAction(() => {
                                setDraftNews((prev) => prev.filter((item) => item.id !== article.id));
                                showToast(
                                  'Remoção marcada no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                  'info'
                                );
                              });
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="Excluir notícia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 3B: PATROCINADORES & PARCERIAS (COMPLETE CRUD & FIRESTORE SYNC) */}
          {/* ========================================================================= */}
          {activeTab === 'patrocinadores' && (() => {
            const filteredSponsors = draftSponsors.filter((spon) => {
              const matchTier = sponsorTierFilter === 'all' || spon.tier === sponsorTierFilter;
              const matchSearch =
                !sponsorSearch.trim() ||
                spon.name.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
                spon.category.toLowerCase().includes(sponsorSearch.toLowerCase()) ||
                spon.description.toLowerCase().includes(sponsorSearch.toLowerCase());
              return matchTier && matchSearch;
            });

            return (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider">
                        Captação & Parcerias
                      </span>
                      <span className="text-[10px] bg-sky-50 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                        {draftSponsors.filter((s) => s.active).length} Ativos no Site
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Patrocinadores, Apoio Institucional & Chancela
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">
                      Cadastre e organize as marcas, parceiros comerciais e órgãos governamentais que apoiam a Associação Vitalizar. Os patrocinadores são exibidos no portal público por nível.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsCreatingSponsor(true);
                      setEditingSponsor({
                        id: '',
                        name: '',
                        tier: 'ouro',
                        tierLabel: 'Patrocinador Ouro',
                        logoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80',
                        websiteUrl: '',
                        description: '',
                        category: 'Empresa Privada',
                        active: true,
                        order: draftSponsors.length + 1,
                      });
                    }}
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Novo Patrocinador</span>
                  </button>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={sponsorSearch}
                      onChange={(e) => setSponsorSearch(e.target.value)}
                      placeholder="Buscar por nome, categoria ou descrição..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Filtrar:</span>
                    {(['all', 'master', 'ouro', 'prata', 'bronze', 'apoio'] as const).map((tierKey) => (
                      <button
                        key={tierKey}
                        onClick={() => setSponsorTierFilter(tierKey)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          sponsorTierFilter === tierKey
                            ? 'bg-[#0a1e36] text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {tierKey === 'all'
                          ? 'Todos'
                          : tierKey === 'master'
                          ? 'Master'
                          : tierKey === 'ouro'
                          ? 'Ouro'
                          : tierKey === 'prata'
                          ? 'Prata'
                          : tierKey === 'bronze'
                          ? 'Bronze'
                          : 'Apoio'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* MODAL: ADD / EDIT SPONSOR */}
                {editingSponsor && (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2">
                          <HeartHandshake className="w-5 h-5 text-[#0284c7]" />
                          <h3 className="font-extrabold text-base text-slate-900">
                            {isCreatingSponsor ? 'Novo Patrocinador / Parceiro' : 'Editar Patrocinador'}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSponsor(null);
                            setIsCreatingSponsor(false);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Name & Category */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Nome da Empresa / Parceiro *
                            </label>
                            <input
                              type="text"
                              required
                              value={editingSponsor.name}
                              onChange={(e) =>
                                setEditingSponsor({ ...editingSponsor, name: e.target.value })
                              }
                              placeholder="Ex: Sicoob Espírito Santo"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Segmento / Categoria *
                            </label>
                            <input
                              type="text"
                              value={editingSponsor.category}
                              onChange={(e) =>
                                setEditingSponsor({ ...editingSponsor, category: e.target.value })
                              }
                              placeholder="Ex: Cooperativa Financeira, Material Esportivo"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Tier & TierLabel */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Nível de Patrocínio *
                            </label>
                            <select
                              value={editingSponsor.tier}
                              onChange={(e) => {
                                const newTier = e.target.value as SponsorTier;
                                const defaultLabel =
                                  newTier === 'master'
                                    ? 'Patrocinador Master'
                                    : newTier === 'ouro'
                                    ? 'Patrocinador Ouro'
                                    : newTier === 'prata'
                                    ? 'Patrocinador Prata'
                                    : newTier === 'bronze'
                                    ? 'Patrocinador Bronze'
                                    : 'Apoio Institucional';
                                setEditingSponsor({
                                  ...editingSponsor,
                                  tier: newTier,
                                  tierLabel: defaultLabel,
                                });
                              }}
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                            >
                              <option value="master">Master (Destaque Principal)</option>
                              <option value="ouro">Ouro</option>
                              <option value="prata">Prata</option>
                              <option value="bronze">Bronze</option>
                              <option value="apoio">Apoio Institucional / Governamental</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Título do Nível (Exibição Pública)
                            </label>
                            <input
                              type="text"
                              value={editingSponsor.tierLabel}
                              onChange={(e) =>
                                setEditingSponsor({ ...editingSponsor, tierLabel: e.target.value })
                              }
                              placeholder="Ex: Patrocinador Ouro"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Logo Upload */}
                        <ImageUploadField
                          label="Logotipo do Patrocinador *"
                          imageUrl={editingSponsor.logoUrl}
                          onChange={(url: string) =>
                            setEditingSponsor({ ...editingSponsor, logoUrl: url })
                          }
                          onError={(msg: string) => showToast(msg, 'error')}
                        />

                        {/* Website URL & Order */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-8">
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Link do Site ou Rede Social Oficial
                            </label>
                            <input
                              type="url"
                              value={editingSponsor.websiteUrl || ''}
                              onChange={(e) =>
                                setEditingSponsor({ ...editingSponsor, websiteUrl: e.target.value })
                              }
                              placeholder="https://exemplo.com.br"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-[11px]"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Ordem de Exibição
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              value={editingSponsor.order || 1}
                              onChange={(e) =>
                                setEditingSponsor({
                                  ...editingSponsor,
                                  order: parseInt(e.target.value, 10) || 1,
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Descrição da Parceria ou Mensagem Institucional
                          </label>
                          <textarea
                            rows={3}
                            value={editingSponsor.description}
                            onChange={(e) =>
                              setEditingSponsor({ ...editingSponsor, description: e.target.value })
                            }
                            placeholder="Descreva o apoio oferecido, impacto social ou contrapartida institucional..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                          />
                        </div>

                        {/* Active Switch */}
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 block">Exibir no Site Público</span>
                            <span className="text-[11px] text-slate-500">
                              Se desmarcado, o patrocinador fica salvo no painel sem aparecer aos visitantes.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={editingSponsor.active}
                            onChange={(e) =>
                              setEditingSponsor({ ...editingSponsor, active: e.target.checked })
                            }
                            className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Modal Footer Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSponsor(null);
                            setIsCreatingSponsor(false);
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!editingSponsor.name.trim()) {
                              showToast('Preencha o nome do patrocinador.', 'error');
                              return;
                            }
                            let next = [...draftSponsors];
                            const finalSpon: Sponsor = {
                              ...editingSponsor,
                              id:
                                isCreatingSponsor || !editingSponsor.id
                                  ? `patrocinador-${Date.now()}`
                                  : editingSponsor.id,
                            };
                            if (isCreatingSponsor || !editingSponsor.id) {
                              next = [...next, finalSpon];
                            } else {
                              next = next.map((s) => (s.id === finalSpon.id ? finalSpon : s));
                            }
                            next.sort((a, b) => (a.order || 0) - (b.order || 0));
                            setDraftSponsors(next);
                            setIsCreatingSponsor(false);
                            setEditingSponsor(null);
                            showToast(
                              'Patrocinador inserido no rascunho. Clique em "Salvar Alterações" para gravar no banco!',
                              'info'
                            );
                          }}
                          className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-xl cursor-pointer shadow-md"
                        >
                          Confirmar no Rascunho
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sponsors Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSponsors.map((spon, index) => (
                    <div
                      key={spon.id}
                      className={`bg-white p-5 rounded-2xl border shadow-2xs flex flex-col justify-between transition-all ${
                        spon.active ? 'border-slate-200 hover:border-sky-300' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${
                              spon.tier === 'master'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : spon.tier === 'ouro'
                                ? 'bg-yellow-100 text-yellow-900 border-yellow-300'
                                : spon.tier === 'prata'
                                ? 'bg-slate-100 text-slate-800 border-slate-300'
                                : spon.tier === 'bronze'
                                ? 'bg-orange-100 text-orange-900 border-orange-300'
                                : 'bg-sky-100 text-sky-900 border-sky-300'
                            }`}
                          >
                            {spon.tierLabel}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = draftSponsors.map((item) =>
                                item.id === spon.id ? { ...item, active: !item.active } : item
                              );
                              setDraftSponsors(updated);
                              showToast(
                                spon.active
                                  ? `"${spon.name}" desativado do site no rascunho.`
                                  : `"${spon.name}" reativado no rascunho.`,
                                'info'
                              );
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                              spon.active
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                            title="Alternar visibilidade pública"
                          >
                            {spon.active ? '● Ativo' : '○ Inativo'}
                          </button>
                        </div>

                        <div className="flex items-center gap-3.5 mb-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-100 p-1 flex items-center justify-center border border-slate-200 shrink-0 overflow-hidden">
                            <img
                              src={spon.logoUrl}
                              alt={`Logo ${spon.name}`}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=400&q=80';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-sm text-slate-900 leading-snug truncate" title={spon.name}>
                              {spon.name}
                            </h4>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {spon.category}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Ordem #{spon.order || 1}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                          {spon.description || 'Sem descrição cadastrada.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              if (index === 0) return;
                              const next = [...draftSponsors];
                              const temp = next[index - 1];
                              next[index - 1] = next[index];
                              next[index] = temp;
                              next.forEach((s, i) => (s.order = i + 1));
                              setDraftSponsors(next);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                            title="Subir na ordem de exibição"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === draftSponsors.length - 1}
                            onClick={() => {
                              if (index === draftSponsors.length - 1) return;
                              const next = [...draftSponsors];
                              const temp = next[index + 1];
                              next[index + 1] = next[index];
                              next[index] = temp;
                              next.forEach((s, i) => (s.order = i + 1));
                              setDraftSponsors(next);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded hover:bg-slate-100 cursor-pointer"
                            title="Descer na ordem de exibição"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          {spon.websiteUrl && (
                            <a
                              href={spon.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg cursor-pointer"
                              title="Acessar site oficial"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              const duplicated: Sponsor = {
                                ...spon,
                                id: `patrocinador-${Date.now()}`,
                                name: `${spon.name} (Cópia)`,
                                order: draftSponsors.length + 1,
                              };
                              setDraftSponsors((prev) => [...prev, duplicated]);
                              showToast(`Patrocinador "${spon.name}" duplicado no rascunho.`, 'info');
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg cursor-pointer"
                            title="Duplicar patrocinador"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingSponsor({ ...spon });
                              setIsCreatingSponsor(false);
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg cursor-pointer"
                            title="Editar patrocinador"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              requestPinProtectedAction(() => {
                                setDraftSponsors((prev) => prev.filter((item) => item.id !== spon.id));
                                showToast(
                                  `Remoção de "${spon.name}" marcada no rascunho. Clique em Salvar para persistir.`,
                                  'info'
                                );
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Excluir patrocinador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 4: CALENDÁRIO & CLÍNICAS (COMPLETE EDITOR + ATTACHMENTS) */}
          {/* ========================================================================= */}
          {activeTab === 'eventos' && (() => {
            const filteredAdminEvents = draftEvents.filter((ev) => {
              const matchCat =
                eventCategoryFilter === 'all' || ev.category === eventCategoryFilter;
              const matchSearch =
                !eventSearch.trim() ||
                ev.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
                ev.location.toLowerCase().includes(eventSearch.toLowerCase());
              return matchCat && matchSearch;
            });

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Calendário de Clínicas, Oficinas & Eventos
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Edição completa de datas, vagas, programação, pré-requisitos e regulamentos anexos ({draftEvents.length} atividades).
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsCreatingEvent(true);
                      setEditingEvent({
                        id: '',
                        title: '',
                        category: 'clinica_esportiva',
                        categoryLabel: 'Clínica Esportiva',
                        date: '2026-11-30',
                        formattedDate: '30 de Novembro de 2026',
                        dayNumber: '30',
                        monthShort: 'NOV',
                        time: '09:00 às 12:00',
                        location: 'Polo Rio Marinho',
                        address: 'Rua Quatro, 173, Rio Marinho, Cariacica/ES',
                        targetAudience: 'Comunidade em geral',
                        coordinator: 'Comissão Técnica Vitalizar',
                        capacity: 30,
                        availableSpots: 30,
                        isFree: true,
                        description: '',
                        status: 'inscricoes_abertas',
                        scheduleHighlights: [],
                        prerequisites: [],
                        attachments: [],
                      });
                    }}
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Novo Evento / Clínica</span>
                  </button>
                </div>

                {/* Search & Category Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      placeholder="Buscar evento por título ou local..."
                      className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-600">Categoria:</label>
                    <select
                      value={eventCategoryFilter}
                      onChange={(e) => setEventCategoryFilter(e.target.value)}
                      className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="all">Todas</option>
                      <option value="clinica_esportiva">Clínicas Esportivas</option>
                      <option value="oficina_comunitaria">Oficinas Comunitárias</option>
                      <option value="reuniao_associacao">Reuniões da Associação</option>
                    </select>
                  </div>
                </div>

                {/* Event Create / Edit Modal */}
                {(isCreatingEvent || editingEvent) && editingEvent && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                            Gestão da Agenda Esportiva
                          </span>
                          <h3 className="font-black text-base text-[#0a1e36] uppercase">
                            {isCreatingEvent ? 'Cadastrar Novo Evento' : 'Editar Evento / Atividade'}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setIsCreatingEvent(false);
                            setEditingEvent(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-8">
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Título do Evento / Atividade *
                            </label>
                            <input
                              type="text"
                              value={editingEvent.title}
                              onChange={(e) =>
                                setEditingEvent({ ...editingEvent, title: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Status das Inscrições
                            </label>
                            <select
                              value={editingEvent.status}
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  status: e.target.value as VitalizarEvent['status'],
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            >
                              <option value="inscricoes_abertas">Inscrições Abertas</option>
                              <option value="confirmado">Confirmado</option>
                              <option value="vagas_limitadas">Últimas Vagas</option>
                              <option value="em_breve">Em Breve / Encerrado</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Categoria *
                            </label>
                            <select
                              value={editingEvent.category}
                              onChange={(e) => {
                                const val = e.target.value as EventCategory;
                                const label =
                                  val === 'clinica_esportiva'
                                    ? 'Clínica Esportiva'
                                    : val === 'oficina_comunitaria'
                                    ? 'Oficina Comunitária'
                                    : 'Reunião da Associação';
                                setEditingEvent({
                                  ...editingEvent,
                                  category: val,
                                  categoryLabel: label,
                                });
                              }}
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            >
                              <option value="clinica_esportiva">Clínica Esportiva</option>
                              <option value="oficina_comunitaria">Oficina Comunitária</option>
                              <option value="reuniao_associacao">Reunião da Associação</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Data do Evento *
                            </label>
                            <input
                              type="date"
                              value={editingEvent.date}
                              onChange={(e) => {
                                const iso = e.target.value;
                                const parsed = parseEventIsoDate(iso);
                                setEditingEvent({
                                  ...editingEvent,
                                  date: iso,
                                  dayNumber: parsed.dayNumber,
                                  monthShort: parsed.monthShort,
                                  formattedDate: parsed.formattedDate,
                                });
                              }}
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Horário *
                            </label>
                            <input
                              type="text"
                              value={editingEvent.time}
                              onChange={(e) =>
                                setEditingEvent({ ...editingEvent, time: e.target.value })
                              }
                              placeholder="Ex: 08:30 às 11:30"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Local / Polo Esportivo *
                            </label>
                            <input
                              type="text"
                              value={editingEvent.location}
                              onChange={(e) =>
                                setEditingEvent({ ...editingEvent, location: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Endereço Completo
                            </label>
                            <input
                              type="text"
                              value={editingEvent.address}
                              onChange={(e) =>
                                setEditingEvent({ ...editingEvent, address: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Público-Alvo
                            </label>
                            <input
                              type="text"
                              value={editingEvent.targetAudience}
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  targetAudience: e.target.value,
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Capacidade Total
                            </label>
                            <input
                              type="number"
                              value={editingEvent.capacity}
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  capacity: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Vagas Disponíveis
                            </label>
                            <input
                              type="number"
                              value={editingEvent.availableSpots}
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  availableSpots: Math.max(0, Number(e.target.value)),
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Coordenação / Responsável Técnico
                            </label>
                            <input
                              type="text"
                              value={editingEvent.coordinator}
                              onChange={(e) =>
                                setEditingEvent({ ...editingEvent, coordinator: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Data Formatada Exibida
                            </label>
                            <input
                              type="text"
                              value={editingEvent.formattedDate}
                              onChange={(e) =>
                                setEditingEvent({
                                  ...editingEvent,
                                  formattedDate: e.target.value,
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Descrição Completa da Atividade *
                          </label>
                          <textarea
                            rows={3}
                            value={editingEvent.description}
                            onChange={(e) =>
                              setEditingEvent({ ...editingEvent, description: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        {/* Schedule Highlights & Prerequisites Dynamic Lists */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                          <div className="space-y-2">
                            <label className="block font-bold text-slate-700 uppercase">
                              Destaques da Programação
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={newHighlightText}
                                onChange={(e) => setNewHighlightText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (!newHighlightText.trim()) return;
                                    setEditingEvent({
                                      ...editingEvent,
                                      scheduleHighlights: [
                                        ...(editingEvent.scheduleHighlights || []),
                                        newHighlightText.trim(),
                                      ],
                                    });
                                    setNewHighlightText('');
                                  }
                                }}
                                placeholder="Ex: Aula prática de fundamentos..."
                                className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newHighlightText.trim()) return;
                                  setEditingEvent({
                                    ...editingEvent,
                                    scheduleHighlights: [
                                      ...(editingEvent.scheduleHighlights || []),
                                      newHighlightText.trim(),
                                    ],
                                  });
                                  setNewHighlightText('');
                                }}
                                className="px-3 py-2 bg-[#0a1e36] text-white font-bold rounded-lg cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <ul className="space-y-1">
                              {(editingEvent.scheduleHighlights || []).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                                >
                                  <span className="truncate">{item}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        scheduleHighlights: (
                                          editingEvent.scheduleHighlights || []
                                        ).filter((_, i) => i !== idx),
                                      })
                                    }
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-2">
                            <label className="block font-bold text-slate-700 uppercase">
                              Pré-requisitos / Orientações
                            </label>
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={newPrereqText}
                                onChange={(e) => setNewPrereqText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (!newPrereqText.trim()) return;
                                    setEditingEvent({
                                      ...editingEvent,
                                      prerequisites: [
                                        ...(editingEvent.prerequisites || []),
                                        newPrereqText.trim(),
                                      ],
                                    });
                                    setNewPrereqText('');
                                  }
                                }}
                                placeholder="Ex: Traje esportivo e documento..."
                                className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newPrereqText.trim()) return;
                                  setEditingEvent({
                                    ...editingEvent,
                                    prerequisites: [
                                      ...(editingEvent.prerequisites || []),
                                      newPrereqText.trim(),
                                    ],
                                  });
                                  setNewPrereqText('');
                                }}
                                className="px-3 py-2 bg-[#0a1e36] text-white font-bold rounded-lg cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                            <ul className="space-y-1">
                              {(editingEvent.prerequisites || []).map((item, idx) => (
                                <li
                                  key={idx}
                                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2"
                                >
                                  <span className="truncate">{item}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingEvent({
                                        ...editingEvent,
                                        prerequisites: (editingEvent.prerequisites || []).filter(
                                          (_, i) => i !== idx
                                        ),
                                      })
                                    }
                                    className="text-rose-500 hover:text-rose-700 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Event File Attachments */}
                        <AttachmentsEditor
                          attachments={editingEvent.attachments || []}
                          onChange={(updatedAtts) =>
                            setEditingEvent({ ...editingEvent, attachments: updatedAtts })
                          }
                          onNotify={showToast}
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          onClick={() => {
                            setIsCreatingEvent(false);
                            setEditingEvent(null);
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            handleSaveAllAdminChanges(
                              isCreatingEvent
                                ? 'Nova atividade adicionada e salva com sucesso!'
                                : 'Atividade atualizada e salva com sucesso!'
                            );
                          }}
                          className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Atividade</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Events Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[720px]">
                    <thead className="bg-[#0a1e36] text-white uppercase text-[11px]">
                      <tr>
                        <th className="p-3.5">Data & Horário</th>
                        <th className="p-3.5">Título / Atividade</th>
                        <th className="p-3.5">Categoria</th>
                        <th className="p-3.5">Vagas</th>
                        <th className="p-3.5">Anexos</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-slate-50/80">
                          <td className="p-3.5 font-bold text-[#0a1e36] whitespace-nowrap">
                            {ev.dayNumber}/{ev.monthShort} • {ev.time}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-800 block">{ev.title}</span>
                            <span className="text-[11px] text-slate-400">{ev.location}</span>
                          </td>
                          <td className="p-3.5 text-slate-500">{ev.categoryLabel}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-[#0284c7]">
                              {ev.availableSpots} de {ev.capacity}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {ev.attachments && ev.attachments.length > 0 ? (
                              <span className="px-2 py-0.5 bg-sky-50 text-[#0284c7] rounded font-bold inline-flex items-center gap-1">
                                <Paperclip className="w-3 h-3" />
                                {ev.attachments.length}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingEvent({
                                  ...ev,
                                  attachments: ev.attachments || [],
                                  scheduleHighlights: ev.scheduleHighlights || [],
                                  prerequisites: ev.prerequisites || [],
                                });
                                setIsCreatingEvent(false);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-100 text-[#0284c7] rounded-lg cursor-pointer font-bold inline-flex items-center gap-1"
                              title="Editar evento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => {
                                setIsCreatingEvent(true);
                                setEditingEvent({
                                  ...ev,
                                  id: '',
                                  title: `${ev.title} (Cópia)`,
                                  attachments: [...(ev.attachments || [])],
                                  scheduleHighlights: [...(ev.scheduleHighlights || [])],
                                  prerequisites: [...(ev.prerequisites || [])],
                                });
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                              title="Duplicar evento (salva ao confirmar no modal)"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                requestPinProtectedAction(() => {
                                  setDraftEvents((prev) => prev.filter((item) => item.id !== ev.id));
                                  showToast(
                                    'Remoção marcada no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                    'info'
                                  );
                                });
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 5: PROJETOS ESPORTIVOS & ABA SEPARADA DE PARTICIPANTES (NEXT FIT CSV) */}
          {/* ========================================================================= */}
          {activeTab === 'projetos' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Projetos Esportivos & Gestão de Participantes
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Gerencie os projetos sociais/base ou acesse a aba exclusiva de <strong>Participantes</strong> para importar a relação do Next Fit via planilha <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.csv</code>.
                    </p>
                  </div>

                  {projectsSubTab === 'projetos' && (
                    <button
                      onClick={() => {
                        setIsCreatingProject(true);
                        setEditingProject({
                          id: '',
                          name: '',
                          category: 'esporte_educacional',
                          targetAudience: 'Crianças e adolescentes de 6 a 17 anos',
                          description: '',
                          schedule: 'Terças e quintas: 08h às 10h',
                          location: 'Polo Rio Marinho · Cariacica/ES',
                          coordinator: 'Coordenação Técnica Vitalizar',
                          fundingSource: 'Recursos Próprios e Parcerias MROSC',
                          imageUrl:
                            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
                          attachments: [],
                        });
                      }}
                      className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Novo Projeto Esportivo</span>
                    </button>
                  )}
                </div>

                {/* Sub-tabs inside Projetos: 1. Projetos & Estrutura | 2. Participantes (Next Fit / CSV) */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setProjectsSubTab('projetos')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      projectsSubTab === 'projetos'
                        ? 'bg-[#0a1e36] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4" />
                    <span>Projetos Cadastrados ({draftProjects.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectsSubTab('participantes')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      projectsSubTab === 'participantes'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>
                      Participantes & Atletas Next Fit (
                      {draftProjects.reduce(
                        (acc, p) => acc + (p.participants?.length || 0),
                        0
                      )}
                      )
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectsSubTab('chamada')}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                      projectsSubTab === 'chamada'
                        ? 'bg-[#0284c7] text-white shadow-xs'
                        : 'bg-sky-50 text-[#0284c7] border border-sky-200 hover:bg-sky-100'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>
                      Chamada Digital & Assiduidade MROSC (
                      {(draftSiteSettings.attendanceSessions || []).length})
                    </span>
                  </button>
                </div>
              </div>

              {projectsSubTab === 'chamada' ? (
                <AttendanceManager
                  projects={draftProjects}
                  attendanceSessions={draftSiteSettings.attendanceSessions || []}
                  onSaveSessionAndSyncProjects={(
                    updatedSessions,
                    updatedProjects,
                    toastMsg
                  ) => {
                    const nextSettings = {
                      ...draftSiteSettings,
                      attendanceSessions: updatedSessions,
                    };
                    setDraftSiteSettings(nextSettings);
                    setDraftProjects(updatedProjects);
                    saveAdminChanges({
                      siteSettings: nextSettings,
                      projects: updatedProjects,
                      toastMessage: toastMsg,
                      logDetails: toastMsg,
                    });
                  }}
                  onNotify={showToast}
                />
              ) : projectsSubTab === 'participantes' ? (
                <NextFitParticipantsManager
                  mode="projects_subtab"
                  projects={draftProjects}
                  selectedProjectFilter={projectsParticipantFilter}
                  onSelectProjectFilterChange={setProjectsParticipantFilter}
                  onUpdateProjects={(updatedProjects, toastMsg, persistImmediately) => {
                    setDraftProjects(updatedProjects);
                    if (persistImmediately) {
                      saveAdminChanges({
                        projects: updatedProjects,
                        toastMessage: toastMsg,
                        logDetails:
                          toastMsg ||
                          'Relação de participantes dos projetos atualizada via planilha Next Fit (.CSV).',
                      });
                    } else if (toastMsg) {
                      showToast(toastMsg, 'info');
                    }
                  }}
                  onNotify={showToast}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftProjects.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="flex gap-3.5">
                          <img
                            src={proj.imageUrl}
                            alt={proj.name}
                            referrerPolicy="no-referrer"
                            className="w-24 h-20 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200"
                          />
                          <div>
                            <span className="text-[10px] font-black text-[#0284c7] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 uppercase">
                              {(proj.category || 'geral').replace(/_/g, ' ')}
                            </span>
                            <h3 className="font-black text-sm text-[#0a1e36] mt-1.5">{proj.name}</h3>
                            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                              {proj.description}
                            </p>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>
                            <strong>Público:</strong> {proj.targetAudience}
                          </div>
                          <div>
                            <strong>Horários:</strong> {proj.schedule}
                          </div>
                          <div>
                            <strong>Local:</strong> {proj.location}
                          </div>
                          <div>
                            <strong>Coordenação:</strong> {proj.coordinator}
                          </div>
                        </div>

                        {/* Preview de Participantes Vinculados ao Projeto */}
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block">
                              Participantes Vinculados ({(proj.participants || []).length})
                            </span>
                            {(proj.participants || []).length > 0 ? (
                              <p className="text-[11px] text-emerald-800 truncate mt-0.5 font-medium">
                                {(proj.participants || [])
                                  .slice(0, 4)
                                  .map((p) => p.name)
                                  .join(', ')}
                                {(proj.participants || []).length > 4
                                  ? ` +${(proj.participants || []).length - 4}`
                                  : ''}
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Nenhuma lista associada ainda. Importe um .CSV para vincular.
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProjectsParticipantFilter(proj.id);
                              setProjectsSubTab('participantes');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer inline-flex items-center gap-1 transition-colors"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            <span>Ver / Associar .CSV</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setProjectsParticipantFilter(proj.id);
                              setProjectsSubTab('participantes');
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                            title="Abrir aba de Participantes filtrada para este projeto"
                          >
                            <Users className="w-3 h-3" />
                            <span>{(proj.participants || []).length} participante(s) →</span>
                          </button>
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[11px] font-bold">
                            {(proj.staff || []).length} comissão
                          </span>
                          {proj.attachments && proj.attachments.length > 0 && (
                            <span className="px-2 py-0.5 bg-sky-50 text-[#0284c7] rounded-md text-[11px] font-bold inline-flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {proj.attachments.length} anexo(s)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setIsCreatingProject(false);
                              setEditingProject({
                                ...proj,
                                attachments: proj.attachments || [],
                                staff: proj.staff || [],
                                participants: proj.participants || [],
                              });
                            }}
                            className="px-3 py-1.5 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar Projeto</span>
                          </button>
                          <button
                            onClick={() => {
                              setIsCreatingProject(true);
                              setEditingProject({
                                ...proj,
                                id: '',
                                name: `${proj.name} (Cópia)`,
                                attachments: [...(proj.attachments || [])],
                                staff: [...(proj.staff || [])],
                                participants: [...(proj.participants || [])],
                              });
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                            title="Duplicar projeto (salva ao confirmar no modal)"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              requestPinProtectedAction(() => {
                                setDraftProjects((prev) => prev.filter((p) => p.id !== proj.id));
                                showToast(
                                  'Remoção marcada no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                  'info'
                                );
                              });
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                            title="Excluir projeto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Project Create / Edit Modal */}
              {(isCreatingProject || editingProject) && editingProject && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                  <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                          Gestão de Projetos, Comissão Técnica & Vitrine de Atletas
                        </span>
                        <h3 className="font-black text-base text-[#0a1e36] uppercase">
                          {isCreatingProject
                            ? 'Cadastrar Novo Projeto Esportivo'
                            : `Editar Projeto: ${editingProject.name}`}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsCreatingProject(false);
                          setEditingProject(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8">
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Nome do Projeto *
                          </label>
                          <input
                            type="text"
                            value={editingProject.name}
                            onChange={(e) =>
                              setEditingProject({ ...editingProject, name: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Eixo / Categoria *
                          </label>
                          <select
                            value={editingProject.category}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                category: e.target.value as VitalizarProject['category'],
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          >
                            <option value="esporte_educacional">Esporte Educacional</option>
                            <option value="saude_qualidade_vida">Saúde & Qualidade de Vida</option>
                            <option value="terceira_idade">Terceira Idade / Vida Ativa</option>
                            <option value="inclusao_pcd">Inclusão & PcD</option>
                            <option value="cultura_cidadania">Cultura & Cidadania</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Público-Alvo / Faixa Etária
                          </label>
                          <input
                            type="text"
                            value={editingProject.targetAudience}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                targetAudience: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Dias e Horários das Turmas
                          </label>
                          <input
                            type="text"
                            value={editingProject.schedule}
                            onChange={(e) =>
                              setEditingProject({ ...editingProject, schedule: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Local / Polo de Atendimento
                          </label>
                          <input
                            type="text"
                            value={editingProject.location}
                            onChange={(e) =>
                              setEditingProject({ ...editingProject, location: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Coordenação Técnica
                          </label>
                          <input
                            type="text"
                            value={editingProject.coordinator}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                coordinator: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Fonte de Recursos / Fomento
                          </label>
                          <input
                            type="text"
                            value={editingProject.fundingSource}
                            onChange={(e) =>
                              setEditingProject({
                                ...editingProject,
                                fundingSource: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Descrição Pedagógica e Metodológica
                        </label>
                        <textarea
                          rows={3}
                          value={editingProject.description}
                          onChange={(e) =>
                            setEditingProject({ ...editingProject, description: e.target.value })
                          }
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
                        />
                      </div>

                      {/* Cover Photo Upload */}
                      <ImageUploadField
                        label="Foto de Capa da Modalidade / Projeto"
                        imageUrl={editingProject.imageUrl}
                        onChange={(newUrl) =>
                          setEditingProject({ ...editingProject, imageUrl: newUrl })
                        }
                        onError={(msg) => showToast(msg, 'error')}
                      />

                      {/* 1. Comissão Técnica (Staff) Manager */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs uppercase text-[#0a1e36]">
                            Comissão Técnica & Professores ({(editingProject.staff || []).length})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={newStaffName}
                            onChange={(e) => setNewStaffName(e.target.value)}
                            placeholder="Nome do profissional..."
                            className="sm:col-span-3 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={newStaffRole}
                            onChange={(e) => setNewStaffRole(e.target.value)}
                            placeholder="Cargo (ex: Treinador)"
                            className="sm:col-span-3 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={newStaffLicense}
                            onChange={(e) => setNewStaffLicense(e.target.value)}
                            placeholder="Registro (ex: CREF 01234-G/ES)"
                            className="sm:col-span-3 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newStaffName.trim() || !newStaffRole.trim()) return;
                              const nextStaff = [
                                ...(editingProject.staff || []),
                                {
                                  id: `staff-${Date.now()}`,
                                  name: newStaffName.trim(),
                                  role: newStaffRole.trim(),
                                  cref: newStaffLicense.trim() || 'Equipe Vitalizar',
                                  bio:
                                    newStaffBio.trim() ||
                                    'Profissional integrante da comissão técnica da Associação Esportiva Vitalizar.',
                                  photoUrl:
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
                                  specialties: ['Formação Esportiva', 'Pedagogia do Esporte'],
                                },
                              ];
                              setEditingProject({ ...editingProject, staff: nextStaff });
                              setNewStaffName('');
                              setNewStaffRole('');
                              setNewStaffLicense('');
                              setNewStaffBio('');
                            }}
                            className="sm:col-span-3 px-3 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg cursor-pointer"
                          >
                            + Adicionar Membro
                          </button>
                        </div>

                        {(editingProject.staff || []).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {(editingProject.staff || []).map((member, idx) => (
                              <div
                                key={member.id || idx}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {member.name}
                                  </span>
                                  <span className="text-[11px] text-slate-500 block truncate">
                                    {member.role} {member.cref ? `• ${member.cref}` : ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingProject({
                                      ...editingProject,
                                      staff: (editingProject.staff || []).filter((_, i) => i !== idx),
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Remover membro"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Vitrine de Atletas / Participantes (Participants) Manager */}
                      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-black text-xs uppercase text-emerald-950 block">
                              Elenco & Participantes Vinculados ao Projeto ({(editingProject.participants || []).length})
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Suba uma planilha .CSV para associar a lista diretamente a este projeto ou cadastre manualmente abaixo.
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5 shadow-xs transition-colors">
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              <span>Associar Lista .CSV neste Projeto</span>
                              <input
                                type="file"
                                accept=".csv,text/csv"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => {
                                    const text = String(ev.target?.result || '');
                                    const parsed = parseNextFitCsv(
                                      text,
                                      draftProjects,
                                      editingProject.id || 'temp-proj'
                                    );
                                    if (parsed.error || parsed.rows.length === 0) {
                                      showToast(
                                        parsed.error || 'Nenhum participante encontrado no CSV.',
                                        'error'
                                      );
                                      return;
                                    }
                                    const currentList = [...(editingProject.participants || [])];
                                    let added = 0;
                                    let updated = 0;
                                    parsed.rows.forEach((row, idx) => {
                                      const existingIdx = currentList.findIndex(
                                        (p) =>
                                          p.name.toLowerCase().trim() ===
                                          row.name.toLowerCase().trim()
                                      );
                                      const converted = convertNextFitRowToParticipant(
                                        row,
                                        existingIdx >= 0 ? existingIdx : currentList.length + idx,
                                        existingIdx >= 0 ? currentList[existingIdx] : undefined
                                      );
                                      if (existingIdx >= 0) {
                                        currentList[existingIdx] = converted;
                                        updated++;
                                      } else {
                                        currentList.push(converted);
                                        added++;
                                      }
                                    });
                                    setEditingProject({
                                      ...editingProject,
                                      participants: currentList,
                                    });
                                    showToast(
                                      `Lista .CSV associada ao projeto "${editingProject.name || 'Novo Projeto'}": ${added} novo(s) e ${updated} atualizado(s)!`,
                                      'success'
                                    );
                                  };
                                  reader.readAsText(file, 'utf-8');
                                  e.target.value = '';
                                }}
                              />
                            </label>
                            {!isCreatingProject && editingProject.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  const targetId = editingProject.id;
                                  setIsCreatingProject(false);
                                  setEditingProject(null);
                                  setProjectsParticipantFilter(targetId);
                                  setProjectsSubTab('participantes');
                                }}
                                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold cursor-pointer inline-flex items-center gap-1 transition-colors"
                              >
                                <Users className="w-3.5 h-3.5" />
                                <span>Abrir Aba Participantes</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={newParticipantName}
                            onChange={(e) => setNewParticipantName(e.target.value)}
                            placeholder="Nome do atleta / educando..."
                            className="sm:col-span-4 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="number"
                            value={newParticipantAge}
                            onChange={(e) => setNewParticipantAge(e.target.value)}
                            placeholder="Idade"
                            className="sm:col-span-2 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={newParticipantRole}
                            onChange={(e) => setNewParticipantRole(e.target.value)}
                            placeholder="Posição / Categoria (ex: Atacante)"
                            className="sm:col-span-3 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={newParticipantSchool}
                            onChange={(e) => setNewParticipantSchool(e.target.value)}
                            placeholder="Escola / Ano (ex: EMEF • 9º Ano)"
                            className="sm:col-span-3 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={newParticipantHighlight}
                            onChange={(e) => setNewParticipantHighlight(e.target.value)}
                            placeholder="Destaque esportivo/escolar (ex: Artilheiro Sub-15)"
                            className="sm:col-span-5 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <input
                            type="text"
                            value={newParticipantBio}
                            onChange={(e) => setNewParticipantBio(e.target.value)}
                            placeholder="Resumo técnico / parecer para olheiros..."
                            className="sm:col-span-4 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newParticipantName.trim()) return;
                              const ageNum = Number(newParticipantAge) || 14;
                              const nextParticipants = [
                                ...(editingProject.participants || []),
                                {
                                  id: `ath-${Date.now()}`,
                                  name: newParticipantName.trim(),
                                  photoUrl:
                                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
                                  jerseyNumber: ((editingProject.participants?.length || 0) % 11) + 7,
                                  position: newParticipantRole.trim() || 'Meio-Campista / Ala',
                                  positionGroup: 'meio' as const,
                                  preferredFoot: 'Destro' as const,
                                  age: ageNum,
                                  birthDate: `${2026 - ageNum}`,
                                  category: ageNum <= 13 ? 'Sub-13' : ageNum <= 15 ? 'Sub-15' : 'Sub-17',
                                  height: '1,68m',
                                  weight: '58kg',
                                  cardTier: 'destaque' as const,
                                  stats: {
                                    pace: 82,
                                    shooting: 79,
                                    passing: 84,
                                    dribbling: 85,
                                    defending: 72,
                                    physical: 78,
                                    overall: 82,
                                  },
                                  schoolInfo: {
                                    schoolName: newParticipantSchool.trim() || 'Rede Pública Municipal de Cariacica',
                                    grade: 'Ensino Fundamental',
                                    turn: 'Matutino' as const,
                                    attendanceRate: '98%',
                                  },
                                  highlights: [
                                    newParticipantHighlight.trim() || 'Destaque Assiduidade & Fair Play 2026',
                                  ],
                                  scoutReport: {
                                    summary:
                                      newParticipantBio.trim() ||
                                      'Atleta em formação com excelente leitura tática, disciplina escolar e comprometimento nos treinos.',
                                    strengths: ['Visão de jogo', 'Velocidade de transição', 'Disciplina tática'],
                                    developmentAreas: ['Finalização de média distância'],
                                    scoutRating: '4.8 / 5.0',
                                  },
                                  photos: [],
                                  videos: [],
                                },
                              ];
                              setEditingProject({
                                ...editingProject,
                                participants: nextParticipants,
                              });
                              setNewParticipantName('');
                              setNewParticipantRole('');
                              setNewParticipantSchool('');
                              setNewParticipantHighlight('');
                              setNewParticipantBio('');
                            }}
                            className="sm:col-span-3 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg cursor-pointer"
                          >
                            + Cadastrar Atleta
                          </button>
                        </div>

                        {(editingProject.participants || []).length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-52 overflow-y-auto">
                            {(editingProject.participants || []).map((ath, idx) => (
                              <div
                                key={ath.id || idx}
                                className="p-2.5 bg-white border border-emerald-200 rounded-xl flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate">
                                    {ath.name} ({ath.age} anos)
                                  </span>
                                  <span className="text-[11px] text-emerald-700 font-semibold block truncate">
                                    {ath.position} • {(ath.highlights && ath.highlights[0]) || ath.category}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingProject({
                                      ...editingProject,
                                      participants: (editingProject.participants || []).filter(
                                        (_, i) => i !== idx
                                      ),
                                    })
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Remover atleta"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. Requisitos de Matrícula (functioning.requirements) */}
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                        <span className="font-black text-xs uppercase text-[#0a1e36] block">
                          Requisitos & Documentos para Matrícula ({(editingProject.functioning?.requirements || []).length})
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newRequirementText}
                            onChange={(e) => setNewRequirementText(e.target.value)}
                            placeholder="Ex: Atestado médico de aptidão física atualizado..."
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newRequirementText.trim()) return;
                              const currentFunc = editingProject.functioning || {
                                overview: editingProject.description || '',
                                methodology: '',
                                requirements: [],
                                scheduleDetails: [],
                                benefits: [],
                              };
                              setEditingProject({
                                ...editingProject,
                                functioning: {
                                  ...currentFunc,
                                  requirements: [
                                    ...(currentFunc.requirements || []),
                                    newRequirementText.trim(),
                                  ],
                                },
                              });
                              setNewRequirementText('');
                            }}
                            className="px-3 py-2 bg-[#0a1e36] text-white font-bold rounded-lg cursor-pointer"
                          >
                            + Requisito
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(editingProject.functioning?.requirements || []).map((req: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                            >
                              <span>{req}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const currentFunc = editingProject.functioning;
                                  if (!currentFunc) return;
                                  setEditingProject({
                                    ...editingProject,
                                    functioning: {
                                      ...currentFunc,
                                      requirements: (currentFunc.requirements || []).filter(
                                        (_: string, i: number) => i !== idx
                                      ),
                                    },
                                  });
                                }}
                                className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Project File Attachments */}
                      <AttachmentsEditor
                        attachments={editingProject.attachments || []}
                        onChange={(updatedAtts) =>
                          setEditingProject({ ...editingProject, attachments: updatedAtts })
                        }
                        onNotify={showToast}
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button
                        onClick={() => {
                          setIsCreatingProject(false);
                          setEditingProject(null);
                        }}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          handleSaveAllAdminChanges(
                            isCreatingProject
                              ? 'Novo projeto cadastrado e salvo com sucesso!'
                              : 'Projeto esportivo atualizado e salvo com sucesso!'
                          );
                        }}
                        className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Projeto</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: GALERIA DE FOTOS (ALBUMS & MULTI-PHOTO UPLOAD) */}
          {/* ========================================================================= */}
          {activeTab === 'galeria' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                    Galeria de Fotos de Projetos e Eventos
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Gerencie os álbuns fotográficos exibidos na página inicial e envie múltiplas fotos diretamente do seu computador ({draftAlbums.length} álbuns).
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsCreatingAlbum(true);
                    setEditingAlbum({
                      id: '',
                      title: '',
                      category: 'Festivais Esportivos',
                      date: 'Outubro 2026',
                      location: 'Polo Rio Marinho · Cariacica/ES',
                      coverUrl:
                        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1000&q=80',
                      caption: '',
                      albumPhotos: [],
                    });
                  }}
                  className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Novo Álbum de Fotos</span>
                </button>
              </div>

              {/* Albums Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {draftAlbums.map((album) => (
                  <div
                    key={album.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="flex gap-4">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-28 h-24 rounded-xl object-cover bg-slate-900 shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                          <span className="font-bold text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                            {album.category}
                          </span>
                          <span className="font-bold text-slate-700">
                            {album.albumPhotos.length} foto(s)
                          </span>
                        </div>
                        <h3 className="font-black text-sm text-[#0a1e36] mt-1.5 line-clamp-1">
                          {album.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {album.date} · {album.location}
                        </p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{album.caption}</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex -space-x-2 overflow-hidden">
                        {album.albumPhotos.slice(0, 5).map((p, i) => (
                          <img
                            key={i}
                            src={p.url}
                            alt=""
                            className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover bg-slate-200"
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setIsCreatingAlbum(false);
                            setEditingAlbum({
                              ...album,
                              albumPhotos: [...album.albumPhotos],
                            });
                          }}
                          className="px-3 py-1.5 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editar Fotos ({album.albumPhotos.length})</span>
                        </button>
                        <button
                          onClick={() => {
                            requestPinProtectedAction(() => {
                              setDraftAlbums((prev) => prev.filter((a) => a.id !== album.id));
                              showToast(
                                'Remoção marcada no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                'info'
                              );
                            });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                          title="Excluir álbum"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Create / Edit Album Modal */}
              {(isCreatingAlbum || editingAlbum) && editingAlbum && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                  <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                          Memória Esportiva & Lightbox
                        </span>
                        <h3 className="font-black text-base text-[#0a1e36] uppercase">
                          {isCreatingAlbum ? 'Criar Novo Álbum de Fotos' : 'Editar Álbum e Fotos'}
                        </h3>
                      </div>
                      <button
                        onClick={() => {
                          setIsCreatingAlbum(false);
                          setEditingAlbum(null);
                        }}
                        className="text-slate-400 hover:text-slate-600 p-1"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-7">
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Título do Álbum *
                          </label>
                          <input
                            type="text"
                            value={editingAlbum.title}
                            onChange={(e) =>
                              setEditingAlbum({ ...editingAlbum, title: e.target.value })
                            }
                            placeholder="Ex: Festival Esportivo Comunitário de Rio Marinho"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Categoria da Galeria *
                          </label>
                          <select
                            value={editingAlbum.category}
                            onChange={(e) =>
                              setEditingAlbum({
                                ...editingAlbum,
                                category: e.target.value as PastEventPhoto['category'],
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          >
                            <option value="Festivais Esportivos">Festivais Esportivos</option>
                            <option value="Categorias de Base">Categorias de Base</option>
                            <option value="Saúde & Vida Ativa">Saúde & Vida Ativa</option>
                            <option value="Inclusão & Comunidade">Inclusão & Comunidade</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Mês / Ano de Realização
                          </label>
                          <input
                            type="text"
                            value={editingAlbum.date}
                            onChange={(e) =>
                              setEditingAlbum({ ...editingAlbum, date: e.target.value })
                            }
                            placeholder="Ex: Agosto 2026"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Local do Evento
                          </label>
                          <input
                            type="text"
                            value={editingAlbum.location}
                            onChange={(e) =>
                              setEditingAlbum({ ...editingAlbum, location: e.target.value })
                            }
                            placeholder="Ex: Quadra Poliesportiva de Rio Marinho · Cariacica/ES"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Descrição / Resumo do Álbum
                        </label>
                        <textarea
                          rows={2}
                          value={editingAlbum.caption}
                          onChange={(e) =>
                            setEditingAlbum({ ...editingAlbum, caption: e.target.value })
                          }
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <ImageUploadField
                        label="Foto de Capa do Álbum"
                        imageUrl={editingAlbum.coverUrl}
                        onChange={(newUrl) =>
                          setEditingAlbum({ ...editingAlbum, coverUrl: newUrl })
                        }
                        onError={(msg) => showToast(msg, 'error')}
                      />

                      {/* Multi-Photo Upload & Management inside Album */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-800 uppercase block">
                              Fotos do Álbum ({editingAlbum.albumPhotos.length})
                            </span>
                            <span className="text-[11px] text-slate-500">
                              Envie várias fotos do seu computador de uma só vez ou adicione por URL.
                            </span>
                          </div>

                          <label className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5 shadow-xs self-start sm:self-auto">
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {isUploadingAlbumPhotos
                                ? 'Processando fotos...'
                                : '+ Anexar Fotos do Computador'}
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={handleGalleryPhotosUpload}
                              className="hidden"
                              disabled={isUploadingAlbumPhotos}
                            />
                          </label>
                        </div>

                        {/* Add Photo via URL */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-white p-3 rounded-lg border border-slate-200">
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Adicionar Foto por URL
                            </label>
                            <input
                              type="url"
                              value={newPhotoUrl}
                              onChange={(e) => setNewPhotoUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                            />
                          </div>
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                              Legenda da Foto
                            </label>
                            <input
                              type="text"
                              value={newPhotoCaption}
                              onChange={(e) => setNewPhotoCaption(e.target.value)}
                              placeholder="Descrição do momento registrado..."
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!newPhotoUrl.trim()) return;
                                setEditingAlbum({
                                  ...editingAlbum,
                                  albumPhotos: [
                                    ...editingAlbum.albumPhotos,
                                    {
                                      url: newPhotoUrl.trim(),
                                      caption:
                                        newPhotoCaption.trim() || editingAlbum.title || 'Foto',
                                    },
                                  ],
                                });
                                setNewPhotoUrl('');
                                setNewPhotoCaption('');
                              }}
                              className="w-full py-2 bg-[#0a1e36] hover:bg-[#0284c7] text-white font-bold rounded-md cursor-pointer"
                            >
                              + Incluir
                            </button>
                          </div>
                        </div>

                        {/* Photo List with Editable Captions */}
                        {editingAlbum.albumPhotos.length === 0 ? (
                          <div className="py-6 text-center text-slate-400 border border-dashed border-slate-300 rounded-lg bg-white">
                            Nenhuma foto adicionada ainda. Envie fotos do computador acima.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                            {editingAlbum.albumPhotos.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                className="p-2.5 bg-white rounded-xl border border-slate-200 flex gap-3 items-start"
                              >
                                <img
                                  src={photo.url}
                                  alt=""
                                  className="w-20 h-16 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                                />
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <input
                                    type="text"
                                    value={photo.caption}
                                    onChange={(e) => {
                                      const updated = [...editingAlbum.albumPhotos];
                                      updated[pIdx] = {
                                        ...updated[pIdx],
                                        caption: e.target.value,
                                      };
                                      setEditingAlbum({ ...editingAlbum, albumPhotos: updated });
                                    }}
                                    placeholder="Legenda da foto..."
                                    className="w-full p-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded"
                                  />
                                  <div className="flex items-center justify-between">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditingAlbum({ ...editingAlbum, coverUrl: photo.url })
                                      }
                                      className={`text-[10px] font-bold cursor-pointer ${
                                        editingAlbum.coverUrl === photo.url
                                          ? 'text-emerald-700'
                                          : 'text-[#0284c7] hover:underline'
                                      }`}
                                    >
                                      {editingAlbum.coverUrl === photo.url
                                        ? '★ Capa Atual'
                                        : 'Definir como Capa'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = editingAlbum.albumPhotos.filter(
                                          (_, i) => i !== pIdx
                                        );
                                        setEditingAlbum({ ...editingAlbum, albumPhotos: updated });
                                      }}
                                      className="text-rose-600 hover:underline text-[10px] font-bold cursor-pointer"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button
                        onClick={() => {
                          setIsCreatingAlbum(false);
                          setEditingAlbum(null);
                        }}
                        className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => {
                          handleSaveAllAdminChanges(
                            isCreatingAlbum
                              ? 'Novo álbum fotográfico criado e salvo com sucesso!'
                              : 'Álbum da galeria atualizado e salvo com sucesso!'
                          );
                        }}
                        className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Álbum na Galeria</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: TRANSPARÊNCIA MROSC & UPLOAD DE DOCUMENTOS OFICIAIS */}
          {/* ========================================================================= */}
          {activeTab === 'transparencia' && (() => {
            const filteredDocs = draftDocs.filter((doc) => {
              const matchCat =
                docCategoryFilter === 'all' || doc.category === docCategoryFilter;
              const matchQuery =
                !docSearch.trim() ||
                (doc.title || '').toLowerCase().includes(docSearch.toLowerCase()) ||
                (doc.description || '').toLowerCase().includes(docSearch.toLowerCase());
              return matchCat && matchQuery;
            });

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Portal da Transparência, Relatórios & Sócio-Torcedores
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Gerencie a contagem de Sócio-Torcedores, o Dashboard Financeiro e os relatórios e certidões para download público ({draftDocs.length} documentos).
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsCreatingDoc(true);
                      setEditingDoc({
                        id: '',
                        title: '',
                        category: 'prestacao_contas',
                        date: new Date().toLocaleDateString('pt-BR'),
                        description: '',
                        fileType: 'Relatório PDF',
                        badge: 'Aprovado',
                        period: 'Exercício 2026',
                        protocolNumber: `REL-2026/${String(draftDocs.length + 1).padStart(3, '0')}`,
                        responsible: 'Diretoria Executiva & Conselho Fiscal',
                        summaryPoints: [],
                      });
                    }}
                    className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Publicar Relatório / Arquivo</span>
                  </button>
                </div>

                {/* Sócio-Torcedores & Dashboard KPIs Editor */}
                {(() => {
                  const defaultDash = DEFAULT_SITE_SETTINGS.transparencyDashboard!;
                  const rawDash = draftSiteSettings.transparencyDashboard || defaultDash;
                  const dash = {
                    ...defaultDash,
                    ...rawDash,
                  };
                  const updateDash = (patch: Partial<typeof dash>) => {
                    setDraftSiteSettings({
                      ...draftSiteSettings,
                      transparencyDashboard: {
                        ...dash,
                        ...patch,
                      },
                    });
                  };
                  return (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                            Indicadores em Tempo Real
                          </span>
                          <h3 className="text-sm font-black text-[#0a1e36] uppercase">
                            Dashboard Financeiro & Contagem de Sócio-Torcedores
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveAllAdminChanges(
                              'Indicadores de Sócio-Torcedores e Dashboard atualizados!'
                            )
                          }
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Indicadores do Dashboard</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Sócio-Torcedores Ativos
                          </label>
                          <input
                            type="number"
                            value={dash.socioTorcedoresTotal}
                            onChange={(e) =>
                              updateDash({
                                socioTorcedoresTotal: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Meta Anual de Sócios
                          </label>
                          <input
                            type="number"
                            value={dash.socioTorcedoresGoal}
                            onChange={(e) =>
                              updateDash({
                                socioTorcedoresGoal: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Novos Sócios no Mês
                          </label>
                          <input
                            type="number"
                            value={dash.socioTorcedoresNewMonth}
                            onChange={(e) =>
                              updateDash({
                                socioTorcedoresNewMonth: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Beneficiários Diretos Atendidos
                          </label>
                          <input
                            type="number"
                            value={dash.directBeneficiaries}
                            onChange={(e) =>
                              updateDash({
                                directBeneficiaries: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Receita Captada no Ano (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={dash.totalRevenue}
                            onChange={(e) =>
                              updateDash({
                                totalRevenue: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Investido em Projetos (R$)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={dash.totalInvested}
                            onChange={(e) =>
                              updateDash({
                                totalInvested: Math.max(0, Number(e.target.value) || 0),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Data da Última Auditoria
                          </label>
                          <input
                            type="text"
                            value={dash.lastAuditDate}
                            onChange={(e) => updateDash({ lastAuditDate: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">
                            Parecer / Status Fiscal
                          </label>
                          <input
                            type="text"
                            value={dash.auditStatus}
                            onChange={(e) => updateDash({ auditStatus: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Search & Category Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => setDocSearch(e.target.value)}
                      placeholder="Buscar documento, protocolo, ata ou certidão..."
                      className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <label className="text-xs font-bold text-slate-600">Categoria:</label>
                    <select
                      value={docCategoryFilter}
                      onChange={(e) => setDocCategoryFilter(e.target.value)}
                      className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl"
                    >
                      <option value="all">Todas</option>
                      <option value="estatuto">Estatuto Social</option>
                      <option value="governanca">Governança & Atas</option>
                      <option value="prestacao_contas">Prestação de Contas</option>
                      <option value="emendas">Emendas Parlamentares</option>
                      <option value="fomento">Termos de Fomento</option>
                      <option value="certidoes">Certidões Negativas</option>
                      <option value="cnpj">Comprovante CNPJ</option>
                    </select>
                  </div>
                </div>

                {/* Doc Modal with Direct File Dropzone */}
                {(isCreatingDoc || editingDoc) && editingDoc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                            MROSC · Lei Federal 13.019/2014
                          </span>
                          <h3 className="font-black text-base text-[#0a1e36] uppercase">
                            {isCreatingDoc ? 'Publicar Documento ou Relatório Oficial' : 'Editar Documento / Relatório'}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setIsCreatingDoc(false);
                            setEditingDoc(null);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        {/* File Attachment Dropzone */}
                        <div className="p-4 bg-sky-50/70 border-2 border-dashed border-sky-300 rounded-xl space-y-2.5 text-center">
                          <Paperclip className="w-6 h-6 text-[#0284c7] mx-auto" />
                          <div>
                            <span className="font-bold text-slate-800 block">
                              Anexar Arquivo Oficial do Computador (PDF, DOCX, XLSX, Imagem)
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              O arquivo ficará disponível para download público no Portal da Transparência após salvar.
                            </span>
                          </div>

                          <div className="flex justify-center">
                            <label className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg cursor-pointer inline-flex items-center gap-1.5 shadow-2xs">
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {isUploadingDocFile
                                  ? 'Processando arquivo...'
                                  : editingDoc.fileName
                                  ? 'Substituir Arquivo Anexado'
                                  : 'Selecionar Arquivo no Computador'}
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,image/*"
                                onChange={handleTransparencyFileUpload}
                                className="hidden"
                                disabled={isUploadingDocFile}
                              />
                            </label>
                          </div>

                          {editingDoc.fileName && (
                            <div className="mt-2 p-2.5 bg-white rounded-lg border border-emerald-200 flex items-center justify-between text-left">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-black rounded text-[10px]">
                                  {editingDoc.fileType}
                                </span>
                                <span className="font-bold text-slate-800 truncate">
                                  {editingDoc.fileName}
                                </span>
                                {editingDoc.fileSize && (
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    ({editingDoc.fileSize})
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingDoc({
                                    ...editingDoc,
                                    fileName: undefined,
                                    fileSize: undefined,
                                    fileDataUrl: undefined,
                                  })
                                }
                                className="text-rose-600 hover:underline text-[11px] font-bold cursor-pointer ml-2"
                              >
                                Remover
                              </button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Título do Documento / Relatório *
                          </label>
                          <input
                            type="text"
                            value={editingDoc.title}
                            onChange={(e) =>
                              setEditingDoc({ ...editingDoc, title: e.target.value })
                            }
                            placeholder="Ex: Relatório Executivo de Atividades e Prestação de Contas 2026"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Categoria *
                            </label>
                            <select
                              value={editingDoc.category}
                              onChange={(e) =>
                                setEditingDoc({
                                  ...editingDoc,
                                  category: e.target.value as TransparencyDocument['category'],
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            >
                              <option value="estatuto">Estatuto Social</option>
                              <option value="governanca">Governança & Atas</option>
                              <option value="prestacao_contas">Prestação de Contas</option>
                              <option value="emendas">Emendas Parlamentares</option>
                              <option value="fomento">Termos de Fomento</option>
                              <option value="certidoes">Certidões Negativas</option>
                              <option value="cnpj">Comprovante CNPJ</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Formato
                            </label>
                            <input
                              type="text"
                              value={editingDoc.fileType || 'PDF'}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, fileType: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Status / Selo
                            </label>
                            <input
                              type="text"
                              value={editingDoc.badge}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, badge: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Protocolo / Registro
                            </label>
                            <input
                              type="text"
                              value={editingDoc.protocolNumber || ''}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, protocolNumber: e.target.value })
                              }
                              placeholder="Ex: REL-2026/004"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Período / Vigência
                            </label>
                            <input
                              type="text"
                              value={editingDoc.period || ''}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, period: e.target.value })
                              }
                              placeholder="Ex: 3º Trimestre 2026"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Valor / Indicador
                            </label>
                            <input
                              type="text"
                              value={editingDoc.financialValue || ''}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, financialValue: e.target.value })
                              }
                              placeholder="Ex: R$ 144.188,00"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Data de Atualização
                            </label>
                            <input
                              type="text"
                              value={editingDoc.date}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, date: e.target.value })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Link Externo Opcional (URL)
                            </label>
                            <input
                              type="url"
                              value={editingDoc.downloadUrl || ''}
                              onChange={(e) =>
                                setEditingDoc({ ...editingDoc, downloadUrl: e.target.value })
                              }
                              placeholder="https://..."
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Descrição e Finalidade
                          </label>
                          <textarea
                            rows={2}
                            value={editingDoc.description}
                            onChange={(e) =>
                              setEditingDoc({ ...editingDoc, description: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Destaques Executivos do Relatório (1 por linha)
                          </label>
                          <textarea
                            rows={3}
                            value={(editingDoc.summaryPoints || []).join('\n')}
                            onChange={(e) =>
                              setEditingDoc({
                                ...editingDoc,
                                summaryPoints: e.target.value
                                  .split('\n')
                                  .map((line) => line.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Ex: 415 beneficiários atendidos gratuitamente&#10;Parecer favorável do Conselho Fiscal"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          onClick={() => {
                            setIsCreatingDoc(false);
                            setEditingDoc(null);
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={() => {
                            handleSaveAllAdminChanges(
                              isCreatingDoc
                                ? 'Documento publicado e salvo com sucesso!'
                                : 'Documento oficial atualizado e salvo com sucesso!'
                            );
                          }}
                          className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Documento</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Docs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocs.map((doc) => {
                    const hasAttachedFile = Boolean(doc.fileDataUrl || doc.downloadUrl);
                    return (
                      <div
                        key={doc.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {doc.category}
                              </span>
                              <span className="text-[10px] font-black text-[#0284c7] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                {doc.fileType || 'PDF'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {doc.badge}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#0a1e36]">{doc.title}</h4>
                          <p className="text-xs text-slate-600 mt-1">{doc.description}</p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="text-[11px] text-slate-400 truncate">
                            <span>Atualizado: {doc.date}</span>
                            {doc.fileName && (
                              <span className="text-emerald-700 font-semibold block truncate">
                                Anexo: {doc.fileName} ({doc.fileSize})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {hasAttachedFile && (
                              <a
                                href={doc.fileDataUrl || doc.downloadUrl}
                                download={doc.fileName || `${doc.title}.pdf`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                                title="Baixar arquivo anexado"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setEditingDoc({ ...doc });
                                setIsCreatingDoc(false);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-100 text-[#0284c7] rounded-lg cursor-pointer text-xs font-bold inline-flex items-center gap-1"
                              title="Editar ou anexar arquivo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{hasAttachedFile ? 'Editar' : 'Anexar / Editar'}</span>
                            </button>
                            <button
                              onClick={() => {
                                requestPinProtectedAction(() => {
                                  setDraftDocs((prev) => prev.filter((d) => d.id !== doc.id));
                                  showToast(
                                    'Remoção marcada no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                    'info'
                                  );
                                });
                              }}
                              className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 8: INSCRIÇÕES & RSVPS (WITH MANUAL ENROLLMENT & EDITING) */}
          {/* ========================================================================= */}
          {activeTab === 'inscricoes' && (() => {
            const filteredRsvps = draftRsvps.filter((r) => {
              const matchesSearch =
                !rsvpSearch.trim() ||
                r.name.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
                r.phone.includes(rsvpSearch) ||
                r.confirmationCode.toLowerCase().includes(rsvpSearch.toLowerCase()) ||
                r.eventTitle.toLowerCase().includes(rsvpSearch.toLowerCase());
              const matchesEvent = rsvpEventFilter === 'all' || r.eventId === rsvpEventFilter;
              return matchesSearch && matchesEvent;
            });

            const handleExportCsv = () => {
              const headers = [
                'Código de Confirmação',
                'Nome do Participante',
                'Telefone/WhatsApp',
                'Evento / Modalidade',
                'Vagas',
                'Data Registro',
              ];
              const rows = filteredRsvps.map((r) => [
                r.confirmationCode,
                `"${(r.name || '').replace(/"/g, '""')}"`,
                `"${r.phone || ''}"`,
                `"${(r.eventTitle || '').replace(/"/g, '""')}"`,
                r.spots,
                `"${r.date || ''}"`,
              ]);
              const csvContent =
                '\uFEFF' + [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `inscricoes-vitalizar-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              showToast('Planilha de inscritos exportada com sucesso!');
            };

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Inscrições de Participantes & Vagas
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Gerencie inscrições realizadas pelo site ou cadastre participantes presencialmente ({draftRsvps.length} registros).
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const firstEv = draftEvents[0];
                        setIsCreatingRsvp(true);
                        setEditingRsvpItem({
                          id: '',
                          eventId: firstEv?.id || 'modalidade-iniciacao_esportiva',
                          eventTitle: firstEv?.title || 'Iniciação Esportiva — Polo Rio Marinho',
                          name: '',
                          phone: '',
                          spots: 1,
                          date: new Date().toLocaleDateString('pt-BR'),
                          confirmationCode: `VIT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                        });
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Nova Inscrição</span>
                    </button>

                    <button
                      onClick={handleExportCsv}
                      disabled={filteredRsvps.length === 0}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      title="Exportar planilha para Excel ou Google Sheets"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Exportar CSV ({filteredRsvps.length})</span>
                    </button>
                  </div>
                </div>

                {/* Manual RSVP Create/Edit Modal */}
                {editingRsvpItem && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                            Controle de Participantes
                          </span>
                          <h3 className="font-black text-base text-[#0a1e36] uppercase">
                            {isCreatingRsvp ? 'Cadastrar Inscrição Manual' : 'Editar Inscrição'}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRsvpItem(null);
                            setIsCreatingRsvp(false);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-3.5 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Evento / Atividade Esportiva *
                          </label>
                          <select
                            value={editingRsvpItem.eventId}
                            onChange={(e) => {
                              const val = e.target.value;
                              const foundEv = draftEvents.find((ev) => ev.id === val);
                              setEditingRsvpItem({
                                ...editingRsvpItem,
                                eventId: val,
                                eventTitle: foundEv
                                  ? foundEv.title
                                  : val === 'modalidade-iniciacao_esportiva'
                                  ? 'Iniciação Esportiva (Futsal, Vôlei) — Polo Rio Marinho'
                                  : val === 'modalidade-condicionamento_fisico'
                                  ? 'Condicionamento Físico & Saúde — Polo Rio Marinho'
                                  : 'Projeto Vida Ativa (Pessoas Idosas) — Polo Rio Marinho',
                              });
                            }}
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                          >
                            <optgroup label="Eventos e Clínicas do Calendário">
                              {draftEvents.map((ev) => (
                                <option key={ev.id} value={ev.id}>
                                  {ev.title} ({ev.availableSpots} vagas livres)
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Escolinhas e Modalidades Permanentes">
                              <option value="modalidade-iniciacao_esportiva">
                                Iniciação Esportiva (Futsal, Vôlei) — Polo Rio Marinho
                              </option>
                              <option value="modalidade-condicionamento_fisico">
                                Condicionamento Físico & Saúde — Polo Rio Marinho
                              </option>
                              <option value="modalidade-vida_ativa_idosos">
                                Projeto Vida Ativa (Pessoas Idosas) — Polo Rio Marinho
                              </option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Nome Completo do Participante / Aluno *
                          </label>
                          <input
                            type="text"
                            value={editingRsvpItem.name}
                            onChange={(e) =>
                              setEditingRsvpItem({ ...editingRsvpItem, name: e.target.value })
                            }
                            placeholder="Ex: Gabriel Martins (12 anos · Resp: Ana Martins)"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Telefone / WhatsApp *
                            </label>
                            <input
                              type="tel"
                              value={editingRsvpItem.phone}
                              onChange={(e) =>
                                setEditingRsvpItem({ ...editingRsvpItem, phone: e.target.value })
                              }
                              placeholder="(27) 99999-0000"
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 uppercase mb-1">
                              Quantidade de Vagas
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={editingRsvpItem.spots}
                              onChange={(e) =>
                                setEditingRsvpItem({
                                  ...editingRsvpItem,
                                  spots: Math.max(1, Number(e.target.value)),
                                })
                              }
                              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRsvpItem(null);
                            setIsCreatingRsvp(false);
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveAllAdminChanges(
                              isCreatingRsvp
                                ? 'Inscrição cadastrada e salva com sucesso!'
                                : 'Inscrição atualizada e salva com sucesso!'
                            );
                          }}
                          className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Inscrição</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={rsvpSearch}
                      onChange={(e) => setRsvpSearch(e.target.value)}
                      placeholder="Buscar por nome, telefone, código..."
                      className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    {rsvpSearch && (
                      <button
                        onClick={() => setRsvpSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="w-full sm:w-auto flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Filtrar Atividade:</label>
                    <select
                      value={rsvpEventFilter}
                      onChange={(e) => setRsvpEventFilter(e.target.value)}
                      className="text-xs p-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="all">Todas as Atividades ({draftRsvps.length})</option>
                      {draftEvents.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {filteredRsvps.length === 0 ? (
                  <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                    <Users className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">Nenhuma inscrição encontrada com estes critérios.</p>
                    <p>Tente ajustar a busca ou clique em "+ Nova Inscrição" acima.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[720px]">
                      <thead className="bg-[#0a1e36] text-white uppercase text-[11px]">
                        <tr>
                          <th className="p-3.5">Código</th>
                          <th className="p-3.5">Nome do Participante</th>
                          <th className="p-3.5">Telefone / WhatsApp</th>
                          <th className="p-3.5">Evento / Modalidade</th>
                          <th className="p-3.5 text-center">Vagas</th>
                          <th className="p-3.5">Data Registro</th>
                          <th className="p-3.5 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRsvps.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-mono font-bold text-[#0284c7]">{r.confirmationCode}</td>
                            <td className="p-3.5 font-bold text-slate-800">{r.name}</td>
                            <td className="p-3.5 text-slate-600 font-medium">{r.phone}</td>
                            <td className="p-3.5 text-slate-700">{r.eventTitle}</td>
                            <td className="p-3.5 text-center font-bold text-[#0a1e36]">
                              <span className="bg-sky-50 text-[#0284c7] border border-sky-200 px-2.5 py-0.5 rounded-full">
                                {r.spots}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-400 text-[11px]">{r.date}</td>
                            <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setIsCreatingRsvp(false);
                                  setEditingRsvpItem({ ...r });
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-sky-100 text-[#0284c7] rounded-lg cursor-pointer transition-colors"
                                title="Editar inscrição"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  requestPinProtectedAction(() => {
                                    setDraftRsvps((prev) => prev.filter((item) => item.id !== r.id));
                                    setDraftEvents((prev) =>
                                      prev.map((ev) =>
                                        ev.id === r.eventId
                                          ? {
                                              ...ev,
                                              availableSpots: Math.min(
                                                ev.capacity,
                                                ev.availableSpots + r.spots
                                              ),
                                            }
                                          : ev
                                      )
                                    );
                                    showToast(
                                      'Cancelamento marcado no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                      'info'
                                    );
                                  });
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer transition-colors"
                                title="Cancelar inscrição"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 9: MENSAGENS RECEBIDAS (CONTATOS & OUVIDORIA) */}
          {/* ========================================================================= */}
          {activeTab === 'mensagens' && (() => {
            const filteredMsgs = draftMessages.filter((m) => {
              const matchesStatus =
                msgStatusFilter === 'all'
                  ? true
                  : msgStatusFilter === 'unread'
                  ? !m.read
                  : m.read;
              const matchesQuery =
                !msgSearch.trim() ||
                m.name.toLowerCase().includes(msgSearch.toLowerCase()) ||
                m.email.toLowerCase().includes(msgSearch.toLowerCase()) ||
                m.subject.toLowerCase().includes(msgSearch.toLowerCase()) ||
                m.message.toLowerCase().includes(msgSearch.toLowerCase());
              return matchesStatus && matchesQuery;
            });

            const unreadCount = draftMessages.filter((m) => !m.read).length;

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase">
                      Mensagens de Contato & Ouvidoria
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Envios de cidadãos via formulário "Fale com a Vitalizar" ({unreadCount} não lida(s)).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setDraftMessages((prev) => prev.map((m) => ({ ...m, read: true })));
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Marcar Todas como Lidas
                      </button>
                    )}
                    {isMessagesDirty && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveAllAdminChanges('Mensagens atualizadas e salvas com sucesso!')
                        }
                        className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Salvar Mensagens</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={msgSearch}
                      onChange={(e) => setMsgSearch(e.target.value)}
                      placeholder="Buscar por nome, assunto ou mensagem..."
                      className="w-full text-xs pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    {[
                      { id: 'all', label: `Todas (${draftMessages.length})` },
                      { id: 'unread', label: `Não Lidas (${unreadCount})` },
                      { id: 'read', label: `Lidas (${draftMessages.length - unreadCount})` },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setMsgStatusFilter(tab.id as any)}
                        className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                          msgStatusFilter === tab.id
                            ? 'bg-[#0a1e36] text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredMsgs.length === 0 ? (
                  <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500 space-y-2">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">Nenhuma mensagem encontrada.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredMsgs.map((msg) => {
                      const cleanWhatsApp = (msg.phone || '').replace(/\D/g, '');
                      const whatsappHref =
                        cleanWhatsApp.length >= 10
                          ? `https://wa.me/55${cleanWhatsApp}?text=${encodeURIComponent(
                              `Olá ${msg.name}, aqui é da Secretaria da Associação Esportiva Vitalizar referente ao seu contato sobre "${msg.subject}".`
                            )}`
                          : null;

                      return (
                        <div
                          key={msg.id}
                          className={`p-5 rounded-2xl border transition-all ${
                            msg.read
                              ? 'bg-white border-slate-200'
                              : 'bg-sky-50/60 border-sky-300 shadow-xs'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  msg.read
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-[#0284c7] text-white'
                                }`}
                              >
                                {msg.subject}
                              </span>
                              <span className="font-black text-sm text-[#0a1e36]">{msg.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{msg.date}</span>
                          </div>

                          <p className="text-xs text-slate-700 my-3 leading-relaxed">
                            {msg.message}
                          </p>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <div>
                              <span>
                                E-mail: <strong>{msg.email}</strong>
                              </span>{' '}
                              •{' '}
                              <span>
                                Tel: <strong>{msg.phone}</strong>
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {whatsappHref && (
                                <a
                                  href={whatsappHref}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs transition-colors"
                                >
                                  Responder WhatsApp
                                </a>
                              )}
                              <a
                                href={`mailto:${msg.email}?subject=${encodeURIComponent(
                                  `Retorno Vitalizar: ${msg.subject}`
                                )}`}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors"
                              >
                                Responder E-mail
                              </a>
                              <button
                                onClick={() => {
                                  setDraftMessages((prev) =>
                                    prev.map((m) =>
                                      m.id === msg.id ? { ...m, read: !m.read } : m
                                    )
                                  );
                                }}
                                className="text-xs text-[#0284c7] hover:underline font-bold cursor-pointer px-1"
                              >
                                {msg.read ? 'Marcar Não Lida' : 'Marcar como Lida'}
                              </button>
                              <button
                                onClick={() => {
                                  setDraftMessages((prev) =>
                                    prev.filter((m) => m.id !== msg.id)
                                  );
                                }}
                                className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                title="Excluir mensagem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB SEDES & POLOS DE ATENDIMENTO (FACILITY POLOS CRUD) */}
          {/* ========================================================================= */}
          {activeTab === 'polos' && (() => {
            const poloTypeLabel: Record<FacilityPolo['type'], string> = {
              polo_principal: 'Polo Principal',
              quadra_poliesportiva: 'Núcleo Esportivo',
              sala_atividades: 'Sala Multiuso / Pedagógica',
              espaco_saude: 'Espaço Saúde & Funcional',
            };

            return (
              <div className="space-y-8">
                {/* 1. GESTÃO DE SEDES & POLOS DE ATENDIMENTO */}
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0284c7]">
                        Unidades de Atendimento dos Projetos
                      </span>
                      <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
                        Sedes e Polos de Atendimento ({draftPolos.length})
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Gerencie as sedes e polos onde acontecem os projetos sociais, escolinhas e oficinas comunitárias da Vitalizar.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsCreatingPolo(true);
                        setEditingPolo({
                          id: '',
                          name: '',
                          type: 'quadra_poliesportiva',
                          address: 'Cariacica - ES',
                          capacity: 'Até 150 pessoas / turno',
                          maxGuests: 150,
                          description:
                            'Espaço comunitário preparado para práticas esportivas, oficinas socioeducativas e eventos de integração.',
                          imageUrl:
                            'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=900&q=80',
                          includedItems: ['Iluminação LED', 'Vestiários', 'Acessibilidade PcD'],
                          rules: [
                            'Uso 100% gratuito mediante agendamento prévio na Secretaria.',
                            'Proibido o consumo de bebidas alcoólicas e fumo nas dependências esportivas.',
                          ],
                        });
                      }}
                      className="px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Novo Polo / Espaço Esportivo</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {draftPolos.map((polo) => (
                      <div
                        key={polo.id}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative">
                            <img
                              src={polo.imageUrl}
                              alt={polo.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-[#0a1e36]/90 text-[#38bdf8] rounded-full text-[10px] font-black uppercase">
                              {poloTypeLabel[polo.type] || 'Polo Esportivo'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-black text-sm text-[#0a1e36]">{polo.name}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{polo.address}</p>
                          </div>
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                            <div>
                              <strong>Capacidade:</strong> {polo.capacity} (máx. {polo.maxGuests} pessoas)
                            </div>
                            <div className="line-clamp-2">{polo.description}</div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(polo.includedItems || []).slice(0, 4).map((am: string, i: number) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-sky-50 text-[#0284c7] border border-sky-200 rounded text-[10px] font-bold"
                              >
                                {am}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {(polo.rules || []).length} norma(s)
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setIsCreatingPolo(false);
                                setEditingPolo({
                                  ...polo,
                                  includedItems: [...(polo.includedItems || [])],
                                  rules: [...(polo.rules || [])],
                                });
                              }}
                              className="px-3 py-1.5 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar Polo</span>
                            </button>
                            {draftPolos.length > 1 && (
                              <button
                                onClick={() => {
                                  requestPinProtectedAction(() => {
                                    setDraftPolos((prev) => prev.filter((p) => p.id !== polo.id));
                                    showToast(
                                      'Polo removido no rascunho. Clique em "Salvar Alterações" para confirmar.',
                                      'info'
                                    );
                                  });
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                title="Excluir polo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal: Create / Edit Facility Polo */}
                {(isCreatingPolo || editingPolo) && editingPolo && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto text-xs">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase">
                            Infraestrutura Esportiva
                          </span>
                          <h3 className="font-black text-base text-[#0a1e36] uppercase">
                            {isCreatingPolo
                              ? 'Cadastrar Novo Polo Esportivo'
                              : `Editar Polo: ${editingPolo.name}`}
                          </h3>
                        </div>
                        <button
                          onClick={() => {
                            setIsCreatingPolo(false);
                            setEditingPolo(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Nome Oficial do Polo / Quadra *
                          </label>
                          <input
                            type="text"
                            value={editingPolo.name}
                            onChange={(e) =>
                              setEditingPolo({ ...editingPolo, name: e.target.value })
                            }
                            placeholder="Ex: Polo Principal Rio Marinho"
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Tipo de Estrutura *
                          </label>
                          <select
                            value={editingPolo.type}
                            onChange={(e) =>
                              setEditingPolo({
                                ...editingPolo,
                                type: e.target.value as FacilityPolo['type'],
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                          >
                            <option value="polo_principal">Polo Principal</option>
                            <option value="quadra_poliesportiva">Quadra Poliesportiva</option>
                            <option value="sala_atividades">Sala de Atividades / Pedagógica</option>
                            <option value="espaco_saude">Espaço Saúde & Funcional</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Endereço Completo
                          </label>
                          <input
                            type="text"
                            value={editingPolo.address}
                            onChange={(e) =>
                              setEditingPolo({ ...editingPolo, address: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Capacidade Descritiva
                          </label>
                          <input
                            type="text"
                            value={editingPolo.capacity}
                            onChange={(e) =>
                              setEditingPolo({ ...editingPolo, capacity: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Público Máximo (Pessoas)
                          </label>
                          <input
                            type="number"
                            value={editingPolo.maxGuests}
                            onChange={(e) =>
                              setEditingPolo({
                                ...editingPolo,
                                maxGuests: Math.max(1, Number(e.target.value) || 50),
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Descrição da Infraestrutura
                        </label>
                        <textarea
                          rows={2}
                          value={editingPolo.description}
                          onChange={(e) =>
                            setEditingPolo({ ...editingPolo, description: e.target.value })
                          }
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <ImageUploadField
                        label="Foto do Polo / Quadra Esportiva"
                        imageUrl={editingPolo.imageUrl}
                        onChange={(newUrl) => setEditingPolo({ ...editingPolo, imageUrl: newUrl })}
                        onError={(msg) => showToast(msg, 'error')}
                      />

                      {/* Included Items / Amenities */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="block font-bold text-slate-700 uppercase">
                          Infraestrutura & Comodidades ({(editingPolo.includedItems || []).length})
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPoloAmenity}
                            onChange={(e) => setNewPoloAmenity(e.target.value)}
                            placeholder="Ex: Iluminação de LED, Vestiários, Arquibancada..."
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newPoloAmenity.trim()) return;
                              setEditingPolo({
                                ...editingPolo,
                                includedItems: [
                                  ...(editingPolo.includedItems || []),
                                  newPoloAmenity.trim(),
                                ],
                              });
                              setNewPoloAmenity('');
                            }}
                            className="px-3 py-2 bg-[#0284c7] text-white font-bold rounded-lg cursor-pointer"
                          >
                            + Item
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(editingPolo.includedItems || []).map((am: string, idx: number) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-semibold"
                            >
                              <span>{am}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingPolo({
                                    ...editingPolo,
                                    includedItems: (editingPolo.includedItems || []).filter(
                                      (_: string, i: number) => i !== idx
                                    ),
                                  })
                                }
                                className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Usage Rules */}
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <label className="block font-bold text-slate-700 uppercase">
                          Regras de Uso Comunitário ({(editingPolo.rules || []).length})
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newPoloRule}
                            onChange={(e) => setNewPoloRule(e.target.value)}
                            placeholder="Ex: Uso 100% gratuito mediante agendamento..."
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!newPoloRule.trim()) return;
                              setEditingPolo({
                                ...editingPolo,
                                rules: [
                                  ...(editingPolo.rules || []),
                                  newPoloRule.trim(),
                                ],
                              });
                              setNewPoloRule('');
                            }}
                            className="px-3 py-2 bg-[#0a1e36] text-white font-bold rounded-lg cursor-pointer"
                          >
                            + Regra
                          </button>
                        </div>
                        <div className="space-y-1">
                          {(editingPolo.rules || []).map((rule: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-lg"
                            >
                              <span>{rule}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingPolo({
                                    ...editingPolo,
                                    rules: (editingPolo.rules || []).filter(
                                      (_: string, i: number) => i !== idx
                                    ),
                                  })
                                }
                                className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingPolo(false);
                            setEditingPolo(null);
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveAllAdminChanges('Polo esportivo salvo com sucesso!')
                          }
                          className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Salvar Polo</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB OLHEIROS & CAPTAÇÃO (SCOUT INQUIRIES + ATHLETE SHOWCASE OVERVIEW) */}
          {/* ========================================================================= */}
          {activeTab === 'olheiros' && (() => {
            const filteredScoutInquiries = draftScoutInquiries.filter((inq) => {
              const matchStatus = scoutInqFilter === 'all' || inq.status === scoutInqFilter;
              const q = scoutInqSearch.trim().toLowerCase();
              const matchSearch =
                !q ||
                (inq.targetPlayerName || '').toLowerCase().includes(q) ||
                (inq.scoutName || '').toLowerCase().includes(q) ||
                (inq.organization || '').toLowerCase().includes(q) ||
                (inq.protocol || '').toLowerCase().includes(q);
              return matchStatus && matchSearch;
            });

            const allRegisteredAthletes = draftProjects.flatMap((proj) =>
              (proj.participants || []).map((ath) => ({
                ...ath,
                projectId: proj.id,
                projectName: proj.name,
              }))
            );

            const inquiryTypeLabels: Record<ScoutInquiryRecord['inquiryType'], string> = {
              avaliacao_clube: 'Convite para Avaliação Técnica',
              visita_treino: 'Visita Presencial em Treino',
              relatorio_atleta: 'Solicitação de Ficha Técnica',
              parceria_base: 'Intercâmbio / Parceria de Base',
            };

            const scoutStatusLabels: Record<ScoutInquiryRecord['status'], string> = {
              nova: 'Nova Sondagem',
              em_analise: 'Em Análise',
              agendada: 'Visita Agendada',
              concluida: 'Concluída',
            };

            return (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                      Vitrine Esportiva & Intercâmbio de Base
                    </span>
                    <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
                      Central de Captação, Olheiros & Sondagens ({draftScoutInquiries.length})
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Gerencie todos os pedidos de relatórios técnicos, convites para avaliação e visitas técnicas enviados por clubes e observadores credenciados.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingScoutInq(true);
                        setEditingScoutInq({
                          id: '',
                          protocol: `SCT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
                          targetPlayerName: allRegisteredAthletes[0]?.name || '',
                          targetCategory: allRegisteredAthletes[0]?.category || 'Sub-15',
                          projectName:
                            allRegisteredAthletes[0]?.projectName ||
                            'Iniciação Esportiva & Cidadania (Futsal e Vôlei)',
                          scoutName: '',
                          organization: '',
                          role: 'Observador Técnico',
                          phone: '',
                          email: '',
                          inquiryType: 'avaliacao_clube',
                          preferredDate: '',
                          message: '',
                          createdAt: new Date().toLocaleDateString('pt-BR'),
                          status: 'nova',
                        });
                      }}
                      className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Registrar Sondagem</span>
                    </button>

                    {draftScoutInquiries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const header =
                            'Protocolo,Atleta,Categoria,Projeto,Avaliador,Clube,Modalidade,Telefone,Email,Data,Status\n';
                          const rows = draftScoutInquiries
                            .map(
                              (s) =>
                                `"${s.protocol || ''}","${s.targetPlayerName || ''}","${s.targetCategory || ''}","${s.projectName || ''}","${s.scoutName || ''}","${s.organization || ''}","${s.inquiryType || ''}","${s.phone || ''}","${s.email || ''}","${s.createdAt || ''}","${s.status || ''}"`
                            )
                            .join('\n');
                          const blob = new Blob([header + rows], {
                            type: 'text/csv;charset=utf-8;',
                          });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `captacao-olheiros-vitalizar-${new Date().toISOString().slice(0, 10)}.csv`;
                          a.click();
                          URL.revokeObjectURL(url);
                          showToast('Relatório CSV de captação exportado!');
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-xl cursor-pointer flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Exportar CSV</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search & Status Filter */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={scoutInqSearch}
                      onChange={(e) => setScoutInqSearch(e.target.value)}
                      placeholder="Buscar por atleta, clube, olheiro ou protocolo..."
                      className="w-full text-xs pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    {(
                      [
                        { id: 'all', label: `Todos (${draftScoutInquiries.length})` },
                        { id: 'nova', label: 'Novas' },
                        { id: 'em_analise', label: 'Em Análise' },
                        { id: 'agendada', label: 'Agendadas' },
                        { id: 'concluida', label: 'Concluídas' },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setScoutInqFilter(st.id)}
                        className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                          scoutInqFilter === st.id
                            ? 'bg-[#0a1e36] text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inquiries List */}
                {filteredScoutInquiries.length === 0 ? (
                  <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2 text-xs text-slate-500">
                    <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">
                      Nenhuma sondagem de olheiro ou pedido de ficha técnica registrado neste filtro.
                    </p>
                    <p>
                      Quando observadores clicam em &ldquo;Solicitar Contato / Avaliação&rdquo; no perfil de um atleta dos projetos, o registro aparece aqui automaticamente.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredScoutInquiries.map((inq) => {
                      const cleanPhone = (inq.phone || '').replace(/\D/g, '');
                      const whatsappUrl =
                        cleanPhone.length >= 10
                          ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(
                              `Olá ${inq.scoutName} (${inq.organization}), aqui é da Coordenação de Base da Associação Esportiva Vitalizar referente ao protocolo ${inq.protocol} do atleta ${inq.targetPlayerName || inq.targetCategory}.`
                            )}`
                          : null;

                      return (
                        <div
                          key={inq.id}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-[11px] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300 text-[#0a1e36]">
                                {inq.protocol}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  inq.status === 'nova'
                                    ? 'bg-sky-100 text-[#0284c7] border border-sky-300'
                                    : inq.status === 'agendada'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : inq.status === 'em_analise'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-slate-100 text-slate-700 border border-slate-300'
                                }`}
                              >
                                {scoutStatusLabels[inq.status] || inq.status}
                              </span>
                              <span className="font-black text-sm text-[#0a1e36]">
                                Atleta: {inq.targetPlayerName || 'Elenco Geral'}
                              </span>
                              <span className="text-slate-500 font-semibold">
                                ({inq.targetCategory} • {inq.projectName})
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">{inq.createdAt}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Observador / Avaliador
                              </span>
                              <span className="font-bold text-slate-800">{inq.scoutName}</span>
                              <span className="block text-slate-600">{inq.organization}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Modalidade da Solicitação
                              </span>
                              <span className="font-bold text-[#0284c7]">
                                {inquiryTypeLabels[inq.inquiryType] || inq.inquiryType}
                              </span>
                              {inq.preferredDate && (
                                <span className="block text-slate-600">
                                  Previsão: {inq.preferredDate}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                                Contatos Diretos
                              </span>
                              <span className="font-semibold text-slate-800 block">
                                Tel: {inq.phone}
                              </span>
                              <span className="text-slate-600 block truncate">{inq.email}</span>
                            </div>
                          </div>

                          {inq.message && (
                            <p className="text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/70">
                              &ldquo;{inq.message}&rdquo;
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-500">Status:</span>
                              <select
                                value={inq.status}
                                onChange={(e) => {
                                  const nextSt = e.target.value as ScoutInquiryRecord['status'];
                                  setDraftScoutInquiries((prev) =>
                                    prev.map((item) =>
                                      item.id === inq.id ? { ...item, status: nextSt } : item
                                    )
                                  );
                                }}
                                className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs"
                              >
                                <option value="nova">Nova Sondagem</option>
                                <option value="em_analise">Em Análise</option>
                                <option value="agendada">Visita Agendada</option>
                                <option value="concluida">Concluída</option>
                              </select>
                            </div>

                            <div className="flex items-center gap-2">
                              {whatsappUrl && (
                                <a
                                  href={whatsappUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                                >
                                  Contatar WhatsApp
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingScoutInq(false);
                                  setEditingScoutInq({ ...inq });
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftScoutInquiries((prev) =>
                                    prev.filter((item) => item.id !== inq.id)
                                  )
                                }
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                title="Excluir registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Overview of All Registered Athletes across Projects */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="font-black text-sm text-[#0a1e36] uppercase">
                        Atletas & Educandos na Vitrine Oficial ({allRegisteredAthletes.length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Para adicionar ou remover atletas de um projeto específico, clique em &ldquo;Gerenciar Projetos & Elencos&rdquo;.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('projetos')}
                      className="px-3.5 py-1.5 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold rounded-xl cursor-pointer self-start sm:self-auto"
                    >
                      Gerenciar Projetos & Elencos
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {allRegisteredAthletes.map((ath, idx) => (
                      <div
                        key={ath.id || idx}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-[#0284c7] uppercase block truncate">
                            {ath.projectName}
                          </span>
                          <span className="font-black text-slate-900 block truncate">
                            {ath.name} ({ath.age} anos)
                          </span>
                          <span className="text-[11px] text-slate-600 block truncate">
                            {ath.position} • {(ath.highlights && ath.highlights[0]) || ath.category}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const proj = draftProjects.find((p) => p.id === ath.projectId);
                            if (proj) {
                              setActiveTab('projetos');
                              setIsCreatingProject(false);
                              setEditingProject({
                                ...proj,
                                attachments: proj.attachments || [],
                                staff: proj.staff || [],
                                participants: proj.participants || [],
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-[#0284c7] border border-slate-200 rounded-lg font-bold shrink-0 cursor-pointer"
                        >
                          Ficha
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal: Create / Edit Scout Inquiry */}
                {(isCreatingScoutInq || editingScoutInq) && editingScoutInq && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-black text-sm text-[#0a1e36] uppercase">
                          {isCreatingScoutInq
                            ? 'Registrar Nova Sondagem / Olheiro'
                            : `Editar Sondagem: ${editingScoutInq.protocol}`}
                        </h3>
                        <button
                          onClick={() => {
                            setIsCreatingScoutInq(false);
                            setEditingScoutInq(null);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Nome do Atleta *
                          </label>
                          <input
                            type="text"
                            value={editingScoutInq.targetPlayerName || ''}
                            onChange={(e) =>
                              setEditingScoutInq({
                                ...editingScoutInq,
                                targetPlayerName: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Categoria (ex: Sub-15)
                          </label>
                          <input
                            type="text"
                            value={editingScoutInq.targetCategory}
                            onChange={(e) =>
                              setEditingScoutInq({
                                ...editingScoutInq,
                                targetCategory: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Nome do Olheiro / Avaliador *
                          </label>
                          <input
                            type="text"
                            value={editingScoutInq.scoutName}
                            onChange={(e) =>
                              setEditingScoutInq({
                                ...editingScoutInq,
                                scoutName: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Clube / Entidade *
                          </label>
                          <input
                            type="text"
                            value={editingScoutInq.organization}
                            onChange={(e) =>
                              setEditingScoutInq({
                                ...editingScoutInq,
                                organization: e.target.value,
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            WhatsApp / Telefone *
                          </label>
                          <input
                            type="text"
                            value={editingScoutInq.phone}
                            onChange={(e) =>
                              setEditingScoutInq({ ...editingScoutInq, phone: e.target.value })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-700 uppercase mb-1">
                            Status do Atendimento
                          </label>
                          <select
                            value={editingScoutInq.status}
                            onChange={(e) =>
                              setEditingScoutInq({
                                ...editingScoutInq,
                                status: e.target.value as ScoutInquiryRecord['status'],
                              })
                            }
                            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                          >
                            <option value="nova">Nova Sondagem</option>
                            <option value="em_analise">Em Análise</option>
                            <option value="agendada">Visita Agendada</option>
                            <option value="concluida">Concluída</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 uppercase mb-1">
                          Observações / Mensagem da Sondagem
                        </label>
                        <textarea
                          rows={3}
                          value={editingScoutInq.message}
                          onChange={(e) =>
                            setEditingScoutInq({ ...editingScoutInq, message: e.target.value })
                          }
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                        />
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingScoutInq(false);
                            setEditingScoutInq(null);
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveAllAdminChanges('Sondagem de olheiro salva com sucesso!')
                          }
                          className="px-6 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-lg cursor-pointer"
                        >
                          Confirmar e Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 10: SEGURANÇA & SENHA (WITH VALIDATION & SHOW/HIDE TOGGLES) */}
          {/* ========================================================================= */}
          {activeTab === 'seguranca' && (() => {
            const pwdStrength = validatePasswordStrength(draftCreds.passwordHashOrPlain);
            const pinValid = /^\d{6}$/.test(draftCreds.securityPin.trim());

            return (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-2xl">
                <div>
                  <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
                    Proteção de Acesso
                  </span>
                  <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
                    Credenciais Administrativas & PIN
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Atualize o e-mail de acesso, senha mestre ou o PIN de segurança para ações críticas. As alterações só serão efetivadas ao clicar em Salvar.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSaveAllAdminChanges('Credenciais de segurança salvas com sucesso!');
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      E-mail do Administrador *
                    </label>
                    <input
                      type="email"
                      required
                      value={draftCreds.email}
                      onChange={(e) => setDraftCreds({ ...draftCreds, email: e.target.value })}
                      className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Senha do Administrador *
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminNewPassword ? 'text' : 'password'}
                        value={draftCreds.passwordHashOrPlain}
                        onChange={(e) =>
                          setDraftCreds({ ...draftCreds, passwordHashOrPlain: e.target.value })
                        }
                        className="w-full text-xs p-2.5 pr-10 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        {showAdminNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <span
                      className={`text-[11px] mt-1 block font-medium ${
                        pwdStrength.valid ? 'text-emerald-600' : 'text-amber-700'
                      }`}
                    >
                      {pwdStrength.valid
                        ? '✓ Senha forte (atende aos requisitos de letras e números).'
                        : pwdStrength.reason}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      PIN de Segurança (6 dígitos numéricos para exclusões críticas) *
                    </label>
                    <div className="relative w-52">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        maxLength={6}
                        value={draftCreds.securityPin}
                        onChange={(e) =>
                          setDraftCreds({
                            ...draftCreds,
                            securityPin: e.target.value.replace(/\D/g, ''),
                          })
                        }
                        className="w-full text-center text-sm p-2 pr-9 bg-slate-50 border border-slate-300 rounded-lg font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPin(!showAdminPin)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                      >
                        {showAdminPin ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {!pinValid && (
                      <span className="text-[11px] text-amber-700 mt-1 block">
                        O PIN deve conter exatamente 6 números.
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    {isCredsDirty && (
                      <button
                        type="button"
                        onClick={() => setDraftCreds(creds)}
                        className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase rounded-xl cursor-pointer"
                      >
                        Descartar
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar Alterações de Segurança</span>
                    </button>
                  </div>
                </form>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* TAB 10B: CHAVE PIX (CNPJ), RESULTADOS DA BASE, TROFÉUS & VOLUNTARIADO */}
          {/* ========================================================================= */}
          {activeTab === 'comunidade_pix' && (
            <AdminCommunityModules
              draftSettings={draftSiteSettings}
              onUpdateDraftSettings={setDraftSiteSettings}
              onSaveSettingsImmediately={(updatedSettings, logMsg, toastMsg) => {
                setDraftSiteSettings(updatedSettings);
                saveAdminChanges({
                  siteSettings: updatedSettings,
                  logDetails: logMsg,
                  toastMessage: toastMsg,
                });
              }}
              onNotify={showToast}
            />
          )}

          {/* ========================================================================= */}
          {/* TAB 11: IMPORTAÇÃO DE DADOS (NEXT FIT CSV, GITHUB) & BACKUP */}
          {/* ========================================================================= */}
          {activeTab === 'backup' && (() => {
            const estimatedBytes = new Blob([exportDatabaseJson()]).size;
            const maxStorageBytes = 5 * 1024 * 1024; // ~5MB browser localStorage quota
            const usagePercent = Math.min(100, Math.round((estimatedBytes / maxStorageBytes) * 100));

            return (
              <div className="space-y-6">
                {/* 0. Next Fit CSV Importer & Athlete Roster Sync */}
                <NextFitParticipantsManager
                  mode="import_hub"
                  projects={draftProjects}
                  onUpdateProjects={(updatedProjects, toastMsg, persistImmediately) => {
                    setDraftProjects(updatedProjects);
                    if (persistImmediately) {
                      saveAdminChanges({
                        projects: updatedProjects,
                        toastMessage: toastMsg,
                        logDetails:
                          toastMsg ||
                          'Relação de atletas Next Fit importada via .CSV na aba de Importação de Dados.',
                      });
                    } else if (toastMsg) {
                      showToast(toastMsg, 'info');
                    }
                  }}
                  onNavigateToProjectsParticipants={() => {
                    setActiveTab('projetos');
                    setProjectsSubTab('participantes');
                  }}
                  onNotify={showToast}
                />

                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
                        Preservação de Dados & Sistema
                      </span>
                      <h2 className="text-xl font-black text-[#0a1e36] uppercase mt-0.5">
                        Backup Completo JSON, GitHub & Restauração
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Exporte cópias de segurança de todo o banco de dados do site (incluindo arquivos, participantes, inscrições e álbuns), importe backups ou restaure os padrões.
                      </p>
                    </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs shrink-0 min-w-[200px]">
                    <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
                      <span>Uso de Armazenamento:</span>
                      <span className="text-[#0284c7]">{formatFileSize(estimatedBytes)}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usagePercent > 80 ? 'bg-amber-500' : 'bg-[#0284c7]'
                        }`}
                        style={{ width: `${Math.max(4, usagePercent)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {usagePercent}% da cota local do navegador (~5 MB)
                    </span>
                  </div>
                </div>

                {importJsonError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{importJsonError}</span>
                    </div>
                    <button
                      onClick={() => setImportJsonError(null)}
                      className="text-rose-500 hover:text-rose-800 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Export */}
                  <div className="p-5 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Download className="w-6 h-6 text-[#0284c7]" />
                      <h3 className="font-bold text-sm text-[#0a1e36]">Exportar Banco</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Gera um arquivo JSON contendo todas as notícias, eventos, projetos, galeria, anexos, mensagens e inscrições.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const jsonStr = exportDatabaseJson();
                        const blob = new Blob([jsonStr], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `vitalizar-backup-${new Date().toISOString().slice(0, 10)}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        addAuditLog('BACKUP_EXPORTADO', 'Backup completo do site Vitalizar foi exportado.');
                        showToast('Backup baixado com sucesso!');
                      }}
                      className="w-full py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Baixar JSON
                    </button>
                  </div>

                  {/* 2. Import */}
                  <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <Upload className="w-6 h-6 text-emerald-700" />
                      <h3 className="font-bold text-sm text-emerald-950">Restaurar de JSON</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Restaura todos os dados a partir de um arquivo JSON de backup previamente exportado.
                      </p>
                    </div>
                    <div>
                      <label className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Selecionar JSON</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const content = event.target?.result as string;
                              if (content) {
                                const result = importDatabaseJson(content);
                                if (result.success) {
                                  setImportJsonError(null);
                                  showToast(result.message, 'success');
                                } else {
                                  setImportJsonError(result.message);
                                }
                              }
                            };
                            reader.readAsText(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* 3. Reset Defaults */}
                  <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <RefreshCw className="w-6 h-6 text-amber-700" />
                      <h3 className="font-bold text-sm text-amber-900">Restaurar Padrões</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Redefine todas as informações e registros para os valores de fábrica da Vitalizar.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        requestPinProtectedAction(() => {
                          resetAllToDefaults();
                        });
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Restaurar Originais
                    </button>
                  </div>
                </div>

                {/* 4. GitHub Repository & Raw File Importer */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#0284c7]">
                        Integração GitHub API
                      </span>
                      <h3 className="text-base font-black text-[#0a1e36] uppercase">
                        Importar Arquivos Diretamente do GitHub
                      </h3>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Informe o repositório (ex: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200">usuario/repositorio</code> ou URL completa do GitHub) para listar e importar backups JSON, documentos PDF para a Transparência ou fotos para a Galeria.
                      </p>
                    </div>
                  </div>

                  {githubError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{githubError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGithubError(null)}
                        className="text-rose-500 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Repositório ou URL do GitHub *
                      </label>
                      <input
                        type="text"
                        value={githubRepoUrl}
                        onChange={(e) => setGithubRepoUrl(e.target.value)}
                        placeholder="Ex: https://github.com/usuario/vitalizar ou usuario/repo"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284c7]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        placeholder="main"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284c7]"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Pasta / Caminho (opcional)
                      </label>
                      <input
                        type="text"
                        value={githubPath}
                        onChange={(e) => setGithubPath(e.target.value)}
                        placeholder="Ex: public ou src/data"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0284c7]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Token de Acesso GitHub (Opcional — apenas para repositórios privados)
                      </label>
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0284c7]"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={githubLoading}
                      onClick={async () => {
                        const rawInput = githubRepoUrl.trim();
                        if (!rawInput) {
                          setGithubError('Informe a URL do repositório ou arquivo no GitHub.');
                          return;
                        }
                        setGithubLoading(true);
                        setGithubError(null);
                        try {
                          const headers: Record<string, string> = {
                            Accept: 'application/vnd.github.v3+json',
                          };
                          if (githubToken.trim()) {
                            headers.Authorization = `Bearer ${githubToken.trim()}`;
                          }

                          // Direct raw file URL support
                          if (
                            rawInput.includes('raw.githubusercontent.com') ||
                            rawInput.endsWith('.json')
                          ) {
                            const rawUrl = rawInput
                              .replace('https://github.com/', 'https://raw.githubusercontent.com/')
                              .replace('/blob/', '/');
                            const res = await fetch(rawUrl);
                            if (!res.ok) {
                              throw new Error(`Não foi possível baixar o arquivo (${res.status}).`);
                            }
                            const text = await res.text();
                            const result = importDatabaseJson(text);
                            if (result.success) {
                              showToast('Backup JSON importado diretamente do GitHub!', 'success');
                            } else {
                              setGithubError(result.message);
                            }
                            setGithubLoading(false);
                            return;
                          }

                          // Parse owner/repo from URL or shorthand
                          let cleaned = rawInput
                            .replace(/^https?:\/\/(www\.)?github\.com\//i, '')
                            .replace(/\.git$/i, '')
                            .replace(/^\/+|\/+$/g, '');

                          const parts = cleaned.split('/');
                          if (parts.length < 2) {
                            throw new Error(
                              'Formato inválido. Use "usuario/repositorio" ou a URL completa do GitHub.'
                            );
                          }
                          const owner = parts[0];
                          const repo = parts[1];
                          let effectiveBranch = githubBranch.trim() || 'main';
                          let effectivePath = githubPath.trim().replace(/^\/+|\/+$/g, '');

                          if (parts[2] === 'tree' || parts[2] === 'blob') {
                            if (parts[3]) effectiveBranch = parts[3];
                            if (parts.length > 4) {
                              effectivePath = parts.slice(4).join('/');
                            }
                          }

                          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${effectivePath}${
                            effectiveBranch ? `?ref=${encodeURIComponent(effectiveBranch)}` : ''
                          }`;
                          let response = await fetch(apiUrl, { headers });

                          // Fallback to master if main fails with 404
                          if (response.status === 404 && effectiveBranch === 'main') {
                            const fallbackUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${effectivePath}?ref=master`;
                            const fallbackRes = await fetch(fallbackUrl, { headers });
                            if (fallbackRes.ok) {
                              response = fallbackRes;
                              setGithubBranch('master');
                            }
                          }

                          if (!response.ok) {
                            throw new Error(
                              `Repositório ou caminho não encontrado no GitHub (Status ${response.status}). Verifique se o repositório é público.`
                            );
                          }

                          const data = await response.json();
                          const items = Array.isArray(data) ? data : [data];
                          setGithubItems(
                            items.map((item: any) => ({
                              name: item.name,
                              path: item.path,
                              type: item.type === 'dir' ? 'dir' : 'file',
                              size: item.size || 0,
                              download_url: item.download_url || null,
                              html_url: item.html_url || '',
                            }))
                          );
                          setGithubPath(effectivePath);
                          showToast(`${items.length} arquivo(s)/pasta(s) carregados do GitHub!`, 'info');
                        } catch (err: any) {
                          setGithubError(err?.message || 'Erro ao consultar a API do GitHub.');
                        } finally {
                          setGithubLoading(false);
                        }
                      }}
                      className="px-4 py-2 bg-[#0a1e36] hover:bg-[#0284c7] disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer flex items-center gap-2 shrink-0"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{githubLoading ? 'Buscando...' : 'Listar Arquivos do GitHub'}</span>
                    </button>
                  </div>

                  {githubItems.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                          <span>
                            Caminho: <code className="text-[#0284c7]">/{githubPath || ''}</code>
                          </span>
                          {githubPath && (
                            <button
                              type="button"
                              onClick={() => {
                                const parent = githubPath.split('/').slice(0, -1).join('/');
                                setGithubPath(parent);
                              }}
                              className="px-2 py-0.5 bg-white border border-slate-300 rounded text-[10px] hover:bg-slate-50 cursor-pointer"
                            >
                              ↑ Voltar Pasta
                            </button>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            let importedDocsCount = 0;
                            let importedImagesCount = 0;
                            let importedBackup = false;
                            const newDocs = [...draftDocs];
                            const newImages: { url: string; caption: string }[] = [];

                            for (const item of githubItems) {
                              if (item.type !== 'file' || !item.download_url) continue;
                              const lower = item.name.toLowerCase();
                              if (lower.endsWith('.json') && lower.includes('backup')) {
                                try {
                                  const res = await fetch(item.download_url);
                                  if (res.ok) {
                                    const text = await res.text();
                                    const result = importDatabaseJson(text);
                                    if (result.success) importedBackup = true;
                                  }
                                } catch {
                                  // ignore single file failure
                                }
                              } else if (
                                lower.endsWith('.pdf') ||
                                lower.endsWith('.doc') ||
                                lower.endsWith('.docx') ||
                                lower.endsWith('.xlsx') ||
                                lower.endsWith('.csv')
                              ) {
                                const ext = lower.split('.').pop()?.toUpperCase() || 'DOC';
                                newDocs.unshift({
                                  id: `gh-doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                                  title: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                                  category: 'governanca',
                                  date: new Date().toLocaleDateString('pt-BR'),
                                  description: `Arquivo importado do GitHub (${item.path})`,
                                  fileType: `${ext} • ${formatFileSize(item.size || 1024)}`,
                                  badge: 'GitHub',
                                  downloadUrl: item.download_url,
                                  fileName: item.name,
                                  fileSize: formatFileSize(item.size || 1024),
                                });
                                importedDocsCount++;
                              } else if (
                                lower.endsWith('.png') ||
                                lower.endsWith('.jpg') ||
                                lower.endsWith('.jpeg') ||
                                lower.endsWith('.webp')
                              ) {
                                newImages.push({
                                  url: item.download_url,
                                  caption: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                                });
                                importedImagesCount++;
                              }
                            }

                            if (importedDocsCount > 0) {
                              setDraftDocs(newDocs);
                              saveAdminChanges({ transparencyDocs: newDocs });
                            }
                            if (importedImagesCount > 0) {
                              const newAlbum = {
                                id: `gh-album-${Date.now()}`,
                                title: `Importação GitHub (${githubPath || 'Raiz'})`,
                                category: 'Festivais Esportivos',
                                date: new Date().toLocaleDateString('pt-BR'),
                                location: 'Cariacica - ES',
                                coverUrl: newImages[0].url,
                                caption: `Álbum com ${importedImagesCount} imagem(ns) importadas diretamente do GitHub.`,
                                albumPhotos: newImages,
                              };
                              const updatedAlbums = [newAlbum, ...draftAlbums];
                              setDraftAlbums(updatedAlbums);
                              saveAdminChanges({ galleryAlbums: updatedAlbums });
                            }

                            if (importedBackup || importedDocsCount > 0 || importedImagesCount > 0) {
                              showToast(
                                `Importação concluída: ${importedDocsCount} documento(s), ${importedImagesCount} imagem(ns)${
                                  importedBackup ? ' e backup JSON restaurado' : ''
                                }!`,
                                'success'
                              );
                            } else {
                              showToast(
                                'Nenhum arquivo PDF, imagem ou backup JSON encontrado nesta pasta para importação em lote.',
                                'info'
                              );
                            }
                          }}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
                        >
                          Importar Todos Desta Pasta
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                        {githubItems.map((item) => {
                          const lower = item.name.toLowerCase();
                          const isJson = lower.endsWith('.json');
                          const isImage =
                            lower.endsWith('.png') ||
                            lower.endsWith('.jpg') ||
                            lower.endsWith('.jpeg') ||
                            lower.endsWith('.webp') ||
                            lower.endsWith('.svg');

                          return (
                            <div
                              key={item.path}
                              className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                                <div className="truncate">
                                  <span className="font-semibold text-slate-800 block truncate">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {item.type === 'dir' ? 'Pasta' : formatFileSize(item.size)} • {item.path}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {item.type === 'dir' ? (
                                  <button
                                    type="button"
                                    onClick={() => setGithubPath(item.path)}
                                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-md cursor-pointer"
                                  >
                                    Selecionar Pasta →
                                  </button>
                                ) : (
                                  <>
                                    {isJson && item.download_url && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          try {
                                            const res = await fetch(item.download_url!);
                                            const text = await res.text();
                                            const result = importDatabaseJson(text);
                                            if (result.success) {
                                              showToast(`Backup "${item.name}" importado com sucesso!`, 'success');
                                            } else {
                                              setGithubError(result.message);
                                            }
                                          } catch {
                                            setGithubError(`Falha ao importar ${item.name}.`);
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold rounded-md cursor-pointer"
                                      >
                                        Restaurar JSON
                                      </button>
                                    )}
                                    {isImage && item.download_url && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newAlbum = {
                                            id: `gh-img-${Date.now()}`,
                                            title: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                                            category: 'Festivais Esportivos',
                                            date: new Date().toLocaleDateString('pt-BR'),
                                            location: 'Cariacica - ES',
                                            coverUrl: item.download_url!,
                                            caption: `Imagem importada do GitHub (${item.path})`,
                                            albumPhotos: [
                                              {
                                                url: item.download_url!,
                                                caption: item.name,
                                              },
                                            ],
                                          };
                                          const updated = [newAlbum, ...draftAlbums];
                                          setDraftAlbums(updated);
                                          saveAdminChanges({
                                            galleryAlbums: updated,
                                            toastMessage: `Imagem "${item.name}" adicionada à Galeria!`,
                                          });
                                        }}
                                        className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold rounded-md cursor-pointer"
                                      >
                                        + Galeria
                                      </button>
                                    )}
                                    {item.download_url && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const ext = lower.split('.').pop()?.toUpperCase() || 'ARQ';
                                          const newDoc = {
                                            id: `gh-doc-${Date.now()}`,
                                            title: item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
                                            category: 'governanca' as const,
                                            date: new Date().toLocaleDateString('pt-BR'),
                                            description: `Importado do repositório GitHub (${item.path})`,
                                            fileType: `${ext} • ${formatFileSize(item.size || 1024)}`,
                                            badge: 'GitHub',
                                            downloadUrl: item.download_url!,
                                            fileName: item.name,
                                            fileSize: formatFileSize(item.size || 1024),
                                          };
                                          const updated = [newDoc, ...draftDocs];
                                          setDraftDocs(updated);
                                          saveAdminChanges({
                                            transparencyDocs: updated,
                                            toastMessage: `Arquivo "${item.name}" importado para Transparência!`,
                                          });
                                        }}
                                        className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold rounded-md cursor-pointer"
                                      >
                                        + Transparência
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING UNSAVED CHANGES ACTION BAR */}
      {/* ========================================================================= */}
      {hasUnsavedChanges && !hasOpenModalDraft && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-[#0a1e36] text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-500/40 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="font-bold">Você possui alterações pendentes não salvas.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardAllChanges}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-sky-200 text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={() => handleSaveAllAdminChanges()}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-lg cursor-pointer flex items-center gap-1.5 shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UNSAVED CHANGES CONFIRMATION MODAL WHEN EXITING */}
      {/* ========================================================================= */}
      {unsavedClosePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-[#0a1e36] uppercase">
                  Alterações Não Salvas
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Você fez edições no painel administrativo que ainda não foram salvas. Deseja salvar antes de sair?
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUnsavedClosePromptOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Continuar Editando
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDiscardAllChanges();
                  setUnsavedClosePromptOpen(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Sair sem Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  const ok = handleSaveAllAdminChanges();
                  if (ok) {
                    setUnsavedClosePromptOpen(false);
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar e Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECURITY PIN CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {pinPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-sm text-[#0a1e36] uppercase">
                Confirmação de Segurança
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta é uma ação protegida. Digite o PIN mestre de 6 dígitos para autorizar:
              </p>
            </div>

            {pinError && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg">
                PIN incorreto! Verifique o código cadastrado.
              </div>
            )}

            <form onSubmit={handleConfirmPin} className="space-y-4">
              <input
                type="password"
                required
                maxLength={6}
                autoFocus
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="••••••"
                className="w-full text-center text-lg tracking-widest font-mono p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPinPromptOpen(false)}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0a1e36] hover:bg-[#0284c7] text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
