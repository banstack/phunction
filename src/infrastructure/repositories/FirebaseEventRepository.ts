import { collection, addDoc, query, where, getDocs, deleteDoc, doc, setDoc, arrayUnion, getDoc, onSnapshot, updateDoc, deleteField } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/app/firebase";
import { EventRepository } from "@/domain/repositories/EventRepository";
import { Event, CounterGameData } from "@/domain/models/Event";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/app/firebase";
import { Attendee } from "@/domain/models/Attendee";

export class FirebaseEventRepository implements EventRepository {
  async createEvent(event: Omit<Event, "id" | "createdAt" | "createdBy">, image: File | null): Promise<Event> {
    let imageUrl: string | undefined = undefined;
    if (image) {
      imageUrl = await this.uploadEventImage(image);
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error("User must be authenticated to create an event");
    }

    // Get user data to include username
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();
    if (!userData?.username) {
      throw new Error("User data not found");
    }

    const eventData = {
      ...event,
      createdAt: new Date(),
      createdBy: userId,
      creatorUsername: userData.username, // Add username to event data
      creatorProfilePicture: userData.profilePicture || "", // Add profile picture to event data
    };

    // Only add imageUrl if it exists
    if (imageUrl) {
      Object.assign(eventData, { imageUrl });
    }

    const docRef = await addDoc(collection(db, "events"), eventData);
    
    // Create or update user document with the new event
    await setDoc(userRef, {
      eventsCreated: arrayUnion(docRef.id),
      createdAt: new Date(),
      lastUpdated: new Date()
    }, { merge: true });

    // Add creator as first attendee
    await this.addAttendee(docRef.id, {
      uid: userId,
      username: userData.username,
      xp: userData.xp || 0,
      profilePicture: userData.profilePicture || ""
    });

    return {
      id: docRef.id,
      ...eventData,
      imageUrl: imageUrl || undefined,
    };
  }

