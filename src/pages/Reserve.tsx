import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '@/components/BackButton';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import { useState } from 'react';
import { useUserActivity } from '@/hooks/useUserActivity';

const reservationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  phone: z.string().trim().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format').min(10, 'Phone number is too short'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email must be less than 255 characters'),
  pickupTime: z.string().min(1, 'Pickup time is required'),
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms')
});

type ReservationFormData = z.infer<typeof reservationSchema>;

const Reserve = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logActivity } = useUserActivity();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      termsAccepted: false
    }
  });

  const termsAccepted = watch('termsAccepted');

  const calculateExpiryTime = (pickupTime: string): string => {
    const now = new Date();
    switch (pickupTime) {
      case 'Within 2 hours':
        return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
      case 'Within 4 hours':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
      case 'Today (before closing)':
        const endOfDay = new Date(now);
        endOfDay.setHours(20, 0, 0, 0);
        return endOfDay.toISOString();
      case 'Tomorrow':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    }
  };

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true);

    try {
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please sign in to make a reservation',
          variant: 'destructive'
        });
        navigate('/auth');
        return;
      }

      // For demo purposes, we'll use mock product/store/inventory IDs
      // In production, these would come from the product details page
      const mockProductId = id || '00000000-0000-0000-0000-000000000000';
      const mockStoreId = '00000000-0000-0000-0000-000000000000';
      const mockInventoryId = '00000000-0000-0000-0000-000000000000';

      const { error } = await supabase.from('reservations').insert({
        user_id: user.id,
        product_id: mockProductId,
        store_id: mockStoreId,
        inventory_id: mockInventoryId,
        contact_info: {
          name: data.name,
          phone: data.phone,
          email: data.email
        },
        expires_at: calculateExpiryTime(data.pickupTime),
        status: 'pending'
      });

      if (error) throw error;

      // Log activity
      await logActivity('reservation', {
        productId: mockProductId,
        storeId: mockStoreId
      });

      toast({
        title: 'Reservation Confirmed',
        description: 'Your item has been reserved. You will receive a confirmation email shortly.'
      });

      navigate('/profile');
    } catch (error) {
      console.error('Reservation error:', error);
      toast({
        title: 'Reservation Failed',
        description: 'Unable to complete reservation. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <BackButton fallbackPath={`/product/${id || '1'}`} />
          <h1 className="text-xl font-bold">Reserve Item</h1>
        </div>
      </header>

      {/* Reservation Form */}
      <main className="flex-1 p-4">
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto space-y-6">
          {/* Product Summary */}
          <div className="p-4 bg-card border border-border rounded-lg">
            <h3 className="font-semibold mb-1">Sony WH-1000XM4</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Tech Store Downtown
            </p>
            <p className="text-lg font-semibold text-primary">$349</p>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="(555) 123-4567" 
                {...register('phone')}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Pickup Time */}
          <div className="space-y-2">
            <Label htmlFor="pickupTime">Pickup Time</Label>
            <select
              id="pickupTime"
              {...register('pickupTime')}
              className={`w-full p-2 bg-background border rounded-md ${
                errors.pickupTime ? 'border-destructive' : 'border-input'
              }`}
            >
              <option value="">Select pickup time</option>
              <option>Within 2 hours</option>
              <option>Within 4 hours</option>
              <option>Today (before closing)</option>
              <option>Tomorrow</option>
            </select>
            {errors.pickupTime && (
              <p className="text-sm text-destructive">{errors.pickupTime.message}</p>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setValue('termsAccepted', checked === true)}
            />
            <Label htmlFor="terms" className="text-sm cursor-pointer leading-tight">
              I agree to the store's reservation policy and understand that this
              item will be held for the selected timeframe.
            </Label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Confirming...' : 'Confirm Reservation'}
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              type="button"
              onClick={() => navigate(`/product/${id || '1'}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
};

export default Reserve;
