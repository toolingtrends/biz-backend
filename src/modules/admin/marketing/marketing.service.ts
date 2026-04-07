import prisma from "../../../config/prisma";
import { sendMarketingEmail } from "../../../services/email.service";

type CampaignStatus = "draft" | "scheduled" | "sending" | "sent";
type CampaignPriority = "low" | "medium" | "high";

export interface EmailCampaignItem {
  id: string;
  title: string;
  subject: string;
  content: string;
  status: CampaignStatus;
  priority: CampaignPriority;
  targetAudiences: string[];
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  };
  engagement: {
    openRate: number;
    clickRate: number;
    deliveryRate: number;
  };
}

export interface EmailTemplateItem {
  id: string;
  name: string;
  subject: string;
  content: string;
  category: string;
}

export interface PushNotificationItem {
  id: string;
  title: string;
  body: string;
  status: CampaignStatus;
  priority: CampaignPriority;
  targetAudiences: string[];
  createdAt: string;
  scheduledAt?: string;
  sentAt?: string;
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
  engagement: {
    openRate: number;
    clickRate: number;
    deliveryRate: number;
  };
}

export interface PushTemplateItem {
  id: string;
  name: string;
  title: string;
  message: string;
  imageUrl?: string;
  category: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const campaignsStore: EmailCampaignItem[] = [];
const pushStore: PushNotificationItem[] = [];

const templatesStore: EmailTemplateItem[] = [
  {
    id: "welcome",
    name: "Welcome Campaign",
    subject: "Welcome to our event platform",
    content: "Hello! We are excited to have you with us. Stay tuned for updates.",
    category: "onboarding",
  },
  {
    id: "announcement",
    name: "Event Announcement",
    subject: "New event announcement",
    content: "A new event has been published. Check details and register now.",
    category: "marketing",
  },
];

const pushTemplatesStore: PushTemplateItem[] = [
  {
    id: "reminder",
    name: "Event Reminder",
    title: "Your event starts soon",
    message: "Reminder: your registered event will start shortly. See you there!",
    category: "engagement",
  },
  {
    id: "announcement",
    name: "General Announcement",
    title: "New update available",
    message: "Check out the latest platform updates and new opportunities.",
    category: "marketing",
  },
];

export function listEmailCampaigns(status?: string): EmailCampaignItem[] {
  if (!status || status === "all") return campaignsStore;
  const normalized = status.toLowerCase();
  return campaignsStore.filter((c) => c.status === normalized);
}

export async function createEmailCampaign(input: {
  title: string;
  subject: string;
  content: string;
  htmlContent?: string;
  priority?: string;
  targetAudiences?: string[];
  scheduledAt?: string;
  sendImmediately?: boolean;
}): Promise<EmailCampaignItem> {
  const nowIso = new Date().toISOString();
  const sendNow = !!input.sendImmediately;
  const recipients = await prisma.user.findMany({
    where: {
      email: { not: "" },
      isActive: true,
    },
    select: { email: true },
  });
  const uniqueEmails = Array.from(new Set(recipients.map((r) => String(r.email || "").trim()).filter(Boolean)));

  let sent = 0;
  let failed = 0;
  if (sendNow && uniqueEmails.length > 0) {
    const mailResults = await Promise.allSettled(
      uniqueEmails.map((email) =>
        sendMarketingEmail({
          to: email,
          subject: input.subject,
          content: input.content,
          htmlContent: input.htmlContent,
        }),
      ),
    );
    sent = mailResults.filter((r) => r.status === "fulfilled").length;
    failed = mailResults.length - sent;
  }

  const item: EmailCampaignItem = {
    id: `${Date.now()}`,
    title: input.title,
    subject: input.subject,
    content: input.content,
    status: sendNow ? "sending" : "scheduled",
    priority: (input.priority as CampaignPriority) || "medium",
    targetAudiences: Array.isArray(input.targetAudiences) ? input.targetAudiences : [],
    createdAt: nowIso,
    scheduledAt: input.scheduledAt || undefined,
    sentAt: sendNow ? nowIso : undefined,
    stats: {
      totalRecipients: uniqueEmails.length,
      sent,
      delivered: sent,
      opened: 0,
      clicked: 0,
      bounced: failed,
      unsubscribed: 0,
    },
    engagement: {
      openRate: 0,
      clickRate: 0,
      deliveryRate: uniqueEmails.length > 0 ? Number(((sent / uniqueEmails.length) * 100).toFixed(2)) : 0,
    },
  };
  campaignsStore.unshift(item);
  return item;
}

export function listEmailTemplates(): EmailTemplateItem[] {
  return templatesStore;
}

export function listEmailTemplatesByCategory(category?: string): EmailTemplateItem[] {
  if (!category || category === "all") return templatesStore;
  const normalized = category.toLowerCase();
  return templatesStore.filter((t) => (t.category || "").toLowerCase() === normalized);
}

export function createEmailTemplate(input: {
  name: string;
  subject: string;
  content: string;
  htmlContent?: string;
  category?: string;
}): EmailTemplateItem & { isActive: boolean; createdAt: string; updatedAt: string } {
  const nowIso = new Date().toISOString();
  const template = {
    id: `${Date.now()}`,
    name: input.name,
    subject: input.subject,
    content: input.content,
    category: input.category || "promotional",
    htmlContent: input.htmlContent || "",
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  templatesStore.unshift(template);
  return template;
}

export function deleteEmailTemplate(id: string): boolean {
  const idx = templatesStore.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  templatesStore.splice(idx, 1);
  return true;
}

export function listPushNotifications(status?: string): PushNotificationItem[] {
  if (!status || status === "all") return pushStore;
  const normalized = status.toLowerCase();
  return pushStore.filter((n) => n.status === normalized);
}

export function createPushNotification(input: {
  title: string;
  bodyText: string;
  priority?: string;
  targetAudiences?: string[];
  scheduledAt?: string;
  sendImmediately?: boolean;
}): PushNotificationItem {
  const nowIso = new Date().toISOString();
  const sendNow = !!input.sendImmediately;
  const item: PushNotificationItem = {
    id: `${Date.now()}`,
    title: input.title,
    body: input.bodyText,
    status: sendNow ? "sending" : "scheduled",
    priority: (input.priority as CampaignPriority) || "medium",
    targetAudiences: Array.isArray(input.targetAudiences) ? input.targetAudiences : [],
    createdAt: nowIso,
    scheduledAt: input.scheduledAt || undefined,
    sentAt: sendNow ? nowIso : undefined,
    stats: {
      totalRecipients: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    },
    engagement: {
      openRate: 0,
      clickRate: 0,
      deliveryRate: 0,
    },
  };
  pushStore.unshift(item);
  return item;
}

export function listPushTemplates(): PushTemplateItem[] {
  return pushTemplatesStore;
}

export function listPushTemplatesByCategory(category?: string): PushTemplateItem[] {
  if (!category || category === "all") return pushTemplatesStore;
  const normalized = category.toLowerCase();
  return pushTemplatesStore.filter((t) => (t.category || "").toLowerCase() === normalized);
}

export function createPushTemplate(input: {
  name: string;
  title: string;
  message: string;
  imageUrl?: string;
  category?: string;
}): PushTemplateItem {
  const nowIso = new Date().toISOString();
  const item: PushTemplateItem = {
    id: `${Date.now()}`,
    name: input.name,
    title: input.title,
    message: input.message,
    imageUrl: input.imageUrl || "",
    category: input.category || "promotional",
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
  pushTemplatesStore.unshift(item);
  return item;
}

export function deletePushTemplate(id: string): boolean {
  const idx = pushTemplatesStore.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  pushTemplatesStore.splice(idx, 1);
  return true;
}
