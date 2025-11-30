import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Store, User } from 'lucide-react';
import { format } from 'date-fns';

interface OrderNote {
  id: string;
  message: string;
  is_vendor: boolean;
  created_at: string;
  user_id: string;
}

interface OrderNotesProps {
  orderId: string;
  isVendor: boolean;
  userId: string;
}

export default function OrderNotes({ orderId, isVendor, userId }: OrderNotesProps) {
  const { toast } = useToast();
  const [notes, setNotes] = useState<OrderNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchNotes();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`order-notes-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'order_notes',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          setNotes((prev) => [...prev, payload.new as OrderNote]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNote = async () => {
    if (!newNote.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('order_notes').insert({
        order_id: orderId,
        user_id: userId,
        message: newNote.trim(),
        is_vendor: isVendor,
      });

      if (error) throw error;

      setNewNote('');
      toast({
        title: 'Success',
        description: 'Note sent successfully',
      });
    } catch (error) {
      console.error('Error sending note:', error);
      toast({
        title: 'Error',
        description: 'Failed to send note',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Order Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading notes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Order Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Notes List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Start a conversation about this order.
            </p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className={`flex gap-3 ${
                  note.is_vendor ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {note.is_vendor ? (
                      <Store className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`flex-1 ${
                    note.is_vendor ? 'text-left' : 'text-right'
                  }`}
                >
                  <div
                    className={`inline-block max-w-[80%] p-3 rounded-lg ${
                      note.is_vendor
                        ? 'bg-primary/10 text-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p className="text-sm">{note.message}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(note.created_at), 'MMM dd, hh:mm a')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* New Note Input */}
        <div className="space-y-2 pt-4 border-t">
          <Textarea
            placeholder={
              isVendor
                ? 'Send a message to the customer...'
                : 'Send a message to the store...'
            }
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={sending}
          />
          <Button
            onClick={handleSendNote}
            disabled={!newNote.trim() || sending}
            className="w-full gap-2"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Sending...' : 'Send Note'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
