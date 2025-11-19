import { Plus, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';

const Lists = () => {
  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Shopping Lists</h1>
          <Button size="icon">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Lists */}
      <main className="flex-1 p-4">
        <div className="max-w-lg mx-auto space-y-3">
          {[
            { name: 'Weekly Groceries', items: 12, available: 10 },
            { name: 'Home Office Setup', items: 5, available: 4 },
            { name: 'Birthday Party', items: 8, available: 8 },
          ].map((list, i) => (
            <Link key={i} to={`/lists/${i + 1}`}>
              <div className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{list.name}</h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    {list.items} items
                  </span>
                  <span className="text-accent font-medium">
                    {list.available}/{list.items} available
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{
                        width: `${(list.available / list.items) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Lists;