  async uploadEventImage(file: File): Promise<string> {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `events/${fileName}`);

    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        creatorProfilePicture: data.creatorProfilePicture || "",
      } as Event;
    });
  }

  async getAttendedEvents(userId: string): Promise<Event[]> {
    // First, get the user's data to get their attended events
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      throw new Error("User not found");
    }

    const userData = userDoc.data();
    const attendedEventIds = userData.eventsAttended || [];

    // If user hasn't attended any events, return empty array
    if (attendedEventIds.length === 0) {
      return [];
    }

    // Get all events that the user is attending
    const eventsRef = collection(db, "events");
    const events = await Promise.all(
      attendedEventIds.map(async (eventId: string) => {
        const eventDoc = await getDoc(doc(eventsRef, eventId));
        if (!eventDoc.exists()) return null;
        const data = eventDoc.data();
        return {
          id: eventDoc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          creatorProfilePicture: data.creatorProfilePicture || "",
        } as Event;
      })
    );

    // Filter out any null values (from deleted events)
    return events.filter((event): event is Event => event !== null);
  }

  async deleteEvent(eventId: string): Promise<void> {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) return;

    const eventData = eventDoc.data();
    if (eventData.imageUrl) {
      const imageRef = ref(storage, eventData.imageUrl);
      try {
        await deleteObject(imageRef);
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }

    // Delete all attendees in the subcollection
    const attendeesRef = collection(db, "events", eventId, "attendees");
    const attendeesSnapshot = await getDocs(attendeesRef);
    const deletePromises = attendeesSnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    await deleteDoc(doc(db, "events", eventId));
  }

  async getEvent(eventId: string): Promise<Event> {
    const eventDoc = await getDoc(doc(db, "events", eventId));
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    const data = eventDoc.data();
    return {
      ...data,
      id: eventDoc.id,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as Event;
  }

  async getEventAttendees(eventId: string): Promise<Attendee[]> {
    const attendeesRef = collection(db, "events", eventId, "attendees");
    const attendeesSnapshot = await getDocs(attendeesRef);
    
    // Get all user documents for the attendees to get their profile pictures
    const attendeePromises = attendeesSnapshot.docs.map(async (attendeeDoc) => {
      const attendeeData = attendeeDoc.data();
      const userDoc = await getDoc(doc(db, "users", attendeeDoc.id));
      const userData = userDoc.data();
      
      return {
        uid: attendeeDoc.id,
        username: attendeeData.username,
        xp: attendeeData.xp,
        profilePicture: userData?.profilePicture || ""
      };
    });

    return Promise.all(attendeePromises);
  }

  private async updateUserXP(userId: string, xpToAdd: number): Promise<void> {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    const currentXP = userData.xp || 0;
    
    await updateDoc(userRef, {
      xp: currentXP + xpToAdd,
      lastUpdated: new Date()
    });
  }

  async addAttendee(eventId: string, attendee: Attendee): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventDoc.data();
    const attendeeRef = doc(db, "events", eventId, "attendees", attendee.uid);

    // Add attendee to the attendees subcollection
    await setDoc(attendeeRef, {
      username: attendee.username,
      xp: attendee.xp,
      profilePicture: attendee.profilePicture
    });

    // Add event to user's attended events
    const userRef = doc(db, "users", attendee.uid);
    await setDoc(userRef, {
      eventsAttended: arrayUnion(eventId),
      lastUpdated: new Date()
    }, { merge: true });

    // Award 50 XP for joining an event
    await this.updateUserXP(attendee.uid, 50);

    // Get current attendee count
    const attendeesRef = collection(db, "events", eventId, "attendees");
    const attendeesSnapshot = await getDocs(attendeesRef);
    const attendeeCount = attendeesSnapshot.size;

    // If this is the 5th attendee, award 100 XP to the event creator
    if (attendeeCount === 5) {
      await this.updateUserXP(eventData.createdBy, 100);
    }

    // Initialize counter game data if event is in counter mode
    if (eventData.gameMode === 'counter') {
      await updateDoc(eventRef, {
        [`gameData.counter.participants.${attendee.uid}`]: {
          userId: attendee.uid,
          count: 0,
          goal: 0
        }
      });
    }
  }

  async removeAttendee(eventId: string, userId: string): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);
    const attendeeRef = doc(db, "events", eventId, "attendees", userId);

    // Remove attendee from the attendees subcollection
    await deleteDoc(attendeeRef);

    // If event exists and is in counter mode, remove user from counter game data
    if (eventDoc.exists()) {
      const eventData = eventDoc.data();
      if (eventData.gameMode === 'counter' && eventData.gameData?.counter?.participants) {
        // Remove the user from counter participants
        await updateDoc(eventRef, {
          [`gameData.counter.participants.${userId}`]: deleteField()
        });
      }
    }
  }

  async isUserAttending(eventId: string, userId: string): Promise<boolean> {
    const attendeeRef = doc(db, "events", eventId, "attendees", userId);
    const attendeeDoc = await getDoc(attendeeRef);
    return attendeeDoc.exists();
  }

  async updateEvent(eventId: string, eventData: Partial<Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'creatorUsername' | 'creatorProfilePicture'>>): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    // Verify the current user is the event creator
    const userId = auth.currentUser?.uid;
    if (!userId || eventDoc.data()?.createdBy !== userId) {
      throw new Error("Unauthorized to edit this event");
    }

    await setDoc(eventRef, eventData, { merge: true });
  }

  subscribeToEventAttendees(eventId: string, callback: (attendees: Attendee[]) => void): () => void {
    const attendeesRef = collection(db, "events", eventId, "attendees");
    let userUnsubscribers: (() => void)[] = [];
    
    const unsubscribeAttendees = onSnapshot(attendeesRef, async (snapshot) => {
      // Clean up previous user subscriptions
      userUnsubscribers.forEach(unsubscribe => unsubscribe());
      userUnsubscribers = [];

      const attendeePromises = snapshot.docs.map(async (attendeeDoc) => {
        const attendeeData = attendeeDoc.data();
        const userRef = doc(db, "users", attendeeDoc.id);
        
        // Create a promise that resolves with the attendee data
        return new Promise<Attendee>((resolve) => {
          // Subscribe to user document changes
          const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
            const userData = userDoc.data();
            resolve({
              uid: attendeeDoc.id,
              username: attendeeData.username,
              xp: userData?.xp || attendeeData.xp || 0, // Use user's current XP
              profilePicture: userData?.profilePicture || ""
            });
          });
          
          // Store the unsubscribe function
          userUnsubscribers.push(unsubscribeUser);
        });
      });

      const attendees = await Promise.all(attendeePromises);
      callback(attendees);
    });

    // Return a cleanup function that unsubscribes from both attendees and users
    return () => {
      unsubscribeAttendees();
      userUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }

  subscribeToUserEvents(userId: string, callback: (events: Event[]) => void): () => void {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, where("createdBy", "==", userId));
    
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.date.toDate(),
          createdAt: data.createdAt.toDate(),
          creatorProfilePicture: data.creatorProfilePicture || "",
        } as Event;
      });
      callback(events);
    });
  }

  subscribeToAttendedEvents(userId: string, callback: (events: Event[]) => void): () => void {
    // Subscribe to user document to get attended event IDs
    const userRef = doc(db, "users", userId);
    
    return onSnapshot(userRef, async (userDoc) => {
      if (!userDoc.exists()) {
        callback([]);
        return;
      }

      const userData = userDoc.data();
      const attendedEventIds = userData.eventsAttended || [];

      if (attendedEventIds.length === 0) {
        callback([]);
        return;
      }

      // Get all events that the user is attending
      const eventsRef = collection(db, "events");
      const events = await Promise.all(
        attendedEventIds.map(async (eventId: string) => {
          const eventDoc = await getDoc(doc(eventsRef, eventId));
          if (!eventDoc.exists()) return null;
          const data = eventDoc.data();
          return {
            id: eventDoc.id,
            ...data,
            date: data.date.toDate(),
            createdAt: data.createdAt.toDate(),
            creatorProfilePicture: data.creatorProfilePicture || "",
          } as Event;
        })
      );

      // Filter out any null values (from deleted events)
      callback(events.filter((event): event is Event => event !== null));
    });
  }

  async updateAttendeeXP(eventId: string, userId: string, newXP: number): Promise<void> {
    const attendeeRef = doc(db, "events", eventId, "attendees", userId);
    const attendeeDoc = await getDoc(attendeeRef);
    
    if (!attendeeDoc.exists()) {
      return; // User is not an attendee of this event
    }

    const attendeeData = attendeeDoc.data();
    await setDoc(attendeeRef, {
      ...attendeeData,
      xp: newXP
    });
  }

  async initializeCounterGame(eventId: string, userId: string, initialCount: number, goal: number): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventDoc.data();
    if (eventData.gameMode !== 'counter') {
      throw new Error("Event is not in counter mode");
    }

    // Check if the user is already initialized
    if (eventData.gameData?.counter?.participants?.[userId]) {
      return; // User already has counter data
    }

    // Update only this user's data, preserving other participants
    await updateDoc(eventRef, {
      [`gameData.counter.participants.${userId}`]: {
        userId,
        count: initialCount,
        goal: goal
      }
    });
  }

  async updateCounterGameData(eventId: string, userId: string, count: number, goal: number): Promise<void> {
    const eventRef = doc(db, "events", eventId);
    const eventDoc = await getDoc(eventRef);
    
    if (!eventDoc.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventDoc.data();
    if (eventData.gameMode !== 'counter') {
      throw new Error("Event is not in counter mode");
    }

    await updateDoc(eventRef, {
      [`gameData.counter.participants.${userId}`]: {
        userId,
        count: Math.max(0, Math.min(count, 1000)), // Enforce min/max limits
        goal: Math.max(0, Math.min(goal, 1000))
      }
    });
  }

  subscribeToCounterGameData(eventId: string, callback: (gameData: { participants: Record<string, CounterGameData> } | undefined) => void): () => void {
    const eventRef = doc(db, "events", eventId);
    
    return onSnapshot(eventRef, (doc) => {
      if (!doc.exists()) {
        callback(undefined);
        return;
      }

      const eventData = doc.data();
      if (eventData.gameMode !== 'counter') {
        callback(undefined);
        return;
      }

      callback(eventData.gameData?.counter);
    });
  }
} 