import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { query, storeId, language = 'en' } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user owns the store
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const unauthorizedMessages: Record<string, string> = {
        en: 'Unauthorized',
        hi: 'अनधिकृत',
        bn: 'অননুমোদিত',
        te: 'అనధికారం',
        mr: 'अनधिकृत',
        ta: 'அங்கீகரிக்கப்படாதது',
        gu: 'અનધિકૃત',
        kn: 'ಅನಧಿಕೃತ',
        ml: 'അനധികൃത',
        pa: 'ਅਣਅਧਿਕਾਰਤ',
        or: 'ଅନଧିକୃତ',
        as: 'অননুমোদিত'
      };
      return new Response(JSON.stringify({ error: unauthorizedMessages[language] || unauthorizedMessages.en }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Parsing search query:', query);

    // Use AI to parse natural language query
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a search query parser for inventory management. Parse natural language queries into structured filters.
            
Extract:
- category: product category (snacks, beverages, dairy, etc.)
- minPrice: minimum price in rupees
- maxPrice: maximum price in rupees  
- stockStatus: "low", "out", "all"
- sortBy: "price_asc", "price_desc", "name", "stock"

Examples:
"snacks under 100" -> {category: "snacks", maxPrice: 100}
"beverages above 50" -> {category: "beverages", minPrice: 50}
"low stock items" -> {stockStatus: "low"}
"dairy products" -> {category: "dairy"}
"expensive products" -> {sortBy: "price_desc"}

Return ONLY valid JSON with extracted filters. If no filters found, return {}.`
          },
          {
            role: 'user',
            content: query
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "parse_search_query",
              description: "Parse natural language search query into structured filters",
              parameters: {
                type: "object",
                properties: {
                  category: { type: "string", description: "Product category" },
                  minPrice: { type: "number", description: "Minimum price" },
                  maxPrice: { type: "number", description: "Maximum price" },
                  stockStatus: { type: "string", enum: ["low", "out", "all"] },
                  sortBy: { type: "string", enum: ["price_asc", "price_desc", "name", "stock"] }
                },
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "parse_search_query" } }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI request failed: ${await aiResponse.text()}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract parsed filters from tool call
    let filters = {};
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      filters = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    }

    console.log('Parsed filters:', filters);

    const successMessages: Record<string, string> = {
      en: 'Search query parsed successfully',
      hi: 'खोज क्वेरी सफलतापूर्वक पार्स की गई',
      bn: 'সার্চ ক্যোয়ারী সফলভাবে পার্স করা হয়েছে',
      te: 'శోధన ప్రశ్న విజయవంతంగా పార్స్ చేయబడింది',
      mr: 'शोध क्वेरी यशस्वीरित्या पार्स केली',
      ta: 'தேடல் வினவல் வெற்றிகரமாக பாகுபடுத்தப்பட்டது',
      gu: 'શોધ ક્વેરી સફળતાપૂર્વક પાર્સ કરી',
      kn: 'ಹುಡುಕಾಟ ಪ್ರಶ್ನೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪಾರ್ಸ್ ಮಾಡಲಾಗಿದೆ',
      ml: 'തിരയൽ ചോദ്യം വിജയകരമായി പാർസ് ചെയ്തു',
      pa: 'ਖੋਜ ਕੁਐਰੀ ਸਫਲਤਾਪੂਰਵਕ ਪਾਰਸ ਕੀਤੀ ਗਈ',
      or: 'ସନ୍ଧାନ ପ୍ରଶ୍ନ ସଫଳତାର ସହ ପାର୍ସ କରାଗଲା',
      as: 'সন্ধান প্ৰশ্ন সফলভাৱে পাৰ্ছ কৰা হ'ল'
    };

    return new Response(JSON.stringify({ 
      filters,
      originalQuery: query,
      message: successMessages[language] || successMessages.en
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in smart-inventory-search:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});