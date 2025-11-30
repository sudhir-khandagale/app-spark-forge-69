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

    // Fetch order details with store info
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        stores (
          name, 
          address, 
          phone, 
          email,
          photo_urls
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Generate receipt number if not exists
    if (!order.receipt_number) {
      const receiptNumber = `INV${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      await supabaseClient
        .from('orders')
        .update({ receipt_number: receiptNumber })
        .eq('id', orderId);

      order.receipt_number = receiptNumber;
    }

    // Calculate tax breakdown (18% GST in India)
    const subtotal = order.total_amount / 1.18;
    const cgst = subtotal * 0.09; // 9% CGST
    const sgst = subtotal * 0.09; // 9% SGST
    const deliveryCharges = order.delivery_charges || 0;

    // Generate HTML invoice
    const invoiceHtml = generateInvoiceHtml({
      order,
      subtotal,
      cgst,
      sgst,
      deliveryCharges,
    });

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          receiptNumber: order.receipt_number,
          orderId: order.id,
          date: new Date(order.created_at).toISOString(),
          store: order.stores,
          items: order.items,
          subtotal: subtotal.toFixed(2),
          cgst: cgst.toFixed(2),
          sgst: sgst.toFixed(2),
          deliveryCharges: deliveryCharges.toFixed(2),
          totalAmount: order.total_amount,
          paymentStatus: order.payment_status,
          paymentId: order.razorpay_payment_id,
          deliveryTimeSlot: order.delivery_time_slot,
          deliveryAddress: order.delivery_address,
          html: invoiceHtml,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

function generateInvoiceHtml(data: any): string {
  const { order, subtotal, cgst, sgst, deliveryCharges } = data;
  const store = order.stores;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #f5f5f5; }
    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #1E3A5F; }
    .logo { font-size: 32px; font-weight: bold; color: #1E3A5F; }
    .logo-accent { color: #F47920; }
    .invoice-info { text-align: right; color: #666; }
    .invoice-number { font-size: 24px; font-weight: bold; color: #1E3A5F; margin-bottom: 5px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 14px; font-weight: 600; color: #1E3A5F; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
    .info-box { padding: 15px; background: #f8f9fa; border-radius: 8px; }
    .info-label { font-size: 12px; color: #666; margin-bottom: 5px; }
    .info-value { font-size: 14px; color: #333; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th { background: #1E3A5F; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    .item-name { font-weight: 500; color: #333; }
    .item-qty { color: #666; }
    .totals { margin-top: 30px; }
    .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
    .total-row.subtotal { color: #666; }
    .total-row.tax { color: #666; font-size: 13px; padding-left: 20px; }
    .total-row.final { font-size: 18px; font-weight: bold; border-top: 2px solid #1E3A5F; padding-top: 15px; margin-top: 10px; color: #1E3A5F; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-paid { background: #d4edda; color: #155724; }
    .badge-pending { background: #fff3cd; color: #856404; }
    .delivery-slot { background: #e7f3ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #F47920; }
    .delivery-slot-title { font-weight: 600; color: #1E3A5F; margin-bottom: 5px; }
    .delivery-slot-time { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="logo">Flow<span class="logo-accent">dux</span></div>
        <div style="color: #666; font-size: 12px; margin-top: 5px;">Local Shopping Made Easy</div>
      </div>
      <div class="invoice-info">
        <div class="invoice-number">#${order.receipt_number}</div>
        <div>Date: ${new Date(order.created_at).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        })}</div>
        <div style="margin-top: 5px;">
          <span class="badge ${order.payment_status === 'completed' ? 'badge-paid' : 'badge-pending'}">
            ${order.payment_status}
          </span>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-box">
        <div class="section-title">Bill From</div>
        <div class="info-value" style="font-weight: 600; margin-bottom: 8px;">${store.name}</div>
        <div class="info-label">${store.address}</div>
        ${store.phone ? `<div class="info-label">Phone: ${store.phone}</div>` : ''}
        ${store.email ? `<div class="info-label">Email: ${store.email}</div>` : ''}
      </div>
      
      <div class="info-box">
        <div class="section-title">Bill To</div>
        ${order.delivery_address ? `
          <div class="info-value">${order.delivery_address.name || 'Customer'}</div>
          <div class="info-label">${order.delivery_address.address || ''}</div>
          ${order.delivery_address.phone ? `<div class="info-label">Phone: ${order.delivery_address.phone}</div>` : ''}
        ` : '<div class="info-label">Customer</div>'}
      </div>
    </div>

    ${order.delivery_time_slot ? `
      <div class="delivery-slot">
        <div class="delivery-slot-title">🚚 Scheduled Delivery</div>
        <div class="delivery-slot-time">${order.delivery_time_slot}</div>
      </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${Array.isArray(order.items) ? order.items.map((item: any) => `
            <tr>
              <td class="item-name">${item.name}</td>
              <td style="text-align: center;" class="item-qty">${item.quantity}</td>
              <td style="text-align: right;">₹${item.price.toFixed(2)}</td>
              <td style="text-align: right; font-weight: 600;">₹${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('') : ''}
        </tbody>
      </table>
    </div>

    <div class="totals">
      <div class="total-row subtotal">
        <span>Subtotal (excluding GST)</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row tax">
        <span>CGST (9%)</span>
        <span>₹${cgst.toFixed(2)}</span>
      </div>
      <div class="total-row tax">
        <span>SGST (9%)</span>
        <span>₹${sgst.toFixed(2)}</span>
      </div>
      ${deliveryCharges > 0 ? `
        <div class="total-row subtotal">
          <span>Delivery Charges</span>
          <span>₹${deliveryCharges.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="total-row final">
        <span>Total Amount</span>
        <span>₹${order.total_amount.toFixed(2)}</span>
      </div>
    </div>

    ${order.razorpay_payment_id ? `
      <div class="section" style="margin-top: 30px;">
        <div class="section-title">Payment Information</div>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 13px;">
          <div style="color: #666;">Payment ID: <span style="color: #333; font-weight: 500;">${order.razorpay_payment_id}</span></div>
          <div style="color: #666; margin-top: 5px;">Payment Method: <span style="color: #333; font-weight: 500;">Razorpay</span></div>
        </div>
      </div>
    ` : ''}

    <div class="footer">
      <div style="margin-bottom: 10px; font-weight: 600; color: #666;">Thank you for shopping with Flowdux!</div>
      <div>This is a computer-generated invoice and does not require a signature.</div>
      <div style="margin-top: 10px;">For any queries, please contact the store directly.</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
