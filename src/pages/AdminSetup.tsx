import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Shield } from 'lucide-react';

const AdminSetup = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-primary" />
            <CardTitle>Admin Setup</CardTitle>
          </div>
          <CardDescription>
            Assign admin role to a user by entering their email address
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
                {isLoading ? 'Assigning...' : 'Assign Admin'}
              </Button>
            </div>
          </form>

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
