import { Event, CounterGameData } from '../models/Event';
import { Attendee } from '../models/Attendee';

export interface EventRepository {
  createEvent(event: Omit<Event, 'id' | 'createdAt' | 'createdBy'>, image: File | null): Promise<Event>;
  uploadEventImage(file: File): Promise<string>;
  getUserEvents(userId: string): Promise<Event[]>;
  getAttendedEvents(userId: string): Promise<Event[]>;
  deleteEvent(eventId: string): Promise<void>;
  getEvent(eventId: string): Promise<Event>;
  getEventAttendees(eventId: string): Promise<Attendee[]>;
  addAttendee(eventId: string, attendee: Attendee): Promise<void>;
  removeAttendee(eventId: string, userId: string): Promise<void>;
  isUserAttending(eventId: string, userId: string): Promise<boolean>;
  updateEvent(eventId: string, eventData: Partial<Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'creatorUsername' | 'creatorProfilePicture'>>): Promise<void>;
  subscribeToEventAttendees(eventId: string, callback: (attendees: Attendee[]) => void): () => void;
  subscribeToUserEvents(userId: string, callback: (events: Event[]) => void): () => void;
  subscribeToAttendedEvents(userId: string, callback: (events: Event[]) => void): () => void;
  updateAttendeeXP(eventId: string, userId: string, newXP: number): Promise<void>;
  // Counter game mode methods
  initializeCounterGame(eventId: string, userId: string, initialCount: number, goal: number): Promise<void>;
  updateCounterGameData(eventId: string, userId: string, count: number, goal: number): Promise<void>;
  subscribeToCounterGameData(eventId: string, callback: (gameData: { participants: Record<string, CounterGameData> } | undefined) => void): () => void;
} 