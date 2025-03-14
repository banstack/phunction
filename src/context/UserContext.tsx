import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from "@/app/firebase";
import { getUserData, UserData } from "@/utils/userData";
import { EventService } from "@/application/services/EventService";
import { FirebaseEventRepository } from "@/infrastructure/repositories/FirebaseEventRepository";
import { Event } from "@/domain/models/Event";
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from "@/app/firebase";

interface UserContextType {
  userData: UserData | null;
  userEvents: Event[];
  attendedEvents: Event[];
  refreshUserData: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const eventService = new EventService(new FirebaseEventRepository());

export function UserProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [attendedEvents, setAttendedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        setIsLoading(true);
        const [userData, createdEvents, attendedEvents] = await Promise.all([
          getUserData(),
          eventService.getUserEvents(userId),
          eventService.getAttendedEvents(userId)
        ]);
        
        setUserData(userData);
        setUserEvents(createdEvents);
        setAttendedEvents(attendedEvents);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to real-time user data updates
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Subscribe to user document changes
    const unsubscribeUser = onSnapshot(doc(db, 'users', userId), (doc) => {
      if (doc.exists()) {
        const newUserData = doc.data() as UserData;
        setUserData(prev => ({
          ...prev,
          ...newUserData
        }));
      }
    });

    // Subscribe to user's events
    const unsubscribeEvents = eventService.subscribeToUserEvents(userId, (events) => {
      setUserEvents(events);
    });

    // Subscribe to user's attended events
    const unsubscribeAttended = eventService.subscribeToAttendedEvents(userId, (events) => {
      setAttendedEvents(events);
    });

    return () => {
      unsubscribeUser();
      unsubscribeEvents();
      unsubscribeAttended();
    };
  }, [auth.currentUser?.uid]);

  // Initial fetch
  useEffect(() => {
    fetchUserData();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData();
      } else {
        setUserData(null);
        setUserEvents([]);
        setAttendedEvents([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        userData, 
        userEvents, 
        attendedEvents, 
        refreshUserData: fetchUserData,
        isLoading 
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
} 