import { UserService } from "@/application/services/UserService";
import { EventService } from "@/application/services/EventService";
import { FirebaseUserRepository } from "@/infrastructure/repositories/FirebaseUserRepository";
import { FirebaseEventRepository } from "@/infrastructure/repositories/FirebaseEventRepository";

// Create singleton instances of repositories
const userRepository = new FirebaseUserRepository();
const eventRepository = new FirebaseEventRepository();

// Create singleton instance of UserService
const userService = new UserService(userRepository);

// Create singleton instance of EventService with userService
const eventService = new EventService(eventRepository, userService);

// Set the eventService on userService to complete the circular dependency
userService.setEventService(eventService);

export { userService, eventService }; 