import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RoleBasedBottomNav from "@/components/RoleBasedBottomNav";
import { FriendCard } from '@/components/profile/FriendCard';
import { UserSearch } from '@/components/profile/UserSearch';
import { useFriends } from '@/hooks/useFriends';
import { Badge } from '@/components/ui/badge';

const Friends = () => {
  const { friends, pendingRequests, loading, acceptFriendRequest, removeFriend, refreshFriends } = useFriends();

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Link to="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Friends</h1>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-6">
          <Tabs defaultValue="friends">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="friends">
                Friends
                {friends.length > 0 && (
                  <Badge className="ml-2" variant="secondary">{friends.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="requests">
                Requests
                {pendingRequests.length > 0 && (
                  <Badge className="ml-2" variant="destructive">{pendingRequests.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="search">Search</TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-3">
              {loading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : friends.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No friends yet. Search for users to add!</p>
                  </CardContent>
                </Card>
              ) : (
                friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onRemove={() => removeFriend(friend.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-3">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">No pending requests</p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{request.display_name}</h3>
                        <p className="text-sm text-muted-foreground">Wants to be friends</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => acceptFriendRequest(request.id)}>
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeFriend(request.id)}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="search">
              <Card>
                <CardHeader>
                  <CardTitle>Find Friends</CardTitle>
                  <CardDescription>Search for users to add as friends</CardDescription>
                </CardHeader>
                <CardContent>
                  <UserSearch onFriendRequestSent={refreshFriends} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <RoleBasedBottomNav />
    </div>
  );
};

export default Friends;