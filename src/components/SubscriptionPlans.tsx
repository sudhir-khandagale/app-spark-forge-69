import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Star, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlansProps {
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
    ]
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
    ]
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
    ]
  }
];

export default function SubscriptionPlans({ 
  storeId, 
  currentTier = 'free',
  onUpgrade 
}: SubscriptionPlansProps) {
  const { toast } = useToast();
  const [upgradingTier, setUpgradingTier] = useState<string | null>(null);

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgradingTier(tier);
      
      const selectedTier = tiers.find(t => t.id === tier);
      if (!selectedTier) return;

      // Call Razorpay edge function with callback URL
      const callbackUrl = `${window.location.origin}/vendor/dashboard/${storeId}`;
      const { data, error } = await supabase.functions.invoke('razorpay-subscription', {
        body: {
          action: 'create_subscription',
          tier: tier,
          storeId: storeId,
          callbackUrl: callbackUrl
        }
      });

      if (error) throw error;

      if (tier === 'free') {
        toast({
          title: 'Subscription Updated!',
          description: `You're now on the ${selectedTier.name} plan.`
        });
        onUpgrade?.();
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
      setUpgradingTier(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Unlock powerful features to grow your business
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const isCurrent = currentTier === tier.id;

          return (
            <Card 
              key={tier.id} 
              className={`relative flex flex-col ${isCurrent ? 'border-primary shadow-lg' : ''}`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">{tier.badge}</Badge>
                </div>
              )}
              
              <CardHeader className={`${tier.bgColor} space-y-3`}>
                <div className="flex items-center gap-2">
                  <Icon className={`h-6 w-6 ${tier.color}`} />
                  <CardTitle className="text-xl">{tier.name}</CardTitle>
                </div>
                <div>
                  <span className="text-3xl sm:text-4xl font-bold">₹{tier.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                {isCurrent && (
                  <Badge variant="outline" className="w-fit">
                    <Check className="h-3 w-3 mr-1" />
                    Current Plan
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="pt-6 flex-1 flex flex-col">
                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  size="lg"
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || upgradingTier !== null}
                  onClick={() => handleUpgrade(tier.id)}
                >
                  {isCurrent 
                    ? 'Current Plan' 
                    : upgradingTier === tier.id 
                      ? 'Processing...' 
                      : tier.id === 'free' 
                        ? 'Downgrade' 
                        : 'Upgrade Now'
                  }
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              All plans include a 7-day free trial. Cancel anytime.
            </p>
            <p>Prices shown are in Indian Rupees (₹). Secure payments via Razorpay.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plan Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4">Feature</th>
                  <th className="text-center py-3 px-2">Free</th>
                  <th className="text-center py-3 px-2">Pro</th>
                  <th className="text-center py-3 px-2">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-3 pr-4">Products</td>
                  <td className="text-center py-3 px-2">50</td>
                  <td className="text-center py-3 px-2">500</td>
                  <td className="text-center py-3 px-2">Unlimited</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Analytics</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Flash Sales</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Bulk Upload</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Featured Listing</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">24/7 Support</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2">-</td>
                  <td className="text-center py-3 px-2"><Check className="h-4 w-4 mx-auto text-green-600" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}