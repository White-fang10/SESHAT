import React, { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  Sun,
  Moon,
  LayoutGrid,
  ChevronsLeft,
  ChevronsRight,
  HardDrive,
  RefreshCw,
  LogOut,
  FolderOpen,
  Check,
  Sparkles,
  UserCheck,
  Menu,
  X,
} from 'lucide-react';
import { SyncState, WorkspaceSettings } from '../types/note';
import { DriveQuotaInfo } from '../services/driveService';
import { User } from 'firebase/auth';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  syncState: SyncState;
  syncError?: string;
  onManualSync: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  settings: WorkspaceSettings;
  onUpdateSettings: (s: Partial<WorkspaceSettings>) => void;
  driveQuota: DriveQuotaInfo | null;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenSettings: () => void;
  onOpenDeployment: () => void;
  onOpenConnectDrive?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  syncState,
  syncError,
  onManualSync,
  searchQuery,
  onSearchChange,
  settings,
  onUpdateSettings,
  driveQuota,
  onToggleSidebar,
  isSidebarOpen,
  onOpenSettings,
  onOpenDeployment,
  onOpenConnectDrive,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAppsMenu, setShowAppsMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const isDarkMode = settings.theme === 'dark';

  return (
    <>
      <header className="sticky top-0 z-30 h-16 bg-[#FFFBF2] dark:bg-[#0B111E] border-b border-slate-200/60 dark:border-slate-800/80 px-3.5 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
        {/* Left: Mobile Drawer Hamburger / Desktop Collapse Toggle & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile hamburger menu button */}
          <button
            onClick={onToggleSidebar}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/60 md:hidden transition cursor-pointer"
            title="Open navigation menu"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => {
              onSearchChange('');
              setShowMobileSearch(false);
            }}
            title="Sesh@ Notes Workspace"
          >
            {/* Reactive Logo */}
            <img
              key={isDarkMode ? 'dark-logo' : 'light-logo'}
              src={isDarkMode ? '/logo-dark.svg' : '/logo.svg'}
              alt="Sesh@"
              className="h-8 sm:h-10 w-auto object-contain max-w-[130px] sm:max-w-[180px] select-none transition-all duration-150"
            />
          </div>

          {/* Desktop Sidebar Collapse Toggle « / » (Preserved for PC) */}
          <button
            onClick={onToggleSidebar}
            className="hidden md:inline-flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition ml-1 cursor-pointer"
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? (
              <ChevronsLeft className="w-4 h-4" />
            ) : (
              <ChevronsRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Center: Search Bar matching reference for Desktop (hidden on mobile, uses slide-down bar instead) */}
        <div className="hidden md:flex flex-1 max-w-2xl relative mx-2">
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search notes, labels, or anything..."
              className="w-full pl-11 pr-11 py-2.5 bg-white/90 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400/90 focus:outline-none focus:ring-2 focus:ring-[#FFBF24]/60 shadow-2xs transition"
            />

            <button
              type="button"
              className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Filter options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Search Toggle (Mobile), Theme Toggle, App Switcher, User Avatar */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Search notes"
          >
            <Search className="w-5 h-5" />
          </button>
        {/* If Guest/Not Connected, Show Connect Drive button */}
        {!user && onOpenConnectDrive && (
          <button
            onClick={onOpenConnectDrive}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFBF24] hover:bg-[#F59E0B] text-slate-900 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            title="Connect Google Drive to sync notes"
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Connect Drive</span>
          </button>
        )}

        {/* Sun/Moon Toggle */}
        <button
          onClick={() =>
            onUpdateSettings({ theme: isDarkMode ? 'light' : 'dark' })
          }
          className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={isDarkMode ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-[#FFBF24]" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600 hover:text-slate-900" />
          )}
        </button>

        {/* 3x3 Apps / Tools Grid Icon */}
        <div className="relative">
          <button
            onClick={() => setShowAppsMenu(!showAppsMenu)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Sesh@ Tools & Details"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>

          {showAppsMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2 z-40 animate-in fade-in">
              <button
                onClick={() => {
                  setShowAppsMenu(false);
                  onOpenDeployment();
                }}
                className="w-full px-3 py-2 text-xs flex items-center gap-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-900 dark:text-amber-300 font-semibold"
              >
                <Sparkles className="w-4 h-4 text-[#FFBF24]" />
                <span>Creator Details & About Sesh@</span>
              </button>
              <button
                onClick={() => {
                  setShowAppsMenu(false);
                  onManualSync();
                }}
                className="w-full px-3 py-2 text-xs flex items-center gap-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <RefreshCw className="w-4 h-4 text-[#F59E0B]" />
                <span>Sync with Google Drive</span>
              </button>
              <button
                onClick={() => {
                  setShowAppsMenu(false);
                  onOpenSettings();
                }}
                className="w-full px-3 py-2 text-xs flex items-center gap-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <FolderOpen className="w-4 h-4 text-slate-400" />
                <span>Workspace Settings</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Avatar with letter 'P' in peach circle */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 rounded-full bg-[#FCA5A5] text-white font-bold text-sm flex items-center justify-center hover:ring-2 hover:ring-[#FFBF24] transition shadow-xs cursor-pointer"
            title={user?.email || 'User Profile & Creator Details'}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{user?.displayName?.charAt(0).toUpperCase() || 'P'}</span>
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-10 h-10 rounded-full bg-[#FCA5A5] text-white font-bold text-base flex items-center justify-center">
                  {user?.displayName?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="overflow-hidden">
                  <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {user?.displayName || (user ? 'Pranesh' : 'Pranesh V')}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email || 'esppranesh@gmail.com'}
                  </div>
                  <div
                    className={`mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                      user
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                    }`}
                  >
                    {user ? 'Google Drive Connected' : 'Local Storage Mode'}
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenDeployment();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl flex items-center gap-2 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FFBF24]" />
                  <span>Creator Details & Story</span>
                </button>
                {!user && onOpenConnectDrive && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenConnectDrive();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white bg-[#FFBF24]/20 hover:bg-[#FFBF24]/30 rounded-xl flex items-center gap-2 transition"
                  >
                    <HardDrive className="w-4 h-4 text-[#F59E0B]" />
                    <span>Connect Google Drive</span>
                  </button>
                )}
                {user && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onManualSync();
                    }}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-400" />
                    <span>Sync Google Drive</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenSettings();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl flex items-center gap-2 transition"
                >
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  <span>Workspace Preferences</span>
                </button>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

    {/* Mobile Search Dropdown Bar */}
    {showMobileSearch && (
      <div className="md:hidden sticky top-16 z-25 bg-[#FFFBF2] dark:bg-[#0B111E] border-b border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 shadow-sm animate-in slide-in-from-top-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes, tags, checklists..."
            className="w-full pl-10 pr-9 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FFBF24]"
          />
          <button
            type="button"
            onClick={() => {
              if (searchQuery) onSearchChange('');
              else setShowMobileSearch(false);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )}
  </>
  );
};
