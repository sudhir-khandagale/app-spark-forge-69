import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle2 } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onBackToLogin: () => void;
}

export const EmailVerification = ({ email, onBackToLogin }: EmailVerificationProps) => {
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      toast({
        title: "Failed to resend email",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Email sent!",
        description: "Please check your inbox for the verification link.",
      });
      
      // Start 60-second cooldown
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setIsResending(false);
  };

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-muted-foreground">
          We've sent a verification link to
        </p>
        <p className="font-medium">{email}</p>
      </div>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          Click the link in the email to verify your account and complete registration.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or
        </div>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={handleResendEmail}
          disabled={isResending || resendTimer > 0}
        >
          {resendTimer > 0 
            ? `Resend in ${resendTimer}s` 
            : isResending 
              ? 'Sending...' 
              : 'Resend verification email'}
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
