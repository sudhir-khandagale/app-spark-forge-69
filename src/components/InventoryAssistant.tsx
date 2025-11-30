import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Bot, Send, Sparkles, X, Loader2, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { VoiceChatInput } from './VoiceChatInput';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from '@/hooks/useTranslation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  action?: string;
  result?: string;
}

interface InventoryAssistantProps {
  storeId: string;
  onInventoryUpdate?: () => void;
}

export const InventoryAssistant = ({ storeId, onInventoryUpdate }: InventoryAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your AI inventory assistant. I can help you update stock, check low inventory, analyze products, and more. Just ask me anything!"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { speak, stop, isSpeaking } = useSpeechSynthesis({ language });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant') {
        speak(lastMessage.content);
      }
    }
  }, [messages, autoSpeak, speak]);

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
  };

  const suggestions = [
    t('update_maggi_stock'),
    t('show_low_stock'),
    t('update_price'),
  ];

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('inventory-assistant', {
        body: { message: textToSend, storeId, language }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        action: data.action,
        result: data.result
      }]);

      if (data.action && onInventoryUpdate) {
        onInventoryUpdate();
      }

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process your request",
        variant: "destructive"
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-accent hover:scale-110 transition-transform z-[60] relative"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
        {autoSpeak && (
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-24 right-6 w-[calc(100vw-2rem)] max-w-96 h-[500px] flex flex-col shadow-2xl z-[60] border-primary/20">
      <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-white" />
          <span className="font-semibold text-white">{t('ai_assistant')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (!autoSpeak) {
                toast({
                  title: t('voice_chat_enabled'),
                  description: t('auto_read_responses'),
                });
              }
            }}
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            {autoSpeak ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.result && (
                  <p className="text-xs mt-2 opacity-80 font-medium">
                    ✓ {msg.result}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">{t('suggestions')}:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-auto py-1"
                onClick={() => sendMessage(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t space-y-2">
        <div className="flex gap-2">
          <VoiceChatInput onTranscript={handleVoiceTranscript} />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t('ask_me_anything')}
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isSpeaking && (
          <Button
            variant="outline"
            size="sm"
            onClick={stop}
            className="w-full"
          >
            {t('stop_speaking')}
          </Button>
        )}
      </div>
    </Card>
  );
};