import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  LogOut,
  ArrowRight,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  User,
  Briefcase,
  Camera,
  Feather,
  Newspaper,
  Sparkles,
  MessageSquareQuote,
  Trophy,
  ClipboardList,
  BookOpenCheck,
  Crown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PortalAdviserConfig } from '../types';
import {
  EDITORIAL_ROLES,
  EditorialRoleId,
  getEditorialRoleConfig,
} from '../utils/editorialRoles';
import { InkspirerLogo } from './InkspirerLogo';
import { MagicalLoginLamp } from './MagicalLoginLamp';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditorialDesk: () => void;
  activeAdviserConfig: PortalAdviserConfig;
}

const ROLE_ICONS: Record<EditorialRoleId, React.FC<{ className?: string }>> = {
  'publication-adviser': ShieldCheck,
  'editor-in-chief': Crown,
  'associate-editor': BookOpenCheck,
  'managing-editor': ClipboardList,
  'news-editor': Newspaper,
  'features-editor': Sparkles,
  'opinion-editor': MessageSquareQuote,
  'sports-editor': Trophy,
  'chief-photojournalism': Camera,
  'staff-writer': Feather,
};

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  onOpenEditorialDesk,
  activeAdviserConfig,
}) => {
  const {
    userProfile,
    activeRoleConfig,
    isAuthorizedStaff,
    loginWithEditorialRole,
    changeOwnRolePassword,
    hasCustomPassword,
    loginWithGoogle,
    logout,
  } = useAuth();

  // Magical Login Lamp state (starts OFF when opening Login while signed out)
  const [isLampLit, setIsLampLit] = useState(false);

  // Login form state (when signed out)
  const [selectedRoleId, setSelectedRoleId] = useState<EditorialRoleId>('publication-adviser');
  const [password, setPassword] = useState('');
  const [staffName, setStaffName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Change password state (only for currently signed-in account)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showChangePwdText, setShowChangePwdText] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Reset transient fields & extinguish lamp when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLampLit(false);
      setErrorMessage(null);
      setPasswordSuccess(null);
      setPassword('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setShowChangePwdText(false);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedRoleConfig =
    getEditorialRoleConfig(selectedRoleId) || EDITORIAL_ROLES[0];
  const isSelectedRoleCustomPassword = hasCustomPassword(selectedRoleId);

  const handleRoleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password.trim()) {
      setErrorMessage(`Please enter the password for ${selectedRoleConfig.title}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEditorialRole(selectedRoleId, password, {
        staffName: staffName.trim() || undefined,
        activeAdviser: activeAdviserConfig,
      });
      setPassword('');
      setStaffName('');
      onClose();
      onOpenEditorialDesk();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in. Please check your password.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
      onClose();
      onOpenEditorialDesk();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Google Sign-In could not be completed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleChangeOwnPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setPasswordSuccess(null);

    if (!currentPassword.trim() || !newPassword.trim()) {
      setErrorMessage('Please fill in both your current password and new password.');
      return;
    }
    if (newPassword.trim().length < 4) {
      setErrorMessage('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeOwnRolePassword(
        currentPassword,
        newPassword,
        activeAdviserConfig.pinCode
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(
        `Password updated for ${activeRoleConfig?.title || 'your account'} and synced securely.`
      );
      setShowChangePassword(false);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to update password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setShowChangePassword(false);
    setErrorMessage(null);
    setPasswordSuccess(null);
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'ED';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const isSignedIn = Boolean(userProfile && isAuthorizedStaff);
  const modalWidthClass = isSignedIn
    ? 'max-w-lg'
    : isLampLit
    ? 'max-w-5xl'
    : 'max-w-md';

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-login-modal-title"
      onClick={onClose}
    >
      <div
        className={`w-full ${modalWidthClass} ${
          !isSignedIn && !isLampLit
            ? 'bg-[#170307] text-white border-[#D4AF37]/40'
            : 'bg-[#FBF9F5] text-stone-900 border-[#D4AF37]/60'
        } rounded-xl shadow-2xl border overflow-hidden my-auto max-h-[92vh] flex flex-col transition-all duration-500`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Maroon Editorial Modal Header */}
        <div className="bg-[#34070E] border-b border-[#58111A] px-5 sm:px-6 py-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/BNHS_LOGO_29bb7e4c.jpg"
              alt="BNHS Logo"
              className="w-8 h-8 object-contain rounded-full border border-[#D4AF37]/80 shrink-0"
            />
            <InkspirerLogo size="sm" />
            <div>
              <h2
                id="staff-login-modal-title"
                className="font-serif text-base sm:text-lg font-bold text-[#F3C562] leading-tight"
              >
                {isSignedIn
                  ? 'My Editorial Account'
                  : isLampLit
                  ? 'Editorial Board Role Login'
                  : 'The Inkspirer · Magical Login Lamp'}
              </h2>
              <p className="text-[11px] text-stone-300">
                The Inkspirer · Barobo National High School
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close login modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isSignedIn && userProfile ? (
          <div className="p-5 sm:p-6 overflow-y-auto">
            {/* SIGNED-IN VIEW: STRICTLY ISOLATED TO OWN ACCOUNT ONLY */}
            <div className="space-y-5">
              {/* Own Account Identity Card */}
              <div className="bg-white rounded-lg border border-stone-200 p-4 flex items-center gap-3.5 shadow-2xs">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName || 'Staff Avatar'}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#D4AF37] shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#4A0E17] to-[#781B2B] text-[#F3C562] font-bold text-sm flex items-center justify-center border border-[#D4AF37]/50 shrink-0">
                    {getInitials(userProfile.displayName)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-sm text-stone-900 truncate">
                      {userProfile.displayName}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#4A0E17] text-[#F3C562] shrink-0">
                      {activeRoleConfig?.title || userProfile.designation || 'Editorial Staff'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 truncate mt-0.5">
                    {activeRoleConfig?.department || userProfile.department}
                    {activeRoleConfig?.beatScope ? ` · ${activeRoleConfig.beatScope} Beat Only` : ''}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-1">
                    Private role session active — only your assigned desk tasks are visible.
                  </p>
                </div>
              </div>

              {/* Assigned Tasks for This Role Only */}
              {activeRoleConfig && (
                <div className="bg-white rounded-lg border border-stone-200 p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#4A0E17]">
                    <Briefcase className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Your Assigned Tasks ({activeRoleConfig.title})</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-stone-700">
                    {activeRoleConfig.tasksList.map((task, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Change Own Password Form */}
              {activeRoleConfig && (
                <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword((prev) => !prev);
                      setErrorMessage(null);
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-stone-800 hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-[#4A0E17]" />
                      <span>Change My Password ({activeRoleConfig.title})</span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#4A0E17]">
                      {showChangePassword ? 'Hide' : 'Update'}
                    </span>
                  </button>

                  {showChangePassword && (
                    <form
                      onSubmit={handleChangeOwnPassword}
                      className="px-4 pb-4 pt-2 border-t border-stone-100 space-y-3 bg-stone-50/70"
                    >
                      <div>
                        <label
                          htmlFor="own-current-password"
                          className="block text-[11px] font-semibold text-stone-700 mb-1"
                        >
                          Current Password
                        </label>
                        <input
                          id="own-current-password"
                          type={showChangePwdText ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label
                            htmlFor="own-new-password"
                            className="block text-[11px] font-semibold text-stone-700 mb-1"
                          >
                            New Password
                          </label>
                          <input
                            id="own-new-password"
                            type={showChangePwdText ? 'text' : 'password'}
                            required
                            minLength={4}
                            maxLength={64}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 4 characters"
                            className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="own-confirm-password"
                            className="block text-[11px] font-semibold text-stone-700 mb-1"
                          >
                            Confirm New Password
                          </label>
                          <input
                            id="own-confirm-password"
                            type={showChangePwdText ? 'text' : 'password'}
                            required
                            minLength={4}
                            maxLength={64}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter new password"
                            className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37]"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-stone-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={showChangePwdText}
                            onChange={(e) => setShowChangePwdText(e.target.checked)}
                            className="rounded border-stone-300 text-[#4A0E17] focus:ring-[#D4AF37]"
                          />
                          <span>Show passwords</span>
                        </label>

                        <button
                          type="submit"
                          disabled={isChangingPassword}
                          className="px-4 py-1.5 rounded bg-[#4A0E17] hover:bg-[#60121F] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {isChangingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>Save New Password</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Primary Workspace & Sign Out Actions */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenEditorialDesk();
                  }}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#4A0E17] hover:bg-[#60121F] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                  <span>Open My {activeRoleConfig?.title || 'Editorial'} Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full py-2 px-4 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-stone-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        ) : !isLampLit ? (
          /* LAMP OFF STAGE: MAGICAL LOGIN LAMP WITH PULL-STRING SLING SWITCH */
          <div className="bg-linear-to-b from-[#23050B] via-[#170307] to-[#0E0104] overflow-y-auto">
            <MagicalLoginLamp
              isLit={false}
              onToggle={() => setIsLampLit(true)}
            />
          </div>
        ) : (
          /* LAMP LIT STAGE: GLOWING LAMP + ILLUMINATED 10-ROLE EDITORIAL LOGIN */
          <div className="flex flex-col md:flex-row overflow-y-auto flex-1">
            {/* Glowing Study Lamp Column */}
            <div className="md:w-68 lg:w-72 shrink-0 bg-linear-to-b from-[#2D070F] via-[#1D0409] to-[#120205] border-b md:border-b-0 md:border-r border-[#58111A] flex items-center justify-center">
              <MagicalLoginLamp
                isLit={true}
                onToggle={() => setIsLampLit(false)}
                compact
              />
            </div>

            {/* Illuminated Editorial Board Role Login Panel */}
            <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-[#FBF9F5] relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-0 left-0 right-0 h-20 opacity-50"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(243, 197, 98, 0.22) 0%, rgba(251, 249, 245, 0) 100%)',
                }}
              />
              <div className="relative z-10 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#4A0E17]">
                    1. Select Your Editorial Role / Position
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Each position accesses only its own tasks
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EDITORIAL_ROLES.map((role) => {
                    const Icon = ROLE_ICONS[role.id];
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                          setSelectedRoleId(role.id);
                          setErrorMessage(null);
                          setPassword('');
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#4A0E17] text-white border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/50'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-[#4A0E17]/50 hover:bg-stone-50'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#34070E] text-[#F3C562] border border-[#D4AF37]/40'
                              : 'bg-[#4A0E17]/10 text-[#4A0E17]'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-bold truncate ${
                              isSelected ? 'text-[#F3C562]' : 'text-stone-900'
                            }`}
                          >
                            {role.title}
                          </div>
                          <div
                            className={`text-[10px] truncate ${
                              isSelected ? 'text-stone-200' : 'text-stone-500'
                            }`}
                          >
                            {role.beatScope
                              ? `${role.beatScope} Beat Desk`
                              : role.ownArticlesOnly
                              ? 'My Stories & Bio'
                              : role.department}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Role Task Preview & Password Form */}
              <form
                onSubmit={handleRoleLogin}
                className="bg-white rounded-lg border border-stone-200 p-4 sm:p-5 space-y-4 shadow-2xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      2. Sign In to Private Account
                    </div>
                    <h3 className="font-serif text-base font-bold text-[#4A0E17]">
                      {selectedRoleConfig.title}
                    </h3>
                  </div>
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded bg-[#FBF9F5] border border-[#D4AF37]/50 text-[#4A0E17]">
                    {selectedRoleConfig.beatScope
                      ? `${selectedRoleConfig.beatScope} Desk Only`
                      : selectedRoleConfig.ownArticlesOnly
                      ? 'Personal Writer Desk'
                      : `${selectedRoleConfig.allowedTabs.length} Assigned Sections`}
                  </span>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed -mt-1">
                  {selectedRoleConfig.taskSummary}
                </p>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password */}
                  <div>
                    <label
                      htmlFor="role-login-password"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Account Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        id="role-login-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter role password"
                        autoComplete="current-password"
                        className="w-full text-sm pl-9 pr-9 py-2 rounded border border-stone-300 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 cursor-pointer"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Optional Staff Name */}
                  <div>
                    <label
                      htmlFor="role-login-name"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      Your Name <span className="text-stone-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        id="role-login-name"
                        type="text"
                        maxLength={80}
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder={
                          selectedRoleId === 'publication-adviser'
                            ? activeAdviserConfig.name
                            : `e.g., ${selectedRoleConfig.title}`
                        }
                        className="w-full text-sm pl-9 pr-3 py-2 rounded border border-stone-300 bg-stone-50 focus:outline-hidden focus:ring-2 focus:ring-[#D4AF37] focus:border-[#4A0E17]"
                      />
                    </div>
                  </div>
                </div>

                {/* Default password note (only shown while account still uses default password) */}
                <div className="text-[11px] px-3 py-2 rounded bg-[#FBF9F5] border border-stone-200 text-stone-600 flex flex-wrap items-center justify-between gap-2">
                  {isSelectedRoleCustomPassword ? (
                    <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Custom password is set for {selectedRoleConfig.title}.</span>
                    </span>
                  ) : (
                    <span>
                      Default password for <strong>{selectedRoleConfig.title}</strong>:{' '}
                      <code className="px-1.5 py-0.5 rounded bg-stone-200/80 text-[#4A0E17] font-mono font-bold">
                        {selectedRoleConfig.defaultPassword}
                      </code>{' '}
                      <span className="text-stone-500">(you can change it after signing in)</span>
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !password.trim()}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#4A0E17] hover:bg-[#60121F] disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  ) : (
                    <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Verifying Credentials...'
                      : `Sign In as ${selectedRoleConfig.title}`}
                  </span>
                </button>
              </form>

              {/* Firebase Auth Google Sign-In Option */}
              <div className="space-y-3">
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-stone-200" />
                  <span className="mx-3 text-[11px] font-semibold text-stone-500">
                    Or sign in with Firebase Google Auth
                  </span>
                  <div className="flex-grow border-t border-stone-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 shadow-2xs text-xs font-semibold flex items-center justify-center gap-2.5 transition-all disabled:opacity-60 cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#4A0E17]" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span>
                    {isGoogleLoading
                      ? 'Connecting to Google...'
                      : 'Sign in with DepEd / Google Account'}
                  </span>
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
