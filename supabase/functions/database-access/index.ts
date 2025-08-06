// Setup type definitions for built-in Supabase Runtime APIs
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization')
        }
      }
    });
    let claims: any = {};
    let user = null;
    let fullProfile = null;
    try {
      const rawBody = await req.text();
      console.log('DEBUG: Raw request body:', rawBody);
      if (!rawBody) {
        console.error('DEBUG: Empty request body received.');
      } else {
        const body = JSON.parse(rawBody);
        user = body.user || body.event?.user || body.event?.record || body;
        claims = body.claims || body.event?.claims || {};
      }
    } catch (e) {
      console.error('Error parsing request body:', e);
    }
    let organization_id = null;
    try {
      if (!user || !user.id) {
        console.error('Missing user or user.id in request body', { user });
      } else {
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        if (error || !data) {
          console.error('Error fetching user profile:', error);
        } else {
          organization_id = data.organization_id;
          fullProfile = data;
        }
      }
    } catch (e) {
      console.error('Unexpected error in jwt-claims function:', e);
    }
    if (organization_id) {
      claims.organization_id = organization_id;
    }
    if (fullProfile) {
      claims.profile = {
        id: fullProfile.id,
        email: fullProfile.email,
        first_name: fullProfile.first_name,
        last_name: fullProfile.last_name,
        role: fullProfile.role,
        organization_id: fullProfile.organization_id,
        department: fullProfile.department,
        avatar_url: fullProfile.avatar_url,
        phone: fullProfile.phone,
        employee_id: fullProfile.employee_id,
        is_active: fullProfile.is_active
      };
    }
    return new Response(JSON.stringify({
      app_metadata: {},
      user_metadata: {},
      claims
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
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
