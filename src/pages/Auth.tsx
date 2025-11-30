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
  const navigate = useNavigate();
  const { toast } = useToast();

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

    if (signupPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
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
              Welcome to Flowdux
            </h1>
            <p className="text-muted-foreground">
              Find products at local stores instantly
            </p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
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
                    <Label htmlFor="login-password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot Password?
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
                  {isLoading ? 'Logging in...' : 'Login'}
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
                    placeholder="At least 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>I want to sign up as</Label>
                  <RadioGroup value={signupRole} onValueChange={(value: 'customer' | 'vendor') => setSignupRole(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="font-normal">Customer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vendor" id="vendor" />
                      <Label htmlFor="vendor" className="font-normal">Vendor (Shop Owner)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Already have an account? Switch to the Login tab.
                </p>
              </form>
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              Continue as Guest
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
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
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
