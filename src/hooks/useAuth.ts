import { useState, useEffect } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      const demoUser = localStorage.getItem('demo_user');
      if (demoUser) {
        try {
          setUser(JSON.parse(demoUser));
        } catch (e) {
          console.error('Error parsing demo user:', e);
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setFirebaseUser(firebaseUser);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({
              uid: firebaseUser.uid,
              name: userData.name || firebaseUser.displayName || '',
              email: userData.email || firebaseUser.email || '',
              role: userData.role || 'sales',
              active: userData.active !== undefined ? userData.active : true,
              createdAt: userData.createdAt ? userData.createdAt.toDate() : null,
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              role: 'sales',
              active: true,
              createdAt: null,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      const demoUser: User = {
        uid: 'demo-user-' + Date.now(),
        name: 'Demo User',
        email: 'demo@prylogi.com',
        role: 'admin',
        active: true,
        createdAt: new Date(),
      };
      setUser(demoUser);
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      return { success: true };
    }

    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    if (!isFirebaseConfigured) {
      setUser(null);
      localStorage.removeItem('demo_user');
      return { success: true };
    }

    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Error signing out:', error);
      return { success: false, error };
    }
  };

  return {
    user,
    firebaseUser,
    loading,
    signInWithGoogle,
    signOut,
  };
}
