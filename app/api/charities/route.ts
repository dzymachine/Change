import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface GlobalGivingProject {
  id: string | number;
  title?: string;
  summary?: string;
  projectLink?: unknown;
  projectlink?: unknown;
  projectUrl?: unknown;
  url?: unknown;
  websiteUrl?: unknown;
  imageLink?: string;
  image?: {
    imagelink?: Array<{ url?: string }> | string;
  };
  organization?: {
    name?: string;
  };
}

/**
 * GET /api/charities
 * Fetches charities - tries GlobalGiving API first, falls back to Supabase
 */
export async function GET() {
  // Try GlobalGiving API first
  const apiKey = process.env.GLOBALGIVING_API_KEY;
  
  if (apiKey) {
    try {
      const url = `https://api.globalgiving.org/api/public/projectservice/featured/projects?api_key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(url, {
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        const projects: GlobalGivingProject[] = data?.projects?.project || [];
        
        if (projects.length > 0) {
          const charities = projects.map((project) => {
            // Extract image URL from various possible locations
            let imageUrl: string | undefined;
            const pickHighRes = (urls: string[]): string | undefined => {
              if (urls.length === 0) return undefined;
              const preferred = urls.find((url) =>
                /pict_original|original|large|1024|1200|1600/i.test(url)
              );
              return preferred ?? urls[urls.length - 1];
            };

            if (typeof project.imageLink === "string") {
              imageUrl = project.imageLink;
            } else if (project.image?.imagelink) {
              if (Array.isArray(project.image.imagelink)) {
                const candidates = project.image.imagelink
                  .map((item) => item?.url)
                  .filter((item): item is string => Boolean(item));
                imageUrl = pickHighRes(candidates);
              } else if (typeof project.image.imagelink === "string") {
                imageUrl = project.image.imagelink;
              }
            }

            const pickLink = (value: unknown): string | undefined => {
              if (typeof value === "string") {
                return value;
              }
              if (value && typeof value === "object") {
                const candidate = value as Record<string, unknown>;
                const keys = ["url", "href", "link", "#text", "_"];
                for (const key of keys) {
                  if (typeof candidate[key] === "string") {
                    return candidate[key] as string;
                  }
                }
              }
              return undefined;
            };

            const charityUrl =
              pickLink(project.projectLink) ??
              pickLink(project.projectlink) ??
              pickLink(project.projectUrl) ??
              pickLink(project.url) ??
              pickLink(project.websiteUrl);

            return {
              id: String(project.id),
              name: project.title || project.organization?.name || "Untitled Project",
              description: project.summary || "Supporting communities worldwide.",
              logo: "🌍",
              imageUrl,
              charityUrl,
              source: "globalgiving" as const,
            };
          });

          return NextResponse.json({ charities, source: "globalgiving" });
        }
      }
    } catch (error) {
      console.error("GlobalGiving API error:", error);
      // Fall through to Supabase fallback
    }
  }

  // Fallback to Supabase charities
  const supabase = await createClient();
  const { data: charities, error } = await supabase
    .from("charities")
    .select("id, name, description, logo, logo_url, category, website_url")
    .eq("is_active", true)
    .order("name");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch charities", details: error.message },
      { status: 500 }
    );
  }

  // Map to the format expected by CharityPicker
  const formatted = (charities || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    logo: c.logo || "🎯",
    imageUrl: c.logo_url,
    charityUrl: c.website_url,
    source: "local" as const,
  }));

  return NextResponse.json({ charities: formatted, source: "local" });
}
