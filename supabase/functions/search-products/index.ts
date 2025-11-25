import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation
const validateSearchInput = (input: any) => {
  const errors: string[] = [];
  
  if (!input.query || typeof input.query !== 'string') {
    errors.push('Query is required and must be a string');
  } else if (input.query.trim().length === 0) {
    errors.push('Query cannot be empty');
  } else if (input.query.length > 200) {
    errors.push('Query must be less than 200 characters');
  }
  
  if (input.latitude !== undefined) {
    if (typeof input.latitude !== 'number' || input.latitude < -90 || input.latitude > 90) {
      errors.push('Latitude must be a number between -90 and 90');
    }
  }
  
  if (input.longitude !== undefined) {
    if (typeof input.longitude !== 'number' || input.longitude < -180 || input.longitude > 180) {
      errors.push('Longitude must be a number between -180 and 180');
    }
  }
  
  if (input.maxDistance !== undefined) {
    if (typeof input.maxDistance !== 'number' || input.maxDistance < 0 || input.maxDistance > 100) {
      errors.push('MaxDistance must be a number between 0 and 100');
    }
  }
  
  return errors;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawInput = await req.json();
    
    // Validate input
    const validationErrors = validateSearchInput(rawInput);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: validationErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { query, latitude, longitude, maxDistance = 10 } = rawInput;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Use AI to understand natural language and extract search intent
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an intelligent product search assistant. Analyze natural language queries and extract:
1. Core product terms and synonyms
2. Product categories (e.g., "electronics", "clothing", "food")
3. Intent keywords (e.g., "cheap" → "budget", "gift" → "present")
4. Related product suggestions

Return ONLY a JSON object with this structure:
{
  "searchTerms": ["term1", "term2", "term3"],
  "categories": ["category1", "category2"],
  "recommendations": ["product1", "product2", "product3"]
}

Examples:
"cheap running shoes" → {"searchTerms": ["running shoes", "sneakers", "athletic shoes", "trainers"], "categories": ["footwear", "sports"], "recommendations": ["workout shoes", "gym shoes", "jogging shoes"]}
"birthday gift for mom" → {"searchTerms": ["gift", "present"], "categories": ["gifts", "accessories", "jewelry"], "recommendations": ["perfume", "jewelry", "handbag", "scarf"]}
"dinner ingredients" → {"searchTerms": ["food", "ingredients"], "categories": ["groceries", "food"], "recommendations": ["pasta", "vegetables", "meat", "spices"]}`
          },
          {
            role: 'user',
            content: query
          }
        ],
      }),
    });

    let searchTerms = [query];
    let recommendations: string[] = [];
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices[0]?.message?.content;
      try {
        const parsed = JSON.parse(content);
        if (parsed.searchTerms && Array.isArray(parsed.searchTerms)) {
          searchTerms = [...searchTerms, ...parsed.searchTerms];
        }
        if (parsed.categories && Array.isArray(parsed.categories)) {
          searchTerms = [...searchTerms, ...parsed.categories];
        }
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          recommendations = parsed.recommendations;
        }
      } catch (e) {
        console.log('Could not parse AI response, using original query:', e);
      }
    }

    // Search for products using expanded terms
    const searchPattern = searchTerms.map(term => 
      term.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    ).join('|');

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, category, image_url')
      .or(searchTerms.map(term => 
        `name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`
      ).join(','));

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ results: [], message: 'No products found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get inventory for these products from approved stores
    const productIds = products.map(p => p.id);
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select(`
        *,
        store:stores!inner(
          id,
          name,
          address,
          latitude,
          longitude,
          rating,
          phone,
          status
        )
      `)
      .in('product_id', productIds)
      .eq('in_stock', true)
      .eq('store.status', 'approved');

    if (inventoryError) {
      throw inventoryError;
    }

    // Calculate distances if location provided
    const results = inventory?.map((inv: any) => {
      let distance = null;
      if (latitude && longitude && inv.store.latitude && inv.store.longitude) {
        const R = 3959; // Earth's radius in miles
        const lat1 = latitude * Math.PI / 180;
        const lat2 = inv.store.latitude * Math.PI / 180;
        const dLat = (inv.store.latitude - latitude) * Math.PI / 180;
        const dLon = (inv.store.longitude - longitude) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) * Math.cos(lat2) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      const product = products.find(p => p.id === inv.product_id);

      return {
        id: inv.product_id,
        name: product?.name,
        description: product?.description,
        category: product?.category,
        image_url: product?.image_url,
        store_id: inv.store.id,
        store_name: inv.store.name,
        store_address: inv.store.address,
        store_rating: inv.store.rating,
        store_phone: inv.store.phone,
        price: inv.price,
        quantity: inv.quantity,
        in_stock: inv.in_stock,
        distance: distance,
        store_latitude: inv.store.latitude,
        store_longitude: inv.store.longitude
      };
    }) || [];

    // Filter by distance if provided
    const filteredResults = results.filter(r => 
      !maxDistance || !r.distance || r.distance <= maxDistance
    );

    // Sort by distance if available, otherwise by rating
    filteredResults.sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      return (b.store_rating || 0) - (a.store_rating || 0);
    });

    return new Response(
      JSON.stringify({ 
        results: filteredResults, 
        searchTerms,
        recommendations: recommendations.slice(0, 5)
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-products:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});