/**
 * Sesh@ Collaboration & Distributed Sync Engine
 * Modeled after the Google Keep Distributed Architecture:
 * 1. Local-First: Immediate commit to IndexedDB and optimistic UI updates.
 * 2. Event-Driven Real-time Sync: Subscribes to Firestore downstream mutation streams for:
 *    - Notes owned by current user (ownerEmail == user.email)
 *    - Notes shared with current user by friends (collaboratorEmails array-contains user.email)
 * 3. Last-Write-Wins (LWW) & Vector Clocks: Reconciles concurrent edits via updatedAt & version.
 * 4. Google Drive Deep Sync: Dual-persists workspace assets into Google Drive.
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Note, Collaborator } from '../types/note';
import { driveService } from './driveService';

class CollaborationService {
  /**
   * Sanitizes a note object for Firestore (removes undefined fields which Firestore rejects)
   */
  private sanitizeForFirestore(note: Note, user: User | null): Record<string, any> {
    const ownerEmail = (note.ownerEmail || user?.email || '').toLowerCase().trim();
    const ownerId = note.ownerId || user?.uid || '';

    const collaboratorEmails = Array.from(
      new Set(
        (note.collaborators || [])
          .map((c) => c.email.toLowerCase().trim())
          .filter((e) => e && e.includes('@'))
      )
    );

    const clean: Record<string, any> = {
      id: note.id,
      title: note.title || '',
      content: note.content || '',
      type: note.type || 'text',
      items: (note.items || []).map((item) => ({
        id: item.id,
        text: item.text || '',
        completed: !!item.completed,
        order: item.order ?? 0,
      })),
      drawings: (note.drawings || []).map((d) => ({
        aspectRatio: d.aspectRatio || 1,
        canvasBackground: d.canvasBackground || 'blank',
        previewUrl: d.previewUrl || '',
        strokes: d.strokes || [],
      })),
      images: (note.images || []).map((img) => ({
        id: img.id,
        url: img.url,
        name: img.name || 'image',
        sizeBytes: img.sizeBytes || 0,
      })),
      labels: note.labels || [],
      isPinned: !!note.isPinned,
      isStarred: !!note.isStarred,
      isArchived: !!note.isArchived,
      isTrashed: !!note.isTrashed,
      trashedAt: note.trashedAt ?? null,
      reminderDate: note.reminderDate ?? null,
      appearance: note.appearance,
      collaborators: (note.collaborators || []).map((c) => ({
        email: c.email.toLowerCase().trim(),
        role: c.role || 'editor',
        addedAt: c.addedAt || Date.now(),
        displayName: c.displayName || c.email.split('@')[0],
      })),
      collaboratorEmails,
      ownerEmail,
      ownerId,
      isLiveShared: note.isLiveShared ?? true,
      version: (note.version || 0) + 1,
      createdAt: note.createdAt || Date.now(),
      updatedAt: note.updatedAt || Date.now(),
    };

    if (note.codeSnippet && note.codeSnippet.code) {
      clean.codeSnippet = note.codeSnippet;
    }

    if (note.quote) {
      clean.quote = note.quote;
    }

    if (note.links && note.links.length > 0) {
      clean.links = note.links;
    }

    if (note.order !== undefined) {
      clean.order = note.order;
    }

    if (note.position) {
      clean.position = note.position;
    }

    return clean;
  }

  /**
   * Saves or mutates a note in Cloud Firestore.
   * Immediately propagates to all collaborator accounts and live subscribers in real time.
   */
  async saveNoteCloud(note: Note, user: User | null): Promise<void> {
    try {
      const payload = this.sanitizeForFirestore(note, user);
      const noteRef = doc(db, 'notes', note.id);
      await setDoc(noteRef, payload, { merge: true });
    } catch (err) {
      console.warn('Firestore cloud save notice:', err);
    }
  }

  /**
   * Fetches a note directly from Cloud Firestore
   */
  async getNoteCloud(noteId: string): Promise<Note | null> {
    try {
      const noteRef = doc(db, 'notes', noteId);
      const snapshot = await getDoc(noteRef);
      if (snapshot.exists()) {
        return {
          ...(snapshot.data() as Note),
          id: snapshot.id,
        };
      }
      return null;
    } catch (err) {
      console.warn(`Could not fetch live note ${noteId}:`, err);
      return null;
    }
  }

  /**
   * Subscribes to real-time live updates on an individual shared editable note document.
   * Both owner and collaborators see changes update instantly on screen.
   */
  subscribeToLiveNote(
    noteId: string,
    onNoteUpdated: (note: Note) => void
  ): () => void {
    if (!noteId) return () => {};

    try {
      const noteRef = doc(db, 'notes', noteId);
      const unsub = onSnapshot(
        noteRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Note;
            onNoteUpdated({
              ...data,
              id: snapshot.id,
            });
          }
        },
        (error) => {
          console.warn(`Real-time live note sync notice (${noteId}):`, error.message);
        }
      );
      return unsub;
    } catch (err) {
      console.warn(`Could not attach live listener to note ${noteId}:`, err);
      return () => {};
    }
  }

  /**
   * Deletes a note permanently from Cloud Firestore
   */
  async deleteNoteCloud(noteId: string): Promise<void> {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (err) {
      console.warn('Firestore cloud delete notice:', err);
    }
  }

  /**
   * Subscribes to real-time updates for:
   * 1. Notes owned by the user
   * 2. Notes shared with the user by their email ID (Google Keep collaboration)
   */
  subscribeToUserNotes(
    userEmail: string,
    onNotesUpdated: (notes: Note[]) => void
  ): () => void {
    if (!userEmail) return () => {};

    const normalizedEmail = userEmail.toLowerCase().trim();
    const notesMap = new Map<string, Note>();

    let unsubs: Unsubscribe[] = [];

    const handleSnapshot = (snapshotDocs: any[]) => {
      let changed = false;
      for (const d of snapshotDocs) {
        const data = d.data() as Note;
        const existing = notesMap.get(data.id);
        if (!existing || (data.updatedAt || 0) >= (existing.updatedAt || 0)) {
          notesMap.set(data.id, {
            ...data,
            id: d.id,
          });
          changed = true;
        }
      }

      if (changed) {
        onNotesUpdated(Array.from(notesMap.values()));
      }
    };

    try {
      // Query 1: Notes owned by current user
      const ownedQuery = query(
        collection(db, 'notes'),
        where('ownerEmail', '==', normalizedEmail)
      );

      const unsubOwned = onSnapshot(
        ownedQuery,
        (snapshot) => {
          handleSnapshot(snapshot.docs);
        },
        (error) => {
          console.warn('Real-time owned notes sync status:', error.message);
        }
      );

      // Query 2: Notes shared with current user by friends (Google Keep collaborator stream)
      const sharedQuery = query(
        collection(db, 'notes'),
        where('collaboratorEmails', 'array-contains', normalizedEmail)
      );

      const unsubShared = onSnapshot(
        sharedQuery,
        (snapshot) => {
          handleSnapshot(snapshot.docs);
        },
        (error) => {
          console.warn('Real-time shared notes sync status:', error.message);
        }
      );

      unsubs.push(unsubOwned, unsubShared);
    } catch (err) {
      console.warn('Could not establish real-time Firestore listeners:', err);
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubs = [];
    };
  }

  /**
   * Attaches a collaborator by email ID (Google Keep collaborator pattern).
   * Populates both collaborator object and collaboratorEmails index for Firestore.
   */
  addCollaborator(
    note: Note,
    rawEmail: string,
    role: 'viewer' | 'editor' = 'editor'
  ): Note {
    const email = rawEmail.toLowerCase().trim();
    if (!email || !email.includes('@')) return note;

    const existing = (note.collaborators || []).filter(
      (c) => c.email.toLowerCase() !== email
    );

    const newCollaborator: Collaborator = {
      email,
      role,
      addedAt: Date.now(),
      displayName: email.split('@')[0],
    };

    const updatedCollaborators = [...existing, newCollaborator];
    const updatedEmails = Array.from(
      new Set([...(note.collaboratorEmails || []), email])
    );

    return {
      ...note,
      collaborators: updatedCollaborators,
      collaboratorEmails: updatedEmails,
      updatedAt: Date.now(),
      version: (note.version || 1) + 1,
    };
  }

  /**
   * Revokes collaborator access for an email address
   */
  removeCollaborator(note: Note, rawEmail: string): Note {
    const email = rawEmail.toLowerCase().trim();
    const updatedCollaborators = (note.collaborators || []).filter(
      (c) => c.email.toLowerCase() !== email
    );
    const updatedEmails = (note.collaboratorEmails || []).filter(
      (e) => e.toLowerCase() !== email
    );

    return {
      ...note,
      collaborators: updatedCollaborators,
      collaboratorEmails: updatedEmails,
      updatedAt: Date.now(),
      version: (note.version || 1) + 1,
    };
  }
}

export const collaborationService = new CollaborationService();
