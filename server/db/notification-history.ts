import { prisma } from "./prisma";

export interface NotificationHistoryInput {
  title: string;
  body: string;
  url?: string;
  sentCount: number;
  isTest?: boolean;
}

export const saveNotificationToHistory = async (data: NotificationHistoryInput) => {
  const title = String(data.title).slice(0, 500);
  const body = String(data.body);
  const url = data.url != null && data.url !== "" ? String(data.url).slice(0, 500) : null;
  return prisma.notification_history.create({
    data: {
      title,
      body,
      url,
      sentCount: Number(data.sentCount) || 0,
      isTest: Boolean(data.isTest),
    },
  });
};

export const getNotificationHistory = async (limit = 50) => {
  return prisma.notification_history.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};
