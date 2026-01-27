import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  browserLocalPersistence,
  setPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import app, { db } from '../config/firebase'; // Ensure app is initialized

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: 'admin' | 'user';
  status: 'pending' | 'approved';
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const auth = getAuth(app);
  
  // Set persistence to browserLocalPersistence - keep login across sessions
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
  }, [auth]);

  // Fetch or create user profile from Firestore
  const fetchUserProfile = async (firebaseUser: FirebaseUser): Promise<UserProfile | null> => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        
        // Update lastActive timestamp
        await updateDoc(userDocRef, {
          lastActive: Timestamp.now()
        });
        
        return {
          uid: firebaseUser.uid,
          email: data.email,
          displayName: data.displayName,
          photoURL: data.photoURL,
          role: data.role,
          status: data.status,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastActive: new Date(),
        };
      } else {
        // Create new user profile (pending approval)
        const now = new Date();
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || 'User',
          photoURL: firebaseUser.photoURL || null, // Fix: Firestore doesn't accept undefined
          role: 'user',
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          lastActive: now,
        };

        await setDoc(userDocRef, {
          ...newProfile,
          createdAt: Timestamp.fromDate(newProfile.createdAt),
          updatedAt: Timestamp.fromDate(newProfile.updatedAt),
          lastActive: Timestamp.fromDate(now),
        });

        return newProfile;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoading(true);
      
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await fetchUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Real-time listener for user profile changes (for pending → approved auto-redirect)
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        setUserProfile(prev => prev ? {
          ...prev,
          status: data.status,
          role: data.role,
          displayName: data.displayName,
          photoURL: data.photoURL,
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } : null);
        
        console.log('Profile updated in real-time:', data.status);
      }
    }, (error) => {
      console.error('Profile listener error:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Google Sign In
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  // Email Sign In
  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email Login Error:', error);
      throw error;
    }
  };

  // Email Sign Up
  const signupWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create profile immediately
      await fetchUserProfile(result.user);
    } catch (error) {
      console.error('Email Signup Error:', error);
      throw error;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    isLoading,
    isAuthenticated: !!user,
    isApproved: userProfile?.status === 'approved',
    isAdmin: userProfile?.role === 'admin',
    loginWithGoogle,
    loginWithEmail,
    signupWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
