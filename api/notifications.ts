/**
 * Notifications API Serverless Handler for Vercel
 * Enhanced with notification preferences and push subscriptions
 */

import { VercelRequest, VercelResponse } from '@vercel/node';

// Import storage functions directly
import * as storageModule from './storage.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-user-id, x-warehouse-id'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { pathname } = new URL(req.url || '', `http://${req.headers.host}`);

    // Route to different handlers based on path
    if (pathname === '/api/notifications') {
      switch (req.method) {
        case 'GET':
          return handleGetNotifications(req, res);
        case 'POST':
          return handleCreateNotification(req, res);
        default:
          return res.status(405).json({ message: 'Method not allowed' });
      }
    } else if (pathname.startsWith('/api/notifications/')) {
      const id = pathname.split('/')[3];
      switch (req.method) {
        case 'PUT':
          return handleUpdateNotification(req, res, id);
        case 'DELETE':
          return handleDeleteNotification(req, res, id);
        default:
          return res.status(405).json({ message: 'Method not allowed' });
      }
    } else if (pathname === '/api/notification-preferences') {
      switch (req.method) {
        case 'GET':
          return handleGetPreferences(req, res);
        case 'POST':
          return handleCreatePreference(req, res);
        case 'PUT':
          return handleUpdatePreference(req, res);
        case 'DELETE':
          return handleDeletePreference(req, res);
        default:
          return res.status(405).json({ message: 'Method not allowed' });
      }
    } else if (pathname === '/api/push-subscriptions') {
      switch (req.method) {
        case 'GET':
          return handleGetSubscriptions(req, res);
        case 'POST':
          return handleCreateSubscription(req, res);
        case 'DELETE':
          return handleDeleteSubscription(req, res);
        default:
          return res.status(405).json({ message: 'Method not allowed' });
      }
    } else {
      return res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    console.error('Notifications API error:', error);
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Notification handlers
async function handleGetNotifications(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';

    const notifications = await storageModule.getAllNotifications(userId);
    console.log(`Retrieved ${notifications.length} notifications for user ${userId}`);

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      message: 'Failed to fetch notifications',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleCreateNotification(req: VercelRequest, res: VercelResponse) {
  try {
    const notificationData = req.body;

    const notification = await storageModule.createNotification(notificationData);
    console.log(`Created notification ${notification.id}`);

    return res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      message: 'Failed to create notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleUpdateNotification(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    if (req.body.read !== undefined) {
      if (req.body.read) {
        await storageModule.markNotificationRead(id);
        return res.status(200).json({ success: true, message: 'Notification marked as read' });
      }
    }

    return res.status(400).json({ message: 'Invalid update operation' });
  } catch (error) {
    console.error('Error updating notification:', error);
    return res.status(500).json({
      message: 'Failed to update notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleDeleteNotification(req: VercelRequest, res: VercelResponse, id: string) {
  try {
    await storageModule.deleteNotification(id);
    console.log(`Deleted notification ${id}`);

    return res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      message: 'Failed to delete notification',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Notification preferences handlers
async function handleGetPreferences(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';

    const preferences = await storageModule.getNotificationPreferences(userId);
    console.log(`Retrieved ${preferences.length} preferences for user ${userId}`);

    return res.status(200).json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return res.status(500).json({
      message: 'Failed to fetch notification preferences',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleCreatePreference(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';
    const preferenceData = { ...req.body, userId };

    const preference = await storageModule.createNotificationPreference(preferenceData);
    console.log(`Created preference for user ${userId}, type ${preference.notificationType}`);

    return res.status(201).json(preference);
  } catch (error) {
    console.error('Error creating preference:', error);
    return res.status(500).json({
      message: 'Failed to create notification preference',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleUpdatePreference(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';
    const { notificationType, ...updates } = req.body;

    const preference = await storageModule.updateNotificationPreference(
      userId,
      notificationType,
      updates
    );

    if (preference) {
      console.log(`Updated preference for user ${userId}, type ${notificationType}`);
      return res.status(200).json(preference);
    } else {
      return res.status(404).json({ message: 'Notification preference not found' });
    }
  } catch (error) {
    console.error('Error updating preference:', error);
    return res.status(500).json({
      message: 'Failed to update notification preference',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleDeletePreference(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';
    const { notificationType } = req.body;

    await storageModule.deleteNotificationPreference(userId, notificationType);
    console.log(`Deleted preference for user ${userId}, type ${notificationType}`);

    return res.status(200).json({ success: true, message: 'Notification preference deleted' });
  } catch (error) {
    console.error('Error deleting preference:', error);
    return res.status(500).json({
      message: 'Failed to delete notification preference',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Push subscription handlers
async function handleGetSubscriptions(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';

    const subscriptions = await storageModule.getPushSubscriptions(userId);
    console.log(`Retrieved ${subscriptions.length} push subscriptions for user ${userId}`);

    return res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return res.status(500).json({
      message: 'Failed to fetch push subscriptions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleCreateSubscription(req: VercelRequest, res: VercelResponse) {
  try {
    const userId = (req.headers['x-user-id'] as string) || 'default-user-id';
    const subscriptionData = { ...req.body, userId };

    const subscription = await storageModule.createPushSubscription(subscriptionData);
    console.log(`Created push subscription ${subscription.id} for user ${userId}`);

    return res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({
      message: 'Failed to create push subscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleDeleteSubscription(req: VercelRequest, res: VercelResponse) {
  try {
    const { subscriptionId } = req.body;

    await storageModule.deletePushSubscription(subscriptionId);
    console.log(`Deleted push subscription ${subscriptionId}`);

    return res.status(200).json({ success: true, message: 'Push subscription deleted' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return res.status(500).json({
      message: 'Failed to delete push subscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
