import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect } from 'react';

interface Story {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  views_count: number;
  created_at: string;
}

interface VendorStoriesCarouselProps {
  stories: Story[];
  vendorName: string;
  vendorAvatar?: string;
  onViewStory?: (storyId: string) => void;
}

export default function VendorStoriesCarousel({ 
  stories, 
  vendorName, 
  vendorAvatar,
  onViewStory 
}: VendorStoriesCarouselProps) {
  const [open, setOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!open) return;

    const duration = 5000; // 5 seconds per story
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        handleNext();
      } else {
        setProgress(newProgress);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [open, currentIndex]);

  useEffect(() => {
    if (open && currentStory && onViewStory) {
      onViewStory(currentStory.id);
    }
  }, [open, currentIndex, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      setOpen(false);
      setCurrentIndex(0);
      setProgress(0);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  if (stories.length === 0) return null;

  return (
    <>
      {/* Story Ring */}
      <button
        onClick={() => setOpen(true)}
        className="flex flex-col items-center gap-1 min-w-[80px]"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[3px]">
            <div className="bg-background rounded-full p-[3px]">
              <Avatar className="h-16 w-16">
                <AvatarImage src={vendorAvatar} />
                <AvatarFallback>{vendorName[0]}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
        <span className="text-xs font-medium truncate w-full text-center">{vendorName}</span>
      </button>

      {/* Story Viewer Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 gap-0 bg-black border-none">
          <div className="relative h-[80vh] w-full">
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
              {stories.map((_, idx) => (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  {idx === currentIndex && (
                    <div 
                      className="h-full bg-white transition-all duration-50"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                  {idx < currentIndex && (
                    <div className="h-full bg-white" />
                  )}
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={vendorAvatar} />
                  <AvatarFallback>{vendorName[0]}</AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-sm">{vendorName}</span>
                <span className="text-white/70 text-xs">
                  {new Date(currentStory?.created_at).toLocaleTimeString()}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Story Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {currentStory?.media_type === 'image' ? (
                <img 
                  src={currentStory.media_url} 
                  alt="Story"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video 
                  src={currentStory?.media_url}
                  className="max-h-full max-w-full object-contain"
                  autoPlay
                  playsInline
                />
              )}
            </div>

            {/* Caption */}
            {currentStory?.caption && (
              <div className="absolute bottom-20 left-0 right-0 px-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3">
                  <p className="text-white text-sm">{currentStory.caption}</p>
                </div>
              </div>
            )}

            {/* Views count */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/80">
              <Eye className="h-4 w-4" />
              <span className="text-sm">{currentStory?.views_count || 0}</span>
            </div>

            {/* Navigation */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
