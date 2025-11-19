import { X, Flashlight, Keyboard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Scanner = () => {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-white">
              <X className="w-6 h-6" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="text-white">
            <Flashlight className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Camera View */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-64 h-64">
          {/* Scan frame */}
          <div className="absolute inset-0 border-2 border-primary rounded-lg">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 text-center">
        <p className="text-white mb-4">Position barcode within frame</p>
        <Link to="/search">
          <Button variant="outline" className="w-full max-w-xs">
            <Keyboard className="w-4 h-4 mr-2" />
            Enter Code Manually
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Scanner;
