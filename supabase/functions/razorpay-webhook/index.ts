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

  // Handle GET requests from payment link callback
  if (req.method === 'GET') {
    const url = new URL(req.url);
    const razorpay_payment_id = url.searchParams.get('razorpay_payment_id');
    const razorpay_payment_link_id = url.searchParams.get('razorpay_payment_link_id');
    const razorpay_payment_link_reference_id = url.searchParams.get('razorpay_payment_link_reference_id');
    const razorpay_payment_link_status = url.searchParams.get('razorpay_payment_link_status');
    const razorpay_signature = url.searchParams.get('razorpay_signature');

    console.log('Payment callback received:', {
      payment_id: razorpay_payment_id,
      link_id: razorpay_payment_link_id,
      status: razorpay_payment_link_status
    });

    if (razorpay_payment_link_status === 'paid') {
      // Redirect to success page
      const baseUrl = (Deno.env.get('SUPABASE_URL') || '').replace('/functions/v1/razorpay-webhook', '');
      return Response.redirect(`${baseUrl}/payment-success?payment_id=${razorpay_payment_id}`, 302);
    }

    const baseUrl = (Deno.env.get('SUPABASE_URL') || '').replace('/functions/v1/razorpay-webhook', '');
    return Response.redirect(`${baseUrl}/dashboard/store`, 302);
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();
    
    // Verify webhook signature for POST requests
    if (signature && !verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;
    
    console.log('Webhook event:', event);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle payment.captured event (for payment links)
    if (event === 'payment.captured') {
      const paymentData = payload.payload.payment.entity;
      const notes = paymentData.notes;
      
      console.log('Payment captured:', paymentData.id, 'Notes:', notes);

      if (notes && notes.type === 'subscription' && notes.store_id && notes.tier) {
        const storeId = notes.store_id;
        const tier = notes.tier;

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

        // Calculate expiry (1 month from now)
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        // Update subscription
        const { data: existing } = await supabaseAdmin
          .from('vendor_subscriptions')
          .select('id')
          .eq('store_id', storeId)
          .single();

        if (existing) {
          await supabaseAdmin
            .from('vendor_subscriptions')
            .update({
              tier: tier,
              features: features[tier as keyof typeof features] || features.free,
              razorpay_subscription_id: paymentData.id,
              razorpay_plan_id: null,
              status: 'active',
              expires_at: expiresAt.toISOString()
            })
            .eq('store_id', storeId);
        } else {
          await supabaseAdmin
            .from('vendor_subscriptions')
            .insert({
              store_id: storeId,
              tier: tier,
              features: features[tier as keyof typeof features] || features.free,
              razorpay_subscription_id: paymentData.id,
              razorpay_plan_id: null,
              status: 'active',
              expires_at: expiresAt.toISOString()
            });
        }

        console.log(`Subscription activated for store ${storeId} with tier ${tier}`);
      }
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
