import React from 'react';
import {
  GraduationCap,
  Sparkles,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Phone,
  Cpu,
  Brain,
  Code2,
  Award,
  Layers,
  ArrowRight,
  ShieldAlert,
  Camera,
} from 'lucide-react';
import { Note } from '../types/note';

interface CreatorCardSectionProps {
  note?: Note;
  isDarkMode?: boolean;
  onOpenDetailsModal?: () => void;
}

export const CreatorCardSection: React.FC<CreatorCardSectionProps> = ({
  isDarkMode = false,
  onOpenDetailsModal,
}) => {
  return (
    <div
      className="my-2.5 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm p-4 space-y-3.5 shadow-2xs"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Profile Header */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FFBF24] via-[#F59E0B] to-[#FCA5A5] flex items-center justify-center text-slate-950 font-black text-xl shadow-md ring-2 ring-white/60 dark:ring-slate-800/80">
            P
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white leading-tight">
              Pranesh V
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#FFBF24]/20 text-amber-800 dark:text-amber-300 border border-amber-300/40 dark:border-amber-500/30">
              Creator
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50">
              Final Year IT &bull; CGPA 7.93
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
            Full-Stack Development &bull; Embedded Systems &bull; Intelligent Applications
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            <GraduationCap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">V.S.B Engineering College, Karur (2023–2027)</span>
          </div>
        </div>
      </div>

      {/* Focus & Domain Badges */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 font-medium flex items-center gap-1">
          <Code2 className="w-3 h-3 text-blue-500" />
          Full-Stack Web & Cloud
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-medium flex items-center gap-1">
          <Cpu className="w-3 h-3 text-emerald-500" />
          Embedded Systems
        </span>
        <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60 font-medium flex items-center gap-1">
          <Brain className="w-3 h-3 text-purple-500" />
          Computer Vision & AI
        </span>
      </div>

      {/* Patents & Key Achievements */}
      <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-2.5 space-y-2 border border-slate-200/60 dark:border-slate-800/80 text-xs">
        <div className="font-semibold text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-500" />
          <span>Patents & Achievements</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <span>🛰️ Space Debris Management System</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Patent 2024
                </span>
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-snug">
                Orbital tracking algorithms and predictive analytics to catalog and mitigate space debris hazards.
              </p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                <span>📷 Hawk AI — Automated Attendance</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Patent 2025
                </span>
              </span>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-snug">
                Deep learning & smart board cameras for real-time facial recognition attendance management.
              </p>
            </div>
          </div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                📜 NPTEL Certifications:
              </span>{' '}
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                Java Programming & Big Data Analysis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack Pills */}
      <div>
        <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-1 flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          <span>Languages & Frameworks</span>
        </div>
        <div className="flex flex-wrap gap-1 font-mono text-[10px]">
          {['Python', 'Java', 'JavaScript', 'C', 'SQL', 'React.js', 'Node.js', 'Express.js', 'REST APIs', 'HTML5/CSS3'].map(
            (tech) => (
              <span
                key={tech}
                className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/40 dark:border-slate-700/50"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </div>

      {/* Direct Social Links & Action */}
      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-200/60 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/White-fang10"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
            title="GitHub: White-fang10"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://linkedin.com/in/pranesh-v-0451b0314"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-300 transition"
            title="LinkedIn: pranesh-v-0451b0314"
          >
            <Linkedin className="w-3.5 h-3.5" />
          </a>
          <a
            href="mailto:esppranesh@gmail.com"
            className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 transition"
            title="Email: esppranesh@gmail.com"
          >
            <Mail className="w-3.5 h-3.5" />
          </a>
          <a
            href="tel:+918807149866"
            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 transition"
            title="Phone: +91 8807149866"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        </div>

        {onOpenDetailsModal && (
          <button
            onClick={onOpenDetailsModal}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline cursor-pointer"
          >
            <span>Full Profile & Resume</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
