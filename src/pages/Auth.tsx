import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmailVerification } from '@/components/EmailVerification';
import flowduxIcon from '@/assets/flowdux-icon.png';
import { z } from 'zod';
import { useTranslation } from '@/hooks/useTranslation';
import { checkPasswordStrength, checkPasswordBreach, PasswordStrength } from '@/lib/passwordValidation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

const emailSchema = z.string().email({ message: "Please enter a valid email address" });

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'customer' | 'vendor'>('customer');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [signupEmailError, setSignupEmailError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [checkingBreach, setCheckingBreach] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Helper function to redirect based on user role
  const redirectByRole = async (userId: string) => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (roleData?.role === 'admin') {
      // Check if admin has a store, redirect to store dashboard if they do
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      
      if (storeData) {
        navigate(`/vendor/dashboard/${storeData.id}`);
      } else {
        navigate('/admin');
      }
    } else if (roleData?.role === 'vendor') {
      // Check if vendor already has a store
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', userId)
        .maybeSingle();
      
      if (storeData) {
        navigate(`/vendor/dashboard/${storeData.id}`);
      } else {
        navigate('/onboarding/merchant');
      }
    } else {
      navigate('/');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await redirectByRole(session.user.id);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await redirectByRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateEmail = (email: string, isSignup: boolean = false) => {
    if (!email) {
      if (isSignup) {
        setSignupEmailError(null);
      } else {
        setEmailError(null);
      }
      return true;
    }
    const result = emailSchema.safeParse(email);
    if (isSignup) {
      setSignupEmailError(result.success ? null : result.error.errors[0].message);
    } else {
      setEmailError(result.success ? null : result.error.errors[0].message);
    }
    return result.success;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Missing Information",
        description: "Please enter your email and password",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(loginEmail)) {
      toast({
        title: "Invalid Email",
        description: emailError || "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword
    });

    if (error) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    } else if (data.user) {
      toast({
        title: "Success!",
        description: "Logged in successfully",
      });
      await redirectByRole(data.user.id);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(forgotPasswordEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link"
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmail(signupEmail, true)) {
      toast({
        title: "Invalid Email",
        description: signupEmailError || "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Check password strength
    const strength = checkPasswordStrength(signupPassword);
    if (!strength.isValid) {
      toast({
        title: "Weak Password",
        description: strength.feedback[0] || "Password does not meet security requirements",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setCheckingBreach(true);

    // Check for breached password
    const isBreached = await checkPasswordBreach(signupPassword);
    setCheckingBreach(false);

    if (isBreached) {
      toast({
        title: "Compromised Password",
        description: "This password has been found in data breaches. Please choose a different password.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: signupName,
          role: signupRole
        }
      }
    });

    if (error) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive"
      });
      setIsLoading(false);
    } else if (data.user) {
      setVerificationEmail(signupEmail);
      setShowEmailVerification(true);
      setIsLoading(false);
    }
  };

  if (showEmailVerification) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
            <EmailVerification 
              email={verificationEmail}
              onBackToLogin={() => {
                setShowEmailVerification(false);
                setIsLoading(false);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-accent/10 via-background to-primary/10">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-gradient-primary rounded-2xl shadow-lg mb-2">
              <img src={flowduxIcon} alt="Flowdux Logo" className="h-20 mx-auto rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {t('welcome_to_flowdux')}
            </h1>
            <p className="text-muted-foreground">
              Find products at local stores instantly
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('email')}</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      validateEmail(e.target.value);
                    }}
                    className={emailError ? "border-destructive" : ""}
                  />
                  {emailError && (
                    <p className="text-xs text-destructive">{emailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">{t('password')}</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('forgot_password')}
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? `${t('loading')}` : t('login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      validateEmail(e.target.value, true);
                    }}
                    className={signupEmailError ? "border-destructive" : ""}
                  />
                  {signupEmailError && (
                    <p className="text-xs text-destructive">{signupEmailError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a strong password"
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      if (e.target.value) {
                        setPasswordStrength(checkPasswordStrength(e.target.value));
                      } else {
                        setPasswordStrength(null);
                      }
                    }}
                  />
                  {passwordStrength && signupPassword && (
                    <PasswordStrengthIndicator 
                      strength={passwordStrength}
                      showRequirements={true}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>{t('select_role')}</Label>
                  <RadioGroup value={signupRole} onValueChange={(value: 'customer' | 'vendor') => setSignupRole(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="font-normal">{t('role_customer')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vendor" id="vendor" />
                      <Label htmlFor="vendor" className="font-normal">{t('role_vendor')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || checkingBreach}
                >
                  {checkingBreach ? 'Checking password security...' : isLoading ? `${t('loading')}` : t('signup')}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  {t('already_have_account')}
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              {t('continue_as_guest')}
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reset_password')}</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">{t('email')}</Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                }}
                className="flex-1"
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? `${t('processing')}` : t('send_reset_link')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
