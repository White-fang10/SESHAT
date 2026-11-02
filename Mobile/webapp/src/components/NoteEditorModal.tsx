import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Pin,
  Sparkles,
  Archive,
  ArchiveRestore,
  Trash2,
  Users,
  Tag,
  CheckSquare,
  PenTool,
  Image as ImageIcon,
  Plus,
  X,
  Check,
  Palette,
  Upload,
  Code,
  BookOpen,
  Edit3,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Eye,
  Type,
  Share2,
  Sparkle,
} from 'lucide-react';
import { CodeBlockEditor, CodeBlockDisplay } from './CodeBlock';
import {
  Note,
  ChecklistItem,
  DrawingData,
  NoteImage,
  NoteAppearance,
  Label,
  AppearancePreset,
} from '../types/note';
import { getCardColorTokens, autoAdjustNoteAppearance } from '../utils/contrast';
import { SOLID_PALETTE, GRADIENT_PALETTE } from '../constants/presets';
import { driveService } from '../services/driveService';

interface NoteEditorModalProps {
  note: Note;
  labels: Label[];
  presets?: AppearancePreset[];
  isOpen: boolean;
  onUpdateNote: (updatedNote: Note) => void;
  onOpenDrawingModal: (
    initialDrawing?: DrawingData,
    onSave?: (d: DrawingData) => void
  ) => void;
  onOpenDesignStudio: (
    currentAppearance: NoteAppearance,
    onApply: (app: NoteAppearance) => void
  ) => void;
  onOpenShareModal: (note: Note) => void;
  onMoveToTrash: (id: string) => void;
  onClose: () => void;
  initialMode?: 'read' | 'edit';
}

