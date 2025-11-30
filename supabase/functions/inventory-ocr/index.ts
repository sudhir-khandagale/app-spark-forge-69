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
    const { imageBase64, storeId, language = 'en' } = await req.json();
    const authHeader = req.headers.get('Authorization')!;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user owns this store
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    const { data: store } = await supabase
      .from('stores')
      .select('owner_id')
      .eq('id', storeId)
      .single();

    if (!user || store?.owner_id !== user.id) {
      const errorMessages: Record<string, string> = {
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
      throw new Error(errorMessages[language] || errorMessages.en);
    }

    // Use Lovable AI Vision to extract inventory data
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract inventory data from this image. Look for product names, quantities, and prices. Return a JSON array with this structure:
[
  {
    "name": "Product Name",
    "quantity": 10,
    "price": 50.00,
    "category": "Category Name (if visible)"
  }
]

Only return the JSON array, no other text. If you can't find clear inventory data, return an empty array.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        temperature: 0.1
      }),
    });

    const aiData = await response.json();
    const content = aiData.choices[0].message.content;

    // Parse the JSON response
    let products = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      products = JSON.parse(jsonStr);
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Could not extract inventory data from image. Please ensure the image shows a clear inventory list.');
    }

    if (!Array.isArray(products) || products.length === 0) {
      const noItemsMessages: Record<string, string> = {
        en: 'No inventory items found in the image. Please try a clearer photo.',
        hi: 'छवि में कोई इन्वेंट्री आइटम नहीं मिला। कृपया स्पष्ट फोटो का प्रयास करें।',
        bn: 'ছবিতে কোনো ইনভেন্টরি আইটেম পাওয়া যায়নি। দয়া করে স্পষ্ট ছবি চেষ্টা করুন।',
        te: 'చిత్రంలో ఇన్వెంటరీ ఐటెమ్‌లు కనుగొనబడలేదు. దయచేసి స్పష్టమైన ఫోటో ప్రయత్నించండి।',
        mr: 'प्रतिमेत कोणतेही इन्व्हेंटरी आयटम आढळले नाहीत. कृपया स्पष्ट फोटो वापरा।',
        ta: 'படத்தில் சரக்கு பொருட்கள் எதுவும் காணப்படவில்லை. தெளிவான புகைப்படத்தை முயற்சிக்கவும்.',
        gu: 'છબીમાં કોઈ ઇન્વેન્ટરી આઇટમ મળ્યું નથી. કૃપા કરીને સ્પષ્ટ ફોટો અજમાવો.',
        kn: 'ಚಿತ್ರದಲ್ಲಿ ದಾಸ್ತಾನು ಐಟಂಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಸ್ಪಷ್ಟ ಫೋಟೋ ಪ್ರಯತ್ನಿಸಿ.',
        ml: 'ചിത്രത്തിൽ ഇൻവെന്ററി ഇനങ്ങൾ കണ്ടെത്തിയില്ല. വ്യക്തമായ ഫോട്ടോ ശ്രമിക്കുക.',
        pa: 'ਤਸਵੀਰ ਵਿੱਚ ਕੋਈ ਇਨਵੈਂਟਰੀ ਆਈਟਮ ਨਹੀਂ ਮਿਲੀ। ਕਿਰਪਾ ਕਰਕੇ ਸਪੱਸ਼ਟ ਫੋਟੋ ਦੀ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
        or: 'ଚିତ୍ରରେ କୌଣସି ଭଣ୍ଡାର ଆଇଟମ୍ ମିଳିଲା ନାହିଁ। ଦୟାକରି ସ୍ପଷ୍ଟ ଫଟୋ ଚେଷ୍ଟା କରନ୍ତୁ।',
        as: 'ছবিত কোনো ইনভেণ্টৰী আইটেম পোৱা নগল। অনুগ্ৰহ কৰি স্পষ্ট ফটো চেষ্টা কৰক।'
      };
      throw new Error(noItemsMessages[language] || noItemsMessages.en);
    }

    const successMessages: Record<string, string> = {
      en: 'Successfully extracted inventory data',
      hi: 'इन्वेंट्री डेटा सफलतापूर्वक निकाला गया',
      bn: 'ইনভেন্টরি ডেটা সফলভাবে বের করা হয়েছে',
      te: 'ఇన్వెంటరీ డేటా విజయవంతంగా సేకరించబడింది',
      mr: 'इन्व्हेंटरी डेटा यशस्वीरित्या काढला',
      ta: 'சரக்கு தரவு வெற்றிகரமாக எடுக்கப்பட்டது',
      gu: 'ઇન્વેન્ટરી ડેટા સફળતાપૂર્વક કાઢવામાં આવ્યો',
      kn: 'ದಾಸ್ತಾನು ಡೇಟಾವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಹೊರತೆಗೆಯಲಾಗಿದೆ',
      ml: 'ഇൻവെന്ററി ഡാറ്റ വിജയകരമായി എക്‌സ്ട്രാക്റ്റ് ചെയ്തു',
      pa: 'ਇਨਵੈਂਟਰੀ ਡਾਟਾ ਸਫਲਤਾਪੂਰਵਕ ਐਕਸਟਰੈਕਟ ਕੀਤਾ ਗਿਆ',
      or: 'ଭଣ୍ଡାର ତଥ୍ୟ ସଫଳତାର ସହ ବାହାର କରାଗଲା',
      as: 'ইনভেণ্টৰী ডেটা সফলভাৱে উলিয়াই লোৱা হ'ল'
    };

    return new Response(
      JSON.stringify({ 
        products,
        message: successMessages[language] || successMessages.en
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in inventory-ocr:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
