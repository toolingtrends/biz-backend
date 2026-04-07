import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { getAppSettingJson, setAppSettingJson } from "../../../lib/admin-app-setting";

function asJsonInput<T>(v: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
}

const KEY_PAYMENTS = "integrations.payments";
const KEY_COMMUNICATION = "integrations.communication";
const KEY_TRAVEL = "integrations.travel";

const nowIso = () => new Date().toISOString();

function defaultPaymentsState() {
  const t = nowIso();
  return {
    gateways: [
      {
        id: "gw_stripe",
        name: "Stripe",
        provider: "stripe",
        logo: "https://cdn.worldvectorlogo.com/logos/stripe-4.svg",
        isActive: true,
        isTestMode: true,
        supportedCurrencies: ["USD", "EUR", "GBP"],
        supportedCountries: ["US", "GB", "DE"],
        transactionFee: "2.9% + 30¢",
        monthlyFee: 0,
        credentials: {
          publicKey: "pk_test_dummy_xxxxxxxx",
          secretKey: "sk_test_dummy_xxxxxxxx",
          webhookSecret: "whsec_dummy_xxxxxxxx",
          merchantId: "",
        },
        lastSyncedAt: null as string | null,
        totalTransactions: 0,
        totalVolume: 0,
        successRate: 99.2,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: "gw_paypal",
        name: "PayPal",
        provider: "paypal",
        logo: "https://cdn.worldvectorlogo.com/logos/paypal-2.svg",
        isActive: false,
        isTestMode: true,
        supportedCurrencies: ["USD", "EUR"],
        supportedCountries: ["US", "GB"],
        transactionFee: "3.49% + fixed",
        monthlyFee: 0,
        credentials: {
          publicKey: "",
          secretKey: "dummy_paypal_secret_xxxxxxxx",
          webhookSecret: "dummy_paypal_webhook_xxxxxxxx",
          merchantId: "dummy_merchant_id",
        },
        lastSyncedAt: null as string | null,
        totalTransactions: 0,
        totalVolume: 0,
        successRate: 0,
        createdAt: t,
        updatedAt: t,
      },
    ],
    logs: [] as Prisma.InputJsonValue[],
  };
}

function defaultCommunicationState() {
  const t = nowIso();
  return {
    emailProviders: [
      {
        id: "email_sendgrid",
        name: "SendGrid (dummy)",
        provider: "sendgrid",
        status: "inactive" as const,
        type: "both" as const,
        apiKey: "SG.dummy_api_key_xxxxxxxx",
        fromEmail: "noreply@example.com",
        fromName: "Biz Events",
        dailyLimit: 10000,
        sentToday: 0,
        totalSent: 0,
        successRate: 98.5,
        lastSync: t,
        settings: { enableTracking: true, enableUnsubscribe: true, replyTo: "support@example.com" },
      },
      {
        id: "email_resend",
        name: "Resend (dummy)",
        provider: "resend",
        status: "active" as const,
        type: "transactional" as const,
        apiKey: "re_dummy_xxxxxxxx",
        fromEmail: "hello@example.com",
        fromName: "Biz",
        dailyLimit: 3000,
        sentToday: 12,
        totalSent: 4520,
        successRate: 99.1,
        lastSync: t,
        settings: { enableTracking: false, enableUnsubscribe: true },
      },
    ],
    smsProviders: [
      {
        id: "sms_twilio",
        name: "Twilio SMS (dummy)",
        provider: "twilio",
        status: "active" as const,
        accountSid: "ACdummyxxxxxxxx",
        authToken: "dummy_auth_token_xxxxxxxx",
        fromNumber: "+15550000000",
        dailyLimit: 500,
        sentToday: 3,
        totalSent: 890,
        successRate: 97.2,
        lastSync: t,
        settings: { enableDeliveryReports: true, defaultCountryCode: "+1" },
      },
    ],
    stats: {
      totalEmailsSent: 4520,
      totalSmsSent: 890,
      emailSuccessRate: 98.8,
      smsSuccessRate: 97.2,
      activeEmailProviders: 1,
      activeSmsProviders: 1,
    },
    logs: [] as Prisma.InputJsonValue[],
  };
}

function defaultTravelState() {
  const t = nowIso();
  return {
    partners: [
      {
        id: "tp_marriott",
        name: "Marriott International (sample)",
        type: "hotel" as const,
        logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Marriott_hotels_logo14.svg",
        website: "https://www.marriott.com",
        email: "partners@marriott.com",
        phone: "+1-800-555-0199",
        apiKey: "dummy_marriott_api_xxxxxxxx",
        apiEndpoint: "https://api.example-travel.com/v1/marriott",
        isActive: true,
        isVerified: true,
        commissionRate: 12,
        rating: 4.7,
        totalBookings: 128,
        totalRevenue: 45600,
        locations: ["New York", "London", "Dubai"],
        description: "Global hotel partner integration (dummy credentials).",
        contactPerson: "Partner Success",
        contractStartDate: "2024-01-01",
        contractEndDate: "2026-12-31",
        lastSyncAt: t,
        createdAt: t,
      },
    ],
    bookings: [] as Prisma.InputJsonValue[],
  };
}

export async function getPayments() {
  let state = await getAppSettingJson(KEY_PAYMENTS, defaultPaymentsState());
  if (!state.gateways?.length) {
    state = defaultPaymentsState();
    await setAppSettingJson(KEY_PAYMENTS, asJsonInput(state));
  }
  return state;
}

