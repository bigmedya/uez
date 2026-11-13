import { prisma } from "./prisma";

export interface FCMTokenData {
  token: string;
  userAgent?: string;
}

// Save FCM token to database
export const saveFCMToken = async (data: FCMTokenData) => {
  try {
    const existingToken = await prisma.fcm_tokens.findUnique({
      where: { token: data.token }
    });

    if (existingToken) {
      // Update existing token
      return await prisma.fcm_tokens.update({
        where: { token: data.token },
        data: {
          userAgent: data.userAgent,
          isActive: true,
          lastUsed: new Date(),
          updatedAt: new Date(),
        }
      });
    } else {
      // Create new token
      return await prisma.fcm_tokens.create({
        data: {
          token: data.token,
          userAgent: data.userAgent,
          isActive: true,
          lastUsed: new Date(),
        }
      });
    }
  } catch (error) {
    console.error('Error saving FCM token:', error);
    throw error;
  }
};

// Get all active FCM tokens
export const getActiveFCMTokens = async () => {
  try {
    return await prisma.fcm_tokens.findMany({
      where: { isActive: true },
      select: {
        id: true,
        token: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error getting active FCM tokens:', error);
    throw error;
  }
};

// Remove FCM token
export const removeFCMToken = async (token: string) => {
  try {
    return await prisma.fcm_tokens.update({
      where: { token },
      data: { isActive: false }
    });
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

// Clean up old/invalid tokens
export const cleanupInvalidTokens = async (invalidTokens: string[]) => {
  try {
    return await prisma.fcm_tokens.updateMany({
      where: {
        token: { in: invalidTokens }
      },
      data: { isActive: false }
    });
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error);
    throw error;
  }
};

// Get FCM token statistics
export const getFCMTokenStats = async () => {
  try {
    const [total, active, inactive] = await Promise.all([
      prisma.fcm_tokens.count(),
      prisma.fcm_tokens.count({ where: { isActive: true } }),
      prisma.fcm_tokens.count({ where: { isActive: false } }),
    ]);

    return { total, active, inactive };
  } catch (error) {
    console.error('Error getting FCM token stats:', error);
    throw error;
  }
};

// Update token last used timestamp
export const updateTokenLastUsed = async (token: string) => {
  try {
    return await prisma.fcm_tokens.update({
      where: { token },
      data: { lastUsed: new Date() }
    });
  } catch (error) {
    console.error('Error updating token last used:', error);
    // Don't throw error for this operation
  }
};