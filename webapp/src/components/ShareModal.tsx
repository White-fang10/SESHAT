import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  X,
  Mail,
  Share2,
  ExternalLink,
  Sparkles,
  Send,
  CloudCheck,
} from 'lucide-react';
import { Note, Collaborator } from '../types/note';
import { User } from 'firebase/auth';

interface ShareModalProps {
  isOpen: boolean;
  note: Note;
  currentUser?: User | null;
  onUpdateCollaborators: (
    noteId: string,
    collaborators: Collaborator[],
    collaboratorEmails: string[]
  ) => void;
  onClose: () => void;
}

/**
 * Generates a direct live collaborative link for a note.
 * Anyone with this link accesses and edits the live note directly in real time.
 */
export function generateShareableLink(note: Note, invitedEmail?: string): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('noteId', note.id);
  if (invitedEmail) {
    url.searchParams.set('invited', invitedEmail.toLowerCase().trim());
  }
  return url.toString();
}

/**
 * Decodes a portable Base64 URL parameter into a Note object
 */
export function decodeShareableNote(base64Str: string): Partial<Note> | null {
  try {
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64Str), (c: string) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse shared note:', err);
    return null;
  }
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  note,
  currentUser,
  onUpdateCollaborators,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('editor');
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const openMailComposer = (targetEmail: string) => {
    const shareLink = generateShareableLink(note, targetEmail);
    const subject = encodeURIComponent(`Shared Note: ${note.title || 'Untitled Note'}`);
    const bodyContent = `Hi,

I shared a note with you on Sesh@ Notes:

"${note.title || 'Untitled Note'}"
${note.content ? `\n"${note.content.slice(0, 150)}${note.content.length > 150 ? '...' : ''}"\n` : ''}
Log in to your Sesh@ account using "${targetEmail}" to view, edit, and collaborate in real-time.
Direct workspace link:
${shareLink}

Best regards!`;

    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${encodeURIComponent(bodyContent)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    if (
      note.collaborators &&
      note.collaborators.some((c) => c.email.toLowerCase() === trimmed)
    ) {
      setErrorMsg('This user is already in the collaborators list');
      return;
    }

    if (currentUser?.email && currentUser.email.toLowerCase() === trimmed) {
      setErrorMsg('You are already the owner of this note');
      return;
    }

    const newCollaborator: Collaborator = {
      email: trimmed,
      role,
      addedAt: Date.now(),
      displayName: trimmed.split('@')[0],
    };

    const updatedCollaborators = [...(note.collaborators || []), newCollaborator];
    const updatedEmails = Array.from(
      new Set([...(note.collaboratorEmails || []), trimmed])
    );

    onUpdateCollaborators(note.id, updatedCollaborators, updatedEmails);

    showToast(`Added ${trimmed}! Note is now synced across devices for their email ID.`);
    setEmail('');
  };

  const handleRemoveCollaborator = (targetEmail: string) => {
    const updatedCollaborators = (note.collaborators || []).filter(
      (c) => c.email.toLowerCase() !== targetEmail.toLowerCase()
    );
    const updatedEmails = (note.collaboratorEmails || []).filter(
      (e) => e.toLowerCase() !== targetEmail.toLowerCase()
    );
    onUpdateCollaborators(note.id, updatedCollaborators, updatedEmails);
    showToast(`Removed access for ${targetEmail}`);
  };

  const handleChangeRole = (targetEmail: string, newRole: 'viewer' | 'editor') => {
    const updatedCollaborators = (note.collaborators || []).map((c) =>
      c.email.toLowerCase() === targetEmail.toLowerCase()
        ? { ...c, role: newRole }
        : c
    );
    const emails = note.collaboratorEmails || [];
    onUpdateCollaborators(note.id, updatedCollaborators, emails);
  };

  const handleCopyLink = () => {
    const shareUrl = generateShareableLink(note);
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    showToast('🟢 Live collaborative link copied! All changes edit in real time.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    const shareUrl = generateShareableLink(note);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Sesh@ Note: ${note.title || 'Untitled'}`,
          text: `Collaborate on this note with me on Sesh@: "${note.title || 'Untitled'}"`,
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const ownerEmail = note.ownerEmail || currentUser?.email || 'You';
  const ownerName = currentUser?.displayName || ownerEmail.split('@')[0] || 'Owner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden">
        {/* Header - Google Keep style */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#FFBF24]/20 rounded-xl text-amber-600 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base font-heading">
                Collaborators
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">
                "{note.title || 'Untitled Note'}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notification toast */}
        {notification && (
          <div className="mt-3 py-2 px-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
            <span className="font-medium truncate">{notification}</span>
          </div>
        )}

        {/* Collaborators List (Google Keep Layout) */}
        <div className="mt-4 space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {/* Note Owner Row */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 truncate mr-2">
              <div className="w-8 h-8 rounded-full bg-[#84A98C] text-white font-bold text-xs flex items-center justify-center shrink-0">
                {ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {ownerName} <span className="text-[11px] text-slate-400 font-normal">(Owner)</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{ownerEmail}</div>
              </div>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-200/50 dark:bg-slate-700 px-2.5 py-0.5 rounded-md shrink-0">
              Owner
            </span>
          </div>

          {/* Invited Collaborators */}
          {(note.collaborators || []).map((c) => (
            <div
              key={c.email}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex items-center gap-2.5 truncate mr-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {c.displayName?.charAt(0).toUpperCase() || c.email.charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {c.displayName || c.email.split('@')[0]}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{c.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <select
                  value={c.role}
                  onChange={(e) => handleChangeRole(c.email, e.target.value as any)}
                  className="text-xs bg-slate-100 dark:bg-slate-700 py-1 px-2 rounded-lg border-none text-slate-700 dark:text-slate-200"
                >
                  <option value="editor">Can edit</option>
                  <option value="viewer">Can view</option>
                </select>

                <button
                  type="button"
                  onClick={() => openMailComposer(c.email)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                  title="Send Email Notice"
                >
                  <Mail className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveCollaborator(c.email)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                  title="Revoke access"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add Collaborator Input (Google Keep Style) */}
        <form onSubmit={handleAddCollaborator} className="mt-4">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            Person or email to share with
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FFBF24]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="px-2.5 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium"
              >
                <option value="editor">Can edit</option>
                <option value="viewer">Can view</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>
          {errorMsg && <p className="text-xs text-rose-500 mt-1">{errorMsg}</p>}
        </form>

        <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#FFBF24] shrink-0" />
          <span>
            Google Keep sync: Entering their email shares the note instantly to their account across PC & mobile.
          </span>
        </p>

        {/* Footer Actions */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#D97706] dark:hover:text-[#FBBF24] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Live Link Copied!</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Live Link</span>
                </>
              )}
            </button>

            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                title="Share via WhatsApp, Telegram, etc."
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share App...</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold rounded-xl transition hover:opacity-90 cursor-pointer"
          >
            Save & Done
          </button>
        </div>
      </div>
    </div>
  );
};
