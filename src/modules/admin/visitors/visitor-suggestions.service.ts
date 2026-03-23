import prisma from "../../../config/prisma";
import type { UserRole } from "@prisma/client";

const VISITOR_ROLE: UserRole = "ATTENDEE";
const EXHIBITOR_ROLE: UserRole = "EXHIBITOR";

interface SuggestionFilters {
  limit?: number;
  search?: string;
  category?: string;
  visitorId: string;
}

export async function getVisitorForSuggestion(visitorId: string) {
  try {
    const visitor = await prisma.user.findFirst({
      where: { id: visitorId, role: VISITOR_ROLE },
      include: {
        registrations: {
          where: {
            status: "CONFIRMED",
            event: {
              status: "PUBLISHED"
            }
          },
          include: {
            event: {
              select: { 
                id: true, 
                title: true, 
                category: true 
              }
            }
          }
        },
        savedEvents: {
          include: {
            event: {
              select: { 
                id: true, 
                title: true, 
                category: true 
              }
            }
          }
        },
        exhibitorSuggestions: {
          where: { status: "PENDING" },
          select: { exhibitorId: true }
        }
      },
    });

    if (!visitor) {
      throw new Error("Visitor not found");
    }

    // Extract categories from visitor's events and interests
    const categories = new Set<string>();
    
    // From registrations
    if (visitor.registrations && visitor.registrations.length > 0) {
      visitor.registrations.forEach((registration: any) => {
        if (registration.event?.category && Array.isArray(registration.event.category)) {
          registration.event.category.forEach((cat: string) => categories.add(cat));
        }
      });
    }
    
    // From saved events
    if (visitor.savedEvents && visitor.savedEvents.length > 0) {
      visitor.savedEvents.forEach((savedEvent: any) => {
        if (savedEvent.event?.category && Array.isArray(savedEvent.event.category)) {
          savedEvent.event.category.forEach((cat: string) => categories.add(cat));
        }
      });
    }
    
    // From interests
    if (visitor.interests && visitor.interests.length > 0) {
      visitor.interests.forEach((interest: string) => categories.add(interest));
    }

    const alreadySuggestedIds = visitor.exhibitorSuggestions?.map((s: any) => s.exhibitorId) || [];

    return {
      id: visitor.id,
      name: `${visitor.firstName || ""} ${visitor.lastName || ""}`.trim(),
      company: visitor.company,
      interests: visitor.interests || [],
      location: visitor.location,
      categories: Array.from(categories),
      alreadySuggestedCount: alreadySuggestedIds.length,
      alreadySuggestedIds,
    };
  } catch (error) {
    console.error("Error in getVisitorForSuggestion:", error);
    throw error;
  }
}

