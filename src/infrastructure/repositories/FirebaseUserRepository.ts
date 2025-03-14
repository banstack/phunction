import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { User } from '@/domain/models/User';

export class FirebaseUserRepository implements UserRepository {
  async checkUsernameExists(username: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  }

  async createUser(userId: string, user: Omit<User, "id">): Promise<User> {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, user);
    return {
      id: userId,
      ...user,
    };
  }

  async getUserData(userId: string): Promise<User> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const data = userDoc.data();
    return {
      id: userDoc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      lastUpdated: data.lastUpdated.toDate(),
    } as User;
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
  }

  async addEventToUser(userId: string, eventId: string, type: 'created' | 'attended'): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const field = type === 'created' ? 'eventsCreated' : 'eventsAttended';
    
    await updateDoc(userRef, {
      [field]: arrayUnion(eventId)
    });
  }
} 