import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

// 1. Define a strict interface for the User Profile
export interface UserProfile {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'super-dev';
  active: boolean;
  createdAt?: any;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Auth changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      // Listen for real-time Firestore profile changes
      const userRef = doc(db, "users", user.uid);
      
      const unsubscribeSnapshot = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
          setLoading(false); // Only stop loading once we have data
        } else {
          // Profile doesn't exist yet (Waiting for Cloud Function)
          // We stay in the 'loading' state to prevent flashing "Access Denied"
          setProfile(null);
          
          // Optional: Add a timeout to stop loading if profile never appears
          setTimeout(() => {
            setLoading(false);
          }, 5000); 
        }
      }, (err) => {
        console.error("Production Error: Profile sync failed:", err);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  return { profile, loading };
};