export async function patchPaymentGateway(
  gatewayId: string,
  body: {
    credentials?: Record<string, string | undefined>;
    isTestMode?: boolean;
    isActive?: boolean;
  },
) {
  const state = await getPayments();
  const idx = state.gateways.findIndex((g: { id: string }) => g.id === gatewayId);
  if (idx === -1) return null;
  const g = { ...(state.gateways[idx] as Record<string, unknown>) };
  if (body.credentials && typeof body.credentials === "object") {
    g.credentials = { ...(g.credentials as object), ...body.credentials };
  }
  if (typeof body.isTestMode === "boolean") g.isTestMode = body.isTestMode;
  if (typeof body.isActive === "boolean") g.isActive = body.isActive;
  g.updatedAt = nowIso();
  state.gateways[idx] = g as (typeof state.gateways)[number];
  await setAppSettingJson(KEY_PAYMENTS, asJsonInput(state));
  return g;
}

export async function testPaymentGateway(gatewayId: string) {
  const state = await getPayments();
  const g = state.gateways.find((x: { id: string }) => x.id === gatewayId);
  if (!g) return { ok: false, message: "Gateway not found" };
  return {
    ok: true,
    message: `Dummy test OK for ${(g as { name?: string }).name ?? gatewayId} (no real network call).`,
  };
}

export async function getCommunication() {
  let state = await getAppSettingJson(KEY_COMMUNICATION, defaultCommunicationState());
  if (!state.emailProviders?.length) {
    state = defaultCommunicationState();
    await setAppSettingJson(KEY_COMMUNICATION, state);
  }
  return state;
}

export async function patchCommunicationProvider(
  id: string,
  body: { channel?: string; type?: string; status?: string; apiKey?: string; authToken?: string; [k: string]: unknown },
) {
  const state = await getCommunication();
  const channel = body.channel === "sms" || body.type === "sms" ? "sms" : "email";
  const listKey = channel === "sms" ? "smsProviders" : "emailProviders";
  const list = [...(state[listKey] as Record<string, unknown>[])];
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  const cur = { ...list[idx] };
  if (body.status === "active" || body.status === "inactive" || body.status === "error") {
    cur.status = body.status;
  }
  if (typeof body.apiKey === "string") cur.apiKey = body.apiKey;
  if (typeof body.authToken === "string") cur.authToken = body.authToken;
  list[idx] = cur;
  (state as Record<string, unknown>)[listKey] = list;
  await setAppSettingJson(KEY_COMMUNICATION, asJsonInput(state));
  return cur;
}

export async function testCommunicationProvider(
  id: string,
  _body: { type?: string; recipient?: string; subject?: string; body?: string },
) {
  const state = await getCommunication();
  const email = state.emailProviders.find((p: { id: string }) => p.id === id);
  const sms = state.smsProviders.find((p: { id: string }) => p.id === id);
  if (!email && !sms) return { ok: false, message: "Provider not found" };
  return { ok: true, message: "Dummy send OK (no email/SMS sent)." };
}

export async function getTravel() {
  let state = await getAppSettingJson(KEY_TRAVEL, defaultTravelState());
  if (!state.partners?.length) {
    state = defaultTravelState();
    await setAppSettingJson(KEY_TRAVEL, asJsonInput(state));
  }
  return state;
}

export async function patchTravelPartner(
  partnerId: string,
  body: Record<string, unknown>,
) {
  const state = await getTravel();
  const idx = state.partners.findIndex((p: { id: string }) => p.id === partnerId);
  if (idx === -1) return null;
  const cur = { ...state.partners[idx], ...body, updatedAt: nowIso() };
  state.partners[idx] = cur;
  await setAppSettingJson(KEY_TRAVEL, asJsonInput(state));
  return cur;
}

export async function syncTravelPartner(partnerId: string) {
  const state = await getTravel();
  const idx = state.partners.findIndex((p: { id: string }) => p.id === partnerId);
  if (idx === -1) return null;
  (state.partners[idx] as { lastSyncAt: string }).lastSyncAt = nowIso();
  await setAppSettingJson(KEY_TRAVEL, asJsonInput(state));
  return state.partners[idx];
}

export async function createTravelPartner(body: Record<string, unknown>) {
  const state = await getTravel();
  const t = nowIso();
  const partner = {
    id: `tp_${randomUUID().slice(0, 8)}`,
    name: String(body.name ?? "New Partner"),
    type: (() => {
      const t = String(body.type ?? "hotel");
      return (["hotel", "airline", "car_rental", "travel_agency"].includes(t) ? t : "hotel") as
        | "hotel"
        | "airline"
        | "car_rental"
        | "travel_agency";
    })(),
    logo: String(body.logo ?? ""),
    website: String(body.website ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    apiKey: String(body.apiKey ?? "dummy_api_key_xxxxxxxx"),
    apiEndpoint: String(body.apiEndpoint ?? ""),
    isActive: body.isActive !== false,
    isVerified: false,
    commissionRate: Number(body.commissionRate ?? 10),
    rating: Number(body.rating ?? 4),
    totalBookings: 0,
    totalRevenue: 0,
    locations: Array.isArray(body.locations) ? body.locations : [],
    description: String(body.description ?? ""),
    contactPerson: String(body.contactPerson ?? ""),
    contractStartDate: String(body.contractStartDate ?? t.slice(0, 10)),
    contractEndDate: String(body.contractEndDate ?? t.slice(0, 10)),
    lastSyncAt: null as string | null,
    createdAt: t,
  };
  state.partners.push(partner as (typeof state.partners)[number]);
  await setAppSettingJson(KEY_TRAVEL, asJsonInput(state));
  return partner;
}
