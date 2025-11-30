import { Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

interface VoiceSearchButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
}

export const VoiceSearchButton = ({ onTranscript, className }: VoiceSearchButtonProps) => {
  const { t, language } = useTranslation();
  
  const handleResult = useCallback((text: string) => {
    console.log('Voice search result:', text);
    onTranscript(text);
  }, [onTranscript]);

  const handleError = useCallback((error: string) => {
    console.error('Voice recognition error:', error);
  }, []);

  const { 
    isListening, 
    isSupported, 
    startListening, 
    stopListening 
  } = useSpeechRecognition({
    onResult: handleResult,
    onError: handleError,
    language: language,
  });

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "ghost"}
      size="icon"
      onClick={isListening ? stopListening : startListening}
      className={cn(
        "relative",
        isListening && "animate-pulse",
        className
      )}
      title={isListening ? t('listening') : t('voice_search')}
    >
      {isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
      {isListening && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-ping" />
      )}
    </Button>
  );
};
