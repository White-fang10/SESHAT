/**
 * Sesh@ - A Highly Customizable, Google Drive-Powered Notes Workspace
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  Note,
  Label,
  AppearancePreset,
  WorkspaceSettings,
  SyncState,
  DrawingData,
  NoteAppearance,
  Collaborator,
} from './types/note';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  connectGoogleDrive,
} from './services/firebase';
import { driveService, DriveQuotaInfo } from './services/driveService';
import { storageService } from './services/storageService';
import { collaborationService } from './services/collaborationService';
import {
  DEFAULT_WORKSPACE_SETTINGS,
  SYSTEM_PRESETS,
  DEFAULT_NOTE_APPEARANCE,
  DEFAULT_REFERENCE_LABELS,
  getRandomNoteAppearance,
} from './constants/presets';

// Components
import { Header } from './components/Header';
import { Sidebar, NavigationTab } from './components/Sidebar';
import { NoteComposer } from './components/NoteComposer';
import { NoteCard } from './components/NoteCard';
import { NoteEditorModal } from './components/NoteEditorModal';
import { DesignStudioModal } from './components/DesignStudioModal';
import { DrawingModal } from './components/DrawingModal';
import { ShareModal, decodeShareableNote } from './components/ShareModal';
import { PresetsModal } from './components/PresetsModal';
import { SettingsModal } from './components/SettingsModal';
import { CreatorDetailsModal } from './components/CreatorDetailsModal';
import { AuthWelcome } from './components/AuthWelcome';
import { GoogleDriveConnectionCard } from './components/GoogleDriveConnectionCard';
import { ConfirmDialog } from './components/ConfirmDialog';

import { FreeboardCanvas } from './components/FreeboardCanvas';

import {
  FileText,
  Trash2,
  LayoutGrid,
  List as ListIcon,
  ChevronDown,
  HardDrive,
  RefreshCw,
  FolderOpen,
  Menu,
  Users,
  Star,
  Plus,
  Check,
  Move,
  Shuffle,
  GripVertical,
} from 'lucide-react';

// Legacy demo starter note IDs to purge from cache or sync
const DEMO_NOTE_IDS = new Set([
  'note_hackathon',
  'note_grocery',
  'note_kodaikanal',
  'note_fitness',
  'note_exam',
  'note_docker',
  'note_books',
  'note_fees',
  'note_about_sesh',
  'note_birthday',
  'note_quote',
  'note_creator',
  'note_workspace',
  'note_arch',
]);

export default function App() {
  // Authentication & User State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('sesh_guest_mode') === 'true'
  );
  const [authError, setAuthError] = useState<string | null>(null);
  const [driveQuota, setDriveQuota] = useState<DriveQuotaInfo | null>(null);

  // App Data State
  const [notes, setNotes] = useState<Note[]>([]);
  const [labels, setLabels] = useState<Label[]>(DEFAULT_REFERENCE_LABELS);
  const [presets, setPresets] = useState<AppearancePreset[]>(SYSTEM_PRESETS);
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_WORKSPACE_SETTINGS);

  // Navigation, Filter Pills, Sorting, Layout
  const [currentTab, setCurrentTab] = useState<NavigationTab>('notes');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'pinned' | 'recent' | 'shared'>('all');
  const [sortBy, setSortBy] = useState<'custom' | 'last_modified' | 'created' | 'title'>('custom');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Drag & Drop Reorder State
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);

  // Sync State
  const [syncState, setSyncState] = useState<SyncState>('synced');
  const [syncError, setSyncError] = useState<string | undefined>();
  const saveTimeoutRef = useRef<any>(null);

  // Modals State
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [designStudioConfig, setDesignStudioConfig] = useState<{
    note?: Note;
    appearance: NoteAppearance;
    onApply: (app: NoteAppearance) => void;
  } | null>(null);
  const [drawingModalConfig, setDrawingModalConfig] = useState<{
    initial?: DrawingData;
    onSave: (d: DrawingData) => void;
  } | null>(null);
  const [shareTargetNote, setShareTargetNote] = useState<Note | null>(null);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeploymentModalOpen, setIsDeploymentModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);

  // Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isDarkMode = settings.theme === 'dark';

  // Sync dark class on document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // 1. Initial Load: Load user's notes and workspace settings (starts clean with 0 starter notes)
  useEffect(() => {
    const loadCachedData = async () => {
      try {
        const [cachedNotes, cachedLabels, cachedPresets, cachedSettings] =
          await Promise.all([
            storageService.getAllNotes(),
            storageService.getLabels(),
            storageService.getPresets(),
            storageService.getWorkspaceSettings(),
          ]);

        // Filter out any legacy demo starter notes so the workspace starts clean and empty
        const cleanedNotes = cachedNotes.filter(
          (n) =>
            !DEMO_NOTE_IDS.has(n.id) &&
            !n.id.startsWith('note_hackathon') &&
            !n.id.startsWith('note_grocery')
        );

        if (cleanedNotes.length !== cachedNotes.length) {
          await storageService.saveNotes(cleanedNotes);
        }

        setNotes(cleanedNotes);

        if (cachedLabels.length > 0) setLabels(cachedLabels);
        if (cachedPresets.length > 0) setPresets(cachedPresets);
        if (cachedSettings) setSettings(cachedSettings);
      } catch (err) {
        console.warn('Error loading notes:', err);
      }
    };

    loadCachedData();
  }, []);

  // 2. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setIsAuthLoading(false);
        if (token) {
          syncWithDrive();
        }
      },
      () => {
        setUser(null);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2b. Real-time Google Keep Collaborative Sync Engine (Firestore Event-Driven Stream)
  // Automatically syncs notes shared with or owned by current user across all devices & accounts
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = collaborationService.subscribeToUserNotes(
      user.email,
      (remoteNotes) => {
        setNotes((prevNotes) => {
          const notesMap = new Map<string, Note>();
          // Index existing local notes
          for (const n of prevNotes) {
            notesMap.set(n.id, n);
          }
          let hasChanges = false;
          // Apply remote notes using Last-Write-Wins (LWW)
          for (const rn of remoteNotes) {
            const existing = notesMap.get(rn.id);
            if (!existing) {
              notesMap.set(rn.id, rn);
              hasChanges = true;
            } else if ((rn.updatedAt || 0) > (existing.updatedAt || 0)) {
              notesMap.set(rn.id, rn);
              hasChanges = true;
            }
          }
          if (!hasChanges) return prevNotes;
          const merged = Array.from(notesMap.values());
          storageService.saveNotes(merged);
          return merged;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.email]);

  // Toast for shared note import
  const [sharedImportToast, setSharedImportToast] = useState<string | null>(null);

  // Check for live shared note in URL (?noteId=...) or legacy (?shared_note=...)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const targetNoteId = params.get('noteId');

    if (targetNoteId) {
      // Allow guest/unauthenticated users to view and collaborate on the live shared note
      setIsGuestMode(true);
      localStorage.setItem('sesh_guest_mode', 'true');

      // Fetch live note from Firestore cloud
      collaborationService.getNoteCloud(targetNoteId).then((liveNote) => {
        if (liveNote) {
          // If user is logged in, attach their email as collaborator if not present
          if (user?.email) {
            const userEmail = user.email.toLowerCase().trim();
            if (
              liveNote.ownerEmail !== userEmail &&
              !liveNote.collaboratorEmails?.includes(userEmail)
            ) {
              const updatedCollabs = [
                ...(liveNote.collaborators || []),
                {
                  email: userEmail,
                  role: 'editor' as const,
                  addedAt: Date.now(),
                  displayName: user.displayName || userEmail.split('@')[0],
                },
              ];
              const updatedEmails = Array.from(
                new Set([...(liveNote.collaboratorEmails || []), userEmail])
              );
              liveNote.collaborators = updatedCollabs;
              liveNote.collaboratorEmails = updatedEmails;
              collaborationService.saveNoteCloud(liveNote, user).catch(console.warn);
            }
          }

          setNotes((prev) => {
            const exists = prev.some((n) => n.id === liveNote.id);
            const updatedList = exists
              ? prev.map((n) => (n.id === liveNote.id ? liveNote : n))
              : [liveNote, ...prev];
            storageService.saveNotes(updatedList);
            return updatedList;
          });

          // Open NoteEditorModal directly so the user can immediately view & live edit the note!
          setEditingNote(liveNote);
          setCurrentTab('shared');
          setSharedImportToast(
            `🟢 Live Shared Note: "${liveNote.title || 'Untitled'}" loaded. Edits sync in real time.`
          );
          setTimeout(() => setSharedImportToast(null), 6000);
        } else {
          setSharedImportToast('Could not load shared note. It may have been removed.');
          setTimeout(() => setSharedImportToast(null), 4000);
        }
      });

      // Attach active real-time listener to live shared note
      const unsubLiveNote = collaborationService.subscribeToLiveNote(
        targetNoteId,
        (updatedLiveNote) => {
          setNotes((prev) => {
            const exists = prev.some((n) => n.id === updatedLiveNote.id);
            const updatedList = exists
              ? prev.map((n) => (n.id === updatedLiveNote.id ? updatedLiveNote : n))
              : [updatedLiveNote, ...prev];
            storageService.saveNotes(updatedList);
            return updatedList;
          });

          setEditingNote((prev) =>
            prev?.id === updatedLiveNote.id ? updatedLiveNote : prev
          );
        }
      );

      // Clean up URL query without reloading
      const cleanPath = window.location.pathname;
      window.history.replaceState({}, document.title, cleanPath);

      return () => {
        unsubLiveNote();
      };
    }

    const sharedData = params.get('shared_note');
    if (sharedData) {
      const imported = decodeShareableNote(sharedData);
      if (imported && imported.id) {
        const fullNote: Note = {
          id: imported.id,
          title: imported.title || 'Shared Note',
          content: imported.content || '',
          type: imported.type || 'text',
          items: imported.items || [],
          drawings: imported.drawings || [],
          images: imported.images || [],
          labels: imported.labels || [],
          isPinned: false,
          isStarred: false,
          isArchived: false,
          isTrashed: false,
          appearance: imported.appearance || DEFAULT_NOTE_APPEARANCE,
          collaborators: imported.collaborators || [
            {
              email: (imported as any).sharedBy || 'friend@example.com',
              role: 'editor',
              addedAt: Date.now(),
              displayName: 'Friend',
            },
          ],
          createdAt: imported.createdAt || Date.now(),
          updatedAt: Date.now(),
          version: (imported.version || 1) + 1,
        };

        setNotes((prev) => {
          const exists = prev.some((n) => n.id === fullNote.id);
          const updatedList = exists
            ? prev.map((n) => (n.id === fullNote.id ? fullNote : n))
            : [fullNote, ...prev];
          storageService.saveNotes(updatedList);
          return updatedList;
        });

        setCurrentTab('shared');
        setSharedImportToast(`Imported shared note: "${fullNote.title}"!`);
        setTimeout(() => setSharedImportToast(null), 5000);

        // Clean up URL query without reloading
        const cleanPath = window.location.pathname;
        window.history.replaceState({}, document.title, cleanPath);

        // Auto-save to user's Drive if connected
        triggerAutoSave(fullNote);
      }
    }
  }, []);

  // 3. Google Drive Multi-Device Synchronization & Reconciliation
  const syncWithDrive = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setSyncState('offline');
        return;
      }

      setSyncState('saving');
      const quota = await driveService.getStorageQuota();
      if (quota) setDriveQuota(quota);

      const { notes: driveNotes } = await driveService.loadAllWorkspaceNotes();

      // Filter out any legacy demo starter notes
      const realDriveNotes = driveNotes.filter(
        (n) =>
          !DEMO_NOTE_IDS.has(n.id) &&
          !n.id.startsWith('note_hackathon') &&
          !n.id.startsWith('note_grocery')
      );

      // Multi-device reconciliation with local notes cache
      const localCached = await storageService.getAllNotes();
      const localReal = localCached.filter(
        (n) =>
          !DEMO_NOTE_IDS.has(n.id) &&
          !n.id.startsWith('note_hackathon') &&
          !n.id.startsWith('note_grocery')
      );

      const notesMap = new Map<string, Note>();
      const notesToUpload: Note[] = [];

      // 1. Index local notes
      for (const ln of localReal) {
        notesMap.set(ln.id, ln);
      }

      // 2. Reconcile with remote Drive notes based on updatedAt / version
      for (const rn of realDriveNotes) {
        const local = notesMap.get(rn.id);
        if (!local) {
          notesMap.set(rn.id, rn);
        } else {
          const remoteTime = rn.updatedAt || 0;
          const localTime = local.updatedAt || 0;
          if (remoteTime >= localTime) {
            notesMap.set(rn.id, rn);
          } else {
            // Local is newer: keep local and push to upload queue to sync remote
            notesToUpload.push(local);
          }
        }
      }

      // 3. Local notes not present in Drive yet -> upload to Drive so other device gets them
      for (const ln of localReal) {
        if (!realDriveNotes.some((rn) => rn.id === ln.id)) {
          notesToUpload.push(ln);
        }
      }

      const mergedNotes = Array.from(notesMap.values());
      setNotes(mergedNotes);
      await storageService.saveNotes(mergedNotes);

      // In background, upload newer or missing notes to Drive
      if (notesToUpload.length > 0) {
        for (const n of notesToUpload) {
          driveService.saveNoteToDrive(n).catch(console.warn);
        }
      }

      // Sync master workspace index (custom presets, labels, settings, and notes index)
      const meta = await driveService.syncWorkspaceMetadata(presets, labels, settings, mergedNotes);
      if (meta.presets && meta.presets.length > 0) {
        setPresets(meta.presets);
        await storageService.saveCustomPresets(meta.presets);
      }
      if (meta.labels && meta.labels.length > 0) {
        setLabels(meta.labels);
        await storageService.saveLabels(meta.labels);
      }

      setSyncState('synced');
      setSyncError(undefined);
    } catch (err: any) {
      console.warn('Drive sync status:', err);
      setSyncState('offline');
      setSyncError('Offline cache active');
    }
  };

  // Cross-device synchronization listeners: visibilitychange, focus, online, and 25s polling
  useEffect(() => {
    if (!user) return;

    const handleSyncTrigger = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncWithDrive();
      }
    };

    const handleFocus = () => {
      if (navigator.onLine) syncWithDrive();
    };

    const handleOnline = () => {
      syncWithDrive();
    };

    document.addEventListener('visibilitychange', handleSyncTrigger);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        syncWithDrive();
      }
    }, 25000);

    return () => {
      document.removeEventListener('visibilitychange', handleSyncTrigger);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      clearInterval(intervalId);
    };
  }, [user]);

  // Google Keep Style Distributed Real-Time Collaboration Listener (Event-driven down stream)
  useEffect(() => {
    if (!user?.email) return;

    const unsubscribe = collaborationService.subscribeToUserNotes(
      user.email,
      (remoteNotes) => {
        setNotes((prevNotes) => {
          const map = new Map<string, Note>();
          for (const n of prevNotes) {
            map.set(n.id, n);
          }
          let hasChanges = false;
          for (const rn of remoteNotes) {
            const existing = map.get(rn.id);
            if (!existing || (rn.updatedAt || 0) >= (existing.updatedAt || 0)) {
              map.set(rn.id, rn);
              hasChanges = true;
            }
          }
          if (hasChanges) {
            const merged = Array.from(map.values());
            storageService.saveNotes(merged);
            return merged;
          }
          return prevNotes;
        });
      }
    );

    return () => unsubscribe();
  }, [user?.email]);

  // Local-first write + Real-time Cloud sync + Debounced Auto-save to Google Drive
  const triggerAutoSave = (noteToSave: Note) => {
    setSyncState('saving');
    // 1. Immediate local write
    storageService.saveNote(noteToSave);

    // 2. Immediate real-time cloud write to Firestore (syncs across collaborators' devices)
    collaborationService.saveNoteCloud(noteToSave, user).catch(console.warn);

    // 3. Debounced Google Drive backup
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          setSyncState('synced');
          return;
        }

        const fileId = await driveService.saveNoteToDrive(noteToSave);
        noteToSave.driveFileId = fileId;
        await storageService.saveNote(noteToSave);
        setSyncState('synced');
      } catch (err) {
        console.warn('Autosave to Drive notice, kept in cloud & local cache:', err);
        setSyncState('synced');
      }
    }, 1200);
  };

  // Auth actions
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        if (res.isDriveConnected) {
          await syncWithDrive();
        } else {
          setSyncState('offline');
          if (res.driveNotice) {
            setSyncError(res.driveNotice);
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleConnectDriveInteractive = async () => {
    try {
      setSyncState('saving');
      const token = await connectGoogleDrive();
      if (token) {
        await syncWithDrive();
      }
    } catch (err: any) {
      setSyncState('offline');
      setSyncError(err.message || 'Could not connect Google Drive');
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setDriveQuota(null);
    setIsGuestMode(false);
    localStorage.removeItem('sesh_guest_mode');
    setNotes([]);
    await storageService.saveNotes([]);
  };

  // CRUD Operations
  const handleCreateNote = (noteData: Partial<Note>) => {
    // If no background specified, assign random pastel background automatically
    const defaultApp = getRandomNoteAppearance(isDarkMode);

    const newNote: Note = {
      id: 'note_' + Date.now() + Math.random().toString(36).substring(2, 6),
      title: noteData.title || '',
      content: noteData.content || '',
      type: noteData.type || 'text',
      items: noteData.items || [],
      drawings: noteData.drawings || [],
      images: noteData.images || [],
      labels: noteData.labels && noteData.labels.length > 0 ? noteData.labels : ['lbl-personal'],
      isPinned: noteData.isPinned || false,
      isStarred: false,
      isArchived: false,
      isTrashed: false,
      appearance: noteData.appearance || defaultApp,
      ownerId: user?.uid || '',
      ownerEmail: (user?.email || '').toLowerCase().trim(),
      collaboratorEmails: (noteData.collaborators || []).map((c) => c.email.toLowerCase().trim()),
      collaborators: noteData.collaborators || [],
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    triggerAutoSave(newNote);
  };

  const handleUpdateNote = (updatedNote: Note) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
    triggerAutoSave(updatedNote);
  };

  const handleUpdateCollaborators = (
    noteId: string,
    collaborators: Collaborator[],
    collaboratorEmails: string[]
  ) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const updated: Note = {
      ...target,
      collaborators,
      collaboratorEmails,
      ownerEmail: target.ownerEmail || (user?.email || '').toLowerCase().trim(),
      ownerId: target.ownerId || user?.uid || '',
      updatedAt: Date.now(),
      version: (target.version || 1) + 1,
    };
    handleUpdateNote(updated);
    if (shareTargetNote?.id === noteId) {
      setShareTargetNote(updated);
    }
  };

  const handleTogglePin = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const updated = { ...target, isPinned: !target.isPinned, updatedAt: Date.now() };
    handleUpdateNote(updated);
  };

  const handleToggleStar = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const updated = { ...target, isStarred: !target.isStarred, updatedAt: Date.now() };
    handleUpdateNote(updated);
  };

  const handleToggleArchive = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const updated = {
      ...target,
      isArchived: !target.isArchived,
      isPinned: false,
      updatedAt: Date.now(),
    };
    handleUpdateNote(updated);
  };

  const handleMoveToTrash = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const updated = {
      ...target,
      isTrashed: true,
      trashedAt: Date.now(),
      isPinned: false,
      updatedAt: Date.now(),
    };
    handleUpdateNote(updated);
  };

  const handleRestoreFromTrash = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const updated = {
      ...target,
      isTrashed: false,
      trashedAt: null,
      updatedAt: Date.now(),
    };
    handleUpdateNote(updated);
  };

  const handlePermanentDelete = (id: string) => {
    const target = notes.find((n) => n.id === id);
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete Note?',
      message: `"${target?.title || 'This note'}" will be deleted from your Google Drive, cloud sync, and local cache. This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        await storageService.deleteNote(id);
        await collaborationService.deleteNoteCloud(id);
        if (target?.driveFileId) {
          try {
            await driveService.deleteNoteFromDrive(target.driveFileId);
          } catch (e) {
            console.warn('Could not delete from Drive:', e);
          }
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleEmptyTrash = () => {
    const trashedNotes = notes.filter((n) => n.isTrashed);
    if (trashedNotes.length === 0) return;

    setConfirmDialog({
      isOpen: true,
      title: `Empty Trash (${trashedNotes.length} notes)?`,
      message:
        'All notes in the trash will be permanently deleted from Google Drive. This action cannot be undone.',
      isDestructive: true,
      onConfirm: async () => {
        setNotes((prev) => prev.filter((n) => !n.isTrashed));
        for (const tn of trashedNotes) {
          await storageService.deleteNote(tn.id);
          await collaborationService.deleteNoteCloud(tn.id);
          if (tn.driveFileId) {
            try {
              await driveService.deleteNoteFromDrive(tn.driveFileId);
            } catch (e) {
              console.warn('Failed to delete note from Drive:', e);
            }
          }
        }
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleDuplicateNote = (id: string) => {
    const target = notes.find((n) => n.id === id);
    if (!target) return;
    const dupe: Note = {
      ...target,
      id: 'note_' + Date.now() + Math.random().toString(36).substring(2, 6),
      title: target.title ? `${target.title} (Copy)` : 'Copy of note',
      driveFileId: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
    };
    setNotes((prev) => [dupe, ...prev]);
    triggerAutoSave(dupe);
  };

  const handleToggleChecklistItem = (noteId: string, itemId: string) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const updatedItems = target.items.map((i) =>
      i.id === itemId ? { ...i, completed: !i.completed } : i
    );
    const updated = { ...target, items: updatedItems, updatedAt: Date.now() };
    handleUpdateNote(updated);
  };

  // Drag and drop reordering handlers
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e: React.DragEvent, noteId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverNoteId !== noteId) {
      setDragOverNoteId(noteId);
    }
  };

  const handleDragLeave = (noteId: string) => {
    if (dragOverNoteId === noteId) {
      setDragOverNoteId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    const sourceNoteId = draggedNoteId || e.dataTransfer.getData('text/plain');
    setDragOverNoteId(null);
    setDraggedNoteId(null);

    if (!sourceNoteId || sourceNoteId === targetNoteId) return;

    setNotes((prev) => {
      const fromIndex = prev.findIndex((n) => n.id === sourceNoteId);
      const toIndex = prev.findIndex((n) => n.id === targetNoteId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);

      const reordered = updated.map((n, idx) => ({
        ...n,
        order: idx,
      }));

      storageService.saveNotes(reordered);
      triggerAutoSave(reordered[toIndex]);
      return reordered;
    });

    setSortBy('custom');
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverNoteId(null);
  };

  // Freeboard / Canvas position handler
  const handleUpdateNotePosition = (id: string, x: number, y: number, rotation?: number) => {
    setNotes((prev) => {
      const updated = prev.map((n) =>
        n.id === id
          ? {
              ...n,
              position: {
                x,
                y,
                rotation: rotation !== undefined ? rotation : n.position?.rotation ?? 0,
              },
              updatedAt: Date.now(),
            }
          : n
      );
      storageService.saveNotes(updated);
      const target = updated.find((n) => n.id === id);
      if (target) {
        triggerAutoSave(target);
      }
      return updated;
    });
  };

  const handleScatterRandomSpots = () => {
    setNotes((prev) => {
      const updated = prev.map((n, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const jitterX = (Math.random() - 0.5) * 80;
        const jitterY = (Math.random() - 0.5) * 60;
        const rot = Math.round((Math.random() * 8 - 4) * 10) / 10;
        const x = Math.max(20, 30 + col * 320 + jitterX);
        const y = Math.max(20, 20 + row * 260 + jitterY);
        return {
          ...n,
          position: { x, y, rotation: rot },
          updatedAt: Date.now(),
        };
      });
      storageService.saveNotes(updated);
      return updated;
    });
  };

  const handleTidyGrid = () => {
    setNotes((prev) => {
      const updated = prev.map((n, idx) => {
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        const x = 30 + col * 315;
        const y = 30 + row * 270;
        return {
          ...n,
          position: { x, y, rotation: 0 },
          order: idx,
          updatedAt: Date.now(),
        };
      });
      storageService.saveNotes(updated);
      return updated;
    });
  };

  // Label Management
  const handleAddLabel = (name: string, color?: string) => {
    const newLbl: Label = {
      id: 'lbl_' + Date.now(),
      name,
      color: color || '#F87171',
      createdAt: Date.now(),
    };
    const updated = [...labels, newLbl];
    setLabels(updated);
    storageService.saveLabels(updated);
  };

  const handleEditLabel = (id: string, name: string) => {
    const updated = labels.map((l) => (l.id === id ? { ...l, name } : l));
    setLabels(updated);
    storageService.saveLabels(updated);
  };

  const handleDeleteLabel = (id: string) => {
    const updated = labels.filter((l) => l.id !== id);
    setLabels(updated);
    storageService.saveLabels(updated);
  };

  // Open Sesh@ Workspace Folder in Google Drive
  const handleOpenWorkspaceFolder = async () => {
    try {
      const url = await driveService.getWorkspaceFolderUrl();
      window.open(url, '_blank');
    } catch {
      window.open('https://drive.google.com', '_blank');
    }
  };

  // Presets
  const handleSavePreset = (name: string, appearance: NoteAppearance) => {
    const newPreset: AppearancePreset = {
      id: 'preset_' + Date.now(),
      name,
      appearance,
      isSystem: false,
      createdAt: Date.now(),
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    storageService.saveCustomPresets(updated);
    driveService.syncWorkspaceMetadata(updated, labels, settings, notes).catch(() => {});
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = presets.filter((p) => p.id !== presetId);
    setPresets(updated);
    storageService.saveCustomPresets(updated);
    driveService.syncWorkspaceMetadata(updated, labels, settings, notes).catch(() => {});
  };

  const handleRenamePreset = (presetId: string, newName: string) => {
    const updated = presets.map((p) => (p.id === presetId ? { ...p, name: newName } : p));
    setPresets(updated);
    storageService.saveCustomPresets(updated);
    driveService.syncWorkspaceMetadata(updated, labels, settings, notes).catch(() => {});
  };

  // Workspace Settings
  const handleUpdateSettings = (patch: Partial<WorkspaceSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    storageService.saveWorkspaceSettings(updated);
    driveService.syncWorkspaceMetadata(presets, labels, updated, notes).catch(() => {});
  };

  // Dynamic Label & Section Counts
  const labelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of labels) counts[l.id] = 0;
    for (const n of notes) {
      if (!n.isTrashed && !n.isArchived) {
        for (const lId of n.labels) {
          counts[lId] = (counts[lId] || 0) + 1;
        }
      }
    }
    return counts;
  }, [notes, labels]);

  const activeNotesCount = notes.filter((n) => !n.isTrashed && !n.isArchived).length;
  const remindersCount = notes.filter((n) => !n.isTrashed && !n.isArchived && (n.reminderDate || n.title.includes('Fees') || n.title.includes('Tasks') || n.title.includes('Birthday'))).length;
  const starredCount = notes.filter((n) => !n.isTrashed && !n.isArchived && n.isStarred).length;
  const sharedCount = notes.filter(
    (n) =>
      !n.isTrashed &&
      !n.isArchived &&
      ((n.collaborators && n.collaborators.length > 0) ||
        (n.collaboratorEmails && n.collaboratorEmails.length > 0))
  ).length;
  const archiveCount = notes.filter((n) => !n.isTrashed && n.isArchived).length;
  const trashCount = notes.filter((n) => n.isTrashed).length;

  // Filter notes by NavigationTab and CategoryFilter
  const displayNotes = useMemo(() => {
    let result = notes.filter((n) => {
      const isSharedNote =
        (n.collaborators && n.collaborators.length > 0) ||
        (n.collaboratorEmails && n.collaboratorEmails.length > 0);

      // Sidebar Tab Filter
      if (currentTab === 'notes') {
        if (n.isTrashed || n.isArchived) return false;
      } else if (currentTab === 'starred') {
        if (n.isTrashed || n.isArchived) return false;
        if (!n.isStarred) return false;
      } else if (currentTab === 'shared') {
        if (n.isTrashed || n.isArchived) return false;
        if (!isSharedNote) return false;
      } else if (currentTab === 'reminders') {
        if (n.isTrashed || n.isArchived) return false;
        if (!n.reminderDate && !n.title.includes('Fees') && !n.title.includes('Tasks') && !n.title.includes('Birthday')) {
          return false;
        }
      } else if (currentTab === 'archive') {
        if (n.isTrashed || !n.isArchived) return false;
      } else if (currentTab === 'trash') {
        if (!n.isTrashed) return false;
      } else if (currentTab.startsWith('label-')) {
        const targetLabelId = currentTab.replace('label-', '');
        if (n.isTrashed || n.isArchived || !n.labels.includes(targetLabelId)) {
          return false;
        }
      }

      // Category Pill Filter (when on main notes tab)
      if (currentTab === 'notes') {
        if (categoryFilter === 'pinned' && !n.isPinned) return false;
        if (categoryFilter === 'shared' && !isSharedNote) return false;
        // 'recent' sorts by updated, handled in sorting
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesItems = n.items.some((i) => i.text.toLowerCase().includes(q));
        const matchesLabels = n.labels.some((lblId) => {
          const l = labels.find((x) => x.id === lblId);
          return l?.name.toLowerCase().includes(q);
        });
        if (!matchesTitle && !matchesContent && !matchesItems && !matchesLabels) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (categoryFilter === 'all' || categoryFilter === 'pinned') {
        // Pinned notes bubble to top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      if (sortBy === 'custom') {
        const orderA = a.order !== undefined ? a.order : 9999;
        const orderB = b.order !== undefined ? b.order : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return b.updatedAt - a.updatedAt;
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'created') {
        return b.createdAt - a.createdAt;
      }
      return b.updatedAt - a.updatedAt;
    });

    return result;
  }, [notes, currentTab, categoryFilter, sortBy, searchQuery, labels]);

  // Google Keep split: Pinned vs Others
  const pinnedDisplayNotes = useMemo(() => {
    return displayNotes.filter((n) => n.isPinned);
  }, [displayNotes]);

  const otherDisplayNotes = useMemo(() => {
    return displayNotes.filter((n) => !n.isPinned);
  }, [displayNotes]);

  const showPinnedSections =
    currentTab === 'notes' &&
    categoryFilter === 'all' &&
    pinnedDisplayNotes.length > 0 &&
    otherDisplayNotes.length > 0;

  // If user is not authenticated, not loading, and not in guest mode, show Sesh@ Welcome page
  if (!user && !isAuthLoading && !isGuestMode) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <AuthWelcome
          onSignIn={handleGoogleSignIn}
          onExploreGuest={() => {
            setNotes([]);
            storageService.saveNotes([]);
            if (typeof window !== 'undefined') {
              localStorage.setItem('sesh_guest_mode', 'true');
            }
            setIsGuestMode(true);
          }}
          isLoading={isAuthLoading}
          error={authError}
          isDarkMode={isDarkMode}
          onToggleTheme={() =>
            handleUpdateSettings({ theme: isDarkMode ? 'light' : 'dark' })
          }
          onOpenDetailsModal={() => setIsDeploymentModalOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
      <div className="bg-[#FFFBF2] dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans transition-colors duration-200">
        {/* Header matching reference */}
        <Header
          user={user}
          onLogout={handleLogout}
          syncState={syncState}
          syncError={syncError}
          onManualSync={syncWithDrive}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          driveQuota={driveQuota}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenDeployment={() => setIsDeploymentModalOpen(true)}
          onOpenConnectDrive={() => setIsStorageModalOpen(true)}
        />

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Functional Sidebar matching reference */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            labels={labels}
            notes={notes}
            onAddLabel={handleAddLabel}
            onEditLabel={handleEditLabel}
            onDeleteLabel={handleDeleteLabel}
            notesCount={activeNotesCount}
            remindersCount={remindersCount}
            starredCount={starredCount}
            sharedCount={sharedCount}
            archiveCount={archiveCount}
            trashCount={trashCount}
            labelCounts={labelCounts}
            isOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            driveQuota={driveQuota}
            onOpenStorageModal={() => setIsStorageModalOpen(true)}
          />

          {/* Main Notes Area */}
          <main className="flex-1 overflow-y-auto px-3.5 sm:px-8 pt-4 sm:pt-6 pb-28 md:pb-8 custom-scrollbar">
            {/* Take a note bar (Composer) */}
            {currentTab === 'notes' && !searchQuery && (
              <NoteComposer
                onSaveNote={handleCreateNote}
                onOpenDrawingModal={(initial, onSave) =>
                  setDrawingModalConfig({
                    initial,
                    onSave: onSave || (() => {}),
                  })
                }
                onOpenDesignStudio={(app, onApply) =>
                  setDesignStudioConfig({ appearance: app, onApply })
                }
                labels={labels}
                isDarkMode={isDarkMode}
              />
            )}

            {/* Filter Pills & View Controls Row matching reference */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
              {/* Category Pills: All Notes, Pinned, Recent, Shared */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all' as const, label: 'All Notes' },
                  { id: 'pinned' as const, label: 'Pinned' },
                  { id: 'recent' as const, label: 'Recent' },
                  { id: 'shared' as const, label: 'Shared' },
                ].map((pill) => {
                  const isActive = categoryFilter === pill.id;
                  return (
                    <button
                      key={pill.id}
                      onClick={() => setCategoryFilter(pill.id)}
                      className={`px-4 py-1.5 rounded-full text-xs transition cursor-pointer ${
                        isActive
                          ? 'bg-[#FFDE8A] dark:bg-[#FBBF24] text-slate-950 font-bold shadow-2xs'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Sort By & View Grid Toggle */}
              <div className="flex items-center gap-3">
                {/* Sort By Dropdown */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="custom">Custom / Draggable</option>
                    <option value="last_modified">Last modified</option>
                    <option value="created">Date created</option>
                    <option value="title">Title A-Z</option>
                  </select>
                </div>

                {/* Grid / Freeboard / List Layout Switcher */}
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl p-1 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
                  <button
                    onClick={() => handleUpdateSettings({ layout: 'masonry' })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      settings.layout === 'masonry' || (!settings.layout && settings.layout !== 'list' && settings.layout !== 'board')
                        ? 'bg-[#FFBF24] text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Grid view: Multi-column responsive layout with drag-to-reorder"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="hidden sm:inline">Grid</span>
                  </button>
                  <button
                    onClick={() => handleUpdateSettings({ layout: 'board' })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      settings.layout === 'board'
                        ? 'bg-[#FFBF24] text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="Freeboard view: Free movable sticky spots like Google Keep"
                  >
                    <Move className="w-4 h-4" />
                    <span className="hidden sm:inline">Board</span>
                  </button>
                  <button
                    onClick={() => handleUpdateSettings({ layout: 'list' })}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                      settings.layout === 'list'
                        ? 'bg-[#FFBF24] text-slate-900 font-bold shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                    title="List view: Single column list"
                  >
                    <ListIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trash View Banner */}
            {currentTab === 'trash' && (
              <div className="max-w-2xl mx-auto mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                <div className="text-xs text-amber-900 dark:text-amber-300 font-medium">
                  Notes in Trash are deleted permanently after 7 days.
                </div>
                {trashCount > 0 && (
                  <button
                    onClick={handleEmptyTrash}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty Trash</span>
                  </button>
                )}
              </div>
            )}

            {/* View Mode 1: Freeboard Canvas (Movable Random Spots like Google Keep) */}
            {settings.layout === 'board' ? (
              <FreeboardCanvas
                notes={displayNotes}
                labels={labels}
                isDarkMode={isDarkMode}
                onUpdateNotePosition={handleUpdateNotePosition}
                onScatterRandomSpots={handleScatterRandomSpots}
                onTidyGrid={handleTidyGrid}
                onTogglePin={handleTogglePin}
                onToggleStar={handleToggleStar}
                onToggleArchive={handleToggleArchive}
                onMoveToTrash={handleMoveToTrash}
                onRestoreFromTrash={handleRestoreFromTrash}
                onPermanentDelete={handlePermanentDelete}
                onDuplicateNote={handleDuplicateNote}
                onOpenDesignStudio={(n) =>
                  setDesignStudioConfig({
                    note: n,
                    appearance: n.appearance,
                    onApply: (app) =>
                      handleUpdateNote({
                        ...n,
                        appearance: app,
                        updatedAt: Date.now(),
                      }),
                  })
                }
                onOpenShareModal={(n) => setShareTargetNote(n)}
                onToggleChecklistItem={handleToggleChecklistItem}
                onEditNote={(n) => setEditingNote(n)}
                onOpenCreatorDetails={() => setIsDeploymentModalOpen(true)}
                isTrashView={currentTab === 'trash'}
              />
            ) : showPinnedSections ? (
              /* View Mode 2: Google Keep Split View (PINNED and OTHERS sections) */
              <div className="max-w-7xl mx-auto space-y-8">
                {/* Pinned Section */}
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1 flex items-center gap-1.5">
                    <span>Pinned</span>
                    <span className="text-xs font-normal text-slate-400">({pinnedDisplayNotes.length})</span>
                  </h2>
                  <div
                    className={
                      settings.layout === 'list'
                        ? 'space-y-3.5 max-w-3xl'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start'
                    }
                  >
                    {pinnedDisplayNotes.map((note) => (
                      <div key={note.id} className="w-full">
                        <NoteCard
                          note={note}
                          labels={labels}
                          isDarkMode={isDarkMode}
                          onTogglePin={handleTogglePin}
                          onToggleStar={handleToggleStar}
                          onToggleArchive={handleToggleArchive}
                          onMoveToTrash={handleMoveToTrash}
                          onRestoreFromTrash={handleRestoreFromTrash}
                          onPermanentDelete={handlePermanentDelete}
                          onDuplicateNote={handleDuplicateNote}
                          onOpenDesignStudio={(n) =>
                            setDesignStudioConfig({
                              note: n,
                              appearance: n.appearance,
                              onApply: (app) =>
                                handleUpdateNote({
                                  ...n,
                                  appearance: app,
                                  updatedAt: Date.now(),
                                }),
                            })
                          }
                          onOpenShareModal={(n) => setShareTargetNote(n)}
                          onToggleChecklistItem={handleToggleChecklistItem}
                          onEditNote={(n) => setEditingNote(n)}
                          onOpenCreatorDetails={() => setIsDeploymentModalOpen(true)}
                          isTrashView={false}
                          isDraggable={true}
                          isDragging={draggedNoteId === note.id}
                          isDragOver={dragOverNoteId === note.id}
                          onDragStart={(e) => handleDragStart(e, note.id)}
                          onDragOver={(e) => handleDragOver(e, note.id)}
                          onDragLeave={() => handleDragLeave(note.id)}
                          onDrop={(e) => handleDrop(e, note.id)}
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Others Section */}
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 px-1 flex items-center gap-1.5">
                    <span>Others</span>
                    <span className="text-xs font-normal text-slate-400">({otherDisplayNotes.length})</span>
                  </h2>
                  <div
                    className={
                      settings.layout === 'list'
                        ? 'space-y-3.5 max-w-3xl'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start'
                    }
                  >
                    {otherDisplayNotes.map((note) => (
                      <div key={note.id} className="w-full">
                        <NoteCard
                          note={note}
                          labels={labels}
                          isDarkMode={isDarkMode}
                          onTogglePin={handleTogglePin}
                          onToggleStar={handleToggleStar}
                          onToggleArchive={handleToggleArchive}
                          onMoveToTrash={handleMoveToTrash}
                          onRestoreFromTrash={handleRestoreFromTrash}
                          onPermanentDelete={handlePermanentDelete}
                          onDuplicateNote={handleDuplicateNote}
                          onOpenDesignStudio={(n) =>
                            setDesignStudioConfig({
                              note: n,
                              appearance: n.appearance,
                              onApply: (app) =>
                                handleUpdateNote({
                                  ...n,
                                  appearance: app,
                                  updatedAt: Date.now(),
                                }),
                            })
                          }
                          onOpenShareModal={(n) => setShareTargetNote(n)}
                          onToggleChecklistItem={handleToggleChecklistItem}
                          onEditNote={(n) => setEditingNote(n)}
                          onOpenCreatorDetails={() => setIsDeploymentModalOpen(true)}
                          isTrashView={false}
                          isDraggable={true}
                          isDragging={draggedNoteId === note.id}
                          isDragOver={dragOverNoteId === note.id}
                          onDragStart={(e) => handleDragStart(e, note.id)}
                          onDragOver={(e) => handleDragOver(e, note.id)}
                          onDragLeave={() => handleDragLeave(note.id)}
                          onDrop={(e) => handleDrop(e, note.id)}
                          onDragEnd={handleDragEnd}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* View Mode 3: Unified Multi-Column Responsive Row-Flowing Grid or List */
              <div
                className={
                  settings.layout === 'list'
                    ? 'max-w-3xl mx-auto space-y-3.5'
                    : 'max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start'
                }
              >
                {displayNotes.map((note) => (
                  <div key={note.id} className="w-full">
                    <NoteCard
                      note={note}
                      labels={labels}
                      isDarkMode={isDarkMode}
                      onTogglePin={handleTogglePin}
                      onToggleStar={handleToggleStar}
                      onToggleArchive={handleToggleArchive}
                      onMoveToTrash={handleMoveToTrash}
                      onRestoreFromTrash={handleRestoreFromTrash}
                      onPermanentDelete={handlePermanentDelete}
                      onDuplicateNote={handleDuplicateNote}
                      onOpenDesignStudio={(n) =>
                        setDesignStudioConfig({
                          note: n,
                          appearance: n.appearance,
                          onApply: (app) =>
                            handleUpdateNote({
                              ...n,
                              appearance: app,
                              updatedAt: Date.now(),
                            }),
                        })
                      }
                      onOpenShareModal={(n) => setShareTargetNote(n)}
                      onToggleChecklistItem={handleToggleChecklistItem}
                      onEditNote={(n) => setEditingNote(n)}
                      onOpenCreatorDetails={() => setIsDeploymentModalOpen(true)}
                      isTrashView={currentTab === 'trash'}
                      isDraggable={currentTab !== 'trash'}
                      isDragging={draggedNoteId === note.id}
                      isDragOver={dragOverNoteId === note.id}
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragOver={(e) => handleDragOver(e, note.id)}
                      onDragLeave={() => handleDragLeave(note.id)}
                      onDrop={(e) => handleDrop(e, note.id)}
                      onDragEnd={handleDragEnd}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {displayNotes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center select-none animate-in fade-in">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-[#F59E0B] flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 opacity-60" />
                </div>
                <h3 className="font-bold text-slate-800 dark:text-white text-base font-heading">
                  {currentTab === 'trash'
                    ? 'Trash is empty'
                    : currentTab === 'archive'
                    ? 'No archived notes'
                    : currentTab === 'starred'
                    ? 'No starred notes'
                    : currentTab === 'reminders'
                    ? 'No upcoming reminders'
                    : searchQuery
                    ? 'No matching notes found'
                    : 'No notes here yet'}
                </h3>
                <p className="mt-1 text-xs text-slate-400 max-w-xs">
                  {searchQuery
                    ? 'Try different search keywords.'
                    : 'Create a note using the composer above!'}
                </p>
              </div>
            )}
          </main>
        </div>

        {/* Floating Toast Notification for Shared Note Import */}
        {sharedImportToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 py-2.5 px-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-top-4">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{sharedImportToast}</span>
          </div>
        )}

        {/* Mobile Bottom Navigation Bar (md:hidden - completely hidden on PC) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFBF2]/95 dark:bg-[#0B111E]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around shadow-lg select-none pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          {/* Notes Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('notes')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              currentTab === 'notes'
                ? 'text-[#D97706] dark:text-[#FBBF24] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <FileText className="w-5 h-5" />
              {activeNotesCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold leading-none">
                  {activeNotesCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Notes</span>
          </button>

          {/* Starred Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('starred')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              currentTab === 'starred'
                ? 'text-[#D97706] dark:text-[#FBBF24] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Star className="w-5 h-5" />
              {starredCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold leading-none">
                  {starredCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Starred</span>
          </button>

          {/* Floating Action Center Button (FAB) -> Quick Create Note */}
          <button
            type="button"
            onClick={() => {
              const newBlankNote: Note = {
                id: 'note_' + Date.now(),
                title: '',
                content: '',
                type: 'text',
                items: [],
                drawings: [],
                images: [],
                labels: [],
                isPinned: false,
                isArchived: false,
                isTrashed: false,
                appearance: getRandomNoteAppearance(isDarkMode),
                collaborators: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                version: 1,
              };
              setEditingNote(newBlankNote);
            }}
            className="w-12 h-12 -mt-5 rounded-full bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-950 flex items-center justify-center shadow-lg transition transform active:scale-95 cursor-pointer ring-4 ring-[#FFFBF2] dark:ring-[#0B111E]"
            title="Create Note"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* Shared Tab */}
          <button
            type="button"
            onClick={() => setCurrentTab('shared')}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              currentTab === 'shared'
                ? 'text-[#D97706] dark:text-[#FBBF24] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5" />
              {sharedCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-blue-500 text-white rounded-full text-[9px] font-bold leading-none">
                  {sharedCount}
                </span>
              )}
            </div>
            <span className="text-[10px]">Shared</span>
          </button>

          {/* Menu Drawer Toggle */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition ${
              isSidebarOpen
                ? 'text-[#D97706] dark:text-[#FBBF24] font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px]">Menu</span>
          </button>
        </nav>

        {/* --- MODALS & DIALOGS --- */}

        {/* Note Editor Modal */}
        {editingNote && (
          <NoteEditorModal
            note={editingNote}
            labels={labels}
            isOpen={!!editingNote}
            onUpdateNote={handleUpdateNote}
            onOpenDrawingModal={(initial, onSave) =>
              setDrawingModalConfig({ initial, onSave: onSave || (() => {}) })
            }
            onOpenDesignStudio={(app, onApply) =>
              setDesignStudioConfig({ appearance: app, onApply })
            }
            onOpenShareModal={(n) => setShareTargetNote(n)}
            onMoveToTrash={handleMoveToTrash}
            onClose={() => setEditingNote(null)}
          />
        )}

        {/* Note Design Studio Modal */}
        {designStudioConfig && (
          <DesignStudioModal
            isOpen={!!designStudioConfig}
            currentAppearance={designStudioConfig.appearance}
            presets={presets}
            onApplyAppearance={designStudioConfig.onApply}
            onSavePreset={handleSavePreset}
            onClose={() => setDesignStudioConfig(null)}
          />
        )}

        {/* Stylus Drawing Canvas Modal */}
        {drawingModalConfig && (
          <DrawingModal
            isOpen={!!drawingModalConfig}
            initialDrawing={drawingModalConfig.initial}
            onSave={drawingModalConfig.onSave}
            onClose={() => setDrawingModalConfig(null)}
          />
        )}

        {/* Share & Collaboration Modal (Google Keep Collaboration) */}
        {shareTargetNote && (
          <ShareModal
            isOpen={!!shareTargetNote}
            note={shareTargetNote}
            currentUser={user}
            onUpdateCollaborators={handleUpdateCollaborators}
            onClose={() => setShareTargetNote(null)}
          />
        )}

        {/* Reusable Presets Modal */}
        {isPresetsModalOpen && (
          <PresetsModal
            isOpen={isPresetsModalOpen}
            presets={presets}
            onDeletePreset={handleDeletePreset}
            onRenamePreset={handleRenamePreset}
            onClose={() => setIsPresetsModalOpen(false)}
          />
        )}

        {/* Workspace Settings Modal */}
        {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onReconcileDrive={syncWithDrive}
            onOpenDriveReview={() => setIsStorageModalOpen(true)}
            onLogout={handleLogout}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}

        {/* Creator Details, Resume & Architecture Modal */}
        {isDeploymentModalOpen && (
          <CreatorDetailsModal
            isOpen={isDeploymentModalOpen}
            onClose={() => setIsDeploymentModalOpen(false)}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Google Drive Connection & Permissions Review Modal */}
        {isStorageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
            <div className="relative w-full max-w-3xl my-auto">
              <button
                onClick={() => setIsStorageModalOpen(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition cursor-pointer shadow-xs"
                title="Close"
              >
                ✕
              </button>
              <GoogleDriveConnectionCard
                isConnected={!!user && syncState !== 'offline'}
                isLoading={syncState === 'saving'}
                error={syncError}
                driveQuota={driveQuota}
                onConnect={handleConnectDriveInteractive}
                onSync={syncWithDrive}
                onOpenFolder={handleOpenWorkspaceFolder}
                onDisconnect={handleLogout}
                variant="modal"
              />
            </div>
          </div>
        )}

        {/* Destructive Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          isDestructive={confirmDialog.isDestructive}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
}
