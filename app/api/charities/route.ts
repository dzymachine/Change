import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface GlobalGivingProject {
  id: string | number;
  title?: string;
  summary?: string;
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
            if (typeof project.imageLink === "string") {
              imageUrl = project.imageLink;
            } else if (project.image?.imagelink) {
              if (Array.isArray(project.image.imagelink)) {
                imageUrl = project.image.imagelink[0]?.url;
              } else if (typeof project.image.imagelink === "string") {
                imageUrl = project.image.imagelink;
              }
            }

            return {
              id: String(project.id),
              name: project.title || project.organization?.name || "Untitled Project",
              description: project.summary?.slice(0, 150) + "..." || "Supporting communities worldwide.",
              logo: "🌍",
              imageUrl,
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
    .select("id, name, description, logo, logo_url, category")
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
    source: "local" as const,
  }));

  return NextResponse.json({ charities: formatted, source: "local" });
}
