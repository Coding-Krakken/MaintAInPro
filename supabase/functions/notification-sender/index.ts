// @ts-nocheck
// Deno Edge Function - TypeScript checking disabled for Deno environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Type definitions for better TypeScript support
interface NotificationResult {
  method: string;
  success: boolean;
  result?: {
    status: string;
    email?: string;
    token?: string;
    data?: unknown;
  };
  error?: string;
}

interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  user: {
    email: string;
    profiles?: {
      push_token?: string;
    };
  };
}

interface UserPreferences {
  email_notifications?: boolean;
  push_notifications?: boolean;
}

type SupabaseClient = ReturnType<typeof createClient>;

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { notification_id, delivery_method } = await req.json();

    console.log(
      `Processing notification ${notification_id} with method ${delivery_method}`
    );

    // Get notification details
    const { data: notification, error: notificationError } =
      await supabaseClient
        .from('notifications')
        .select(
          `
        *,
        user:user_id (
          email,
          profiles (
            first_name,
            last_name,
            push_token
          )
        )
      `
        )
        .eq('id', notification_id)
        .single();

    if (notificationError) {
      console.error('Error fetching notification:', notificationError);
      throw notificationError;
    }

    // Check user preferences
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('email_notifications, push_notifications')
      .eq('user_id', notification.user_id)
      .single();

    const results: NotificationResult[] = [];

    // Send email notification
    if (
      delivery_method === 'email' &&
      preferences?.email_notifications !== false
    ) {
      try {
        const emailResult = await sendEmailNotification(notification);
        results.push({ method: 'email', success: true, result: emailResult });
      } catch (error) {
        console.error('Email notification failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({ method: 'email', success: false, error: errorMessage });
      }
    }

    // Send push notification
    if (
      delivery_method === 'push' &&
      preferences?.push_notifications !== false
    ) {
      try {
        const pushResult = await sendPushNotification(notification);
        results.push({ method: 'push', success: true, result: pushResult });
      } catch (error) {
        console.error('Push notification failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        results.push({ method: 'push', success: false, error: errorMessage });
      }
    }

    // Send both if not specified
    if (!delivery_method) {
      // Email
      if (preferences?.email_notifications !== false) {
        try {
          const emailResult = await sendEmailNotification(notification);
          results.push({ method: 'email', success: true, result: emailResult });
        } catch (error) {
          console.error('Email notification failed:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          results.push({
            method: 'email',
            success: false,
            error: errorMessage,
          });
        }
      }

      // Push
      if (preferences?.push_notifications !== false) {
        try {
          const pushResult = await sendPushNotification(notification);
          results.push({ method: 'push', success: true, result: pushResult });
        } catch (error) {
          console.error('Push notification failed:', error);
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          results.push({ method: 'push', success: false, error: errorMessage });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id,
        results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in notification sender:', error);
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

async function sendEmailNotification(notification: NotificationData) {
  console.log(`Sending email notification to ${notification.user.email}`);

  // In a real implementation, you would use a service like SendGrid, Mailgun, etc.
  // For now, we'll simulate the email sending

  const emailData = {
    to: notification.user.email,
    subject: notification.title,
    html: `
      <html>
        <body>
          <h2>${notification.title}</h2>
          <p>${notification.message}</p>
          <p><strong>Type:</strong> ${notification.type}</p>
          <p><strong>Time:</strong> ${new Date(notification.created_at).toLocaleString()}</p>
          <hr>
          <p><em>This is an automated notification from MaintAInPro CMMS</em></p>
        </body>
      </html>
    `,
  };

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`Email sent successfully to ${notification.user.email}`);
  return { status: 'sent', email: notification.user.email, data: emailData };
}

async function sendPushNotification(notification: NotificationData) {
  console.log(`Sending push notification to user ${notification.user_id}`);

  const pushToken = notification.user.profiles?.push_token;
  if (!pushToken) {
    throw new Error('No push token available for user');
  }

  // In a real implementation, you would use Firebase Cloud Messaging, Apple Push Notification Service, etc.
  // For now, we'll simulate the push notification

  const pushData = {
    token: pushToken,
    title: notification.title,
    body: notification.message,
    data: {
      type: notification.type,
      entity_type: notification.entity_type,
      entity_id: notification.entity_id,
      notification_id: notification.id,
    },
  };

  // Simulate push notification sending delay
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log(
    `Push notification sent successfully to user ${notification.user_id}`
  );
  return { status: 'sent', token: pushToken, data: pushData };
}
