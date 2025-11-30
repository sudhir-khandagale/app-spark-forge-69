import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface VoiceChatInputProps {
  onTranscript: (text: string) => void;
}

export const VoiceChatInput = ({ onTranscript }: VoiceChatInputProps) => {
  const { language } = useLanguage();
  const { toast } = useToast();

  const { isListening, transcript, isSupported, toggleListening } = useSpeechRecognition({
    onResult: (text) => {
      onTranscript(text);
    },
    onError: (error) => {
      toast({
        title: 'Voice Recognition Error',
        description: `Could not recognize speech: ${error}`,
        variant: 'destructive',
      });
    },
    language: language,
  });

  if (!isSupported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant={isListening ? "destructive" : "outline"}
        onClick={toggleListening}
        className={isListening ? "animate-pulse" : ""}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
      {isListening && (
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Listening...</span>
          <div className="flex gap-1">
            <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '0ms' }} />
            <div className="w-1 h-6 bg-primary animate-pulse" style={{ animationDelay: '150ms' }} />
            <div className="w-1 h-4 bg-primary animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
      {transcript && !isListening && (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
          {transcript}
        </span>
      )}
    </div>
  );
};