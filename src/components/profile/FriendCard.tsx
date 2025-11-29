import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserMinus } from 'lucide-react';

interface FriendCardProps {
  friend: {
    id: string;
    friend_id: string;
    display_name: string;
    avatar_url: string | null;
    level?: number;
    level_name?: string;
  };
  onRemove: () => void;
}

export const FriendCard = ({ friend, onRemove }: FriendCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={friend.avatar_url || undefined} />
          <AvatarFallback>{friend.display_name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold">{friend.display_name}</h3>
          {friend.level && (
            <Badge variant="secondary" className="mt-1">
              Level {friend.level} - {friend.level_name}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <UserMinus className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </Card>
  );
};