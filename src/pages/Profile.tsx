import { Settings, Heart, History, HelpCircle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* User Info */}
      <div className="p-6 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
            JD
          </div>
          <div>
            <h2 className="text-xl font-semibold">John Doe</h2>
            <p className="text-muted-foreground">john.doe@example.com</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-2">
          <Link to="/lists">
            <Button
              variant="ghost"
              className="w-full justify-start h-auto py-4"
            >
              <History className="w-5 h-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Shopping Lists</p>
                <p className="text-sm text-muted-foreground">
                  Manage your shopping lists
                </p>
              </div>
            </Button>
          </Link>

          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
          >
            <Heart className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Favorite Stores</p>
              <p className="text-sm text-muted-foreground">
                3 stores saved
              </p>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
          >
            <History className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Search History</p>
              <p className="text-sm text-muted-foreground">
                View recent searches
              </p>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-auto py-4"
          >
            <HelpCircle className="w-5 h-5 mr-3" />
            <div className="text-left">
              <p className="font-medium">Help & Support</p>
              <p className="text-sm text-muted-foreground">
                Get help with AassPass
              </p>
            </div>
          </Button>

          <div className="pt-4">
            <Link to="/auth">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
