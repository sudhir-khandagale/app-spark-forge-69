import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

function verifyWebhookSignature(body: string, signature: string): boolean {
  const expectedSignature = createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  
  return signature === expectedSignature;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    const subscriptionData = payload.payload.subscription.entity;
    
    console.log('Webhook event:', event, subscriptionData);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const storeId = subscriptionData.notes?.store_id;
    const tier = subscriptionData.notes?.tier || 'free';

    if (!storeId) {
      console.error('No store_id in subscription notes');
      return new Response('Missing store_id', { status: 400 });
    }

    // Feature mapping based on tier
    const features = {
      free: {
        analytics: false,
        flash_sales: false,
        bulk_upload: false,
        priority_support: false,
        featured_listing: false
      },
      pro: {
        analytics: true,
        flash_sales: true,
        bulk_upload: true,
        priority_support: false,
        featured_listing: false
      },
      premium: {
        analytics: true,
        flash_sales: true,
        bulk_upload: true,
        priority_support: true,
        featured_listing: true
      }
    };

    switch (event) {
      case 'subscription.activated':
      case 'subscription.charged': {
        // Update subscription to active
        const { data: existing } = await supabaseAdmin
          .from('vendor_subscriptions')
          .select('id')
          .eq('store_id', storeId)
          .single();

        const expiresAt = new Date(subscriptionData.current_end * 1000).toISOString();

        if (existing) {
          await supabaseAdmin
            .from('vendor_subscriptions')
            .update({
              tier: tier,
              features: features[tier as keyof typeof features] || features.free,
              razorpay_subscription_id: subscriptionData.id,
              razorpay_plan_id: subscriptionData.plan_id,
              status: 'active',
              expires_at: expiresAt
            })
            .eq('store_id', storeId);
        } else {
          await supabaseAdmin
            .from('vendor_subscriptions')
            .insert({
              store_id: storeId,
              tier: tier,
              features: features[tier as keyof typeof features] || features.free,
              razorpay_subscription_id: subscriptionData.id,
              razorpay_plan_id: subscriptionData.plan_id,
              status: 'active',
              expires_at: expiresAt
            });
        }

        console.log(`Subscription ${subscriptionData.id} activated for store ${storeId}`);
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.completed': {
        // Update subscription status
        await supabaseAdmin
          .from('vendor_subscriptions')
          .update({
            status: 'cancelled',
            tier: 'free',
            features: features.free
          })
          .eq('razorpay_subscription_id', subscriptionData.id);

        console.log(`Subscription ${subscriptionData.id} cancelled for store ${storeId}`);
        break;
      }

      case 'subscription.halted': {
        // Payment failed - update status
        await supabaseAdmin
          .from('vendor_subscriptions')
          .update({ status: 'payment_failed' })
          .eq('razorpay_subscription_id', subscriptionData.id);

        console.log(`Subscription ${subscriptionData.id} payment failed for store ${storeId}`);
        break;
      }

      default:
        console.log('Unhandled event:', event);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in razorpay-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
