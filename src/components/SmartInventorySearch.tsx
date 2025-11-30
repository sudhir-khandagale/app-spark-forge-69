import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, Filter, TrendingUp, TrendingDown, AlertTriangle, Package, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { debounce } from '@/lib/debounce';
import { useToast } from '@/hooks/use-toast';

interface SmartInventorySearchProps {
  onSearch: (query: string) => void;
  onFilterChange: (filter: string) => void;
  currentFilter: string;
  storeId: string;
  onSmartFiltersChange?: (filters: any) => void;
}

export const SmartInventorySearch = ({ 
  onSearch, 
  onFilterChange, 
  currentFilter, 
  storeId,
  onSmartFiltersChange 
}: SmartInventorySearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [parsedFilters, setParsedFilters] = useState<any>(null);
  const [isParsingQuery, setIsParsingQuery] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();

  const quickFilters = [
    { id: 'all', label: 'All Products', icon: Package, color: 'default' },
    { id: 'low', label: 'Low Stock', icon: AlertTriangle, color: 'destructive' },
    { id: 'out', label: 'Out of Stock', icon: TrendingDown, color: 'secondary' },
    { id: 'trending', label: 'Best Sellers', icon: TrendingUp, color: 'default' }
  ];

  const parseNaturalLanguageQuery = debounce(async (query: string) => {
    if (!query || query.length < 3) {
      setParsedFilters(null);
      onSmartFiltersChange?.({});
      return;
    }

    setIsParsingQuery(true);
    try {
      const { data, error } = await supabase.functions.invoke('smart-inventory-search', {
        body: { query, storeId }
      });

      if (error) throw error;

      console.log('Parsed filters:', data.filters);
      setParsedFilters(data.filters);
      onSmartFiltersChange?.(data.filters);
    } catch (error) {
      console.error('Error parsing query:', error);
      toast({
        title: 'Search Error',
        description: 'Could not parse your search query',
        variant: 'destructive',
      });
    } finally {
      setIsParsingQuery(false);
    }
  }, 800);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
    parseNaturalLanguageQuery(value);
  };

  const clearFilter = (filterKey: string) => {
    if (parsedFilters) {
      const newFilters = { ...parsedFilters };
      delete newFilters[filterKey];
      setParsedFilters(Object.keys(newFilters).length > 0 ? newFilters : null);
      onSmartFiltersChange?.(newFilters);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('search_products')}
          className="pl-10"
        />
        {isParsingQuery && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {parsedFilters && Object.keys(parsedFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {parsedFilters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {parsedFilters.category}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('category')} />
            </Badge>
          )}
          {parsedFilters.minPrice && (
            <Badge variant="secondary" className="gap-1">
              Min: ₹{parsedFilters.minPrice}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('minPrice')} />
            </Badge>
          )}
          {parsedFilters.maxPrice && (
            <Badge variant="secondary" className="gap-1">
              Max: ₹{parsedFilters.maxPrice}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('maxPrice')} />
            </Badge>
          )}
          {parsedFilters.stockStatus && (
            <Badge variant="secondary" className="gap-1">
              Stock: {parsedFilters.stockStatus}
              <X className="h-3 w-3 cursor-pointer" onClick={() => clearFilter('stockStatus')} />
            </Badge>
          )}
        </div>
      )}

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

      {searchQuery && !parsedFilters && (
        <div className="text-sm text-muted-foreground">
          💡 {t('natural_language_hint')}
        </div>
      )}
    </div>
  );
};
