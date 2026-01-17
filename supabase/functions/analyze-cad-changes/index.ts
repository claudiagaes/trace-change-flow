import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisResult {
  changes: {
    type: string;
    description: string;
    confidence: number;
  }[];
  classification: {
    geometry_changed: boolean;
    material_changed: boolean;
    tolerances_changed: boolean;
    weight_changed: boolean;
    surface_finish_changed: boolean;
    supplier_changed: boolean;
    process_changed: boolean;
  };
  summary: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { beforeImage, afterImage } = await req.json();

    if (!beforeImage || !afterImage) {
      return new Response(
        JSON.stringify({ error: 'Both before and after images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing CAD drawings for changes...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert CAD/engineering drawing analyst. Compare the two engineering drawings (before and after) and identify all changes between them.

For each change you detect, determine which category it falls into:
- geometry_changed: Physical shape, dimensions, or form changes
- material_changed: Different material specification or callout
- tolerances_changed: Tolerance values or GD&T changes
- weight_changed: Weight specification changes
- surface_finish_changed: Surface treatment, coating, or finish changes
- supplier_changed: Supplier or part source changes
- process_changed: Manufacturing process or method changes

Respond in JSON format:
{
  "changes": [
    {
      "type": "geometry_changed|material_changed|tolerances_changed|weight_changed|surface_finish_changed|supplier_changed|process_changed",
      "description": "Clear description of what changed",
      "confidence": 0.0-1.0
    }
  ],
  "classification": {
    "geometry_changed": true/false,
    "material_changed": true/false,
    "tolerances_changed": true/false,
    "weight_changed": true/false,
    "surface_finish_changed": true/false,
    "supplier_changed": true/false,
    "process_changed": true/false
  },
  "summary": "Brief overall summary of the changes"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Compare these two engineering drawings. The first image is the BEFORE (original) design, and the second image is the AFTER (updated) design. Identify all changes between them.'
              },
              {
                type: 'image_url',
                image_url: { url: beforeImage }
              },
              {
                type: 'image_url',
                image_url: { url: afterImage }
              }
            ]
          }
        ],
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    console.log('AI Analysis complete:', content);

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a default analysis if parsing fails
      analysis = {
        changes: [{ type: 'geometry_changed', description: 'Unable to parse detailed changes. Manual review recommended.', confidence: 0.5 }],
        classification: {
          geometry_changed: true,
          material_changed: false,
          tolerances_changed: false,
          weight_changed: false,
          surface_finish_changed: false,
          supplier_changed: false,
          process_changed: false,
        },
        summary: 'Analysis completed but detailed parsing failed. Please review manually.',
      };
    }

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error analyzing CAD changes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze changes';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});