import { UserRepository } from "@/domain/repositories/UserRepository";
import { User } from "@/domain/models/User";
import { v4 as uuidv4 } from "uuid";
import { storage } from "@/app/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { EventService } from "./EventService";
import { FirebaseEventRepository } from "../../infrastructure/repositories/FirebaseEventRepository";

export class UserService {
  private eventService?: EventService;

  constructor(private userRepository: UserRepository) {
    // Create EventService with this instance of UserService
    const eventRepository = new FirebaseEventRepository();
    this.eventService = new EventService(eventRepository, this);
  }

  setEventService(eventService: EventService) {
    this.eventService = eventService;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    return this.userRepository.checkUsernameExists(username);
  }

  async createUser(userId: string, username: string, email: string): Promise<User> {
    // Check if username already exists
    const usernameExists = await this.checkUsernameExists(username);
    if (usernameExists) {
      throw new Error('Username already taken');
    }

    const user: Omit<User, "id"> = {
      username,
      email,
      xp: 0,
      eventsAttended: [],
      eventsCreated: [],
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    return this.userRepository.createUser(userId, user);
  }

  async getUserData(userId: string): Promise<User> {
    return this.userRepository.getUserData(userId);
  }

  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    return this.userRepository.updateUser(userId, userData);
  }

  async uploadProfilePicture(file: File): Promise<string> {
    const fileExtension = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const storageRef = ref(storage, `profile-pictures/${fileName}`);

    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }

  async deleteProfilePicture(imageUrl: string): Promise<void> {
    const imageRef = ref(storage, imageUrl);
    try {
      await deleteObject(imageRef);
    } catch (error) {
      console.error("Error deleting profile picture:", error);
    }
  }

  async addEventToUser(userId: string, eventId: string, type: 'attended' | 'created'): Promise<void> {
    const user = await this.getUserData(userId);
    const field = type === 'attended' ? 'eventsAttended' : 'eventsCreated';
    
    if (!user[field].includes(eventId)) {
      await this.userRepository.updateUser(userId, {
        [field]: [...user[field], eventId],
        lastUpdated: new Date()
      });
    }
  }

  async removeEventFromUser(userId: string, eventId: string, type: 'attended' | 'created'): Promise<void> {
    const user = await this.getUserData(userId);
    const field = type === 'attended' ? 'eventsAttended' : 'eventsCreated';
    
    await this.userRepository.updateUser(userId, {
      [field]: user[field].filter(id => id !== eventId),
      lastUpdated: new Date()
    });
  }

  async updateUserXP(userId: string, xpChange: number): Promise<void> {
    if (!this.eventService) {
      throw new Error("EventService not initialized");
    }

    const userData = await this.userRepository.getUserData(userId);
    if (!userData) {
      throw new Error("User not found");
    }

    const newXP = (userData.xp || 0) + xpChange;
    await this.userRepository.updateUser(userId, { xp: newXP });

    // Get all events where the user is an attendee or creator
    const attendedEvents = await this.eventService.getAttendedEvents(userId);
    const createdEvents = await this.eventService.getUserEvents(userId);

    // Combine events and remove duplicates
    const allEvents = [...new Set([...attendedEvents, ...createdEvents])];

    // Update user's XP in all events
    await Promise.all(
      allEvents.map(event => this.eventService!.updateAttendeeXP(event.id, userId, newXP))
    );
  }

  async syncUserXPAcrossEvents(userId: string): Promise<void> {
    if (!this.eventService) {
      throw new Error("EventService not initialized");
    }

    const userData = await this.getUserData(userId);
    if (!userData) {
      throw new Error("User not found");
    }

    // Get all events where the user is an attendee or creator
    const attendedEvents = await this.eventService.getAttendedEvents(userId);
    const createdEvents = await this.eventService.getUserEvents(userId);

    // Combine events and remove duplicates
    const allEvents = [...new Set([...attendedEvents, ...createdEvents])];

    // Update user's XP in all events
    await Promise.all(
      allEvents.map(event => this.eventService!.updateAttendeeXP(event.id, userId, userData.xp || 0))
    );
  }
} 