export interface User {
  id: string;
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