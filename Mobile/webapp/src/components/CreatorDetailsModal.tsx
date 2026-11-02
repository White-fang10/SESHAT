import React, { useState } from 'react';
import {
  GraduationCap,
  Sparkles,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  Phone,
  Code2,
  Award,
  Layers,
  HardDrive,
  Palette,
  PenTool,
  ShieldCheck,
  Check,
  X,
  Copy,
  BookOpen,
  Plus,
} from 'lucide-react';
import { SystemArchitectureDiagram } from './SystemArchitectureDiagram';
import { Note } from '../types/note';

interface CreatorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'creator' | 'about' | 'architecture';
  isDarkMode?: boolean;
  onAddNoteToWorkspace?: (note: Partial<Note>) => void;
}

export const CreatorDetailsModal: React.FC<CreatorDetailsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'creator',
  isDarkMode = false,
  onAddNoteToWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'creator' | 'about' | 'architecture'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [addedNoteKey, setAddedNoteKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleAddCreatorNote = () => {
    if (onAddNoteToWorkspace) {
      onAddNoteToWorkspace({
        title: 'Creator Details — Pranesh V',
        content: `Pranesh V | +91 8807149866 | esppranesh@gmail.com\nLinkedIn: linkedin.com/in/pranesh-v-0451b0314\nGitHub: github.com/White-fang10\n\nInformation Technology undergraduate at V.S.B Engineering College (4th Year; CGPA: 7.93). Hands-on experience in full-stack development, embedded systems, and intelligent application design.\n\nPatents:\n• Space Debris Management System (2024)\n• Hawk AI — Automated Attendance System (2025)\n\nCertifications: NPTEL Java Programming & Big Data Analysis.`,
        type: 'mixed',
        isPinned: true,
        labels: ['lbl-personal'],
      });
      setAddedNoteKey('creator');
      setTimeout(() => setAddedNoteKey(null), 2500);
    }
  };

  const handleAddAboutNote = () => {
    if (onAddNoteToWorkspace) {
      onAddNoteToWorkspace({
        title: 'About Sesh@ — Your ideas. Your space.',
        content: `Sesh@ is a personal notes workspace designed to make capturing ideas simple and expressing them personal.\n\n• Capture freely: Write down ideas, create checklists, sketch concepts, and collect images without interrupting your flow.\n• Make it yours: Personalize individual notes with custom backgrounds, colors, fonts, gradients, and reusable styles.\n• Stay organized: Pin important thoughts, create labels, search your notes, and move between active notes, archives, and completed ideas.\n• Create together: Share selected notes with others and collaborate while keeping control over who can view or edit your content.\n• Your ideas, wherever you go: Designed around Google Drive, allowing you to store notes and attachments in your own Google account with zero vendor lock-in.`,
        type: 'mixed',
        isStarred: true,
        labels: ['lbl-ideas'],
      });
      setAddedNoteKey('about');
      setTimeout(() => setAddedNoteKey(null), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in select-none">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header with Tabs & Close Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FFBF24] to-[#F59E0B] flex items-center justify-center text-slate-950 font-black shadow-md">
              P
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900 dark:text-white leading-tight">
                Creator Details & About Sesh@
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pranesh V &bull; V.S.B Engineering College &bull; Google Drive Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Navigation Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setActiveTab('creator')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'creator'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Creator Profile
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'about'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                About Sesh@
              </button>
              <button
                onClick={() => setActiveTab('architecture')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  activeTab === 'architecture'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Architecture
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto py-5 pr-1 space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* TAB 1: CREATOR DETAILS & RESUME */}
          {activeTab === 'creator' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Creator Bio Banner */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#FEF3C7]/60 via-[#FFFBF2] to-[#FFE4E6]/50 dark:from-slate-800/80 dark:via-slate-900 dark:to-slate-800/60 border border-amber-200/60 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFBF24] via-[#F59E0B] to-[#FCA5A5] flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg ring-4 ring-white/80 dark:ring-slate-800 shrink-0">
                    P
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-xl text-slate-900 dark:text-white">
                        Pranesh V
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-400/40">
                        IT Undergraduate &bull; 4th Year
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                      Full-Stack Development &bull; Embedded Systems &bull; Intelligent Applications
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-500" />
                        V.S.B Engineering College (CGPA: 7.93)
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        +91 8807149866
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <a
                    href="https://github.com/White-fang10"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-xl shadow-xs transition"
                  >
                    <Github className="w-4 h-4" />
                    <span>White-fang10</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
                  </a>
                  <a
                    href="https://linkedin.com/in/pranesh-v-0451b0314"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
                  >
                    <Linkedin className="w-4 h-4" />
                    <span>LinkedIn</span>
                  </a>
                  <a
                    href="mailto:esppranesh@gmail.com"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              {/* Professional Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Professional Summary</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                  Motivated and versatile Information Technology undergraduate in the final year of study, with hands-on experience in full-stack development, embedded systems, and intelligent application design. Proven ability to lead and deliver end-to-end software solutions spanning web platforms, real-time monitoring systems, and AI integrated tools. Adept at translating complex problem statements into scalable, user-centric products. Strong foundation in system design, data structures, and cross-functional collaboration.
                </p>
              </div>

              {/* Education */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4 text-blue-500" />
                  <span>Education</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          V.S.B Engineering College
                        </h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                          B.Tech in Information Technology
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        2023 – 2027
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Karur, Tamil Nadu &bull; <strong>Currently pursuing 4th year; CGPA: 7.93</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                      Relevant Coursework: Data Structures & Algorithms, Database Management Systems, Operating Systems, Computer Networks, Software Engineering, Web Technologies.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                          Veveaham Matric Hr Sec School
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          12th Standard (HSC)
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        2022 – 2023
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Dharapuram, Tamil Nadu &bull; <strong>Score: 78.3%</strong>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 leading-relaxed">
                      Rigorous foundation in mathematics, physics, chemistry, and computer science.
                    </p>
                  </div>
                </div>
              </div>

              {/* Achievements & Patents */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Patents Filed & Achievements</span>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <span>Space Debris Management System</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
                          Patent Filed (2024)
                        </span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Invented and filed an Indian patent for a computational model leveraging orbital tracking algorithms and predictive analytics to identify, catalogue, and mitigate the risk posed by space debris to active satellites and future space missions.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                        <span>Hawk AI — Automated Attendance System</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 dark:bg-blue-900/60 dark:text-blue-200">
                          Patent Filed (2025)
                        </span>
                      </h4>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Filed an Indian patent for a deep learning–based attendance management solution that leverages smart board cameras for real-time facial recognition, eliminating the need for manual roll calls in educational and corporate environments.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <span>NPTEL Certifications</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-200">
                        Certified
                      </span>
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      Completed NPTEL-certified courses in <strong>Java Programming</strong> and <strong>Big Data Analysis</strong>, demonstrating proficiency in industry-relevant technologies.
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Skills */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  <Code2 className="w-4 h-4 text-emerald-500" />
                  <span>Technical Skills</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Languages:</span>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">Python, Java, JavaScript, C, SQL</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Web & Frameworks:</span>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">React.js, Node.js, Express.js, HTML5, CSS3, REST APIs</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">AI Tools:</span>
                    <p className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">ChatGPT, Claude, GitHub Copilot, Cursor, Perplexity</p>
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Domains:</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">Full Stack Development, Embedded Systems, Computer Vision, DSA</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Soft Skills:</span>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px]">Leadership, Creative Problem Solving, Communication, Adaptability, Team Collaboration</p>
                  </div>
                </div>
              </div>

              {/* Add Note Button */}
              {onAddNoteToWorkspace && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleAddCreatorNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {addedNoteKey === 'creator' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Added to Notes!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Creator Profile Note to Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ABOUT SESH@ */}
          {activeTab === 'about' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Hero Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#FEF3C7] via-[#FFFBF2] to-[#FED7AA]/40 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800/80 border border-amber-200/80 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-2xl bg-[#FFBF24] flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
                    @
                  </div>
                  <h1 className="font-heading font-extrabold text-2xl text-slate-950 dark:text-white">
                    About Sesh@
                  </h1>
                </div>
                <h2 className="text-base font-bold text-amber-700 dark:text-amber-400">
                  Your ideas. Your space.
                </h2>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  Sesh@ is a personal notes workspace designed to make capturing ideas simple and expressing them personal.
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  From quick thoughts and everyday checklists to hand-drawn sketches, images, and detailed plans, Sesh@ brings everything together in one flexible space. Customize every note with your own backgrounds, colors, typography, and styles to create a workspace that feels uniquely yours.
                </p>
              </div>

              {/* More than just notes */}
              <div className="space-y-3">
                <h3 className="font-heading font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>More than just notes</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <PenTool className="w-4 h-4 text-amber-500" />
                      <span>Capture freely.</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Write down ideas, create checklists, sketch concepts, and collect images without interrupting your flow.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Palette className="w-4 h-4 text-blue-500" />
                      <span>Make it yours.</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Personalize individual notes with custom backgrounds, colors, fonts, gradients, and reusable styles. Your notes should reflect your ideas, not look identical to everyone else's.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>Stay organized.</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Pin important thoughts, create labels, search your notes, and move between active notes, archives, and completed ideas.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                      <Layers className="w-4 h-4 text-purple-500" />
                      <span>Create together.</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      Share selected notes with others and collaborate while keeping control over who can view or edit your content.
                    </p>
                  </div>
                </div>
              </div>

              {/* Your ideas, wherever you go */}
              <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                  <HardDrive className="w-4 h-4 text-emerald-500" />
                  <span>Your ideas, wherever you go</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sesh@ is designed around Google Drive, allowing you to store your notes and attachments in your own Google account after granting the required permissions. The goal is to make your workspace accessible across devices while keeping your content under your control.
                </p>
              </div>

              {/* Our philosophy */}
              <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Our philosophy</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  We believe productivity doesn't have to be plain, and creativity shouldn't come at the cost of simplicity.
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Your notes are more than information to store. They're ideas to explore, plans to shape, and thoughts worth remembering.
                </p>
                <div className="pt-2">
                  <span className="font-heading font-black text-amber-800 dark:text-amber-300 text-sm tracking-wide">
                    Sesh@ — Your ideas. Your space.
                  </span>
                </div>
              </div>

              {/* Add Note Button */}
              {onAddNoteToWorkspace && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleAddAboutNote}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-950 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {addedNoteKey === 'about' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Added to Notes!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add About Sesh@ Note to Workspace</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM ARCHITECTURE & DEPLOYMENT */}
          {activeTab === 'architecture' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="space-y-2">
                <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                  Sesh@ Google Drive Synchronization Architecture
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Data flow between client React app, Google Drive API v3, and local IndexedDB cache:
                </p>
              </div>

              {/* Render the Architecture Diagram */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <SystemArchitectureDiagram isDarkMode={isDarkMode} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <span>Built by <strong>Pranesh V</strong></span>
            <span>&bull;</span>
            <a
              href="mailto:esppranesh@gmail.com"
              className="text-amber-600 dark:text-amber-400 hover:underline"
            >
              esppranesh@gmail.com
            </a>
            <span>&bull;</span>
            <a
              href="https://github.com/White-fang10"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 dark:text-slate-300 hover:underline flex items-center gap-1"
            >
              <Github className="w-3 h-3" />
              <span>White-fang10</span>
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
