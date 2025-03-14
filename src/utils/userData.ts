import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebase";
import { auth } from "@/app/firebase";

export interface UserData {
  username: string;
  email: string;
  xp: number;
  eventsAttended: string[];
  eventsCreated: string[];
  createdAt: Date;
  lastUpdated: Date;
  profilePicture?: string;
  bio?: string;
  location?: {
    city: string;
    country: string;
  };
}

export async function getUserData(): Promise<UserData> {
  const userId = auth.currentUser?.uid;
  if (!userId) {
    throw new Error("User must be authenticated to get user data");
  }

  const userDoc = await getDoc(doc(db, "users", userId));
  if (!userDoc.exists()) {
    throw new Error("User document not found");
  }

  const data = userDoc.data();
  return {
    username: data.username,
    email: data.email,
    xp: data.xp || 0,
    eventsAttended: data.eventsAttended || [],
    eventsCreated: data.eventsCreated || [],
    createdAt: data.createdAt.toDate(),
    lastUpdated: data.lastUpdated.toDate(),
    profilePicture: data.profilePicture,
    bio: data.bio,
    location: data.location,
  };
}

export const clearUserDataCache = () => {
  // No-op since we removed caching
};

export const updateUserDataCache = (newData: Partial<UserData>) => {
  // No-op since we removed caching
}; 