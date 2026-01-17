import { NextResponse } from "next/server";

type GlobalGivingProject = {
  id: string | number;
  title?: string;
  summary?: string;
  image?: {
    imagelink?: unknown;
    thumbnaillink?: unknown;
  };
  imageLink?: unknown;
  imageUrl?: unknown;
  organization?: {
    name?: string;
  };
};

const GLOBAL_GIVING_BASE =
  "https://api.globalgiving.org/api/public/projectservice/featured/projects";

export async function GET() {
  const apiKey = process.env.GLOBALGIVING_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GlobalGiving API key" },
      { status: 500 }
    );
  }

  try {
    const url = `${GLOBAL_GIVING_BASE}?api_key=${encodeURIComponent(
      apiKey
    )}&format=json`;
    const response = await fetch(url, {
      next: { revalidate: 300 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch GlobalGiving projects",
          details: details.slice(0, 500),
        },
        { status: response.status }
      );
    }

    const body = await response.text();
    let data: unknown;
    try {
      data = JSON.parse(body);
    } catch {
      return NextResponse.json(
        {
          error: "GlobalGiving did not return JSON",
          details: body.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const root: Record<string, unknown> =
      data && typeof data === "object" ? (data as Record<string, unknown>) : {};

    const projectsNode =
      (root.projects as Record<string, unknown> | undefined)?.project ??
      root.project ??
      [];

    const projects = Array.isArray(projectsNode)
      ? (projectsNode as GlobalGivingProject[])
      : projectsNode
        ? ([projectsNode] as GlobalGivingProject[])
        : [];

    const pickImageUrl = (value: unknown): string | undefined => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        const first = value.find((item) => typeof item === "string");
        return typeof first === "string" ? first : undefined;
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

    const charities = projects.map((project) => {
      const imageUrl =
        pickImageUrl(project.image?.imagelink) ??
        pickImageUrl(project.image?.thumbnaillink) ??
        pickImageUrl(project.imageLink) ??
        pickImageUrl(project.imageUrl);

      return {
        id: String(project.id),
        name: project.title ?? project.organization?.name ?? "Untitled Project",
        description: project.summary ?? "No description available.",
        logo: "🌍",
        imageUrl,
      };
    });

    return NextResponse.json({ charities });
  } catch (error) {
    console.error("GlobalGiving API error", error);
    return NextResponse.json(
      { error: "GlobalGiving request failed" },
      { status: 500 }
    );
  }
}
