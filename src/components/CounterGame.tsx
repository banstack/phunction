import { useState, useEffect } from 'react';
import { Event, CounterGameData } from '@/domain/models/Event';
import { eventService } from '@/utils/services';
import { auth } from '@/app/firebase';
import { Button } from '@/components/ui/button';
import { Crown, Trophy, Medal, Award, Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterGameProps {
  event: Event;
  attendees: { uid: string; username: string }[];
}

interface LeaderboardEntry extends CounterGameData {
  username: string;
  place: number;
  isHost: boolean;
}

export default function CounterGame({ event, attendees }: CounterGameProps) {
  const [gameData, setGameData] = useState<{ participants: Record<string, CounterGameData> }>();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!event.id || !currentUser) return;

    // Initialize counter game data for current user if not already initialized
    const initializeUserGame = async () => {
      try {
        await eventService.initializeCounterGame(event.id, currentUser.uid, 0, 0);
      } catch (error) {
        console.error('Error initializing counter game:', error);
      }
    };

    if (event.gameMode === 'counter') {
      initializeUserGame();
    }
  }, [event.id, currentUser]);

  useEffect(() => {
    if (!event.id) return;

    const unsubscribe = eventService.subscribeToCounterGameData(event.id, (data) => {
      if (data) {
        setGameData(data);
      }
    });

    return () => unsubscribe();
  }, [event.id]);

  useEffect(() => {
    if (!gameData) return;

    // Create leaderboard data only for users who are attendees
    const leaderboardData = Object.entries(gameData.participants)
      .filter(([userId]) => attendees.some(a => a.uid === userId)) // Only include actual attendees
      .map(([userId, data]) => {
        const attendee = attendees.find(a => a.uid === userId);
        return {
          ...data,
          username: attendee?.username || 'Unknown User',
          isHost: userId === event.createdBy,
          place: 0 // Will be set below
        };
      });

    // Sort by count (highest first) and then by goal completion
    leaderboardData.sort((a, b) => {
      const aCompleted = a.count >= a.goal;
      const bCompleted = b.count >= b.goal;
      
      if (aCompleted !== bCompleted) {
        return bCompleted ? 1 : -1;
      }
      return b.count - a.count;
    });

    // Assign places
    leaderboardData.forEach((entry, index) => {
      entry.place = index + 1;
    });

    setLeaderboard(leaderboardData);
  }, [gameData, attendees, event.createdBy]);

  const handleCountChange = async (increment: boolean) => {
    if (!currentUser || !gameData) return;

    const userData = gameData.participants[currentUser.uid];
    if (!userData) return;

    const newCount = increment ? userData.count + 1 : userData.count - 1;
    await eventService.updateCounterGameData(event.id, currentUser.uid, newCount, userData.goal);
  };

  const handleGoalChange = async (increment: boolean) => {
    if (!currentUser || !gameData) return;

    const userData = gameData.participants[currentUser.uid];
    if (!userData) return;

    const newGoal = increment ? userData.goal + 1 : userData.goal - 1;
    await eventService.updateCounterGameData(event.id, currentUser.uid, userData.count, newGoal);
  };

  const getPlaceIcon = (place: number) => {
    switch (place) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-300" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return place;
    }
  };

  const currentUserData = currentUser && gameData?.participants[currentUser.uid];

  return (
    <div className="space-y-8 mt-6">
      {/* Counter Controls */}
      {currentUserData && (
        <div className="bg-gray-900/50 rounded-lg p-6 space-y-4">
          <h3 className="text-xl font-semibold mb-4">Your Progress</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Count</span>
                <span className="text-lg font-semibold">{currentUserData.count}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-red-900/50 hover:bg-red-800 text-white border-red-700"
                  onClick={() => handleCountChange(false)}
                  disabled={currentUserData.count <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-green-900/50 hover:bg-green-800 text-white border-green-700"
                  onClick={() => handleCountChange(true)}
                  disabled={currentUserData.count >= 1000}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Goal</span>
                <span className="text-lg font-semibold">{currentUserData.goal}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-red-900/50 hover:bg-red-800 text-white border-red-700"
                  onClick={() => handleGoalChange(false)}
                  disabled={currentUserData.goal <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-green-900/50 hover:bg-green-800 text-white border-green-700"
                  onClick={() => handleGoalChange(true)}
                  disabled={currentUserData.goal >= 1000}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-gray-900/50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">Leaderboard</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-800">
                <th className="pb-2 font-medium text-gray-400">Place</th>
                <th className="pb-2 font-medium text-gray-400">Username</th>
                <th className="pb-2 font-medium text-gray-400 text-right">Count</th>
                <th className="pb-2 font-medium text-gray-400 text-right">Goal</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr 
                  key={entry.userId}
                  className={cn(
                    "border-b border-gray-800/50 transition-colors",
                    entry.count >= entry.goal && "bg-green-900/20",
                    entry.userId === currentUser?.uid && "bg-purple-900/20"
                  )}
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {getPlaceIcon(entry.place)}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium",
                        entry.isHost && "text-yellow-400"
                      )}>
                        {entry.username}
                      </span>
                      {entry.isHost && <Crown className="h-4 w-4 text-yellow-400" />}
                    </div>
                  </td>
                  <td className="py-3 text-right">{entry.count}</td>
                  <td className="py-3 text-right">{entry.goal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 