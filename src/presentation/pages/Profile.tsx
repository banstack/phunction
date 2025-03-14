import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Save, X, MapPin, Mail, Calendar, Trophy, Users } from "lucide-react";
import { UserService } from "@/application/services/UserService";
import { FirebaseUserRepository } from "@/infrastructure/repositories/FirebaseUserRepository";
import { User } from "@/domain/models/User";
import { auth } from "@/app/firebase";
import { getLevelFromXP, getUserTitle, getTitleColor } from "@/utils/leveling";
import { Progress } from "@/components/ui/progress";

const userService = new UserService(new FirebaseUserRepository());

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
    city: "",
    country: "",
  });

  const isOwnProfile = !userId || userId === auth.currentUser?.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const targetUserId = userId || auth.currentUser?.uid;
        if (targetUserId) {
          const userData = await userService.getUserData(targetUserId);
          setUser(userData);
          setFormData({
            bio: userData.bio || "",
            city: userData.location?.city || "",
            country: userData.location?.country || "",
          });
          setPreviewUrl(userData.profilePicture || null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      const updatedUser = {
        ...user,
        bio: formData.bio,
        location: {
          city: formData.city,
          country: formData.country,
        },
      };

      if (profilePicture) {
        const imageUrl = await userService.uploadProfilePicture(profilePicture);
        updatedUser.profilePicture = imageUrl;
      }

      await userService.updateUser(user.id, updatedUser);
      setUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-6">
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-6">
        <div className="flex items-center justify-center h-full">
          <p>User not found</p>
        </div>
      </div>
    );
  }

  const level = getLevelFromXP(user.xp);
  const title = getUserTitle(level);
  const titleColor = getTitleColor(title);
  const xpForCurrentLevel = level * 100;
  const xpForNextLevel = (level + 1) * 100;
  const currentLevelProgress = ((user.xp || 0) - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 text-white p-4 md:p-6">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <Button
          variant="ghost"
          className="text-white hover:text-gray-300 w-full sm:w-auto"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {isOwnProfile && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!isEditing ? (
              <Button
                variant="secondary"
                className="bg-purple-500 hover:bg-purple-600 text-white border-none w-full sm:w-auto"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  variant="secondary"
                  className="bg-gray-800 hover:bg-gray-700 text-white border-none transition-colors w-full sm:w-auto"
                  onClick={() => setIsEditing(false)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  className="bg-purple-500 hover:bg-purple-600 text-white border-none w-full sm:w-auto"
                  onClick={handleSave}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Profile Header */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-8 shadow-xl border border-white/10">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            {/* Left side - Avatar and basic info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
              <div className="relative">
                <div className="relative">
                  <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-purple-500/20">
                    <AvatarImage 
                      src={previewUrl || undefined} 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-2xl md:text-3xl">
                      {user.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gray-900/90 px-3 py-1 rounded-full border border-purple-500/20">
                    <p className="text-sm font-medium text-purple-400">Lvl {level}</p>
                  </div>
                </div>
                {isOwnProfile && isEditing && (
                  <label className="absolute bottom-0 right-0 bg-purple-500 p-2 rounded-full cursor-pointer hover:bg-purple-600 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureChange}
                    />
                  </label>
                )}
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h1 className="text-2xl md:text-3xl font-bold">{user.username}</h1>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <p className={`font-semibold px-3 py-1 rounded-full bg-gray-800/50 border border-white/5 ${titleColor}`}>
                    {title}
                  </p>
                </div>
                {isOwnProfile && (
                  <div className="w-full sm:w-48">
                    <Progress value={currentLevelProgress} className="h-2 bg-gray-700/50" />
                    <p className="text-xs text-gray-400 mt-1">
                      {user.xp || 0} / {xpForNextLevel} XP
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Events info */}
            <div className="flex justify-center md:justify-end">
              {/* Events Statistics */}
              <div className="flex gap-4 md:gap-6">
                <div className="text-center px-4 md:px-6 py-3 bg-gray-800/30 rounded-lg border border-white/5">
                  <Trophy className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                  <p className="text-xl md:text-2xl font-bold text-purple-400">{user.eventsCreated?.length || 0}</p>
                  <p className="text-xs md:text-sm text-gray-400">Hosted</p>
                </div>
                <div className="text-center px-4 md:px-6 py-3 bg-gray-800/30 rounded-lg border border-white/5">
                  <Users className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                  <p className="text-xl md:text-2xl font-bold text-blue-400">{user.eventsAttended?.length || 0}</p>
                  <p className="text-xs md:text-sm text-gray-400">Attended</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 md:p-8 shadow-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4 md:mb-6">Profile Information</h2>
          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
              {isOwnProfile && isEditing ? (
                <Textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 border-gray-700 text-white resize-none w-full"
                  rows={4}
                  placeholder="Tell others about yourself..."
                />
              ) : (
                <p className="text-gray-300 bg-gray-800/30 rounded-lg p-4 border border-white/5">
                  {user.bio || "No bio yet"}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <label className="block text-sm font-medium text-gray-400">Location</label>
                </div>
                {isOwnProfile && isEditing ? (
                  <div className="space-y-2">
                    <Input
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700 text-white text-center"
                      placeholder="City"
                    />
                    <Input
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="bg-gray-800/50 border-gray-700 text-white text-center"
                      placeholder="Country"
                    />
                  </div>
                ) : (
                  <p className="text-gray-300">
                    {user.location?.city && user.location?.country
                      ? `${user.location.city}, ${user.location.country}`
                      : "Not specified"}
                  </p>
                )}
              </div>

              {isOwnProfile && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <label className="block text-sm font-medium text-gray-400">Email</label>
                  </div>
                  <p className="text-gray-300">{user.email}</p>
                </div>
              )}

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <label className="block text-sm font-medium text-gray-400">Member Since</label>
                </div>
                <p className="text-gray-300">
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 