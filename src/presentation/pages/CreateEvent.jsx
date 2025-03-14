import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, ImageIcon, X, ArrowLeft, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { eventService } from "@/utils/services";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  eventName: z.string()
    .min(3, "Event name must be at least 3 characters")
    .max(24, "Event name must be less than 24 characters"),
  dateTime: z.date()
    .min(new Date(), "Date cannot be in the past"),
  location: z.string().min(1, "Location is required"),
  maxSpots: z.number()
    .min(1, "Must have at least 1 spot")
    .optional(),
  description: z.string().min(1, "Description is required"),
  gameMode: z.enum(["counter", "matchmaking", "none"], {
    required_error: "Please select a game mode",
  }),
  image: z.any().optional(),
});

export default function CreateEvent() {
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: "",
      location: "",
      maxSpots: undefined,
      description: "",
      gameMode: "none",
      image: null,
      dateTime: new Date(),
    },
  });

  async function onSubmit(values) {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const { image, dateTime, ...eventData } = values;
      const eventDateTime = new Date(dateTime);
      const formattedTime = format(eventDateTime, 'HH:mm');
      
      await eventService.createEvent({
        ...eventData,
        date: eventDateTime,
        time: formattedTime,
      }, image);
      
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create event. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageRemove = (e) => {
    e.stopPropagation();
    form.setValue("image", null);
    setImagePreview(null);
  };

  useEffect(() => {
    const image = form.watch("image");
    if (image) {
      const objectUrl = URL.createObjectURL(image);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [form.watch("image")]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-900 to-purple-800 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
          <Button
            variant="ghost"
            className="text-white hover:text-gray-300 w-fit"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">Create New Event</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="eventName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Event Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a catchy name for your event" 
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 h-12 text-lg"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Date & Time</FormLabel>
                        <FormControl>
                          <DateTimePicker
                            date={field.value}
                            onDateChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Where is your event taking place?" 
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 h-12 text-lg"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxSpots"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Maximum Spots</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Leave empty for unlimited spots"
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 h-12 text-lg"
                            autoComplete="off"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="gameMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Game Mode</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 gap-3"
                          >
                            <div className="flex items-center space-x-2 bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                              <RadioGroupItem value="counter" id="counter" className="border-gray-700" />
                              <Label htmlFor="counter" className="text-white cursor-pointer">Counter</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                              <RadioGroupItem value="matchmaking" id="matchmaking" className="border-gray-700" />
                              <Label htmlFor="matchmaking" className="text-white cursor-pointer">Matchmaking</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-gray-800/50 p-4 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                              <RadioGroupItem value="none" id="none" className="border-gray-700" />
                              <Label htmlFor="none" className="text-white cursor-pointer">None</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell people more about your event..."
                            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 min-h-[120px] text-lg leading-relaxed resize-none"
                            autoComplete="off"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white text-lg">Event Image</FormLabel>
                        <FormControl>
                          <div className="border-2 border-dashed border-gray-600 rounded-lg h-[200px] w-full flex flex-col items-center justify-center relative hover:border-gray-500 transition-colors overflow-hidden group">
                            <Input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  field.onChange(file);
                                }
                              }}
                            />
                            {imagePreview ? (
                              <>
                                <img 
                                  src={imagePreview} 
                                  alt="Preview" 
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="bg-white hover:bg-gray-100"
                                    onClick={handleImageRemove}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
                                <p className="text-gray-300 text-lg mb-2">Click to upload image</p>
                                <p className="text-gray-500">SVG, PNG, JPG or GIF</p>
                              </>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-gray-800">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
                >
                  {isSubmitting ? (
                    "Creating Event..."
                  ) : (
                    <>
                      Create Event
                      <Check className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
