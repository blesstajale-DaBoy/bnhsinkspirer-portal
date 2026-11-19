import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  OperationType,
  buildFirestoreErrorInfo,
} from '../lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import {
  EditorialRoleId,
  EditorialRoleConfig,
  getEditorialRoleConfig,
  hashRolePassword,
} from '../utils/editorialRoles';

export type UserRole = 'adviser' | 'editor' | 'contributor' | 'reader';

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  editorialRoleId?: EditorialRoleId;
  designation?: string;
  department?: string;
  photoURL?: string | null;
}

interface RoleCredentialEntry {
  passwordHash: string;
  updatedAt: string;
}

type RoleCredentialsMap = Partial<Record<EditorialRoleId, RoleCredentialEntry>>;

interface LoginWithEditorialRoleOptions {
  staffName?: string;
  activeAdviser?: {
    name?: string;
    email?: string;
    designation?: string;
    department?: string;
    photoUrl?: string | null;
    pinCode?: string;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: AuthUserProfile | null;
  activeRoleConfig: EditorialRoleConfig | null;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, role?: UserRole) => Promise<void>;
  loginWithEditorialRole: (
    roleId: EditorialRoleId,
    password: string,
    options?: LoginWithEditorialRoleOptions
  ) => Promise<void>;
  changeOwnRolePassword: (
    currentPassword: string,
    newPassword: string,
    activeAdviserPin?: string
  ) => Promise<void>;
  hasCustomPassword: (roleId: EditorialRoleId) => boolean;
  loginAsAdviserDemo: (customAdviser?: {
    name?: string;
    email?: string;
    designation?: string;
    department?: string;
    photoUrl?: string | null;
  }) => void;
  updateActiveAdviserSession: (adviser: {
    name: string;
    email: string;
    designation: string;
    department: string;
    photoUrl?: string | null;
  }) => void;
  loginAsEditorDemo: () => void;
  logout: () => Promise<void>;
  isAuthorizedStaff: boolean;
  isAdviser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_STORAGE_KEY = 'the_inkspirer_demo_auth_v1';
const ACTIVE_ADVISER_STORAGE_KEY = 'the_inkspirer_active_adviser_v1';
const ROLE_CREDENTIALS_STORAGE_KEY = 'the_inkspirer_role_credentials_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AuthUserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [roleCredentials, setRoleCredentials] = useState<RoleCredentialsMap>(() => {
    try {
      const stored = localStorage.getItem(ROLE_CREDENTIALS_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as RoleCredentialsMap) : {};
    } catch {
      return {};
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sync hashed editorial role passwords in real time via Firestore (Preview <-> Published Live)
  useEffect(() => {
    const credDocRef = doc(db, 'publicationSettings', 'editorialRoleCredentials');
    const unsubscribe = onSnapshot(
      credDocRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data() as Record<string, any>;
        const nextMap: RoleCredentialsMap = {};
        Object.keys(data).forEach((key) => {
          const entry = data[key];
          if (entry && typeof entry.passwordHash === 'string') {
            nextMap[key as EditorialRoleId] = {
              passwordHash: entry.passwordHash,
              updatedAt: typeof entry.updatedAt === 'string' ? entry.updatedAt : '',
            };
          }
        });
        setRoleCredentials(nextMap);
        try {
          localStorage.setItem(ROLE_CREDENTIALS_STORAGE_KEY, JSON.stringify(nextMap));
        } catch {
          // ignore
        }
      },
      (error) => {
        const errInfo = buildFirestoreErrorInfo(
          error,
          OperationType.GET,
          'publicationSettings/editorialRoleCredentials'
        );
        console.warn('Role credentials sync warning:', JSON.stringify(errInfo));
      }
    );

    return () => unsubscribe();
  }, []);

