import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, data } = await req.json();

    switch (action) {
      case 'get_store_stats': {
        const { storeId } = data;
        
        // Get store details
        const { data: store, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('id', storeId)
          .eq('owner_id', user.id)
          .single();

        if (storeError || !store) {
          return new Response(
            JSON.stringify({ error: 'Store not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get inventory count
        const { count: inventoryCount } = await supabase
          .from('inventory')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);

        // Get active reservations
        const { count: reservationsCount } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId)
          .eq('status', 'pending');

        // Get recent reviews
        const { data: reviews } = await supabase
          .from('reviews')
          .select('*, profiles(display_name)')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false })
          .limit(5);

        return new Response(
          JSON.stringify({
            store,
            inventoryCount: inventoryCount || 0,
            reservationsCount: reservationsCount || 0,
            reviews: reviews || []
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update_inventory': {
        const { inventoryId, quantity, price } = data;
        
        // Verify ownership through store
        const { data: inventory } = await supabase
          .from('inventory')
          .select('store_id, stores!inner(owner_id)')
          .eq('id', inventoryId)
          .single();

        if (!inventory || (inventory as any).stores?.owner_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const updateData: any = { last_updated: new Date().toISOString() };
        if (quantity !== undefined) updateData.quantity = quantity;
        if (price !== undefined) updateData.price = price;

        const { data: updated, error: updateError } = await supabase
          .from('inventory')
          .update(updateData)
          .eq('id', inventoryId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({ inventory: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'bulk_upload': {
        const { storeId, products } = data;

        // Verify store ownership
        const { data: store } = await supabase
          .from('stores')
          .select('id')
          .eq('id', storeId)
          .eq('owner_id', user.id)
          .single();

        if (!store) {
          return new Response(
            JSON.stringify({ error: 'Store not found or unauthorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const results: {
          success: any[];
          failed: any[];
        } = {
          success: [],
          failed: []
        };

        for (const product of products) {
          try {
            // Check if product exists by barcode or name
            let productId = null;
            
            if (product.barcode) {
              const { data: existingProduct } = await supabase
                .from('products')
                .select('id')
                .eq('barcode', product.barcode)
                .single();
              
              if (existingProduct) {
                productId = existingProduct.id;
              }
            }

            // If product doesn't exist, create it
            if (!productId) {
              const { data: newProduct, error: productError } = await supabase
                .from('products')
                .insert({
                  name: product.name,
                  description: product.description,
                  category: product.category,
                  barcode: product.barcode
                })
                .select()
                .single();

              if (productError) {
                results.failed.push({ product, error: productError.message });
                continue;
              }

              productId = newProduct.id;
            }

            // Upsert inventory
            const { error: inventoryError } = await supabase
              .from('inventory')
              .upsert({
                store_id: storeId,
                product_id: productId,
                quantity: product.quantity,
                price: product.price
              }, {
                onConflict: 'store_id,product_id'
              });

            if (inventoryError) {
              results.failed.push({ product, error: inventoryError.message });
            } else {
              results.success.push(product);
            }

          } catch (error) {
            results.failed.push({ product, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }

        return new Response(
          JSON.stringify(results),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'manage_reservation': {
        const { reservationId, status } = data;

        // Verify ownership through store
        const { data: reservation } = await supabase
          .from('reservations')
          .select('store_id, stores!inner(owner_id)')
          .eq('id', reservationId)
          .single();

        if (!reservation || (reservation as any).stores?.owner_id !== user.id) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: updated, error: updateError } = await supabase
          .from('reservations')
          .update({ status })
          .eq('id', reservationId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return new Response(
          JSON.stringify({ reservation: updated }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in store-dashboard:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});