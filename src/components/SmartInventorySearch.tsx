import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, Filter, TrendingUp, TrendingDown, AlertTriangle, Package } from 'lucide-react';

interface SmartInventorySearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export const SmartInventorySearch = ({ onSearch, onFilterChange, currentFilter }: SmartInventorySearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const quickFilters = [
    { id: 'all', label: 'All Products', icon: Package, color: 'default' },
    { id: 'low', label: 'Low Stock', icon: AlertTriangle, color: 'destructive' },
    { id: 'out', label: 'Out of Stock', icon: TrendingDown, color: 'secondary' },
    { id: 'trending', label: 'Best Sellers', icon: TrendingUp, color: 'default' }
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search products... (e.g., 'beverages under ₹50')"
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = currentFilter === filter.id;
          
          return (
            <Button
              key={filter.id}
              onClick={() => onFilterChange(filter.id)}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="gap-2"
            >
              <Icon className="h-3 w-3" />
              {filter.label}
            </Button>
          );
        })}
      </div>

      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          💡 Natural language search enabled - Try phrases like "snacks under 100" or "dairy products"
        </div>
      )}
    </div>
  );
};
