import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');

// Razorpay Plan Configurations
// NOTE: Plans MUST be created in Razorpay Dashboard first!
// For now, we'll create payment links instead of subscriptions for easier testing
const PLAN_CONFIGS = {
  free: { amount: 0, name: 'Free Plan' },
  pro: { amount: 99900, name: 'Pro Plan - ₹999/month' },
  premium: { amount: 249900, name: 'Premium Plan - ₹2499/month' }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, tier, storeId } = await req.json();

    console.log(`Processing ${action} for tier ${tier}, storeId ${storeId}`);

    // Get or create Razorpay customer
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('razorpay_customer_id, email, display_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.razorpay_customer_id;

    if (!customerId) {
      // Create Razorpay customer
      const customerResponse = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile?.display_name || 'Vendor',
          email: profile?.email || user.email,
          notes: {
            user_id: user.id,
            store_id: storeId
          }
        })
      });

      const customer = await customerResponse.json();
      customerId = customer.id;

      // Save customer ID
      await supabaseClient
        .from('profiles')
        .update({ razorpay_customer_id: customerId })
        .eq('id', user.id);

      console.log('Created Razorpay customer:', customerId);
    }

    if (action === 'create_subscription') {
      if (tier === 'free') {
        // Handle free tier - no payment needed
        const { data: existing } = await supabaseClient
          .from('vendor_subscriptions')
          .select('id')
          .eq('store_id', storeId)
          .single();

        if (existing) {
          await supabaseClient
            .from('vendor_subscriptions')
            .update({
              tier: 'free',
              features: {
                analytics: false,
                flash_sales: false,
                bulk_upload: false,
                priority_support: false,
                featured_listing: false
              },
              expires_at: null,
              razorpay_subscription_id: null,
              razorpay_plan_id: null,
              status: 'active'
            })
            .eq('store_id', storeId);
        } else {
          await supabaseClient
            .from('vendor_subscriptions')
            .insert({
              store_id: storeId,
              tier: 'free',
              features: {
                analytics: false,
                flash_sales: false,
                bulk_upload: false,
                priority_support: false,
                featured_listing: false
              },
              status: 'active'
            });
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Downgraded to free plan' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const planConfig = PLAN_CONFIGS[tier as keyof typeof PLAN_CONFIGS];
      if (!planConfig) {
        throw new Error('Invalid tier');
      }

      // Create a Payment Link for one-time subscription payment
      // This is simpler than subscriptions and works in test mode
      const paymentLinkResponse = await fetch('https://api.razorpay.com/v1/payment_links', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: planConfig.amount,
          currency: 'INR',
          description: planConfig.name,
          customer: {
            name: profile?.display_name || 'Vendor',
            email: profile?.email || user.email
          },
          notify: {
            sms: false,
            email: true
          },
          reminder_enable: false,
          notes: {
            user_id: user.id,
            store_id: storeId,
            tier: tier,
            type: 'subscription'
          }
        })
      });

      if (!paymentLinkResponse.ok) {
        const errorData = await paymentLinkResponse.json();
        console.error('Razorpay payment link creation failed:', errorData);
        throw new Error(errorData.error?.description || 'Failed to create payment link');
      }

      const paymentLink = await paymentLinkResponse.json();
      console.log('Created payment link:', paymentLink.id, 'short_url:', paymentLink.short_url);

      // Return payment link details for frontend
      return new Response(
        JSON.stringify({
          success: true,
          payment_link_id: paymentLink.id,
          short_url: paymentLink.short_url,
          razorpay_key: RAZORPAY_KEY_ID,
          amount: planConfig.amount,
          currency: 'INR',
          name: planConfig.name,
          description: planConfig.name
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'cancel_subscription') {
      const { data: subscription } = await supabaseClient
        .from('vendor_subscriptions')
        .select('razorpay_subscription_id')
        .eq('store_id', storeId)
        .single();

      if (subscription?.razorpay_subscription_id) {
        await fetch(`https://api.razorpay.com/v1/subscriptions/${subscription.razorpay_subscription_id}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cancel_at_cycle_end: 0 })
        });
      }

      await supabaseClient
        .from('vendor_subscriptions')
        .update({ status: 'cancelled' })
        .eq('store_id', storeId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in razorpay-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
