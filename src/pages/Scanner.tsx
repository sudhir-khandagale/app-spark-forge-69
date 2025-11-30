import { useState, useEffect } from 'react';
import { X, Flashlight, Keyboard, Camera } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { useTranslation } from '@/hooks/useTranslation';

const Scanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { haptic, isNative } = useNativeFeatures();
  const [isScanning, setIsScanning] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const requestCameraPermission = async () => {
    if (!isNative) return true;
    
    try {
      const permission = await CapacitorCamera.checkPermissions();
      if (permission.camera !== 'granted') {
        const result = await CapacitorCamera.requestPermissions({ permissions: ['camera'] });
        return result.camera === 'granted';
      }
      return true;
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  };

  const startScanning = async () => {
    const hasPermission = await requestCameraPermission();
    
    if (!hasPermission) {
      toast({
        title: 'Camera permission required',
        description: 'Please enable camera access to scan barcodes',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    haptic.light();

    try {
      // Use camera to take a photo - in a real app, you'd integrate a barcode scanner
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      // Simulate barcode detection - in production, use ML Kit or similar
      toast({
        title: 'Barcode detected',
        description: 'Redirecting to search...',
      });
      
      haptic.success();
      
      // Navigate to search with detected code
      setTimeout(() => {
        navigate('/search?q=scanned-product');
      }, 500);
    } catch (error: any) {
      if (error.message !== 'User cancelled photos app') {
        toast({
          title: 'Scan failed',
          description: 'Please try again',
          variant: 'destructive',
        });
        haptic.error();
      }
    } finally {
      setIsScanning(false);
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
    haptic.light();
    toast({
      title: torchOn ? 'Flash off' : 'Flash on',
      duration: 1000,
    });
  };

  useEffect(() => {
    if (isNative) {
      requestCameraPermission();
    }
  }, [isNative]);

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="icon" className="text-white" onClick={() => haptic.light()}>
              <X className="w-6 h-6" />
            </Button>
          </Link>
          {isNative && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white"
              onClick={toggleTorch}
            >
              <Flashlight className={torchOn ? 'w-6 h-6 text-yellow-400' : 'w-6 h-6'} />
            </Button>
          )}
        </div>
      </header>

      {/* Camera View */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <div className="relative w-64 h-64">
          {/* Scan frame */}
          <div className="absolute inset-0 border-2 border-primary rounded-lg">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
          </div>
        </div>

        {isNative && (
          <Button 
            size="lg" 
            className="rounded-full w-16 h-16"
            onClick={startScanning}
            disabled={isScanning}
          >
            <Camera className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] text-center">
        <p className="text-white mb-4">
          {isNative 
            ? isScanning 
              ? t('scanning') 
              : t('tap_to_scan')
            : t('camera_requires_app')
          }
        </p>
        <Link to="/search">
          <Button 
            variant="outline" 
            className="w-full max-w-xs"
            onClick={() => haptic.light()}
          >
            <Keyboard className="w-4 h-4 mr-2" />
            {t('enter_manually')}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Scanner;
