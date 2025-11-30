import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractedProduct {
  name: string;
  description?: string;
  price?: number;
  category?: string;
  brand?: string;
  barcode?: string;
  quantity?: number;
  confidence: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const storeId = formData.get('storeId') as string;

    if (!file || !storeId) {
      return new Response(JSON.stringify({ error: 'File and storeId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Read file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(fileBuffer);
    
    let extractedText = '';
    let imageBase64 = '';

    // Handle different file types
    if (file.type.includes('image')) {
      // For images, convert to base64 for vision API
      const blob = new Blob([fileContent], { type: file.type });
      const buffer = await blob.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    } else if (file.type.includes('csv') || file.name.endsWith('.csv')) {
      // Parse CSV
      const decoder = new TextDecoder();
      extractedText = decoder.decode(fileContent);
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      // For Excel files, we need to extract text (simplified approach)
      const decoder = new TextDecoder();
      extractedText = decoder.decode(fileContent);
    } else if (file.type.includes('pdf')) {
      // For PDF, we'll pass it to AI for extraction
      const decoder = new TextDecoder();
      extractedText = decoder.decode(fileContent);
    } else {
      // Try to decode as text
      const decoder = new TextDecoder();
      extractedText = decoder.decode(fileContent);
    }

    // Use Lovable AI to extract product information
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert at extracting product information from documents and images. 
Extract products with these fields: name (required), description, price, category, brand, barcode, quantity.
Categories should be: Electronics, Clothing, Food & Beverages, Home & Garden, Sports, Beauty, Books, Toys, or Other.
Return ONLY a valid JSON array of products. Each product must have at least a name.
Example: [{"name":"Product 1","price":299,"category":"Electronics","quantity":10}]`
      }
    ];

    if (imageBase64) {
      // For images, use vision capabilities
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all product information from this catalog/shelf image. Include product names, visible prices, and estimate categories based on what you see.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${file.type};base64,${imageBase64}`
            }
          }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: `Extract product information from this document:\n\n${extractedText.slice(0, 10000)}`
      });
    }

    console.log('Calling Lovable AI for extraction...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    console.log('AI response:', aiContent);

    // Parse AI response
    let extractedProducts: ExtractedProduct[] = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        extractedProducts = JSON.parse(jsonMatch[0]);
      } else {
        extractedProducts = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Failed to extract products from document');
    }

    // Add confidence scores and validate
    extractedProducts = extractedProducts
      .filter(p => p.name && p.name.trim().length > 0)
      .map(product => ({
        ...product,
        confidence: product.price && product.category ? 0.9 : 0.7,
        category: product.category || 'Other',
        quantity: product.quantity || 0,
      }));

    if (extractedProducts.length === 0) {
      return new Response(JSON.stringify({ error: 'No products found in document' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for duplicates in existing inventory
    const existingProductNames = extractedProducts.map(p => p.name.toLowerCase());
    const { data: existingProducts } = await supabaseClient
      .from('inventory')
      .select(`
        product_id,
        products!inner(name)
      `)
      .eq('store_id', storeId);

    const duplicates = new Set<string>();
    if (existingProducts) {
      existingProducts.forEach(inv => {
        const productName = (inv.products as any)?.name?.toLowerCase();
        if (productName && existingProductNames.includes(productName)) {
          duplicates.add(productName);
        }
      });
    }

    // Mark duplicates
    const productsWithDuplicateInfo = extractedProducts.map(product => ({
      ...product,
      isDuplicate: duplicates.has(product.name.toLowerCase()),
    }));

    console.log(`Extracted ${extractedProducts.length} products, ${duplicates.size} duplicates found`);

    return new Response(
      JSON.stringify({
        success: true,
        products: productsWithDuplicateInfo,
        totalCount: extractedProducts.length,
        duplicateCount: duplicates.size,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in smart-inventory-upload:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process document',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
