import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma";
import {
  OneSignalSendNotificationRequest,
  OneSignalSendNotificationResponse,
  OneSignalStatsResponse,
} from "@shared/api";
import { sendNotification } from "../services/onesignal";

const rawKey = process.env.ONESIGNAL_API_KEY?.trim() || process.env.ONESIGNAL_REST_API_KEY?.trim() || "";
const appIdFromKey = rawKey.includes("::") ? rawKey.split("::")[0]?.trim() ?? "" : "";
const appId = appIdFromKey || process.env.ONESIGNAL_APP_ID?.trim() || "";

// Validation schemas
const sendNotificationSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  url: z.string().optional(),
  data: z.record(z.any()).optional(),
  userIds: z.array(z.string()).optional(),
  segments: z.array(z.string()).optional().default(["All"]),
  filters: z.array(z.object({
    field: z.string(),
    key: z.string().optional(),
    relation: z.string(),
    value: z.string()
  })).optional(),
  schedule: z.object({
    send_after: z.string()
  }).optional(),
});

// Test handler
export const testOneSignalHandler: RequestHandler = async (_req, res) => {
  try {
    const hasConfig =
  !!(process.env.ONESIGNAL_APP_ID?.trim() && (process.env.ONESIGNAL_API_KEY?.trim() || process.env.ONESIGNAL_REST_API_KEY?.trim())) ||
  !!process.env.ONESIGNAL_API_KEY?.trim()?.includes("::");
    res.json({
      success: true,
      message: "OneSignal handler is working!",
      config: {
        appId: appId || "(env'den okunacak)",
        hasConfig,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("OneSignal test error:", error);
    res.status(500).json({
      success: false,
      message: "OneSignal connection failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Send notification via OneSignal (servis katmanı + env kullanır)
export const sendOneSignalNotification: RequestHandler = async (req, res) => {
  try {
    const validatedData = sendNotificationSchema.parse(req.body);
    const { title, body, url, data, userIds, segments, schedule } = validatedData;

    console.log("📱 OneSignal bildirimi gönderiliyor:", { title, body, url });

    const result = await sendNotification({
      title,
      message: body,
      url,
      data,
      language: "tr",
      segments: segments && segments.length > 0 ? segments : ["All"],
      ...(userIds && userIds.length > 0 ? { playerIds: userIds } : {}),
    });

    if (!result.success) {
      const apiResponse: OneSignalSendNotificationResponse = {
        success: false,
        message: result.message ?? "Bildirim gönderilemedi",
        errors: result.message ? [result.message] : undefined,
      };
      res.status(500).json(apiResponse);
      return;
    }

    const recipients = result.recipients ?? 0;
    const notificationId = result.notificationId;

    console.log(`✅ OneSignal bildirimi gönderildi: ${recipients} alıcı, ID: ${notificationId}`);

    // Save to database with error handling
    try {
      await prisma.onesignal_notifications.create({
        data: {
          notificationId: notificationId ?? "",
          title,
          body,
          url: url || null,
          recipients,
          segments: segments?.join(",") ?? "All",
          userIds: userIds?.join(",") ?? null,
          isScheduled: !!schedule,
          scheduledFor: schedule?.send_after ? new Date(schedule.send_after) : null,
          response: JSON.stringify({ id: notificationId, recipients: result.recipients }),
        },
      });
    } catch (dbError) {
      console.warn('⚠️ Database kayıt hatası (bildirim başarılı ama kayıt edilemedi):', dbError);
      // Don't fail the request if notification was sent successfully
    }

    const apiResponse: OneSignalSendNotificationResponse = {
      success: true,
      message: `Notification sent successfully to ${recipients} subscribers`,
      notificationId: notificationId ?? undefined,
      recipients,
    };
    res.json(apiResponse);
  } catch (error) {
    console.error("❌ OneSignal bildirim gönderme hatası:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const apiResponse: OneSignalSendNotificationResponse = {
      success: false,
      message: `Failed to send notification: ${errorMessage}`,
      errors: [errorMessage],
    };
    res.status(500).json(apiResponse);
  }
};

// Get OneSignal stats
export const getOneSignalStats: RequestHandler = async (req, res) => {
  try {
    console.log('📊 OneSignal istatistikleri alınıyor');
    
    // Get notification count from local database with error handling
    let notificationCount = 0;
    let lastNotification = null;
    
    try {
      notificationCount = await prisma.onesignal_notifications.count();
      lastNotification = await prisma.onesignal_notifications.findFirst({
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbError) {
      console.warn('⚠️ Database sorgu hatası (stats):', dbError);
      // Continue with default values
    }
    
    // Calculate basic metrics from local data (placeholder values for now)
    const totalSubscribers = notificationCount > 0 ? 100 : 0; // Placeholder
    const activeSubscribers = Math.floor(totalSubscribers * 0.8); // Placeholder
    const clickRate = 0.15; // Placeholder
    const deliveryRate = 0.95; // Placeholder
    
    const apiResponse: OneSignalStatsResponse = {
      success: true,
      stats: {
        totalSubscribers,
        activeSubscribers,
        clickRate,
        deliveryRate
      }
    };
    
    console.log('📊 OneSignal istatistikleri:', apiResponse.stats);
    
    res.json(apiResponse);
  } catch (error) {
    console.error('❌ OneSignal istatistikleri alma hatası:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get OneSignal stats',
      error: error instanceof Error ? error.message : 'Unknown error',
      stats: {
        totalSubscribers: 0,
        activeSubscribers: 0,
        clickRate: 0,
        deliveryRate: 0
      }
    });
  }
};

// Get OneSignal notification history
export const getOneSignalHistory: RequestHandler = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const takeLimit = Math.min(Math.max(limit, 1), 200);
    
    let notifications: any[] = [];
    
    try {
      notifications = await prisma.onesignal_notifications.findMany({
        orderBy: { createdAt: 'desc' },
        take: takeLimit
      });
    } catch (dbError) {
      console.warn('⚠️ Database sorgu hatası (history):', dbError);
      // Return empty history instead of failing
      return res.json({
        success: true,
        history: [],
        message: 'Database connection issue, returning empty history'
      });
    }
    
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      notificationId: notification.notificationId,
      title: notification.title,
      body: notification.body,
      url: notification.url,
      recipients: notification.recipients,
      segments: notification.segments,
      userIds: notification.userIds,
      isScheduled: notification.isScheduled,
      scheduledFor: notification.scheduledFor?.toISOString() || null,
      createdAt: notification.createdAt.toISOString(),
    }));
    
    console.log('📜 OneSignal geçmişi:', notifications.length, 'bildirim alındı');
    
    res.json({
      success: true,
      history: formattedNotifications,
    });
  } catch (error) {
    console.error('❌ OneSignal geçmişi alma hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get OneSignal history',
      error: error instanceof Error ? error.message : 'Unknown error',
      history: []
    });
  }
};

// Send test notification
export const sendOneSignalTestNotification: RequestHandler = async (req, res) => {
  try {
    console.log('🧪 OneSignal test bildirimi gönderiliyor');
    
    const testNotificationRequest: OneSignalSendNotificationRequest = {
      title: 'Test Bildirimi - UEZ 2026',
      body: 'Bu bir OneSignal test bildirimidir. Sistem çalışıyor!',
      url: '/',
      data: {
        test: 'true',
        source: 'onesignal_test'
      },
      segments: ['All']
    };
    
    // Use the main send notification handler logic
    req.body = testNotificationRequest;
    return sendOneSignalNotification(req, res, () => {});
  } catch (error) {
    console.error('❌ OneSignal test bildirimi hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OneSignal test notification',
    });
  }
};