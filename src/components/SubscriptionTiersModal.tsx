import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionTiersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  currentTier?: string;
  onUpgrade?: () => void;
}

const tiers = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    icon: Zap,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900',
    features: [
      'Basic inventory management',
      'Up to 50 products',
      'Store profile page',
      'Customer reviews',
      'Manual stock updates'
    ],
    limits: {
      analytics: false,
      flash_sales: false,
      bulk_upload: false,
      priority_support: false,
      featured_listing: false
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 999,
    icon: Star,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    badge: 'Most Popular',
    features: [
      'Everything in Free',
      'Advanced analytics dashboard',
      'Flash sales & promotions',
      'Bulk CSV upload (500 products)',
      'Priority email support',
      'Performance insights'
    ],
    limits: {
      analytics: true,
      flash_sales: true,
      bulk_upload: true,
      priority_support: false,
      featured_listing: false
    }
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 2499,
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950',
    badge: 'Best Value',
    features: [
      'Everything in Pro',
      'Unlimited products',
      'Featured store listing',
      'Competitive intelligence',
      '24/7 priority support',
      'Custom branding options',
      'API access',
      'Dedicated account manager'
    ],
    limits: {
      analytics: true,
      flash_sales: true,
      bulk_upload: true,
      priority_support: true,
      featured_listing: true
    }
  }
];

export default function SubscriptionTiersModal({ 
  open, 
  onOpenChange, 
  storeId, 
  currentTier = 'free',
  onUpgrade 
}: SubscriptionTiersModalProps) {
  const { toast } = useToast();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgrading(true);
      
      const selectedTier = tiers.find(t => t.id === tier);
      if (!selectedTier) return;

      // Call Razorpay edge function
      const { data, error } = await supabase.functions.invoke('razorpay-subscription', {
        body: {
          action: 'create_subscription',
          tier: tier,
          storeId: storeId
        }
      });

      if (error) throw error;

      if (tier === 'free') {
        toast({
          title: 'Subscription Updated!',
          description: `You're now on the ${selectedTier.name} plan.`
        });
        onUpgrade?.();
        onOpenChange(false);
        return;
      }

      // Open Razorpay payment page
      if (data.short_url) {
        console.log('Redirecting to payment link:', data.short_url);
        window.location.href = data.short_url;
      } else {
        console.error('Missing payment link:', data);
        throw new Error('Invalid payment configuration');
      }
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process subscription',
        variant: 'destructive'
      });
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Unlock powerful features to grow your business
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-6 py-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            const isCurrent = currentTier === tier.id;

            return (
              <Card 
                key={tier.id} 
                className={`relative ${isCurrent ? 'border-primary shadow-lg' : ''}`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">{tier.badge}</Badge>
                  </div>
                )}
                
                <CardHeader className={tier.bgColor}>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-6 w-6 ${tier.color}`} />
                    <CardTitle>{tier.name}</CardTitle>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">₹{tier.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {isCurrent && (
                    <Badge variant="outline" className="mt-2 w-fit">Current Plan</Badge>
                  )}
                </CardHeader>

                <CardContent className="pt-6">
                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={isCurrent ? 'outline' : 'default'}
                    disabled={isCurrent || upgrading}
                    onClick={() => handleUpgrade(tier.id)}
                  >
                    {isCurrent ? 'Current Plan' : upgrading ? 'Processing...' : tier.id === 'free' ? 'Downgrade' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include a 7-day free trial. Cancel anytime.</p>
          <p className="mt-1">Prices shown are in Indian Rupees (₹)</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
