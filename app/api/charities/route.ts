import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { LOCAL_CHARITIES } from "@/lib/charities/data";

// Our 6 categories (Local is reserved for hardcoded charities)
export const CHARITY_CATEGORIES = [
  "Local",
  "Education", 
  "Climate Action",
  "Humanitarian Crises",
  "Health",
  "Children & Youth",
] as const;

export type CharityCategory = (typeof CHARITY_CATEGORIES)[number];

// Map GlobalGiving themes to our categories (keys must be lowercase)
const THEME_TO_CATEGORY: Record<string, CharityCategory> = {
  // Education
  "education": "Education",
  "literacy": "Education",
  "digital literacy": "Education",
  // Climate Action
  "climate": "Climate Action",
  "climate action": "Climate Action",
  "environment": "Climate Action",
  "clean water": "Climate Action",
  "sustainable agriculture": "Climate Action",
  "wildlife conservation": "Climate Action",
  // Humanitarian Crises
  "disaster recovery": "Humanitarian Crises",
  "disaster response": "Humanitarian Crises",
  "humanitarian": "Humanitarian Crises",
  "refugees": "Humanitarian Crises",
  "refugee rights": "Humanitarian Crises",
  "conflict resolution": "Humanitarian Crises",
  "human rights": "Humanitarian Crises",
  "justice and human rights": "Humanitarian Crises",
  "hunger": "Humanitarian Crises",
  "food security": "Humanitarian Crises",
  // Health
  "health": "Health",
  "mental health": "Health",
  "physical health": "Health",
  "reproductive health": "Health",
  "covid-19": "Health",
  "hiv/aids": "Health",
  // Children & Youth
  "children": "Children & Youth",
  "youth": "Children & Youth",
  "child protection": "Children & Youth",
  "orphans": "Children & Youth",
  "sport": "Children & Youth",
  "gender equality": "Children & Youth",
};

interface GlobalGivingTheme {
  id?: string;
  name?: string;
}

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
  themes?: {
    theme?: GlobalGivingTheme[];
  };
}

// Extract ALL matching categories for a project
function extractCategories(project: GlobalGivingProject): CharityCategory[] {
  const themes = project.themes?.theme;
  if (!themes || !Array.isArray(themes)) return [];
  
  const categories = new Set<CharityCategory>();
  for (const theme of themes) {
    const themeName = theme.name?.toLowerCase();
    if (themeName && THEME_TO_CATEGORY[themeName]) {
      categories.add(THEME_TO_CATEGORY[themeName]);
    }
  }
  
  return Array.from(categories);
}

function processProject(project: GlobalGivingProject) {
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
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const candidate = value as Record<string, unknown>;
      for (const key of ["url", "href", "link", "#text", "_"]) {
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
    categories: extractCategories(project),
    source: "globalgiving" as const,
  };
}

/**
 * GET /api/charities
 * Fetches charities - tries GlobalGiving API first, falls back to Supabase
 */
export async function GET() {
  const apiKey = process.env.GLOBALGIVING_API_KEY;
  
  if (apiKey) {
    try {
      // Fetch multiple pages of projects (10 per page)
      // GlobalGiving returns some duplicates, so we deduplicate after fetching
      const allProjects: GlobalGivingProject[] = [];
      
      for (let page = 0; page < 10; page++) {
        const startIndex = page * 10 + 1;
        const url = `https://api.globalgiving.org/api/public/projectservice/all/projects/active?api_key=${encodeURIComponent(apiKey)}&start=${startIndex}&numberOfProjects=10`;
        
        const response = await fetch(url, {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });

        if (!response.ok) break;
        
        const data = await response.json();
        const projects: GlobalGivingProject[] = data?.projects?.project || [];
        allProjects.push(...projects);
        
        if (projects.length < 10) break;
      }

      if (allProjects.length > 0) {
        // Deduplicate projects by ID (pagination can return duplicates)
        const uniqueProjects = Array.from(
          new Map(allProjects.map(p => [String(p.id), p])).values()
        );
        
        const globalGivingCharities = uniqueProjects.map(processProject);
        
        // Add local charities with "Local" category
        const localCharitiesWithCategory = LOCAL_CHARITIES.map(c => ({
          ...c,
          categories: ["Local" as CharityCategory],
          source: "local" as const,
        }));
        
        // Combine: local charities first, then GlobalGiving
        const allCharities = [...localCharitiesWithCategory, ...globalGivingCharities];
        
        return NextResponse.json({ 
          charities: allCharities, 
          source: "combined",
          categories: CHARITY_CATEGORIES,
        });
      }
    } catch (error) {
      console.error("GlobalGiving API error:", error);
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

  const formatted = (charities || []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description || "",
    logo: c.logo || "🎯",
    imageUrl: c.logo_url,
    charityUrl: c.website_url,
    categories: c.category ? [c.category as CharityCategory] : [],
    source: "local" as const,
  }));

  return NextResponse.json({ 
    charities: formatted, 
    source: "local",
    categories: CHARITY_CATEGORIES,
  });
}