type ReaderTheme = 'note' | 'paper' | 'sepia' | 'night';
type ReaderFontSize = 'sm' | 'md' | 'lg' | 'xl';

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  note,
  labels,
  presets = [],
  isOpen,
  onUpdateNote,
  onOpenDrawingModal,
  onOpenDesignStudio,
  onOpenShareModal,
  onMoveToTrash,
  onClose,
  initialMode,
}) => {
  if (!isOpen) return null;

  // Determine if this is a brand new empty note
  const isBrandNewEmptyNote =
    !note.title.trim() && !note.content.trim() && (!note.items || note.items.length === 0);

  // User requirement: "if the note is opened it should opened in a fully read friendly"
  // Default to 'read' mode for existing notes, 'edit' only if totally empty new note
  const [mode, setMode] = useState<'read' | 'edit'>(
    initialMode || (isBrandNewEmptyNote ? 'edit' : 'read')
  );

  // Reader Customization State
  const [readerFontSize, setReaderFontSize] = useState<ReaderFontSize>('md');
  const [readerTheme, setReaderTheme] = useState<ReaderTheme>('note');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  // Note Data States
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [items, setItems] = useState<ChecklistItem[]>(note.items || []);
  const [newItemText, setNewItemText] = useState('');
  const [drawings, setDrawings] = useState<DrawingData[]>(note.drawings || []);
  const [images, setImages] = useState<NoteImage[]>(note.images || []);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(note.labels || []);
  const [isPinned, setIsPinned] = useState(note.isPinned);
  const [isArchived, setIsArchived] = useState(note.isArchived);
  const [appearance, setAppearance] = useState<NoteAppearance>(note.appearance);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState<{ language: string; code: string } | null>(
    note.codeSnippet || null
  );
  const [showCodeEditor, setShowCodeEditor] = useState(!!note.codeSnippet?.code);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bgUploadRef = useRef<HTMLInputElement | null>(null);

  // Color Tokens based on custom note appearance
  const noteTokens = getCardColorTokens(appearance);

  // Dynamic Theme Tokens for Reader View (allows comfortable reading in Paper, Sepia, Night or Note original)
  const currentReaderTokens = useMemo(() => {
    if (readerTheme === 'paper') {
      return {
        bgColor: '#FAF9F6',
        bgImage: undefined,
        borderColor: '#E2E8F0',
        titleColor: '#0F172A',
        bodyColor: '#334155',
        secondaryColor: '#64748B',
        mutedColor: '#94A3B8',
        isDark: false,
      };
    }
    if (readerTheme === 'sepia') {
      return {
        bgColor: '#FBF0D9',
        bgImage: undefined,
        borderColor: '#EADBC4',
        titleColor: '#2C221E',
        bodyColor: '#43342E',
        secondaryColor: '#7C675B',
        mutedColor: '#A89284',
        isDark: false,
      };
    }
    if (readerTheme === 'night') {
      return {
        bgColor: '#111722',
        bgImage: undefined,
        borderColor: '#1E293B',
        titleColor: '#F8FAFC',
        bodyColor: '#CBD5E1',
        secondaryColor: '#94A3B8',
        mutedColor: '#64748B',
        isDark: true,
      };
    }
    // Default: use note's own appearance tokens
    return {
      bgColor: appearance.bgType === 'solid' ? appearance.bgColor : '#FFFFFF',
      bgImage:
        appearance.bgType === 'gradient'
          ? appearance.bgGradient
          : appearance.bgType === 'image' && appearance.bgImageUrl
          ? `url(${appearance.bgImageUrl})`
          : undefined,
      borderColor: noteTokens.borderColor,
      titleColor: noteTokens.titleColor,
      bodyColor: noteTokens.bodyColor,
      secondaryColor: noteTokens.secondaryColor,
      mutedColor: noteTokens.mutedColor,
      isDark: noteTokens.isDark,
    };
  }, [readerTheme, appearance, noteTokens]);

  // Synchronize remote collaborative updates in real time
  const lastUpdatedRef = useRef(note.updatedAt);
  useEffect(() => {
    if (note.updatedAt > lastUpdatedRef.current) {
      lastUpdatedRef.current = note.updatedAt;
      setTitle(note.title);
      setContent(note.content);
      setItems(note.items || []);
      setDrawings(note.drawings || []);
      setImages(note.images || []);
      setSelectedLabels(note.labels || []);
      setIsPinned(note.isPinned);
      setIsArchived(note.isArchived);
      setAppearance(note.appearance);
      if (note.codeSnippet) {
        setCodeSnippet(note.codeSnippet);
      }
    }
  }, [note.updatedAt]);

  // Clean up Text-to-Speech when unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Debounced live sync to Firestore so collaborators see keystrokes and changes in real time
  const liveSyncTimerRef = useRef<any>(null);
  const triggerLiveSync = (patch: Partial<Note> = {}) => {
    if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
    liveSyncTimerRef.current = setTimeout(() => {
      onUpdateNote({
        ...note,
        title: title.trim(),
        content: content.trim(),
        items,
        drawings,
        images,
        labels: selectedLabels,
        isPinned,
        isArchived,
        appearance,
        codeSnippet: codeSnippet && codeSnippet.code.trim() ? codeSnippet : undefined,
        type:
          codeSnippet && codeSnippet.code.trim()
            ? 'code'
            : items.length > 0
            ? 'checklist'
            : 'text',
        ...patch,
        updatedAt: Date.now(),
        version: (note.version || 1) + 1,
      });
    }, 500);
  };

  const handleSaveAndClose = () => {
    if (liveSyncTimerRef.current) clearTimeout(liveSyncTimerRef.current);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onUpdateNote({
      ...note,
      title: title.trim(),
      content: content.trim(),
      items,
      drawings,
      images,
      labels: selectedLabels,
      isPinned,
      isArchived,
      appearance,
      codeSnippet: codeSnippet && codeSnippet.code.trim() ? codeSnippet : undefined,
      type:
        codeSnippet && codeSnippet.code.trim()
          ? 'code'
          : items.length > 0
          ? 'checklist'
          : 'text',
      updatedAt: Date.now(),
      version: (note.version || 1) + 1,
    });
    onClose();
  };

  // Checklist Actions
  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;
    const item: ChecklistItem = {
      id: 'item_' + Date.now() + Math.random().toString(36).substring(2, 6),
      text: newItemText.trim(),
      completed: false,
      order: items.length,
    };
    const updated = [...items, item];
    setItems(updated);
    setNewItemText('');
    triggerLiveSync({ items: updated });
  };

  const handleToggleItem = (id: string) => {
    const updated = items.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    setItems(updated);
    triggerLiveSync({ items: updated });
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((i) => i.id !== id);
    setItems(updated);
    triggerLiveSync({ items: updated });
  };

  // Attachment Image Actions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      const imgId = 'img_' + Date.now() + '_' + i;
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setImages((prev) => [
          ...prev,
          {
            id: imgId,
            url: dataUrl,
            name: file.name,
            sizeBytes: file.size,
          },
        ]);

        // Background upload to Google Drive if authorized
        driveService
          .uploadImageToDrive(file, file.name)
          .then((res) => {
            if (res.fileId) {
              setImages((prev) =>
                prev.map((img) =>
                  img.id === imgId
                    ? {
                        ...img,
                        driveFileId: res.fileId,
                        url: res.webViewLink || img.url,
                      }
                    : img
                )
              );
            }
          })
          .catch(() => {});
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Background Image Upload
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updated = autoAdjustNoteAppearance({
        ...appearance,
        bgType: 'image',
        bgImageUrl: dataUrl,
        bgOverlayOpacity: 0.85,
      });
      setAppearance(updated);
      setShowBgPicker(false);
    };
    reader.readAsDataURL(file);
  };

  // Text-to-Speech (Read Aloud)
  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const checklistNarrative =
      items.length > 0
        ? 'Checklist items: ' +
          items.map((i) => (i.completed ? 'Completed: ' : 'Pending: ') + i.text).join('. ')
        : '';

    const textToSpeak = [
      title ? `Note: ${title}` : '',
      content,
      checklistNarrative,
    ]
      .filter(Boolean)
      .join('. ');

    if (!textToSpeak.trim()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy Note Text
  const handleCopyNoteText = () => {
    const fullText = [
      title ? `# ${title}` : '',
      content,
      items.length > 0
        ? items.map((i) => `[${i.completed ? 'x' : ' '}] ${i.text}`).join('\n')
        : '',
      codeSnippet?.code ? `\`\`\`${codeSnippet.language}\n${codeSnippet.code}\n\`\`\`` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Reading Stats
  const wordCount = useMemo(() => {
    const allText = `${title} ${content} ${items.map((i) => i.text).join(' ')}`.trim();
    if (!allText) return 0;
    return allText.split(/\s+/).filter(Boolean).length;
  }, [title, content, items]);

  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Checklist completion statistics
  const completedCount = useMemo(() => items.filter((i) => i.completed).length, [items]);

  // Formatted date
  const formattedDate = useMemo(() => {
    const d = new Date(note.updatedAt || note.createdAt);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [note.updatedAt, note.createdAt]);

  // Dynamic Font Size Classes
  const fontSizeClasses = {
    sm: {
      title: 'text-xl sm:text-2xl',
      body: 'text-sm leading-relaxed',
      checklist: 'text-sm',
    },
    md: {
      title: 'text-2xl sm:text-3xl',
      body: 'text-base sm:text-[17px] leading-relaxed',
      checklist: 'text-base',
    },
    lg: {
      title: 'text-3xl sm:text-4xl',
      body: 'text-lg sm:text-[19px] leading-loose',
      checklist: 'text-lg',
    },
    xl: {
      title: 'text-4xl sm:text-5xl',
      body: 'text-xl sm:text-[22px] leading-loose',
      checklist: 'text-xl',
    },
  }[readerFontSize];

  // Helper: Inline text formatting (bold, italic, links, inline code)
  const parseInlineFormatting = (text: string): React.ReactNode => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D97706] dark:text-[#FBBF24] underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-0.5 break-all font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            <span>{part}</span>
            <ExternalLink className="w-3 h-3 inline shrink-0 opacity-70" />
          </a>
        );
      }

      // Parse bold **text**
      const boldParts = part.split(/\*\*(.*?)\*\*/g);
      if (boldParts.length > 1) {
        return boldParts.map((sub, j) =>
          j % 2 === 1 ? (
            <strong key={`${i}-${j}`} className="font-bold">
              {sub}
            </strong>
          ) : (
            sub
          )
        );
      }

      // Parse inline code `code`
      const codeParts = part.split(/`([^`]+)`/g);
      if (codeParts.length > 1) {
        return codeParts.map((sub, j) =>
          j % 2 === 1 ? (
            <code
              key={`${i}-${j}`}
              className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[0.88em] font-medium"
            >
              {sub}
            </code>
          ) : (
            sub
          )
        );
      }

      return part;
    });
  };

  // Helper: Render formatted Markdown & paragraphs in Reading View
  const renderFormattedReadingContent = (rawText: string) => {
    if (!rawText || !rawText.trim()) {
      return (
        <div
          onClick={() => setMode('edit')}
          className="py-8 text-center text-slate-400 italic cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 transition"
        >
          <PenTool className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p>This note has no text content yet. Click here or tap "Edit Note" to write.</p>
        </div>
      );
    }

    const lines = rawText.split('\n');

    return (
      <div className="space-y-3.5 select-text">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} className="h-2" />;
          }

          // Heading 1 (# ...)
          if (line.startsWith('# ')) {
            return (
              <h1
                key={idx}
                className="text-2xl sm:text-3xl font-bold font-heading mt-6 mb-2 tracking-tight"
                style={{ color: currentReaderTokens.titleColor }}
              >
                {line.replace('# ', '')}
              </h1>
            );
          }

          // Heading 2 (## ...)
          if (line.startsWith('## ')) {
            return (
              <h2
                key={idx}
                className="text-xl sm:text-2xl font-bold font-heading mt-5 mb-2 tracking-tight"
                style={{ color: currentReaderTokens.titleColor }}
              >
                {line.replace('## ', '')}
              </h2>
            );
          }

          // Heading 3 (### ...)
          if (line.startsWith('### ')) {
            return (
              <h3
                key={idx}
                className="text-lg sm:text-xl font-semibold font-heading mt-4 mb-1.5"
                style={{ color: currentReaderTokens.titleColor }}
              >
                {line.replace('### ', '')}
              </h3>
            );
          }

          // Blockquote (> ...)
          if (line.startsWith('> ')) {
            return (
              <blockquote
                key={idx}
                className="pl-4 border-l-3 border-[#FFBF24] italic my-3 py-1 bg-amber-500/5 rounded-r-xl"
                style={{ color: currentReaderTokens.bodyColor }}
              >
                {line.replace('> ', '')}
              </blockquote>
            );
          }

          // Bullet list item (- ... or * ...)
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="w-2 h-2 rounded-full bg-[#FFBF24] mt-2.5 shrink-0" />
                <span className="flex-1">{parseInlineFormatting(line.slice(2))}</span>
              </div>
            );
          }

          // Numbered list item (1. ...)
          const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2.5 pl-2">
                <span className="font-bold text-[#D97706] dark:text-[#FBBF24] text-sm mt-0.5 shrink-0 min-w-4">
                  {numMatch[1]}.
                </span>
                <span className="flex-1">{parseInlineFormatting(numMatch[2])}</span>
              </div>
            );
          }

          // Standard paragraph
          return (
            <p key={idx} className={`${fontSizeClasses.body} select-text`}>
              {parseInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in"
      onClick={handleSaveAndClose}
    >
      <div
        className={`relative w-full ${
          isFullscreen
            ? 'h-full max-w-none max-h-none rounded-none'
            : 'max-w-3xl max-h-[92vh] rounded-3xl'
        } shadow-2xl border transition-all duration-200 flex flex-col overflow-hidden`}
        style={{
          backgroundColor: currentReaderTokens.bgColor,
          backgroundImage: currentReaderTokens.bgImage,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: currentReaderTokens.borderColor,
          fontFamily: appearance.fontFamily,
          color: currentReaderTokens.bodyColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background Overlay for image backgrounds */}
        {readerTheme === 'note' && appearance.bgType === 'image' && (
          <div
            className="absolute inset-0 bg-white/80 dark:bg-black/80 pointer-events-none"
            style={{
              opacity: 1 - (appearance.bgOverlayOpacity ?? 0.8),
              backdropFilter: appearance.bgBlur ? `blur(${appearance.bgBlur}px)` : undefined,
            }}
          />
        )}

        {/* Live Shared Note status indicator */}
        {((note.collaborators && note.collaborators.length > 0) ||
          (note.collaboratorEmails && note.collaboratorEmails.length > 0) ||
          note.isLiveShared) && (
          <div className="relative z-10 flex items-center justify-between px-5 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Live Shared Note: Edits sync in real time across devices</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenShareModal(note)}
              className="text-[11px] underline hover:opacity-80 font-semibold cursor-pointer"
            >
              Collaborators ({note.collaborators?.length || note.collaboratorEmails?.length || 1})
            </button>
          </div>
        )}

        {/* --- DEDICATED TOP TOOLBAR (Reading Controls vs Edit Controls) --- */}
        <div className="relative z-20 px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10 flex items-center justify-between gap-3 bg-black/5 dark:bg-white/5 backdrop-blur-md">
          {/* Left Side: Mode Switcher (Reading View vs Edit Mode) & Word Stats */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black/10 dark:bg-white/10 p-1 rounded-xl">
              {/* Reading View Button */}
              <button
                type="button"
                onClick={() => setMode('read')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'read'
                    ? 'bg-[#FFBF24] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Read-Friendly Mode"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Reading View</span>
              </button>

              {/* Edit Mode Button */}
              <button
                type="button"
                onClick={() => setMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  mode === 'edit'
                    ? 'bg-[#FFBF24] text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Edit Note"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Mode</span>
              </button>
            </div>

            {/* Reading Stats (Quiet Typography) */}
            <div className="hidden md:flex items-center gap-1.5 text-xs opacity-75 font-medium ml-1">
              <span>{readingTimeMinutes} min read</span>
              <span aria-hidden="true">·</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          {/* Right Side: Reader Customizers, TTS, Fullscreen, Close */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Font Size Adjuster (Aa) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowFontSizePicker(!showFontSizePicker);
                  setShowThemePicker(false);
                }}
                className={`p-2 rounded-xl transition flex items-center gap-1 text-xs font-bold hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ${
                  showFontSizePicker ? 'bg-black/10 dark:bg-white/10' : ''
                }`}
                title="Adjust Text Size"
              >
                <Type className="w-4 h-4" />
                <span className="uppercase text-[11px]">{readerFontSize}</span>
              </button>

              {showFontSizePicker && (
                <div className="absolute right-0 top-10 w-44 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-30 animate-in fade-in">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Text Size
                  </div>
                  {[
                    { id: 'sm' as const, label: 'Small', size: '14px' },
                    { id: 'md' as const, label: 'Default', size: '17px' },
                    { id: 'lg' as const, label: 'Large', size: '19px' },
                    { id: 'xl' as const, label: 'Extra Large', size: '22px' },
                  ].map((fs) => (
                    <button
                      key={fs.id}
                      type="button"
                      onClick={() => {
                        setReaderFontSize(fs.id);
                        setShowFontSizePicker(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition cursor-pointer ${
                        readerFontSize === fs.id
                          ? 'bg-[#FFBF24] text-slate-950 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>{fs.label}</span>
                      <span className="text-[11px] opacity-60 font-mono">{fs.size}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reading Theme Picker (Note / Paper / Sepia / Night) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowThemePicker(!showThemePicker);
                  setShowFontSizePicker(false);
                }}
                className={`p-2 rounded-xl transition flex items-center gap-1 text-xs hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer ${
                  showThemePicker ? 'bg-black/10 dark:bg-white/10' : ''
                }`}
                title="Reading Theme & Contrast"
              >
                <Eye className="w-4 h-4" />
              </button>

              {showThemePicker && (
                <div className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-30 animate-in fade-in">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                    Reading Mode Theme
                  </div>
                  {[
                    { id: 'note' as const, label: 'Original Note', dot: appearance.bgColor || '#FFF' },
                    { id: 'paper' as const, label: 'Paper White', dot: '#FAF9F6' },
                    { id: 'sepia' as const, label: 'Warm Sepia', dot: '#FBF0D9' },
                    { id: 'night' as const, label: 'Night Parchment', dot: '#111722' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setReaderTheme(t.id);
                        setShowThemePicker(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition cursor-pointer ${
                        readerTheme === t.id
                          ? 'bg-[#FFBF24] text-slate-950 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: t.dot }}
                      />
                      <span className="flex-1 text-left">{t.label}</span>
                      {readerTheme === t.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Read Aloud (Text-to-Speech) */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isSpeaking
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
              }`}
              title={isSpeaking ? 'Stop Reading Aloud' : 'Listen / Read Note Aloud'}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Copy Note Text */}
            <button
              type="button"
              onClick={handleCopyNoteText}
              className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Copy All Note Content"
            >
              {copiedToast ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Fullscreen / Focus Mode Toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Zen Focus / Fullscreen Reader'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleSaveAndClose}
              className="p-2 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Close Note"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- SCROLLABLE BODY AREA --- */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-8 md:px-12 py-6 custom-scrollbar">
          {mode === 'read' ? (
            /* ========================================================= */
            /* ================ READ-FRIENDLY VIEW MODE ================ */
            /* ========================================================= */
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Header Info: Title, Pin, Quiet Metadata */}
              <div className="space-y-2 border-b border-black/10 dark:border-white/10 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <h1
                    className={`${fontSizeClasses.title} font-bold font-heading tracking-tight select-text`}
                    style={{ color: currentReaderTokens.titleColor }}
                  >
                    {title || 'Untitled Note'}
                  </h1>

                  <button
                    type="button"
                    onClick={() => {
                      const nextPin = !isPinned;
                      setIsPinned(nextPin);
                      triggerLiveSync({ isPinned: nextPin });
                    }}
                    className={`p-2 rounded-xl transition shrink-0 cursor-pointer ${
                      isPinned
                        ? 'text-[#F59E0B] bg-amber-100/50 dark:bg-amber-950/40'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={isPinned ? 'Unpin note' : 'Pin note'}
                  >
                    <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Quiet Metadata without pill clutter (Frontend Design Constitution) */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 opacity-60" />
                    <span>{formattedDate}</span>
                  </span>

                  {selectedLabels.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <div className="flex items-center gap-1.5">
                        {selectedLabels.map((lblId) => {
                          const lbl = labels.find((l) => l.id === lblId);
                          return (
                            <span key={lblId} className="hover:underline">
                              #{lbl?.name || 'label'}
                            </span>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {note.isStarred && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#D97706] dark:text-[#FBBF24] font-semibold">Starred</span>
                    </>
                  )}
                </div>
              </div>

              {/* Cover or Attachment Images in Reading Mode */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <div
                    className={
                      images.length === 1
                        ? 'w-full'
                        : 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                    }
                  >
                    {images.map((img) => (
                      <div
                        key={img.id}
                        onClick={() => setSelectedLightboxImage(img.url)}
                        className="relative rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 shadow-sm cursor-zoom-in group max-h-80"
                      >
                        <img
                          src={img.url}
                          alt={img.name || 'Note image'}
                          className="w-full h-full object-cover transition transform group-hover:scale-102 duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-black/70 text-white text-xs font-semibold rounded-full backdrop-blur-xs transition">
                            Click to expand
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formatted Content Reading Area (Double-click or click to edit) */}
              <div
                onDoubleClick={() => setMode('edit')}
                title="Double click anywhere to edit"
                className="cursor-text"
              >
                {renderFormattedReadingContent(content)}
              </div>

              {/* Code Snippet in Reading Mode */}
              {codeSnippet && codeSnippet.code.trim() && (
                <div className="pt-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Code Snippet ({codeSnippet.language})
                  </div>
                  <CodeBlockDisplay
                    code={codeSnippet.code}
                    language={codeSnippet.language}
                  />
                </div>
              )}

              {/* Interactive Checklist in Reading Mode */}
              {items.length > 0 && (
                <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
                  {/* Progress Header */}
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="uppercase tracking-wider opacity-75 font-heading">
                      Checklist Progress
                    </span>
                    <span className="opacity-75">
                      {completedCount} of {items.length} completed (
                      {Math.round((completedCount / items.length) * 100)}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFBF24] transition-all duration-300 rounded-full"
                      style={{
                        width: `${(completedCount / items.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2 pt-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleItem(item.id)}
                        className={`flex items-start gap-3 p-2.5 rounded-2xl transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${
                          item.completed ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="pt-0.5">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                              item.completed
                                ? 'bg-[#FFBF24] border-[#FFBF24] text-slate-950 shadow-xs'
                                : 'border-slate-400 hover:border-[#FFBF24] bg-white/70 dark:bg-slate-800/70'
                            }`}
                          >
                            {item.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        <span
                          className={`${fontSizeClasses.checklist} leading-relaxed flex-1 select-text ${
                            item.completed ? 'line-through' : ''
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Drawings in Reading Mode */}
              {drawings.length > 0 && (
                <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Sketches & Drawings
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {drawings.map((draw, idx) => (
                      <div
                        key={idx}
                        onClick={() => draw.previewUrl && setSelectedLightboxImage(draw.previewUrl)}
                        className="relative rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-white/60 dark:bg-black/40 backdrop-blur-xs p-2 cursor-zoom-in group shadow-xs"
                      >
                        <img
                          src={draw.previewUrl}
                          alt="Drawing sketch"
                          className="w-full h-44 object-contain"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-black/70 text-white text-xs font-semibold rounded-full backdrop-blur-xs transition">
                            Zoom sketch
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editorial Quote styling if note has quote */}
              {note.quote && (
                <div className="pt-4 border-t border-black/10 dark:border-white/10">
                  <blockquote className="text-xl italic font-serif leading-relaxed pl-4 border-l-4 border-amber-500">
                    "{note.quote}"
                  </blockquote>
                </div>
              )}

              {/* Reading View Bottom Quick Bar */}
              <div className="pt-8 pb-4 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="px-5 py-2.5 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Note</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenShareModal(note)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Live</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndClose}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* ==================== EDIT NOTE MODE ===================== */
            /* ========================================================= */
            <div className="max-w-2xl mx-auto space-y-4">
              {/* Title & Pin Input */}
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    triggerLiveSync({ title: e.target.value });
                  }}
                  placeholder="Note Title"
                  className="w-full bg-transparent text-xl sm:text-2xl font-bold placeholder-slate-400 focus:outline-none font-heading"
                  style={{ color: currentReaderTokens.titleColor }}
                />

                <button
                  type="button"
                  onClick={() => {
                    const nextPin = !isPinned;
                    setIsPinned(nextPin);
                    triggerLiveSync({ isPinned: nextPin });
                  }}
                  className={`p-2 rounded-xl transition shrink-0 cursor-pointer ${
                    isPinned
                      ? 'text-[#F59E0B] bg-amber-100/50 dark:bg-amber-950/40'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title={isPinned ? 'Unpin note' : 'Pin note'}
                >
                  <Pin className={`w-5 h-5 ${isPinned ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Text content textarea */}
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  triggerLiveSync({ content: e.target.value });
                }}
                placeholder="Take a note... (supports markdown, headings, bullets)"
                rows={8}
                className="w-full bg-transparent text-base placeholder-slate-400 focus:outline-none resize-none leading-relaxed font-sans"
                style={{ color: currentReaderTokens.bodyColor }}
              />

              {/* Code Block Editor */}
              {showCodeEditor && codeSnippet && (
                <CodeBlockEditor
                  code={codeSnippet.code}
                  language={codeSnippet.language}
                  onChangeCode={(code) => setCodeSnippet((prev) => ({ ...prev!, code }))}
                  onChangeLanguage={(language) =>
                    setCodeSnippet((prev) => ({ ...prev!, language }))
                  }
                  onRemove={() => {
                    setCodeSnippet(null);
                    setShowCodeEditor(false);
                  }}
                />
              )}

              {/* Checklist Editor */}
              {items.length > 0 && (
                <div className="space-y-2 border-t border-black/10 dark:border-white/10 pt-3">
                  <div
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: currentReaderTokens.secondaryColor }}
                  >
                    Checklist Items
                  </div>
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 group">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleItem(item.id)}
                        className="w-4 h-4 accent-[#FFBF24] rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, text: val } : i))
                          );
                        }}
                        className={`flex-1 text-sm bg-transparent focus:outline-none ${
                          item.completed ? 'line-through opacity-50' : ''
                        }`}
                        style={{
                          color: item.completed
                            ? currentReaderTokens.mutedColor
                            : currentReaderTokens.bodyColor,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add checklist item form */}
              <form onSubmit={handleAddItem} className="flex items-center gap-2 pt-1">
                <Plus className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Add checklist item..."
                  className="flex-1 text-xs bg-transparent focus:outline-none placeholder-slate-400"
                  style={{ color: currentReaderTokens.bodyColor }}
                />
              </form>

              {/* Drawings Preview */}
              {drawings.length > 0 && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {drawings.map((draw, idx) => (
                    <div
                      key={idx}
                      className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white/50 dark:bg-black/40 backdrop-blur-xs p-1"
                    >
                      <img
                        src={draw.previewUrl}
                        alt="Drawing"
                        className="w-full h-36 object-contain"
                      />
                      <button
                        onClick={() =>
                          setDrawings((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-900/90 text-rose-600 rounded-lg shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Images Preview */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden h-32 group"
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() =>
                          setImages((prev) => prev.filter((i) => i.id !== img.id))
                        }
                        className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Labels chips */}
              {selectedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedLabels.map((lblId) => {
                    const lbl = labels.find((l) => l.id === lblId);
                    return (
                      <span
                        key={lblId}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-black/5 dark:bg-white/10"
                        style={{ color: currentReaderTokens.bodyColor }}
                      >
                        #{lbl?.name || 'label'}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Quick Background Customizer with Presets and Upload */}
              {showBgPicker && (
                <div
                  className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 animate-in fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-heading">
                      Background & Presets
                    </span>
                    <button
                      type="button"
                      onClick={() => bgUploadRef.current?.click()}
                      className="text-xs font-semibold text-[#D97706] dark:text-[#FBBF24] hover:underline flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                  </div>

                  {/* Presets */}
                  {presets.length > 0 && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Theme Presets
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {presets.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setAppearance(autoAdjustNoteAppearance(p.appearance));
                              setShowBgPicker(false);
                            }}
                            className="px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition text-xs cursor-pointer"
                          >
                            <span
                              className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                              style={{
                                background:
                                  p.appearance.bgType === 'gradient'
                                    ? p.appearance.bgGradient
                                    : p.appearance.bgColor || '#FFF',
                              }}
                            />
                            <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
                              {p.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solid Colors */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Colors
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                      {SOLID_PALETTE.map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => {
                            setAppearance(
                              autoAdjustNoteAppearance({
                                ...appearance,
                                bgType: 'solid',
                                bgColor: c.color,
                              })
                            );
                            setShowBgPicker(false);
                          }}
                          className={`w-7 h-7 rounded-full shrink-0 border-2 transition transform hover:scale-115 cursor-pointer ${
                            appearance.bgColor === c.color
                              ? 'border-[#FFBF24] ring-2 ring-[#FFBF24]/50'
                              : 'border-black/10'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Gradients */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Gradients
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {GRADIENT_PALETTE.map((g) => (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => {
                            setAppearance(
                              autoAdjustNoteAppearance({
                                ...appearance,
                                bgType: 'gradient',
                                bgGradient: g.gradient,
                              })
                            );
                            setShowBgPicker(false);
                          }}
                          className="px-2.5 py-1 rounded-lg shrink-0 border border-black/10 text-[11px] font-semibold text-slate-800 cursor-pointer"
                          style={{ background: g.gradient }}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* --- MODAL FOOTER CONTROLS IN EDIT MODE --- */}
        {mode === 'edit' && (
          <div className="relative z-10 p-3 sm:p-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-2 bg-black/5 dark:bg-white/5">
            <div className="flex items-center gap-1 overflow-x-auto">
              {/* Checklist button */}
              <button
                type="button"
                onClick={() => {
                  if (items.length === 0) {
                    setItems([{ id: 'it_1', text: '', completed: false, order: 0 }]);
                  }
                }}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                title="Add Checklist"
              >
                <CheckSquare className="w-4 h-4" />
              </button>

              {/* Code block button */}
              <button
                type="button"
                onClick={() => {
                  if (showCodeEditor) {
                    if (!codeSnippet?.code.trim()) {
                      setCodeSnippet(null);
                      setShowCodeEditor(false);
                    } else {
                      setShowCodeEditor(false);
                    }
                  } else {
                    setShowCodeEditor(true);
                    if (!codeSnippet) {
                      setCodeSnippet({ language: 'javascript', code: '' });
                    }
                  }
                }}
                className={`p-2 rounded-lg transition cursor-pointer ${
                  showCodeEditor || codeSnippet?.code
                    ? 'text-[#F59E0B] bg-amber-100/50 dark:bg-amber-950/40'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
                title="Code Block"
              >
                <Code className="w-4 h-4" />
              </button>

              {/* Add drawing button */}
              <button
                type="button"
                onClick={() =>
                  onOpenDrawingModal(undefined, (d) => {
                    setDrawings((prev) => [...prev, d]);
                  })
                }
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                title="Add Drawing"
              >
                <PenTool className="w-4 h-4" />
              </button>

              {/* Add attachment image */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                title="Upload Attachment Image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Palette / Background */}
              <button
                type="button"
                onClick={() => setShowBgPicker(!showBgPicker)}
                className="p-2 text-[#F59E0B] hover:text-[#D97706] rounded-lg hover:bg-amber-100/50 transition cursor-pointer"
                title="Change Background & Presets"
              >
                <Palette className="w-4 h-4" />
              </button>

              {/* Full Design Studio */}
              <button
                type="button"
                onClick={() =>
                  onOpenDesignStudio(appearance, (newApp) =>
                    setAppearance(autoAdjustNoteAppearance(newApp))
                  )
                }
                className="p-2 text-[#D97706] hover:text-[#B45309] rounded-lg hover:bg-amber-100/50 transition cursor-pointer"
                title="Full Design Studio"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Share live with friends */}
              <button
                type="button"
                onClick={() => {
                  const currentDraft: Note = {
                    ...note,
                    title: title.trim(),
                    content: content.trim(),
                    items,
                    drawings,
                    images,
                    labels: selectedLabels,
                    appearance,
                    codeSnippet:
                      codeSnippet && codeSnippet.code.trim() ? codeSnippet : undefined,
                    type:
                      codeSnippet && codeSnippet.code.trim()
                        ? 'code'
                        : items.length > 0
                        ? 'checklist'
                        : 'text',
                    updatedAt: Date.now(),
                  };
                  onOpenShareModal(currentDraft);
                }}
                className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                title="Collaborator (Share with friends)"
              >
                <Users className="w-4 h-4" />
              </button>

              {/* Archive */}
              <button
                type="button"
                onClick={() => setIsArchived(!isArchived)}
                className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                title={isArchived ? 'Unarchive' : 'Archive'}
              >
                {isArchived ? (
                  <ArchiveRestore className="w-4 h-4" />
                ) : (
                  <Archive className="w-4 h-4" />
                )}
              </button>

              {/* Labels picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                  title="Labels"
                >
                  <Tag className="w-4 h-4" />
                </button>

                {showLabelPicker && (
                  <div className="absolute left-0 bottom-9 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-30 animate-in fade-in">
                    <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase">
                      Select Labels
                    </div>
                    {labels.map((lbl) => {
                      const isSelected = selectedLabels.includes(lbl.id);
                      return (
                        <button
                          key={lbl.id}
                          type="button"
                          onClick={() => {
                            setSelectedLabels((prev) =>
                              isSelected
                                ? prev.filter((id) => id !== lbl.id)
                                : [...prev, lbl.id]
                            );
                          }}
                          className="w-full px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          <span>{lbl.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Delete Note */}
              <button
                type="button"
                onClick={() => {
                  onMoveToTrash(note.id);
                  onClose();
                }}
                className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                title="Move to Trash"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode('read')}
                className="px-3 py-1.5 border border-black/10 dark:border-white/10 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
              >
                Reading View
              </button>
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="px-4 py-1.5 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={bgUploadRef}
          type="file"
          accept="image/*"
          onChange={handleCustomBgUpload}
          className="hidden"
        />
      </div>

      {/* Lightbox Zoom Overlay for Drawings and Images */}
      {selectedLightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={selectedLightboxImage}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedLightboxImage(null)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              title="Close image view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
