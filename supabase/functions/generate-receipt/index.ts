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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        stores (name, address, phone, email)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
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

    // Generate receipt HTML
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