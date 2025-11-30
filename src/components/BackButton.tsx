import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  fallbackPath?: string;
  className?: string;
}

export const BackButton = ({ fallbackPath = '/', className }: BackButtonProps) => {
  const navigate = useNavigate();
  
  const handleBack = () => {
    // Try to navigate back, if it fails go to fallback
    try {
      navigate(-1);
    } catch {
      navigate(fallbackPath);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={handleBack}
      className={cn("h-11 w-11", className)}
      aria-label="Go back"
      type="button"
    >
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
};
