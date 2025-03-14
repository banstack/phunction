import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Event } from "@/domain/models/Event";
import { auth } from "@/app/firebase";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading";
import { eventService, userService } from "@/utils/services";
import { Attendee } from "@/domain/models/Attendee";
import { getLevelFromXP, getUserTitle, getTitleColor } from "@/utils/leveling";
import { ArrowLeft, MapPin, Calendar, Clock, Users, Edit, Save, X, Share2, LogIn, Crown, Trash2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";
import { toast, Toaster } from "sonner";
import CounterGame from '@/components/CounterGame';

export default function EventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    eventName: "",
    description: "",
    date: new Date(),
    time: "",
    location: "",
    maxSpots: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isAttending, setIsAttending] = useState(false);
  const currentUser = auth.currentUser;
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [showLeavePrompt, setShowLeavePrompt] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  useEffect(() => {
    if (event) {
      setEditForm({
        eventName: event.eventName,
        description: event.description,
        date: event.date,
        time: event.time,
        location: event.location,
        maxSpots: event.maxSpots || 0
      });
      setShareUrl(window.location.href);
    }
  }, [event]);

  useEffect(() => {
    const checkAttendance = async () => {
      if (eventId && currentUser) {
        const attending = await eventService.isUserAttending(eventId, currentUser.uid);
        setIsAttending(attending);
      }
    };
    checkAttendance();
  }, [eventId, currentUser]);

  const isCreator = event?.createdBy === auth.currentUser?.uid;

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;

      try {
        const eventData = await eventService.getEvent(eventId);
        setEvent(eventData);
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;

    // Subscribe to real-time attendee updates
    const unsubscribe = eventService.subscribeToEventAttendees(eventId, (updatedAttendees) => {
      setAttendees(updatedAttendees);
    });

    // Cleanup subscription when component unmounts or eventId changes
    return () => {
      unsubscribe();
    };
  }, [eventId]);

  useEffect(() => {
    if (currentUser && event && !isAttending && !isCreator) {
      setShowJoinPrompt(true);
    }
  }, [currentUser, event, isAttending, isCreator]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setEditForm(prev => ({
      ...prev,
      date
    }));
  };

  const handleSave = async () => {
    if (!eventId) return;

    try {
      setError(null);
      await eventService.updateEvent(eventId, {
        eventName: editForm.eventName,
        description: editForm.description,
        date: editForm.date,
        time: editForm.time,
        location: editForm.location,
        maxSpots: editForm.maxSpots || undefined
      });

      // Refresh event data
      const updatedEvent = await eventService.getEvent(eventId);
      setEvent(updatedEvent);
      setIsEditing(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update event");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!", {
        description: "Event link has been copied to your clipboard."
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link", {
        description: "Please try again or copy the URL manually."
      });
    }
  };

  const handleJoinEvent = async () => {
    if (!currentUser || !eventId || !event) return;
    
    try {
      setIsJoining(true);
      setError(null);
      
      // Get current user data
      const userDoc = await userService.getUserData(currentUser.uid);
      
      // Add user as attendee with current XP
      await eventService.addAttendee(eventId, {
        uid: currentUser.uid,
        username: userDoc.username,
        xp: userDoc.xp || 0,
        profilePicture: userDoc.profilePicture || ""
      });

      // Add event to user's attended events
      await userService.addEventToUser(currentUser.uid, eventId, 'attended');

      // Refresh attendees list
      const updatedAttendees = await eventService.getEventAttendees(eventId);
      setAttendees(updatedAttendees);
      setIsAttending(true);
      setShowJoinPrompt(false);

      toast.success("Successfully joined!", {
        description: `You have joined ${event.eventName}`
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to join event");
      toast.error("Failed to join event", {
        description: error instanceof Error ? error.message : "Please try again later."
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!currentUser || !eventId || !event) return;
    
    try {
      setIsLeaving(true);
      setError(null);
      
      // Remove user from event's attendees
      await eventService.removeAttendee(eventId, currentUser.uid);

      // Remove event from user's attended events
      await userService.removeEventFromUser(currentUser.uid, eventId, 'attended');

      setIsAttending(false);
      setShowLeavePrompt(false);
      
      toast.success("Left event", {
        description: `You have left ${event.eventName}`
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to leave event");
      toast.error("Failed to leave event", {
        description: error instanceof Error ? error.message : "Please try again later."
      });
    } finally {
      setIsLeaving(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading event details..." />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-6">
        <div className="flex items-center justify-center h-full">
          <p>Event not found</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-6">
        <div className="relative min-h-screen">
          {/* Blur overlay */}
          <div className="absolute inset-0 backdrop-blur-md z-10" />
          
          {/* Login prompt */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="bg-gray-900/90 p-8 rounded-lg text-center w-full max-w-md mx-6">
              <LogIn className="w-12 h-12 mx-auto mb-4 text-purple-400" />
              <h2 className="text-2xl font-bold mb-4">Login Required</h2>
              <p className="text-gray-300 mb-6">
                This is a private event. Please log in to view details and join.
              </p>
              <Link to="/login" className="block">
                <Button className="bg-purple-500 hover:bg-purple-600 w-full">
                  Log In to Continue
                </Button>
              </Link>
            </div>
          </div>

          {/* Blurred content */}
          <div className="filter blur-sm">
            {/* Your existing return JSX here */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-3 sm:p-6">
      <Toaster richColors />
      {/* Leave Event Prompt */}
      {showLeavePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 p-6 sm:p-8 rounded-lg w-full max-w-md border border-purple-500/20">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Leave Event?</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Are you sure you want to leave "{event?.eventName}"? You can always join again later.
            </p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleLeaveEvent}
                disabled={isLeaving}
              >
                {isLeaving ? "Leaving..." : "Leave Event"}
              </Button>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white/10 bg-transparent flex-1"
                onClick={() => setShowLeavePrompt(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Join Event Prompt */}
      {showJoinPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900/95 p-6 sm:p-8 rounded-lg w-full max-w-md border border-purple-500/20">
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Join This Event?</h3>
            <p className="text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base">
              Would you like to join "{event?.eventName}"? You'll be added to the attendee list and receive updates about the event.
            </p>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
              <Button
                className="bg-purple-500 hover:bg-purple-600 flex-1"
                onClick={handleJoinEvent}
                disabled={isJoining}
              >
                {isJoining ? "Joining..." : "Join Event"}
              </Button>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white/10 bg-transparent flex-1"
                onClick={() => setShowJoinPrompt(false)}
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <Button
          variant="ghost"
          className="text-white hover:text-gray-300 w-full sm:w-auto justify-start"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex flex-wrap gap-2 sm:space-x-2">
          <Button
            variant="outline"
            className="text-white border-white hover:bg-white/10 bg-transparent flex-1 sm:flex-none"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share Event
          </Button>
          {isCreator && !isEditing && (
            <Button
              variant="outline"
              className="text-white border-white hover:bg-white/10 bg-transparent flex-1 sm:flex-none"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Event
            </Button>
          )}
          {!isCreator && !isAttending && !showJoinPrompt && (
            <Button
              className="bg-purple-500 hover:bg-purple-600 flex-1 sm:flex-none"
              onClick={() => setShowJoinPrompt(true)}
            >
              Join Event
            </Button>
          )}
          {isEditing && (
            <>
              <Button
                variant="outline"
                className="text-white border-white hover:bg-white/10 bg-transparent flex-1 sm:flex-none"
                onClick={() => setIsEditing(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                className="bg-purple-500 hover:bg-purple-600 flex-1 sm:flex-none"
                onClick={handleSave}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Event Header */}
      <div className="relative h-64 rounded-lg overflow-hidden mb-8">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: event.imageUrl ? `url(${event.imageUrl})` : undefined,
          }}
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {isEditing ? (
            <Input
              name="eventName"
              value={editForm.eventName}
              onChange={handleInputChange}
              className="text-4xl font-bold bg-transparent border-white/20 text-white"
            />
          ) : (
            <h1 className="text-4xl font-bold">{event.eventName}</h1>
          )}
          <p className="text-gray-300 mt-2">Hosted by 🟣 {event.creatorUsername}</p>
        </div>
      </div>

      {/* Event Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="md:col-span-2">
          <div className="bg-gray-900/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-left">About This Event</h2>
            {isEditing ? (
              <Textarea
                name="description"
                value={editForm.description}
                onChange={handleInputChange}
                className="min-h-[200px] bg-gray-800 border-gray-700 text-white"
              />
            ) : (
              <p className="text-gray-300 whitespace-pre-wrap text-left">{event.description}</p>
            )}
          </div>

          <div className="mt-6 bg-gray-900/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-left">Event Details</h2>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="flex items-center text-gray-300">
                    <Calendar className="mr-3 h-5 w-5" />
                    <DateTimePicker
                      date={editForm.date}
                      onDateChange={handleDateChange}
                    />
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="mr-3 h-5 w-5" />
                    <Input
                      type="time"
                      name="time"
                      value={editForm.time}
                      onChange={handleInputChange}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="mr-3 h-5 w-5" />
                    <Input
                      name="location"
                      value={editForm.location}
                      onChange={handleInputChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Enter location"
                    />
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Users className="mr-3 h-5 w-5" />
                    <Input
                      type="number"
                      name="maxSpots"
                      value={editForm.maxSpots}
                      onChange={handleInputChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Maximum spots (optional)"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-gray-300">
                    <Calendar className="mr-3 h-5 w-5" />
                    <span>{format(event.date, 'MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <Clock className="mr-3 h-5 w-5" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center text-gray-300">
                    <MapPin className="mr-3 h-5 w-5" />
                    <span>{event.location}</span>
                  </div>
                  {event.maxSpots && (
                    <div className="flex items-center text-gray-300">
                      <Users className="mr-3 h-5 w-5" />
                      <span>
                        {event.maxSpots - attendees.length === 0 
                          ? "No spots left" 
                          : `${event.maxSpots - attendees.length}/${event.maxSpots} spots left`
                        }
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Counter Game Section */}
          {event?.gameMode === 'counter' && (
            <CounterGame event={event} attendees={attendees} />
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          <div className="bg-gray-900/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-left flex items-center">
              <Users className="mr-2 h-6 w-6" />
              Attendees
            </h2>
            <div className="space-y-3">
              {attendees.length > 0 ? (
                attendees.map((attendee) => {
                  const level = getLevelFromXP(attendee.xp);
                  const title = getUserTitle(level);
                  const titleColor = getTitleColor(title);
                  const isCreator = attendee.uid === event.createdBy;

                  return (
                    <div
                      key={attendee.uid}
                      className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 cursor-pointer hover:bg-gray-600/50 transition-colors"
                      onClick={() => navigate(`/user/${attendee.uid}`)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className={cn(
                          "h-10 w-10",
                          "relative",
                          "after:absolute after:inset-0 after:rounded-full after:border-2",
                          {
                            "after:border-yellow-400": title === 'Grandmaster',
                            "after:border-gray-300": title === 'Platinum',
                            "after:border-blue-400": title === 'Diamond',
                            "after:border-yellow-500": title === 'Gold',
                            "after:border-gray-400": title === 'Silver',
                            "after:border-amber-700": title === 'Bronze',
                          }
                        )}>
                          <AvatarImage 
                            src={attendee.profilePicture} 
                            className="object-cover rounded-full"
                          />
                          <AvatarFallback className="text-sm">
                            {attendee.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-left">{attendee.username}</p>
                            {isCreator && (
                              <Crown className="h-4 w-4 text-yellow-400" />
                            )}
                          </div>
                          <p className={cn(
                            "text-sm",
                            title === 'Grandmaster' 
                              ? "bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-transparent bg-clip-text font-bold"
                              : titleColor
                          )}>
                            {title} • Level {level}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400">No attendees yet</p>
              )}
            </div>
            {!isCreator && isAttending && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowLeavePrompt(true)}
                >
                  Leave Event
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone - Only visible to creator */}
      {isCreator && (
        <div className="mt-8 border-t border-red-500/20 pt-8">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-red-500 text-lg font-semibold mb-4">Danger Zone</h3>
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-4">
                Once you delete this event, there is no going back. Please be certain.
              </p>
              <Button
                variant="destructive"
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-red-500/20"
                onClick={() => setEventToDelete(event)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Event
              </Button>
            </div>
          </div>
        </div>
      )}

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
              onClick={async () => {
                try {
                  if (!eventToDelete?.id) return;
                  await eventService.deleteEvent(eventToDelete.id);
                  navigate('/dashboard');
                } catch (error) {
                  console.error("Failed to delete event:", error);
                  toast.error("Failed to delete event", {
                    description: "Please try again later."
                  });
                }
              }}
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