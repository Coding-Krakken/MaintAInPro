// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
Deno.serve(async (req)=>{
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    // Removed unused table_name query
    let event;
    let claims: any = {};
    let user = null;
    try {
      // Read the raw body as text for debugging
      const rawBody = await req.text();
      console.log('DEBUG: Raw request body:', rawBody);
      if (!rawBody) {
        console.error('DEBUG: Empty request body received.');
      } else {
        // Try to parse JSON
        const body = JSON.parse(rawBody);
        user = body.user || body;
        // Accept claims from the incoming payload (for Supabase hooks)
        claims = body.claims || {};
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
    }
    let organization_id = null;
    try {
      if (!user || !user.id) {
        console.error('Missing user or user.id in request body');
      } else {
        // Fetch the user's organization_id from the users table
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
        const { data, error } = await supabaseAdmin.from('users').select('organization_id').eq('id', user.id).single();
        if (error || !data) {
          console.error('Error fetching organization_id:', error);
        } else {
          organization_id = data.organization_id;
        }
      }
    } catch (e) {
      console.error('Unexpected error in jwt-claims function:', e);
    }
    // Add or override organization_id in claims if available
    if (organization_id) {
      claims.organization_id = organization_id;
    }
    // Always return the required structure, including all claims
    return new Response(JSON.stringify({
      app_metadata: {},
      user_metadata: {},
      claims
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // ...existing code...
  } catch (err) {
    return new Response(JSON.stringify({
      message: err?.message ?? err
    }), {
      headers: {
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
