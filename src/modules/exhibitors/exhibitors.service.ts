import prisma from "../../config/prisma";

// List exhibitors (read-only)
export async function listExhibitors() {
  const exhibitors = await prisma.user.findMany({
    where: {
      role: "EXHIBITOR",
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      bio: true,
      company: true,
      jobTitle: true,
      location: true,
      website: true,
      linkedin: true,
      twitter: true,
      businessEmail: true,
      businessPhone: true,
      businessAddress: true,
      taxId: true,
    },
  });

  return exhibitors;
}

// Single exhibitor (read-only)
export async function getExhibitorById(id: string) {
  if (!id || id === "undefined") {
    throw new Error("Invalid exhibitor ID");
  }

  const exhibitor = await prisma.user.findFirst({
    where: {
      id,
      role: "EXHIBITOR",
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      avatar: true,
      role: true,
      bio: true,
      website: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!exhibitor) {
    return null;
  }

  return exhibitor;
}

// Exhibitor analytics – currently mock data (preserve shape)
export async function getExhibitorAnalytics(_id: string) {
  const analytics = {
    overview: {
      totalProfileViews: 1850,
      brochureDownloads: 456,
      leadsGenerated: 89,
      visitorEngagement: 67.5,
    },
    profileViewsData: [
      { date: "Jan 10", views: 45 },
      { date: "Jan 11", views: 52 },
      { date: "Jan 12", views: 38 },
      { date: "Jan 13", views: 61 },
      { date: "Jan 14", views: 48 },
      { date: "Jan 15", views: 73 },
      { date: "Jan 16", views: 56 },
      { date: "Jan 17", views: 69 },
      { date: "Jan 18", views: 82 },
      { date: "Jan 19", views: 74 },
    ],
    brochureDownloadsData: [
      { name: "AI Platform Brochure", downloads: 156, percentage: 34.2 },
      { name: "Security Suite Overview", downloads: 123, percentage: 27.0 },
      { name: "Mobile App Features", downloads: 89, percentage: 19.5 },
      { name: "Technical Specifications", downloads: 67, percentage: 14.7 },
      { name: "Pricing Guide", downloads: 21, percentage: 4.6 },
    ],
    leadSourceData: [
      { name: "Profile Views", value: 45, color: "#3B82F6" },
      { name: "Brochure Downloads", value: 28, color: "#10B981" },
      { name: "Product Inquiries", value: 16, color: "#F59E0B" },
      { name: "Appointment Requests", value: 11, color: "#EF4444" },
    ],
    engagementData: [
      { metric: "Profile Views", current: 1850, previous: 1420, change: 30.3 },
      { metric: "Brochure Downloads", current: 456, previous: 389, change: 17.2 },
      { metric: "Product Inquiries", current: 89, previous: 76, change: 17.1 },
      { metric: "Appointment Bookings", current: 23, previous: 18, change: 27.8 },
    ],
    eventPerformance: [
      {
        eventId: "event-1",
        eventName: "Tech Conference 2024",
        boothVisits: 156,
        leadsGenerated: 12,
        conversions: 3,
        revenue: 2999.99,
        roi: 185,
      },
      {
        eventId: "event-2",
        eventName: "Innovation Summit",
        boothVisits: 89,
        leadsGenerated: 8,
        conversions: 1,
        revenue: 1499.99,
        roi: 120,
      },
    ],
    productPerformance: [
      {
        productId: "prod-1",
        productName: "Smart Display System",
        views: 156,
        inquiries: 23,
        conversions: 2,
        revenue: 5999.98,
        conversionRate: 8.7,
      },
      {
        productId: "prod-2",
        productName: "Interactive Software Platform",
        views: 89,
        inquiries: 12,
        conversions: 1,
        revenue: 1499.99,
        conversionRate: 13.5,
      },
      {
        productId: "prod-3",
        productName: "Portable Exhibition Booth",
        views: 67,
        inquiries: 8,
        conversions: 0,
        revenue: 0,
        conversionRate: 0,
      },
    ],
    leadAnalytics: {
      totalLeads: 89,
      newLeads: 12,
      contactedLeads: 34,
      qualifiedLeads: 28,
      convertedLeads: 15,
      averageScore: 75.5,
      conversionRate: 16.9,
      sourceBreakdown: {
        "Event Booth": 35,
        Website: 28,
        Referral: 16,
        "Social Media": 10,
      },
    },
    appointmentAnalytics: {
      totalAppointments: 23,
      confirmedAppointments: 18,
      pendingAppointments: 3,
      completedAppointments: 15,
      cancelledAppointments: 2,
      averageDuration: 45,
      showUpRate: 83.3,
      typeBreakdown: {
        PRODUCT_DEMO: 12,
        CONSULTATION: 7,
        FOLLOW_UP: 4,
      },
    },
  };

  return analytics;
}

// Exhibitor events (read-only)
export async function getExhibitorEvents(exhibitorId: string) {
  if (!exhibitorId) {
    throw new Error("exhibitorId is required");
  }

  const booths = await prisma.exhibitorBooth.findMany({
    where: { exhibitorId },
    include: {
      event: {
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          venue: true,
          status: true,
          organizer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              company: true,
            },
          },
        },
      },
      exhibitor: {
        select: {
          firstName: true,
          lastName: true,
          company: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const events = booths.map((booth) => ({
    id: booth.id,
    eventId: booth.eventId,
    eventName: booth.event.title,
    date: booth.event.startDate.toISOString().split("T")[0],
    endDate: booth.event.endDate.toISOString().split("T")[0],
    venue: booth.event.venue || "TBD",
    boothSize: `${booth.spaceId}`,
    boothNumber: booth.boothNumber,
    paymentStatus: booth.status === "BOOKED" ? "PAID" : "PENDING",
    setupTime: "8:00 AM - 10:00 AM",
    dismantleTime: "6:00 PM - 8:00 PM",
    passes: 5,
    passesUsed: 0,
    invoiceAmount: booth.totalCost,
    status: booth.event.status,
    specialRequests: booth.specialRequests,
    organizer: booth.event.organizer,
  }));

  return events;
}

