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
 * CURATED CHARITIES
 *
 * Add hardcoded charities for non-local filters here.
 * Provide categories to control which filters they appear in.
 */
export const HARDCODED_CHARITIES: Charity[] = [
  {
    id: "world-wildlife-fund",
    name: "World Wildlife Fund (WWF)",
    description:
      "WWF works to tackle the climate crisis by supporting the shift to renewable energy, strengthening climate resilience, and advancing policies and finance that protect people and nature. Its climate work spans mitigation and adaptation with a global focus.",
    logo: "",
    charityUrl: "https://www.worldwildlife.org/",
    imageUrl: "https://assets.worldwildlife.org/www-prd/images/_WW241341.2e16d0ba.fill-400x300.format-webp.webp",
    categories: ["Climate Action"],
  },
  {
    id: "350-org",
    name: "350.org",
    description:
      "350.org is a global grassroots climate organization that campaigns to keep fossil fuels in the ground and accelerate the transition to renewable energy. It focuses on building people-powered movements and local campaigns to drive climate solutions.",
    logo: "",
    charityUrl: "https://350.org/",
    imageUrl: "https://350.org/wp-content/uploads/2024/08/peterborough-uk_34483003311_o.jpg",
    categories: ["Climate Action"],
  },
  {
    id: "environmental-defense-fund",
    name: "Environmental Defense Fund (EDF)",
    description:
      "EDF’s mission emphasizes stabilizing the climate and strengthening the ability of people and nature to thrive, working across sectors and geographies to reduce pollution and drive durable climate solutions.",
    logo: "",
    charityUrl: "https://www.edf.org/",
    imageUrl: "https://www.edf.org/sites/default/files/styles/3_2_2320x1547_focal_point/public/2025-12/homepage-carousel_woman-sitting-utah-valley_2800x1868.webp?h=0c170278&itok=CW050O7S",
    categories: ["Climate Action"],
  },
  {
    id: "nature-conservancy",
    name: "The Nature Conservancy (TNC)",
    description:
      "TNC advances climate action through natural climate solutions, resilience, and clean energy strategies, with goals that include protecting and restoring habitats to help people at severe risk from climate-related emergencies.",
    logo: "",
    charityUrl: "https://www.nature.org/",
    imageUrl: "https://natureconservancy-h.assetsadobe.com/is/image/content/dam/tnc/nature/en/photos/c/o/ColumbiaRiverGorge.jpg?crop=0%2C146%2C2500%2C1375&wid=2600&hei=1430&scl=0.9615384615384616",
    categories: ["Climate Action"],
  },
  {
    id: "rainforest-alliance",
    name: "Rainforest Alliance",
    description:
      "The Rainforest Alliance works with farmers and forest communities to safeguard climate-cooling tropical forests while promoting human rights and sustainable livelihoods.",
    logo: "",
    charityUrl: "https://www.rainforest-alliance.org/",
    imageUrl: "https://www.rainforest-alliance.org/wp-content/uploads/2023/04/grow-landscape-image-scaled.jpg.optimal.jpg",
    categories: ["Climate Action"],
  },
  {
    id: "world-resources-institute",
    name: "World Resources Institute (WRI)",
    description:
      "WRI is a research nonprofit that aims to stabilize the climate while meeting people’s needs and protecting nature, working with policymakers, businesses, and civil society to cut emissions and build resilience.",
    logo: "",
    charityUrl: "https://www.wri.org/",
    imageUrl:"https://files.wri.org/d8/s3fs-public/styles/1000x900/s3/2026-01/buying-vegetables_1.jpg?VersionId=HfUq4AoXiQkag7MvJ9ZKqRShgg.jbyyH&h=51a72048&itok=ppcqSEdQ",
    categories: ["Climate Action"],
  },
  

  {
    id: "the-climate-group",
    name: "The Climate Group",
    description:
      "The Climate Group works with businesses and sub-national governments to deliver a world of net-zero emissions, using collaborative programs and networks to accelerate climate action at scale.",
    logo: "",
    charityUrl: "https://www.theclimategroup.org/",
    imageUrl: "https://www.theclimategroup.org/sites/default/files/styles/image_with_text_desktop_wide_x2/public/2021-01/shutterstock_1660865671.jpg?h=f2fcf546&itok=kf8bIjdd",
    categories: ["Climate Action"],
  },
  {
    id: "malala-fund",
    name: "Malala Fund",
    description:
      "Malala Fund works to ensure all girls can access and complete 12 years of education, emphasizing that quality schooling builds knowledge, skills, and confidence for girls to reach their potential.",
    logo: "",
    charityUrl: "https://malala.org/",
    imageUrl: "https://images.ctfassets.net/0oan5gk9rgbh/jr5pb55iowGEyMsCyKkIk/9293e9e72902143ff97d923e1e32fee3/About_who_we_are_photo.jpg?w=700&h=394&fit=fill&fm=webp&f=faces",
    categories: ["Education"],
  },
  {
    id: "education-cannot-wait",
    name: "Education Cannot Wait (ECW)",
    description:
      "ECW is the UN's global fund for education in emergencies and protracted crises, supporting learning outcomes for refugee, displaced, and crisis-affected children so no one is left behind.",
    logo: "",
    charityUrl: "https://www.educationcannotwait.org/",
    imageUrl: "https://www.educationcannotwait.org/sites/default/files/styles/d06_square/public/2022-07/homepage_text_and_image_1.png.webp?h=c7ad779f&itok=ufqFUaIp",
    categories: ["Education"],
  },
  {
    id: "unicef",
    name: "UNICEF",
    description:
      "UNICEF works to protect the rights of every child, especially the most disadvantaged, and to help children survive, thrive, and fulfill their potential across more than 190 countries and territories.",
    logo: "",
    charityUrl: "https://www.unicef.org/",
    imageUrl: "https://www.unicef.org/sites/default/files/styles/press_release_feature/public/UNI448430%20%281%29.jpg.webp?itok=qS0Stqdf",
    categories: ["Children & Youth", "Education"],
  },
  {
    id: "childfund-international",
    name: "ChildFund International",
    description:
      "ChildFund helps deprived, excluded, and vulnerable children build the capacity to improve their lives and become young adults, parents, and leaders who drive lasting change.",
    logo: "",
    charityUrl: "https://childfund.org/",
    imageUrl: "https://www.childfund.org/contentassets/917d88bb98b3405dbdf3f81ab627d368/rs66899_231205_08435_lpr.jpg",
    categories: ["Children & Youth"],
  },
  {
    id: "partners-in-health",
    name: "Partners In Health (PIH)",
    description:
      "PIH is a global health and social justice organization that works to provide high-quality health care to people who need it most, including a comprehensive model that addresses barriers like food, housing, and transportation.",
    logo: "",
    charityUrl: "https://www.pih.org/",
    imageUrl: "https://www.pih.org/sites/default/files/2025-05/Haiti_20240131_Malnutrition_mjeanty_00709_960w.jpg",
    categories: ["Health"],
  },
  {
    id: "global-fund",
    name: "The Global Fund to Fight AIDS, Tuberculosis and Malaria",
    description:
      "A worldwide partnership that raises and invests billions to defeat HIV, TB, and malaria, while strengthening health and community systems to support a healthier, more equitable future.",
    logo: "",
    charityUrl: "https://www.theglobalfund.org/",
    imageUrl: "https://www.theglobalfund.org/media/ebsddoyv/malaria-story-02.jpg",
    categories: ["Health"],
  },
  {
    id: "gates-foundation",
    name: "Gates Foundation",
    description:
      "Its mission is to help create a world where every person has the opportunity to live a healthy, productive life, including work to reduce disease and strengthen health outcomes globally.",
    logo: "",
    charityUrl: "https://www.gatesfoundation.org/",
    imageUrl: "https://www.gatesfoundation.org/-/media/gfo/3about/1ourstory/home_ourstory_pga1287486_fc235844_1600x900.jpg?rev=56ef51bd4a6d40edacb51b8c09834776&w=1600&hash=CB203E93AC22194575EB3C96279ADA4E",
    categories: ["Health"],
  },
  {
    id: "clinton-health-access-initiative",
    name: "Clinton Health Access Initiative (CHAI)",
    description:
      "CHAI’s mission is to save lives and improve health outcomes in low- and middle-income countries by helping strengthen and sustain quality health systems in partnership with governments and the private sector.",
    logo: "",
    charityUrl: "https://www.clintonhealthaccess.org/",
    imageUrl: "https://www.clintonhealthaccess.org/wp-content/uploads/2024/09/290518_L0A9096_CHAI_Sujata_Khanna_076-scaled.jpg",
    categories: ["Health"],
  },
  {
    id: "direct-relief",
    name: "Direct Relief",
    description:
      "Direct Relief’s mission is to improve the health and lives of people affected by poverty or emergencies by providing essential medical resources, without regard to politics, religion, or ability to pay.",
    logo: "",
    charityUrl: "https://www.directrelief.org/",
    imageUrl: "https://i0.wp.com/www.directrelief.org/wp-content/uploads/2021/09/DR_Florida_10_24-142.jpg?w=1304&ssl=1",
    categories: ["Health"],
  },

  {
    id: "egpaf",
    name: "Elizabeth Glaser Pediatric AIDS Foundation (EGPAF)",
    description:
      "EGPAF focuses its mission on ending pediatric HIV and AIDS, applying its expertise across children’s health, including preventing mother-to-child transmission and expanding treatment access.",
    logo: "",
    charityUrl: "https://pedaids.org/",
    imageUrl: "https://pedaids.org/wp-content/uploads/2025/10/IMG_6839-XL.jpg",
    categories: ["Health"],
  },
  {
    id: "ippf",
    name: "International Planned Parenthood Federation (IPPF)",
    description:
      "IPPF is a global service provider and leading advocate for sexual and reproductive health and rights, working through member associations across many countries to expand access to care and uphold sexual rights.",
    logo: "",
    charityUrl: "https://www.ippf.org/",
    imageUrl: "https://www.ippf.org/sites/default/files/styles/header_background_xxxl_2x/public/2026-01/shutterstock_2229409491_copy.webp?itok=tk3ZBOHq",
    categories: ["Health"],
  },

  {
    id: "icrc",
    name: "International Committee of the Red Cross (ICRC)",
    description:
      "The ICRC provides neutral, impartial, and independent humanitarian assistance to people affected by armed conflict and other violence, and promotes the laws that protect victims of war.",
    logo: "",
    charityUrl: "https://www.icrc.org/",
    imageUrl: "https://www.icrc.org/sites/default/files/styles/desktop_variant11/public/2024-12/V-P-SD-E-02697.jpg.webp?h=1d3a37fa&itok=5pp2ZFbW",
    categories: ["Humanitarian Crises"],
  },
  
  {
    id: "international-rescue-committee",
    name: "International Rescue Committee (IRC)",
    description:
      "The IRC responds to the world's most severe humanitarian crises, helping people devastated by conflict and disaster to survive, recover, and rebuild their lives, including through health, safety, education, and economic wellbeing support.",
    logo: "",
    charityUrl: "https://www.rescue.org/",
    imageUrl: "https://www.rescue.org/sites/default/files/styles/square_1x1_640px_wide/public/2025-11/GettyImages-2189947465-rs.jpg?h=876537db&itok=27Kv7OBX",
    categories: ["Humanitarian Crises"],
  },
  
  {
    id: "norwegian-refugee-council",
    name: "Norwegian Refugee Council (NRC)",
    description:
      "NRC is a global humanitarian organization helping people forced to flee, providing emergency assistance and working to protect displaced people's rights in some of the world's most challenging crises.",
    logo: "",
    charityUrl: "https://www.nrc.no/",
    imageUrl: "https://www.nrc.no/cdn-cgi/image/width=1920,format=auto,fit=crop,height=1080/globalassets/images/countries/sudan/2026/rs31109_img_e7081.jpg",
    categories: ["Humanitarian Crises"],
  },
  {
    id: "oxfam",
    name: "Oxfam",
    description:
      "Oxfam fights inequality to end poverty and injustice, delivering lifesaving support in times of crisis while also advocating for systemic change through economic justice and related policy work.",
    logo: "",
    charityUrl: "https://www.oxfam.org/",
    imageUrl: "https://webassets.oxfamamerica.org/media/images/Oxfam_InuruID_3608.2e16d0ba.fill-1200x675.jpegquality-60.jpg",
    categories: ["Humanitarian Crises"],
  },
  {
    id: "care",
    name: "CARE",
    description:
      "CARE works globally to save lives, defeat poverty, and fight for people, especially women and girls, through humanitarian response and longer-term programming alongside communities.",
    logo: "",
    charityUrl: "https://www.care.org/",
    imageUrl: "https://www.care.org/wp-content/uploads/2025/04/RS116485_2024_DRC_Mpox_Outbreak-01_scr.jpg",
    categories: ["Humanitarian Crises"],
  },
  {
    id: "save-the-children",
    name: "Save the Children",
    description:
      "Save the Children works in the U.S. and around the world to help children survive, learn, and be protected from harm, and it responds to the unique needs of children when crises and disasters strike.",
    logo: "",
    charityUrl: "https://www.savethechildren.org/",
    imageUrl: "https://image.savethechildren.org/lebanon-syrian-refugee-camp-child-ch194750-sq.jpg-ch11042376.jpg/2cupphn1q4301853450awkqr17kc621r.jpg?g=auto&w=768&format=webp&itok=IPKo_m0Z",
    categories: ["Humanitarian Crises", "Education", "Children & Youth"],
  },

  {
    id: "mercy-corps",
    name: "Mercy Corps",
    description:
      "Mercy Corps' mission is to alleviate suffering, poverty, and oppression by helping people build secure, productive, and just communities, working on the front lines of crisis, disaster, and conflict while also pursuing long-term solutions.",
    logo: "",
    charityUrl: "https://www.mercycorps.org/",
    imageUrl: "https://www.mercycorps.org/sites/default/files/styles/slide_large_12x/public/2021-10/iraq-202108-emillstein-2196-2048px.webp?h=235acd85&itok=HcQf_Kjd",
    categories: ["Humanitarian Crises"],
  },
  {
    id: "action-against-hunger",
    name: "Action Against Hunger",
    description:
      "Action Against Hunger is a global humanitarian organization taking decisive action against the causes and effects of hunger, including emergency response to crises and conflict-driven malnutrition.",
    logo: "",
    charityUrl: "https://www.actionagainsthunger.org/",
    imageUrl: "https://www.actionagainsthunger.org/app/uploads/2025/09/Week-1-A-portrait-of-Halima-and-her-mother-Fatuma-after-a-screening-Somalia-Winter-Appeal-2020-scaled-aspect-ratio-1920-1040-1-aspect-ratio-1920-1040.webp",
    categories: ["Humanitarian Crises"],
  },
];

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
    id: "volunteer-center-sc",
    name: "Volunteer Center of Santa Cruz County",
    description: "Connects volunteers with local opportunities, supports community programs, and strengthens nonprofit collaboration.",
    logo: "",
    imageUrl: "https://scvolunteercenter.org/wp-content/uploads/2024/12/IMG_8418.jpg",
    charityUrl: "https://scvolunteercenter.org/",
  },
  {
    id: "hopes-closet",
    name: "Hope's Closet",
    description: "Community donation center providing clothing, household goods, and essential items to neighbors in need throughout Santa Cruz County.",
    logo: "",
    imageUrl: "https://www.hopesclosetsc.com/uploads/1/3/4/5/13456121/hc-infant-bundle_orig.jpg",
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
  return (
    LOCAL_CHARITIES.find((c) => c.id === id) ??
    HARDCODED_CHARITIES.find((c) => c.id === id)
  );
}
