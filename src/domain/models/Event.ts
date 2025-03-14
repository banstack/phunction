export interface CounterGameData {
  userId: string;
  count: number;
  goal: number;
}

export interface Event {
  id: string;
  eventName: string;
  description: string;
  date: Date;
  time: string; // Format: "HH:mm"
  location: string;
  maxSpots?: number;
  gameMode: 'counter' | 'matchmaking' | 'none';
  gameData?: {
    counter?: {
      participants: Record<string, CounterGameData>;
    };
  };
  imageUrl?: string;
  createdAt: Date;
  createdBy: string;
  creatorUsername: string;
  creatorProfilePicture?: string;
  // attendees will be stored in a subcollection
} 