export async function getAvailableExhibitorsForSuggestion(
  visitorId: string,
  filters: { limit?: number; search?: string; category?: string }
) {
  try {
    const { limit = 20, search, category } = filters;
    
    const visitor = await getVisitorForSuggestion(visitorId);
    
    // Build where clause for exhibitors
    const where: any = {
      role: EXHIBITOR_ROLE,
      isActive: true,
    };

    // Exclude already suggested exhibitors
    if (visitor.alreadySuggestedIds.length > 0) {
      where.id = { notIn: visitor.alreadySuggestedIds };
    }

    // Filter by category if specified
    if (category && category !== "all") {
      where.exhibitorBooths = {
        some: {
          event: {
            category: { has: category }
          }
        }
      };
    } else if (visitor.categories.length > 0 && !category) {
      // If no category filter, show exhibitors matching visitor's categories
      where.exhibitorBooths = {
        some: {
          event: {
            category: { hasSome: visitor.categories }
          }
        }
      };
    }

    // Apply search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch exhibitors
    const exhibitors = await prisma.user.findMany({
      where,
      take: limit,
      orderBy: [{ createdAt: "desc" }],
      include: {
        exhibitorBooths: {
          where: {
            event: {
              status: "PUBLISHED",
              startDate: { gte: new Date() }
            }
          },
          include: {
            event: {
              select: {
                id: true,
                title: true,
                startDate: true,
                endDate: true,
                category: true,
              }
            }
          },
          take: 3
        },
        appointmentsAsExhibitor: {
          where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
          select: { id: true }
        },
        followersAsFollowed: {
          select: { id: true }
        }
      }
    });

    // Calculate match score based on categories
    const formattedExhibitors = exhibitors.map(exhibitor => {
      const exhibitorCategories = new Set<string>();
      exhibitor.exhibitorBooths?.forEach((booth: any) => {
        if (booth.event?.category && Array.isArray(booth.event.category)) {
          booth.event.category.forEach((cat: string) => exhibitorCategories.add(cat));
        }
      });
      
      const matchingCategories = visitor.categories.filter(cat => 
        Array.from(exhibitorCategories).some(exCat => 
          exCat.toLowerCase().includes(cat.toLowerCase()) || 
          cat.toLowerCase().includes(exCat.toLowerCase())
        )
      );
      
      const matchScore = matchingCategories.length;
      
      return {
        id: exhibitor.id,
        name: `${exhibitor.firstName || ""} ${exhibitor.lastName || ""}`.trim() || exhibitor.company || "Exhibitor",
        company: exhibitor.company,
        description: exhibitor.description,
        avatar: exhibitor.avatar,
        website: exhibitor.website,
        linkedin: exhibitor.linkedin,
        location: exhibitor.location,
        categories: Array.from(exhibitorCategories),
        matchingCategories,
        matchScore,
        stats: {
          totalMeetings: exhibitor.appointmentsAsExhibitor?.length || 0,
          followers: exhibitor.followersAsFollowed?.length || 0,
          upcomingEvents: exhibitor.exhibitorBooths?.length || 0,
        },
        upcomingEvents: exhibitor.exhibitorBooths?.map((booth: any) => ({
          id: booth.event.id,
          title: booth.event.title,
          startDate: booth.event.startDate,
          endDate: booth.event.endDate,
          categories: booth.event.category || [],
        })) || [],
      };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return formattedExhibitors;
  } catch (error) {
    console.error("Error in getAvailableExhibitorsForSuggestion:", error);
    throw error;
  }
}

export async function sendSuggestionsToVisitor(
  visitorId: string,
  exhibitorIds: string[],
  note?: string
) {
  try {
    const visitor = await prisma.user.findFirst({
      where: { id: visitorId, role: VISITOR_ROLE },
    });

    if (!visitor) {
      throw new Error("Visitor not found");
    }

    // Check if suggestions already exist
    const existingSuggestions = await prisma.exhibitorSuggestion.findMany({
      where: {
        visitorId,
        exhibitorId: { in: exhibitorIds },
      },
    });

    const existingIds = existingSuggestions.map(s => s.exhibitorId);
    const newExhibitorIds = exhibitorIds.filter(id => !existingIds.includes(id));

    if (newExhibitorIds.length === 0) {
      return {
        success: true,
        count: 0,
        message: "All selected exhibitors have already been suggested",
      };
    }

    // Create suggestions
    const suggestions = await prisma.$transaction(
      newExhibitorIds.map(exhibitorId =>
        prisma.exhibitorSuggestion.create({
          data: {
            visitorId,
            exhibitorId,
            note: note || null,
            status: "PENDING",
            sentAt: new Date(),
          },
        })
      )
    );

    return {
      success: true,
      count: suggestions.length,
      suggestions,
    };
  } catch (error) {
    console.error("Error in sendSuggestionsToVisitor:", error);
    throw error;
  }
}

export async function getVisitorSuggestions(visitorId: string) {
  try {
    const suggestions = await prisma.exhibitorSuggestion.findMany({
      where: {
        visitorId,
        status: "PENDING",
      },
      include: {
        exhibitor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            description: true,
            avatar: true,
            website: true,
            linkedin: true,
            location: true,
            exhibitorBooths: {
              where: {
                event: {
                  status: "PUBLISHED",
                  startDate: { gte: new Date() }
                }
              },
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    startDate: true,
                    endDate: true,
                    category: true,
                  }
                }
              },
              take: 3
            }
          }
        }
      },
      orderBy: { sentAt: "desc" }
    });

    return suggestions.map(suggestion => ({
      id: suggestion.id,
      note: suggestion.note,
      sentAt: suggestion.sentAt,
      exhibitor: {
        id: suggestion.exhibitor.id,
        name: `${suggestion.exhibitor.firstName || ""} ${suggestion.exhibitor.lastName || ""}`.trim() || suggestion.exhibitor.company,
        company: suggestion.exhibitor.company,
        description: suggestion.exhibitor.description,
        avatar: suggestion.exhibitor.avatar,
        website: suggestion.exhibitor.website,
        linkedin: suggestion.exhibitor.linkedin,
        location: suggestion.exhibitor.location,
        upcomingEvents: suggestion.exhibitor.exhibitorBooths?.map((booth: any) => ({
          id: booth.event.id,
          title: booth.event.title,
          startDate: booth.event.startDate,
          endDate: booth.event.endDate,
        })),
      }
    }));
  } catch (error) {
    console.error("Error in getVisitorSuggestions:", error);
    throw error;
  }
}

export async function getAllCategories() {
  try {
    const categories = await prisma.eventCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return categories;
  } catch (error) {
    console.error("Error in getAllCategories:", error);
    throw error;
  }
}