  // Sync Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const data = snap.data();
            const resolvedRole = (data.role as UserRole) || 'editor';
            const resolvedEditorialRoleId: EditorialRoleId =
              data.editorialRoleId ||
              (resolvedRole === 'adviser' ? 'publication-adviser' : 'editor-in-chief');
            const profile: AuthUserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: data.displayName || firebaseUser.displayName || 'Authorized Editor',
              role: resolvedRole,
              editorialRoleId: resolvedEditorialRoleId,
              designation: data.designation || 'Campus Editor',
              department: data.department || 'The Inkspirer Editorial Board',
              photoURL: firebaseUser.photoURL || null,
            };
            setUserProfile(profile);
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(profile));
          } else {
            // First time registration / Google Sign-in: grant adviser or editor staff role
            let storedAdviserEmail = '';
            try {
              const rawAdviser = localStorage.getItem(ACTIVE_ADVISER_STORAGE_KEY);
              if (rawAdviser) {
                const parsed = JSON.parse(rawAdviser);
                if (typeof parsed?.email === 'string') {
                  storedAdviserEmail = parsed.email.toLowerCase();
                }
              }
            } catch {
              // ignore
            }
            const userEmailLower = (firebaseUser.email || '').toLowerCase();
            const isAdviserEmail =
              (storedAdviserEmail && userEmailLower === storedAdviserEmail) ||
              userEmailLower.includes('adviser') ||
              userEmailLower.includes('reyes');
            const defaultRole: UserRole = isAdviserEmail ? 'adviser' : 'editor';
            const defaultEditorialRoleId: EditorialRoleId = isAdviserEmail
              ? 'publication-adviser'
              : 'editor-in-chief';
            const newProfile: AuthUserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName:
                firebaseUser.displayName ||
                (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Staff Editor'),
              role: defaultRole,
              editorialRoleId: defaultEditorialRoleId,
              designation: isAdviserEmail ? 'Publication Adviser' : 'Editor-in-Chief',
              department: 'The Inkspirer Publication Staff',
              photoURL: firebaseUser.photoURL || null,
            };

            try {
              await setDoc(userDocRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
              });
            } catch (writeErr) {
              const errInfo = buildFirestoreErrorInfo(
                writeErr,
                OperationType.WRITE,
                `users/${firebaseUser.uid}`
              );
              console.warn('Firestore user profile write warning:', JSON.stringify(errInfo));
            }

            setUserProfile(newProfile);
            localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newProfile));
          }
        } catch (e) {
          const errInfo = buildFirestoreErrorInfo(
            e,
            OperationType.GET,
            `users/${firebaseUser.uid}`
          );
          console.warn('Error fetching user profile:', JSON.stringify(errInfo));
          const fallbackProfile: AuthUserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Authenticated Editor',
            role: 'editor',
            editorialRoleId: 'editor-in-chief',
            designation: 'Editorial Board Staff',
            department: 'The Inkspirer Publication Staff',
            photoURL: firebaseUser.photoURL || null,
          };
          setUserProfile(fallbackProfile);
          localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fallbackProfile));
        }
      } else {
        const demoStored = localStorage.getItem(DEMO_STORAGE_KEY);
        if (!demoStored) {
          setUserProfile(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const verifyRolePassword = async (
    roleId: EditorialRoleId,
    candidatePassword: string,
    activeAdviserPin?: string
  ): Promise<boolean> => {
    const roleConfig = getEditorialRoleConfig(roleId);
    if (!roleConfig) return false;

    const trimmed = candidatePassword.trim();
    if (!trimmed) return false;

    const customEntry = roleCredentials[roleId];
    if (customEntry?.passwordHash) {
      const candidateHash = await hashRolePassword(roleId, trimmed);
      return candidateHash === customEntry.passwordHash;
    }

    // Check role's default password
    if (trimmed === roleConfig.defaultPassword) {
      return true;
    }

    // For Publication Adviser (when no custom role password is set), also accept active adviser PIN / 1991
    if (roleId === 'publication-adviser') {
      const validPin = (activeAdviserPin || '1991').trim();
      if (trimmed === validPin || trimmed === '1991') {
        return true;
      }
    }

    return false;
  };

  const hasCustomPassword = (roleId: EditorialRoleId): boolean => {
    return Boolean(roleCredentials[roleId]?.passwordHash);
  };

  const loginWithEditorialRole = async (
    roleId: EditorialRoleId,
    password: string,
    options?: LoginWithEditorialRoleOptions
  ) => {
    const roleConfig = getEditorialRoleConfig(roleId);
    if (!roleConfig) {
      throw new Error('Selected editorial role is invalid.');
    }

    const isValid = await verifyRolePassword(
      roleId,
      password,
      options?.activeAdviser?.pinCode
    );

    if (!isValid) {
      throw new Error(
        `Incorrect password for ${roleConfig.title}. Please check your credentials and try again.`
      );
    }

    const customName = options?.staffName?.trim();
    let displayName = customName || roleConfig.title;
    let email = `${roleId}@inkspirer.bnhs.edu.ph`;
    let designation = roleConfig.title;
    let department = roleConfig.department;
    let photoURL: string | null = null;

    if (roleId === 'publication-adviser') {
      let storedAdviser: {
        name?: string;
        email?: string;
        designation?: string;
        department?: string;
        photoUrl?: string | null;
      } | null = null;
      try {
        const raw = localStorage.getItem(ACTIVE_ADVISER_STORAGE_KEY);
        if (raw) storedAdviser = JSON.parse(raw);
      } catch {
        // ignore
      }
      displayName =
        customName ||
        options?.activeAdviser?.name ||
        storedAdviser?.name ||
        'Publication Adviser';
      email =
        options?.activeAdviser?.email ||
        storedAdviser?.email ||
        'adviser@bnhs.deped.edu.ph';
      designation =
        options?.activeAdviser?.designation ||
        storedAdviser?.designation ||
        'Publication Adviser';
      department =
        options?.activeAdviser?.department ||
        storedAdviser?.department ||
        roleConfig.department;
      photoURL = options?.activeAdviser?.photoUrl ?? storedAdviser?.photoUrl ?? null;
    }

    const profile: AuthUserProfile = {
      uid: `role-${roleId}`,
      email,
      displayName,
      role: roleConfig.authRole,
      editorialRoleId: roleId,
      designation,
      department,
      photoURL,
    };

    setUserProfile(profile);
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore
    }
  };

  const changeOwnRolePassword = async (
    currentPassword: string,
    newPassword: string,
    activeAdviserPin?: string
  ) => {
    const roleId = userProfile?.editorialRoleId;
    if (!roleId) {
      throw new Error('You must be signed in to an editorial role account to change its password.');
    }

    const trimmedNew = newPassword.trim();
    if (trimmedNew.length < 4) {
      throw new Error('New password must be at least 4 characters long.');
    }
    if (trimmedNew.length > 64) {
      throw new Error('New password must be 64 characters or fewer.');
    }

    const isCurrentValid = await verifyRolePassword(roleId, currentPassword, activeAdviserPin);
    if (!isCurrentValid) {
      throw new Error('Current password is incorrect. Please enter your existing password.');
    }

    const newHash = await hashRolePassword(roleId, trimmedNew);
    const updatedEntry: RoleCredentialEntry = {
      passwordHash: newHash,
      updatedAt: new Date().toISOString(),
    };

    const nextMap: RoleCredentialsMap = {
      ...roleCredentials,
      [roleId]: updatedEntry,
    };
    setRoleCredentials(nextMap);
    try {
      localStorage.setItem(ROLE_CREDENTIALS_STORAGE_KEY, JSON.stringify(nextMap));
    } catch {
      // ignore
    }

    try {
      await setDoc(
        doc(db, 'publicationSettings', 'editorialRoleCredentials'),
        { [roleId]: updatedEntry },
        { merge: true }
      );
    } catch (error) {
      const errInfo = buildFirestoreErrorInfo(
        error,
        OperationType.WRITE,
        'publicationSettings/editorialRoleCredentials'
      );
      console.error('Firestore role password update error:', JSON.stringify(errInfo));
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in popup was closed before completing authentication.');
      }
      if (code === 'auth/popup-blocked') {
        throw new Error(
          'Sign-in popup was blocked by your browser. Please allow popups for this site and try again.'
        );
      }
      if (code === 'auth/network-request-failed') {
        throw new Error(
          'Network error while contacting Firebase Authentication. Please check your connection.'
        );
      }
      throw new Error(err?.message || 'Unable to sign in with your Google account.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole = 'contributor'
  ) => {
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const userDocRef = doc(db, 'users', cred.user.uid);
      const newProfile: AuthUserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: name,
        role,
        editorialRoleId: role === 'adviser' ? 'publication-adviser' : 'staff-writer',
        designation: role === 'adviser' ? 'Publication Adviser' : 'Staff Writer',
        department: 'The Inkspirer',
      };
      await setDoc(userDocRef, {
        ...newProfile,
        createdAt: serverTimestamp(),
      });
      setUserProfile(newProfile);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(newProfile));
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in as Active Publication Adviser
  const loginAsAdviserDemo = (customAdviser?: {
    name?: string;
    email?: string;
    designation?: string;
    department?: string;
    photoUrl?: string | null;
  }) => {
    let storedAdviser: {
      name?: string;
      email?: string;
      designation?: string;
      department?: string;
      photoUrl?: string | null;
    } | null = null;
    try {
      const raw = localStorage.getItem(ACTIVE_ADVISER_STORAGE_KEY);
      if (raw) storedAdviser = JSON.parse(raw);
    } catch {
      // ignore
    }

    const activeName = customAdviser?.name || storedAdviser?.name || 'Mrs. Maria Elena V. Delos Reyes';
    const activeEmail = customAdviser?.email || storedAdviser?.email || 'm.reyes@bnhs.deped.edu.ph';
    const activeDesignation =
      customAdviser?.designation ||
      storedAdviser?.designation ||
      'Publication Adviser · Master Teacher II';
    const activeDepartment =
      customAdviser?.department ||
      storedAdviser?.department ||
      'English Dept. & Editorial Consultant';
    const activePhoto = customAdviser?.photoUrl ?? storedAdviser?.photoUrl ?? null;

    const adviserProfile: AuthUserProfile = {
      uid: `role-publication-adviser`,
      email: activeEmail,
      displayName: activeName,
      role: 'adviser',
      editorialRoleId: 'publication-adviser',
      designation: activeDesignation,
      department: activeDepartment,
      photoURL: activePhoto,
    };
    setUserProfile(adviserProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(adviserProfile));
  };

  const updateActiveAdviserSession = (adviser: {
    name: string;
    email: string;
    designation: string;
    department: string;
    photoUrl?: string | null;
  }) => {
    if (userProfile?.editorialRoleId === 'publication-adviser' || userProfile?.role === 'adviser') {
      const updatedProfile: AuthUserProfile = {
        uid: 'role-publication-adviser',
        email: adviser.email,
        displayName: adviser.name,
        role: 'adviser',
        editorialRoleId: 'publication-adviser',
        designation: adviser.designation,
        department: adviser.department,
        photoURL: adviser.photoUrl ?? null,
      };
      setUserProfile(updatedProfile);
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(updatedProfile));
    }
  };

  // Sign in as Editor-in-Chief
  const loginAsEditorDemo = () => {
    const editorProfile: AuthUserProfile = {
      uid: 'role-editor-in-chief',
      email: 'jc.morales@bnhs.deped.edu.ph',
      displayName: 'John Cedric Morales',
      role: 'editor',
      editorialRoleId: 'editor-in-chief',
      designation: 'Editor-in-Chief · Grade 12 HUMSS',
      department: 'Executive Editorial Board',
      photoURL: null,
    };
    setUserProfile(editorProfile);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(editorProfile));
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setUserProfile(null);
    setCurrentUser(null);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  };

  const activeRoleConfig = useMemo(() => {
    if (!userProfile) return null;
    if (userProfile.editorialRoleId) {
      return getEditorialRoleConfig(userProfile.editorialRoleId);
    }
    return getEditorialRoleConfig(
      userProfile.role === 'adviser' ? 'publication-adviser' : 'editor-in-chief'
    );
  }, [userProfile]);

  const isAuthorizedStaff =
    userProfile?.role === 'adviser' ||
    userProfile?.role === 'editor' ||
    Boolean(userProfile?.editorialRoleId);

  const isAdviser =
    userProfile?.editorialRoleId === 'publication-adviser' || userProfile?.role === 'adviser';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        activeRoleConfig,
        isLoading,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithEditorialRole,
        changeOwnRolePassword,
        hasCustomPassword,
        loginAsAdviserDemo,
        updateActiveAdviserSession,
        loginAsEditorDemo,
        logout,
        isAuthorizedStaff,
        isAdviser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
