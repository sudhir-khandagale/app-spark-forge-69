import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Create user-scoped client to get the authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Use service role client for data operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        stores (name, address, phone, email, owner_id)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      throw new Error('Order not found');
    }

    // AUTHORIZATION CHECK: Verify user is either the order owner or the store vendor
    const isOrderOwner = order.user_id === user.id;
    const isStoreVendor = order.stores?.owner_id === user.id;
    
    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    const isAdmin = !!roleData;

    if (!isOrderOwner && !isStoreVendor && !isAdmin) {
      console.error('Authorization failed: user', user.id, 'trying to access order', orderId);
      return new Response(
        JSON.stringify({ error: 'You do not have permission to access this receipt' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // Generate receipt number if not exists
    if (!order.receipt_number) {
      const receiptNumber = `RCP${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await supabaseClient
        .from('orders')
        .update({ receipt_number: receiptNumber })
        .eq('id', orderId);

      order.receipt_number = receiptNumber;
    }

    // Generate receipt
    const receipt = {
      receiptNumber: order.receipt_number,
      orderId: order.id,
      date: new Date(order.created_at).toLocaleDateString(),
      store: order.stores,
      items: order.items,
      totalAmount: order.total_amount,
      paymentStatus: order.payment_status,
      paymentId: order.razorpay_payment_id,
    };

    console.log('Receipt generated successfully for order', orderId, 'by user', user.id);

    return new Response(
      JSON.stringify(receipt),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error('Error generating receipt:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
