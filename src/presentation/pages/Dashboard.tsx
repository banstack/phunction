import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Settings, LogOut, Trash2, Calendar, MapPin, Plus } from "lucide-react";
import { logoutUser } from "@/services/authService";
import { useState, useMemo } from "react";
import { Event } from "@/domain/models/Event";
import { useUser } from "@/context/UserContext";
import { Loading } from "@/components/ui/loading";
import { eventService } from "@/utils/services";
import { format } from "date-fns";
import { getLevelFromXP, getUserTitle, getTitleColor, getXPProgress, getXPForNextLevel } from "@/utils/leveling";
import { userService } from "@/utils/services";
import { toast } from "sonner";
import { auth } from "@/app/firebase";

// Memoized Event Card Component
const EventCard = ({ event, onDelete }: { event: Event; onDelete: (event: Event) => void }) => {
  const navigate = useNavigate();

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div 
          className="bg-opacity-20 rounded-lg w-full aspect-[16/10] flex flex-col justify-between cursor-pointer transform-gpu transition-all duration-300 ease-in-out hover:scale-[0.98] hover:shadow-xl"
          onClick={() => navigate(`/event/${event.id}`)}
        >
          <div 
            className="flex-1 relative bg-gradient-to-r from-gray-700 to-gray-500 rounded-t-lg"
            style={{
              backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Event name overlay at the top */}
            <div className="absolute top-0 left-0 right-0 p-2.5 bg-black/70 backdrop-blur-sm rounded-t-lg">
              <p className="text-white font-semibold text-sm md:text-base truncate">
                {event.eventName}
              </p>
            </div>
            
            {/* Event details overlay at the bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 bg-black/70 backdrop-blur-sm space-y-0.5">
              <p className="text-gray-200 text-xs flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {format(event.date, 'MMM d')} at {event.time}
              </p>
              <p className="text-gray-200 text-xs flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1.5" />
                {event.location}
              </p>
            </div>
          </div>
          {/* Hosted by section below the card */}
          <div className="bg-gray-900/90 backdrop-blur-sm rounded-b-lg p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={event.creatorProfilePicture} />
                <AvatarFallback>{event.creatorUsername[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-gray-300 text-xs">Hosted by {event.creatorUsername}</p>
            </div>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-gray-900 border-gray-800">
        <ContextMenuItem 
          className="text-red-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
          onClick={() => onDelete(event)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Event
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { userData, userEvents, attendedEvents, refreshUserData, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'created' | 'upcoming' | 'attended' | 'all'>('upcoming');
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete?.id) return;
    
    try {
      await eventService.deleteEvent(eventToDelete.id);
      refreshUserData(); // Refresh the user data after deletion
      setEventToDelete(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  // Memoize the event cards
  const eventCards = useMemo(() => {
    if (isLoading) return null;

    let eventsToShow: Event[] = [];
    let allEvents: Event[] = [];
    const now = new Date();
    
    switch (activeTab) {
      case 'created':
        eventsToShow = userEvents;
        break;
      case 'upcoming':
        // Show all events (both created and attended) that are in the future
        allEvents = [...userEvents, ...attendedEvents];
        eventsToShow = Array.from(
          new Map(
            allEvents
              .filter(event => event.date > now)
              .map(event => [event.id, event])
          ).values()
        ).sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by date ascending
        break;
      case 'attended':
        // Show only past attended events
        eventsToShow = attendedEvents
          .filter(event => event.date < now)
          .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort by date descending
        break;
      case 'all':
        allEvents = [...userEvents, ...attendedEvents];
        eventsToShow = Array.from(new Map(allEvents.map(event => [event.id, event])).values());
        break;
    }

    if (eventsToShow.length === 0) {
      return (
        <div className="col-span-full flex items-center justify-center min-h-[200px]">
          <p className="text-gray-400 text-lg">
            {activeTab === 'created' ? 'No events created yet' :
             activeTab === 'upcoming' ? 'No upcoming events' :
             activeTab === 'attended' ? 'No past events attended' :
             'No events found'}
          </p>
        </div>
      );
    }

    return eventsToShow.map((event) => (
      <EventCard key={event.id} event={event} onDelete={setEventToDelete} />
    ));
  }, [userEvents, attendedEvents, isLoading, activeTab]);

  // Memoize the user stats
  const userStats = useMemo(() => {
    const level = getLevelFromXP(userData?.xp || 0);
    const title = getUserTitle(level);
    const titleColor = getTitleColor(title);
    const xpProgress = getXPProgress(userData?.xp || 0);
    const nextLevelXP = getXPForNextLevel(userData?.xp || 0);

    return {
      level,
      title,
      titleColor,
      xpProgress,
      nextLevelXP
    };
  }, [userData?.xp]);

  if (isLoading) {
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-4 md:p-6">
      {/* Navbar */}
      <nav className="flex justify-between items-center mb-6">
        <h2 className="font-semibold text-lg">Phunction</h2>
        <div className="flex items-center gap-2 md:gap-4">
          <Button 
            className="bg-purple-400 text-white px-3 md:px-4 py-2 rounded-lg text-sm md:text-base"
            onClick={() => navigate("/create-event")}
          >
            +Create
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 ring-2 ring-purple-500/20">
                  <AvatarImage 
                    src={userData?.profilePicture} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-sm">
                    {userData?.username?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-gray-900 border-gray-800" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">{userData?.username || 'User'}</p>
                  <p className="text-xs leading-none text-gray-400">
                    {userData?.email || 'Loading...'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
                onClick={() => navigate("/profile")}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={refreshUserData}
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Refresh Data</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={async () => {
                  try {
                    const userId = auth.currentUser?.uid;
                    if (!userId) return;
                    await userService.syncUserXPAcrossEvents(userId);
                    toast.success("XP synced successfully", {
                      description: "Your XP has been updated across all events."
                    });
                    refreshUserData();
                  } catch (error) {
                    console.error("Failed to sync XP:", error);
                    toast.error("Failed to sync XP", {
                      description: "Please try again later."
                    });
                  }
                }}
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Sync XP Across Events</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-gray-200 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Main Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mt-6 md:mt-25 gap-6">
        {/* Left Side - Welcome Message and Tabs */}
        <div className="text-left flex flex-col">
          <h2 className="text-2xl md:text-4xl font-light">
            Welcome back, <span className="font-bold">{userData?.username || 'User'}!</span>
          </h2>
          <p className="text-gray-300 mt-2 text-sm md:text-base">
            You have created {userEvents.length} events
          </p>

          {/* User Stats - Shows above tabs on mobile */}
          <div className="md:hidden mt-6 bg-gray-900/30 p-3 rounded-lg">
            <div className="flex justify-between items-start">
              {/* Left aligned content */}
              <div className="flex flex-col items-start gap-1">
                <p className={`font-semibold ${userStats.titleColor}`}>
                  {userStats.title}
                </p>
                <p className="text-base font-bold">Lvl. {userStats.level}</p>
                <div className="w-40">
                  <Progress value={userStats.xpProgress} className="h-2 bg-gray-700 [&>div]:bg-purple-500" />
                  <p className="text-xs text-gray-400 mt-0.5">
                    {userData?.xp || 0} / {userStats.nextLevelXP} XP
                  </p>
                </div>
              </div>
              
              {/* Right aligned stats */}
              <div className="flex flex-col items-end text-sm gap-1">
                <p>
                  Events Attended <span className="text-blue-300">{userData?.eventsAttended.length || "0"}</span>
                </p>
                <p>
                  Events Created <span className="text-purple-300">{userData?.eventsCreated.length || "0"}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Event Tabs */}
          <div className="mt-6 flex flex-wrap gap-2 md:gap-4">
            <Button 
              variant="outline" 
              className={`text-sm md:text-base border-white text-white hover:bg-white/10 bg-transparent transform-gpu transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md ${activeTab === 'upcoming' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
            </Button>
            <Button 
              variant="outline" 
              className={`text-sm md:text-base border-white text-white hover:bg-white/10 bg-transparent transform-gpu transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md ${activeTab === 'created' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('created')}
            >
              Created
            </Button>
            <Button 
              variant="outline" 
              className={`text-sm md:text-base border-white text-white hover:bg-white/10 bg-transparent transform-gpu transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md ${activeTab === 'attended' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('attended')}
            >
              Past Events
            </Button>
            <Button 
              variant="outline" 
              className={`text-sm md:text-base border-white text-white hover:bg-white/10 bg-transparent transform-gpu transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md ${activeTab === 'all' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Events
            </Button>
          </div>
        </div>

        {/* Right Side - User Stats (Desktop Only) */}
        <div className="hidden md:block text-right bg-gray-900/30 p-4 rounded-lg md:bg-transparent md:p-0">
          <p className={`font-semibold ${userStats.titleColor}`}>
            {userStats.title}
          </p>
          <p className="text-lg font-bold">Lvl. {userStats.level}</p>
          <div className="space-y-1">
            <Progress value={userStats.xpProgress} className="w-full md:w-40 my-2 bg-gray-700 [&>div]:bg-purple-500" />
            <p className="text-xs text-gray-400">
              {userData?.xp || 0} / {userStats.nextLevelXP} XP
            </p>
          </div>
          <p className="text-sm md:text-base">
            Events Attended <span className="text-blue-300">{userData?.eventsAttended.length || "0"}</span>
          </p>
          <p className="text-sm md:text-base">
            Events Created <span className="text-purple-300">{userData?.eventsCreated.length || "0"}</span>
          </p>
        </div>
      </div>

      {/* Events Section */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 px-2 sm:px-0">
        {isLoading ? (
          <div className="text-white col-span-full text-center">Loading events...</div>
        ) : (
          <>
            {eventCards}
            {activeTab !== 'attended' && (
              <div 
                className="bg-gray-900/20 border-2 border-dashed border-gray-400 rounded-lg w-full aspect-[16/10] flex flex-col items-center justify-center cursor-pointer transform-gpu transition-all duration-300 ease-in-out hover:scale-[0.98] hover:border-white hover:bg-gray-900/30 hover:shadow-lg"
                onClick={() => navigate("/create-event")}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-purple-400" />
                  </div>
                  <p className="text-gray-300 text-base font-medium">Create New Event</p>
                  <p className="text-gray-400 text-sm">Click to get started</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setEventToDelete(null)}
              className="bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
