import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Phone, CheckCircle2 } from 'lucide-react';

interface PhoneVerificationProps {
  phone: string;
  onVerified: () => void;
  onBackToLogin: () => void;
}

export const PhoneVerification = ({ phone, onVerified, onBackToLogin }: PhoneVerificationProps) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: 'sms'
    });

    if (error) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsVerifying(false);
    } else {
      toast({
        title: "Success!",
        description: "Phone number verified successfully.",
      });
      onVerified();
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone
    });

    if (error) {
      toast({
        title: "Failed to resend OTP",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "OTP sent!",
        description: "Please check your phone for the verification code.",
      });
      setResendTimer(60);
    }
    setIsResending(false);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Phone className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Verify your phone</h2>
        <p className="text-muted-foreground">
          We've sent a verification code to
        </p>
        <p className="font-medium">{phone}</p>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Enter the 6-digit code to verify your phone number
        </AlertDescription>
      </Alert>

      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="otp">Verification Code</Label>
          <Input
            id="otp"
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isVerifying || otp.length !== 6}
        >
          {isVerifying ? 'Verifying...' : 'Verify Phone Number'}
        </Button>
      </form>

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Didn't receive the code?
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResendOtp}
          disabled={isResending || resendTimer > 0}
        >
          {resendTimer > 0 
            ? `Resend in ${resendTimer}s` 
            : isResending 
              ? 'Sending...' 
              : 'Resend verification code'}
        </Button>

        <Button
          variant="link"
          onClick={onBackToLogin}
          className="w-full"
        >
          Back to login
        </Button>
      </div>
    </div>
  );
};
