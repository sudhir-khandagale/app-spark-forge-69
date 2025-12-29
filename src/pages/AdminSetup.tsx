import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';

const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isBootstrap, setIsBootstrap] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: 'Authentication Required',
            description: 'Please log in to access this page',
            variant: 'destructive',
          });
          navigate('/auth');
          return;
        }

        // Check if any admins exist (bootstrap case)
        const { count: adminCount } = await supabase
          .from('user_roles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (adminCount === 0) {
          // Bootstrap case: no admins exist, allow first admin setup
          setIsBootstrap(true);
          setIsAuthorized(true);
          return;
        }

        // Check if current user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (!roleData) {
          toast({
            title: 'Unauthorized',
            description: 'Admin access required',
            variant: 'destructive',
          });
          navigate('/');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Authorization check failed:', error);
        toast({
          title: 'Error',
          description: 'Failed to verify authorization',
          variant: 'destructive',
        });
        navigate('/');
      }
    };

    checkAuthorization();
  }, [navigate]);

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('assign_admin_role', {
        admin_email: email.trim(),
      });

      if (error) throw error;

      if (data?.startsWith('Success')) {
        toast({
          title: 'Success',
          description: data,
        });
        setEmail('');
        // If this was bootstrap, update state
        if (isBootstrap) {
          setIsBootstrap(false);
        }
      } else if (data?.startsWith('Info')) {
        toast({
          title: 'Information',
          description: data,
        });
      } else {
        toast({
          title: 'Error',
          description: data || 'Failed to assign admin role',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authorization
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>Admin Setup</CardTitle>
          </div>
          <CardDescription>
            {isBootstrap 
              ? 'Set up the first admin for your application'
              : 'Assign admin role to a user by entering their email address'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAssignAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  'Assign Admin'
                )}
              </Button>
            </div>
          </form>

          {isBootstrap && (
            <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium">
                <strong>First Admin Setup:</strong> No admins exist yet. 
                The first user you assign will become the initial administrator.
              </p>
            </div>
          )}

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> The user must already be registered in the system. 
              This will update their role to admin or create an admin role if they don't have one.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSetup;
