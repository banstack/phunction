import { EventRepository } from '@/domain/repositories/EventRepository';
import { Event, CounterGameData } from '@/domain/models/Event';
import { Attendee } from '@/domain/models/Attendee';
import { auth } from '@/app/firebase';
import { UserService } from './UserService';

export class EventService {
  constructor(
    private eventRepository: EventRepository,
    private userService: UserService
  ) {}

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'createdBy'>, imageFile: File | null = null): Promise<Event> {
    let imageUrl: string | undefined;

    if (imageFile) {
      imageUrl = await this.eventRepository.uploadEventImage(imageFile);
    }

    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated to create an event');
    }

    const event: Omit<Event, 'id'> = {
      ...eventData,
      imageUrl,
      createdAt: new Date(),
      createdBy: userId,
    };

    const createdEvent = await this.eventRepository.createEvent(event, imageFile);
    
    // Update user's created events
    await this.userService.addEventToUser(userId, createdEvent.id!, 'created');

    return createdEvent;
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    return await this.eventRepository.getUserEvents(userId);
  }

  async getAttendedEvents(userId: string): Promise<Event[]> {
    return await this.eventRepository.getAttendedEvents(userId);
  }

  async deleteEvent(eventId: string): Promise<void> {
    return this.eventRepository.deleteEvent(eventId);
  }

  async getEvent(eventId: string): Promise<Event> {
    return this.eventRepository.getEvent(eventId);
  }

  async getEventAttendees(eventId: string): Promise<Attendee[]> {
    return this.eventRepository.getEventAttendees(eventId);
  }

  async addAttendee(eventId: string, attendee: Attendee): Promise<void> {
    return this.eventRepository.addAttendee(eventId, attendee);
  }

  async removeAttendee(eventId: string, userId: string): Promise<void> {
    return this.eventRepository.removeAttendee(eventId, userId);
  }

  async isUserAttending(eventId: string, userId: string): Promise<boolean> {
    return this.eventRepository.isUserAttending(eventId, userId);
  }

  async updateEvent(eventId: string, eventData: Partial<Omit<Event, 'id' | 'createdAt' | 'createdBy' | 'creatorUsername' | 'creatorProfilePicture'>>): Promise<void> {
    return this.eventRepository.updateEvent(eventId, eventData);
  }

  async getCurrentUserData() {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      throw new Error('User must be authenticated');
    }
    return await this.userService.getUserData(userId);
  }

  subscribeToEventAttendees(eventId: string, callback: (attendees: Attendee[]) => void): () => void {
    return this.eventRepository.subscribeToEventAttendees(eventId, callback);
  }

  subscribeToUserEvents(userId: string, callback: (events: Event[]) => void): () => void {
    return this.eventRepository.subscribeToUserEvents(userId, callback);
  }

  subscribeToAttendedEvents(userId: string, callback: (events: Event[]) => void): () => void {
    return this.eventRepository.subscribeToAttendedEvents(userId, callback);
  }

  async updateAttendeeXP(eventId: string, userId: string, newXP: number): Promise<void> {
    await this.eventRepository.updateAttendeeXP(eventId, userId, newXP);
  }

  async initializeCounterGame(eventId: string, userId: string, initialCount: number, goal: number): Promise<void> {
    return this.eventRepository.initializeCounterGame(eventId, userId, initialCount, goal);
  }

  async updateCounterGameData(eventId: string, userId: string, count: number, goal: number): Promise<void> {
    return this.eventRepository.updateCounterGameData(eventId, userId, count, goal);
  }

  subscribeToCounterGameData(eventId: string, callback: (gameData: { participants: Record<string, CounterGameData> } | undefined) => void): () => void {
    return this.eventRepository.subscribeToCounterGameData(eventId, callback);
  }
} 