// @ts-nocheck
// Deno Edge Function - TypeScript checking disabled for Deno environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Type definitions
interface EscalationRule {
  id: string;
  name: string;
  description: string;
  entity_type: string;
  conditions: {
    status?: string[];
    priority?: string[];
    assigned_to?: string | null;
  };
  actions: {
    notify?: string[];
    update_status?: string;
    assign_to?: string;
    update_priority?: string;
  };
  delay_hours: number;
  is_active: boolean;
}

interface WorkOrderItem {
  id: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  [key: string]: unknown;
}

type SupabaseClient = ReturnType<typeof createClient>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting escalation check...');

    // Get active escalation rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('escalation_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      console.error('Error fetching escalation rules:', rulesError);
      throw rulesError;
    }

    console.log(`Found ${rules.length} active escalation rules`);

    for (const rule of rules) {
      try {
        await processEscalationRule(supabaseClient, rule);
      } catch (error) {
        console.error(`Error processing rule ${rule.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: rules.length,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in escalation checker:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function processEscalationRule(
  supabaseClient: SupabaseClient,
  rule: EscalationRule
) {
  console.log(`Processing escalation rule: ${rule.name}`);

  const { entity_type, conditions, actions, delay_hours } = rule;

  // Build query based on conditions
  let query = supabaseClient.from(entity_type).select('*');

  // Add time-based condition for escalation
  const cutoffTime = new Date();
  cutoffTime.setHours(cutoffTime.getHours() - delay_hours);

  query = query.lt('created_at', cutoffTime.toISOString());

  // Apply rule conditions
  if (conditions.status) {
    query = query.in('status', conditions.status);
  }

  if (conditions.priority) {
    query = query.in('priority', conditions.priority);
  }

  if (conditions.assigned_to === null) {
    query = query.is('assigned_to', null);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error('Error querying items for escalation:', error);
    throw error;
  }

  console.log(`Found ${items?.length || 0} items for escalation`);

  // Process each item that needs escalation
  if (items) {
    for (const item of items) {
      try {
        await executeEscalationActions(
          supabaseClient,
          item as WorkOrderItem,
          actions,
          rule
        );
      } catch (error) {
        console.error(`Error escalating item ${item.id}:`, error);
      }
    }
  }
}

async function executeEscalationActions(
  supabaseClient: SupabaseClient,
  item: WorkOrderItem,
  actions: EscalationRule['actions'],
  rule: EscalationRule
) {
  console.log(`Escalating item ${item.id} with actions:`, actions);

  // Send notifications
  if (actions.notify) {
    for (const userId of actions.notify) {
      await supabaseClient.rpc('create_notification', {
        p_user_id: userId,
        p_title: `Escalation: ${rule.name}`,
        p_message: `Item ${item.id} has been escalated due to: ${rule.description}`,
        p_type: 'warning',
        p_entity_type: rule.entity_type,
        p_entity_id: item.id,
      });
    }
  }

  // Update status
  if (actions.update_status) {
    await supabaseClient
      .from(rule.entity_type)
      .update({ status: actions.update_status })
      .eq('id', item.id);
  }

  // Assign to user
  if (actions.assign_to) {
    await supabaseClient
      .from(rule.entity_type)
      .update({ assigned_to: actions.assign_to })
      .eq('id', item.id);
  }

  // Update priority
  if (actions.update_priority) {
    await supabaseClient
      .from(rule.entity_type)
      .update({ priority: actions.update_priority })
      .eq('id', item.id);
  }

  // Create audit log
  await supabaseClient.rpc('create_audit_log', {
    p_action: 'escalated',
    p_entity_type: rule.entity_type,
    p_entity_id: item.id,
    p_metadata: {
      rule_id: rule.id,
      rule_name: rule.name,
      actions_taken: actions,
      escalation_time: new Date().toISOString(),
    },
  });

  console.log(`Successfully escalated item ${item.id}`);
}
