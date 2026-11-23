import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import API from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncProfile = async (user, nameOverride) => {
    if (!user) {
      setUserProfile(null);
      return null;
    }
    try {
      const response = await API.post('/users/profile', {
        name: nameOverride || user.displayName || ''
      });
      setUserProfile(response.data.user);
      return response.data.user;
    } catch (err) {
      console.error('Failed to load user profile:', err);
      const fallback = {
        name: nameOverride || user.displayName || '',
        email: user.email || '',
        travelPreference: 'balanced',
        savedPlaces: []
      };
      setUserProfile(fallback);
      return fallback;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await syncProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await syncProfile(credential.user);
    return credential.user;
  };

  const register = async (name, email, password) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(credential.user, { displayName: name });
    }
    await syncProfile(credential.user, name);
    return credential.user;
  };

  const loginWithGoogle = async () => {
    const credential = await signInWithPopup(auth, googleProvider);
    await syncProfile(credential.user);
    return credential.user;
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const refreshProfile = async () => {
    if (!currentUser) return null;
    return syncProfile(currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        setUserProfile,
        loading,
        login,
        register,
        loginWithGoogle,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
