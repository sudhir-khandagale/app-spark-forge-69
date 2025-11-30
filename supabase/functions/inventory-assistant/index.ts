import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, storeId } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user owns this store
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user || store?.owner_id !== user.id) {
      throw new Error('Unauthorized');
    }

    // Get current inventory context
    const { data: inventory } = await supabase
      .from('inventory')
      .select('id, quantity, price, low_stock_threshold, products(id, name, category, barcode)')
      .eq('store_id', storeId)
      .limit(100);

    const systemPrompt = `You are an AI inventory assistant for a local store. Help vendors manage their inventory efficiently.

Current Inventory Summary:
${inventory?.map(item => `- ${item.products?.name}: ${item.quantity} units @ ₹${item.price} (threshold: ${item.low_stock_threshold})`).join('\n')}

Available Actions:
1. UPDATE_STOCK: Update product quantity
2. UPDATE_PRICE: Update product price
3. BULK_UPDATE: Update multiple products
4. SEARCH: Find specific products
5. INSIGHTS: Provide inventory insights
6. RESTOCK_RECOMMENDATIONS: Suggest what to restock

Respond in a friendly, helpful manner. When performing actions, return structured JSON with the action type and parameters.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'update_stock',
              description: 'Update stock quantity for a product',
              parameters: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  new_quantity: { type: 'number' }
                },
                required: ['product_name', 'new_quantity']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'update_price',
              description: 'Update price for a product',
              parameters: {
                type: 'object',
                properties: {
                  product_name: { type: 'string' },
                  new_price: { type: 'number' }
                },
                required: ['product_name', 'new_price']
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'get_low_stock',
              description: 'Get products that are running low on stock',
              parameters: {
                type: 'object',
                properties: {}
              }
            }
          },
          {
            type: 'function',
            function: {
              name: 'bulk_update_stock',
              description: 'Update stock for multiple products',
              parameters: {
                type: 'object',
                properties: {
                  updates: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product_name: { type: 'string' },
                        new_quantity: { type: 'number' }
                      }
                    }
                  }
                },
                required: ['updates']
              }
            }
          }
        ]
      }),
    });

    const aiData = await response.json();
    const aiMessage = aiData.choices[0].message;

    // Execute tool calls if any
    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      const toolCall = aiMessage.tool_calls[0];
      const functionName = toolCall.function.name;
      const args = JSON.parse(toolCall.function.arguments);

      let result;
      switch (functionName) {
        case 'update_stock': {
          const invItem = inventory?.find(i => 
            i.products?.name.toLowerCase().includes(args.product_name.toLowerCase())
          );
          if (invItem) {
            await supabase
              .from('inventory')
              .update({ quantity: args.new_quantity })
              .eq('id', invItem.id);
            result = `Updated ${invItem.products?.name} stock to ${args.new_quantity} units`;
          } else {
            result = `Product "${args.product_name}" not found`;
          }
          break;
        }
        case 'update_price': {
          const invItem = inventory?.find(i => 
            i.products?.name.toLowerCase().includes(args.product_name.toLowerCase())
          );
          if (invItem) {
            await supabase
              .from('inventory')
              .update({ price: args.new_price })
              .eq('id', invItem.id);
            result = `Updated ${invItem.products?.name} price to ₹${args.new_price}`;
          } else {
            result = `Product "${args.product_name}" not found`;
          }
          break;
        }
        case 'get_low_stock': {
          const lowStock = inventory?.filter(i => i.quantity <= i.low_stock_threshold);
          result = lowStock?.map(i => `${i.products?.name}: ${i.quantity} units (needs restocking)`).join('\n') || 'All products are well-stocked!';
          break;
        }
        case 'bulk_update_stock': {
          const updates = args.updates || [];
          for (const update of updates) {
            const invItem = inventory?.find(i => 
              i.products?.name.toLowerCase().includes(update.product_name.toLowerCase())
            );
            if (invItem) {
              await supabase
                .from('inventory')
                .update({ quantity: update.new_quantity })
                .eq('id', invItem.id);
            }
          }
          result = `Updated stock for ${updates.length} products`;
          break;
        }
        default:
          result = 'Unknown action';
      }

      return new Response(
        JSON.stringify({ 
          message: aiMessage.content || result,
          action: functionName,
          result 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: aiMessage.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inventory-assistant:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
