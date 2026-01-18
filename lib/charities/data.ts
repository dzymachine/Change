/**
 * Charity categories for filtering
 */
export const CHARITY_CATEGORIES = [
  "Local",
  "Education", 
  "Climate Action",
  "Humanitarian Crises",
  "Health",
  "Children & Youth",
] as const;

export type CharityCategory = (typeof CHARITY_CATEGORIES)[number];

/**
 * Charity type definition
 * Used throughout the app for charity data
 */
export interface Charity {
  id: string;
  name: string;
  description: string;
  logo: string;
  imageUrl?: string;
  charityUrl?: string;
  categories?: CharityCategory[];
}

/**
 * LOCAL CHARITIES
 * 
 * Add your local charities here. Each charity needs:
 * 
 * Required fields:
 * - id: Unique identifier (e.g., "local-1", "food-bank-sf")
 * - name: Organization name
 * - description: 1-2 sentence description of what they do
 * - logo: Emoji to use as fallback (e.g., "🏠", "🍲", "📚")
 * 
 * Optional fields:
 * - imageUrl: URL to charity's logo or image (recommended for better display)
 * - charityUrl: Link to their website
 * 
 * Example:
 * {
 *   id: "sf-food-bank",
 *   name: "San Francisco Food Bank",
 *   description: "Fighting hunger in San Francisco by providing food to families in need.",
 *   logo: "🍲",
 *   imageUrl: "https://example.com/logo.png",
 *   charityUrl: "https://www.sfmfoodbank.org",
 * }
 */
export const LOCAL_CHARITIES: Charity[] = [
  {
    id: "native-animal-rescue",
    name: "Native Animal Rescue",
    description: "Wildlife rescue organization dedicated to the rehabilitation and release of injured, sick, and orphaned native animals in Santa Cruz County.",
    logo: "",
    imageUrl: "https://www.nativeanimalrescue.org/wp-content/uploads/2020/05/IMG_0867-Edit.jpg",
    charityUrl: "https://www.nativeanimalrescue.org/",
  },
  {
    id: "volunteer-center-sc",
    name: "Volunteer Center of Santa Cruz County",
    description: "Connects volunteers with local opportunities, supports community programs, and strengthens nonprofit collaboration.",
    logo: "",
    imageUrl: "https://scvolunteercenter.org/wp-content/uploads/2020/05/UCSC-tabling-copy-e1590897512731.png?w=1204&ssl=1",
    charityUrl: "https://scvolunteercenter.org/",
  },
  {
    id: "hopes-closet",
    name: "Hope's Closet",
    description: "Community donation center providing clothing and goods to neighbors in need.",
    logo: "",
    imageUrl: "https://hopesclosetsc.org/wp-content/uploads/2024/06/Hop-C-Logo-Horizontal-300x100.png",
    charityUrl: "http://www.hopesclosetsc.com/",
  },
  {
    id: "resource-center-nonviolence",
    name: "Resource Center For Nonviolence",
    description: "Promotes peace and social justice through education, advocacy, and community programs.",
    logo: "",
    imageUrl: "https://i0.wp.com/rcnv.org/wp-content/uploads/2020/05/UCSC-tabling-copy-e1590897512731.png?w=1204&ssl=1",
    charityUrl: "http://www.rcnv.org/",
  },
  {
    id: "housing-matters",
    name: "Housing Matters",
    description: "Supports individuals experiencing homelessness with housing resources and supportive services.",
    logo: "",
    imageUrl: "https://i0.wp.com/lookout.co/wp-content/uploads/2025/10/2025-10-15-Housing-Matters-scaled.jpg?w=2560&ssl=1",
    charityUrl: "https://housingmatterssc.org/",
  },
  {
    id: "land-trust-sc",
    name: "Land Trust Santa Cruz County",
    description: "Works to conserve open space, agricultural lands, and natural habitats throughout the county.",
    logo: "",
    imageUrl: "https://landtrustsantacruz.imgix.net/uploads/DSC_2610-1.jpeg?url=https://s3.us-west-2.amazonaws.com/craft-landtrust/uploads/DSC_2610-1.jpeg&w=800&h=534&q=60&fit=cover&g=0.5x0.5&dpr=2.5",
    charityUrl: "http://www.landtrustsantacruz.org/",
  },
  {
    id: "barrios-unidos",
    name: "Santa Cruz Barrios Unidos Inc",
    description: "Offers social services and community support, focusing on empowerment and connection.",
    logo: "",
    imageUrl: "https://scbarriosunidos.org/wp-content/uploads/2025/05/9-600x409.jpg",
    charityUrl: "http://scbarriosunidos.org/",
  },
  {
    id: "casa-sc",
    name: "CASA of Santa Cruz County",
    description: "Provides Court Appointed Special Advocates for children in the dependency system to ensure safety and support.",
    logo: "",
    imageUrl: "https://cdn.firespring.com/images/2f469d77-27eb-4739-b9fd-a78d72354952.png",
    charityUrl: "http://casaofsantacruz.org",
  },
  {
    id: "ecology-action",
    name: "Ecology Action",
    description: "Environmental nonprofit focused on sustainability education and community ecological programs.",
    logo: "",
    imageUrl: "https://ecoact.org/wp-content/uploads/2024/11/modo.jpg",
    charityUrl: "https://ecoact.org/",
  },
  {
    id: "community-foundation-sc",
    name: "Community Foundation Santa Cruz County",
    description: "Grants and philanthropic support for local nonprofits, families, and community initiatives.",
    logo: "",
    imageUrl: "https://cfscc.imgix.net/uploads/PV-Loaves-Fishes-Group-shot-5x3.png?auto=compress,format&fm=pjpg&fit=crop&crop=focalpoint&fp-x=0.5047&fp-y=0.407&bm=multiply&sizes=100vw&w=926&h=521&ixlib=imgixjs-3.5.1",
    charityUrl: "http://www.cfscc.org/",
  },
  {
    id: "big-brothers-big-sisters-sc",
    name: "Big Brothers Big Sisters of Santa Cruz County",
    description: "Mentorship organization that pairs adults with youth for supportive, long-term positive relationships.",
    logo: "",
    imageUrl: "https://static.wixstatic.com/media/e6a7c8_9ecd0a2f042b42288f2b89103c9160c3~mv2.jpg/v1/fill/w_1658,h_1280,al_c,q_90,enc_avif,quality_auto/e6a7c8_9ecd0a2f042b42288f2b89103c9160c3~mv2.jpg",
    charityUrl: "http://www.santacruzmentor.org/",
  },
  {
    id: "homeless-garden-project",
    name: "Homeless Garden Project Farm Stand",
    description: "Offers job training and community engagement via sustainable agriculture and farm stands.",
    logo: "",
    imageUrl: "https://homelessgardenproject.org/wp-content/uploads/2023/03/OurFarm_Section2_website.jpg",
    charityUrl: "http://www.homelessgardenproject.org/",
  },
  {
    id: "siena-house",
    name: "Siena House",
    description: "Transitional residential program offering supportive housing and services.",
    logo: "",
    imageUrl: "https://images.squarespace-cdn.com/content/v1/5e8e53c78c7546215eb280b9/4736701a-0361-4356-875a-9be6daa8f5c8/Untitled+design.jpg?format=2500w",
    charityUrl: "https://www.sienahouse.org/",
  },
];

/**
 * Get charity by ID
 * This is a client-side fallback - prefer fetching from /api/charities
 */
export function getCharityById(id: string): Charity | undefined {
  return LOCAL_CHARITIES.find(c => c.id === id);
}
