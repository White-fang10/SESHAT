import React from 'react';
import {
  HardDrive,
  Palette,
  PenTool,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookmarkCheck,
  Users,
  Compass,
} from 'lucide-react';
import { Note } from '../types/note';

interface AboutSeshCardSectionProps {
  note?: Note;
  isDarkMode?: boolean;
  onOpenDetailsModal?: () => void;
}

export const AboutSeshCardSection: React.FC<AboutSeshCardSectionProps> = ({
  isDarkMode = false,
  onOpenDetailsModal,
}) => {
  return (
    <div
      className="my-2.5 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 space-y-3.5 shadow-2xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Brand & Vision Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FFBF24] flex items-center justify-center text-slate-950 font-bold shadow-xs">
            @
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-tight">
              About Sesh@
            </h4>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              Your ideas. Your space.
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Google Drive-Powered
        </span>
      </div>

      {/* The Vision & Purpose */}
      <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
        <p className="font-medium text-slate-900 dark:text-white">
          Sesh@ is a personal notes workspace designed to make capturing ideas simple and expressing them personal.
        </p>
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          From quick thoughts and everyday checklists to hand-drawn sketches, images, and detailed plans, Sesh@ brings everything together in one flexible space. Customize every note with your own backgrounds, colors, typography, and styles to create a workspace that feels uniquely yours.
        </p>
      </div>

      {/* More than just notes - 4 Pillars */}
      <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/80">
        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>More than just notes</span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <PenTool className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                Capture freely:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Write down ideas, create checklists, sketch concepts, and collect images without interrupting your flow.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                Make it yours:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Personalize individual notes with custom backgrounds, colors, fonts, gradients, and reusable styles.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
              <BookmarkCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                Stay organized:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Pin important thoughts, create labels, search your notes, and move between active notes, archives, and completed ideas.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <div className="p-1 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 dark:text-white">
                Create together:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-300 text-[11px]">
                Share selected notes with others and collaborate while keeping control over who can view or edit your content.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Your ideas, wherever you go */}
      <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/80 space-y-1 text-xs">
        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
          <HardDrive className="w-3.5 h-3.5 text-blue-500" />
          <span>Your ideas, wherever you go</span>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
          Designed around Google Drive: store your notes and attachments in your personal Google account. Accessible across devices with zero vendor lock-in.
        </p>
      </div>

      {/* Philosophy & Action Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800/80">
        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
          Designed & Created by Pranesh V
        </span>
        {onOpenDetailsModal && (
          <button
            onClick={onOpenDetailsModal}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer"
          >
            <span>Full Story & Creator Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
