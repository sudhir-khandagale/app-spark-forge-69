import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, CheckCircle } from 'lucide-react';
import flowduxIcon from '@/assets/flowdux-icon.png';
import { useNavigate } from 'react-router-dom';

const Install = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <img src={flowduxIcon} alt="Flowdux" className="h-20 w-20 mx-auto mb-4 rounded-xl" />
          <CardTitle className="text-2xl">Install Flowdux</CardTitle>
          <CardDescription>
            Get the best experience by installing our app on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <p className="text-lg font-semibold">App is already installed!</p>
              <Button onClick={() => navigate('/')} className="w-full">
                Open App
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Works Offline</h3>
                    <p className="text-sm text-muted-foreground">
                      Access your favorite stores anytime, anywhere
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Fast & Reliable</h3>
                    <p className="text-sm text-muted-foreground">
                      Instant loading with native app-like experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">No App Store Required</h3>
                    <p className="text-sm text-muted-foreground">
                      Install directly from your browser
                    </p>
                  </div>
                </div>
              </div>

              {deferredPrompt ? (
                <Button onClick={handleInstallClick} className="w-full" size="lg">
                  <Download className="mr-2 h-5 w-5" />
                  Install Now
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="font-semibold text-sm">How to Install:</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Tap the Share button in your browser</li>
                      <li>Select "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </div>
                  <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                    Continue to App
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Install;
