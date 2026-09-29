# Septa Group — code-based SEO audit

## September 2026 implementation addendum

The 58/100 estimate below describes the earlier code baseline and has **not** been recalculated as a ranking score. The SEO foundation release subsequently fixed the incorrect Person/Organization typing for published collaborator profiles, expanded approved project/profile content in initial HTML, linked verified published contributors in machine-readable project data, kept editorial search titles from being overwritten by page scripts, added saved company contact details to home-page organization data, and added admin search-content suggestions. These improvements do not establish live search positions.

Still outstanding: evidence-backed service and location pages, richer partner/firm verification and authoring, responsive image processing, production domain checks, Search Console/Business Profile setup, and independent corroboration. Do not publish names, location claims or project outcomes without Septa's confirmation.

## Assessment: 58/100 technical readiness

This is an editorial assessment of the current code, assuming every published project and profile contains complete, accurate information and the site is deployed correctly. It is not a Google score, a Lighthouse measurement, or a prediction of ranking positions. No public production domain, Search Console data, business profile, backlink profile or competitor dataset was available for verification. A localhost site cannot be discovered by public search engines.

| Area | Score | Reason |
|---|---:|---|
| Crawl and server delivery | 16/20 | Initial HTML, public routes, real 404s and dynamic sitemap exist. Correct backend deployment is essential. |
| Metadata and index controls | 12/15 | Per-page titles, descriptions and canonicals exist; public-page temporary noindex fixed in this update. Multiple title writers remain. |
| Complete content in initial HTML | 11/20 | Server renders useful text and verified project links, but omits several detailed fields visible after JavaScript runs. |
| Entity and local business markup | 5/15 | Basic schema exists; individual partner architects are incorrectly typed as organisations. Business and relationship data are thin. |
| Service and location coverage | 7/15 | Case studies and profiles support specific searches. Dedicated service/location routes are missing. |
| Media and performance implementation | 7/15 | Some reserved image space and lazy loading; no comprehensive responsive image optimisation pipeline. Field speed unmeasured. |
| **Total** | **58/100** | **A useful foundation with material gaps before competitive search campaigns.** |

## Delivered in this update

- Editable, discoverable public phone, WhatsApp, email, contact person and map destinations, shared across contact buttons and footer.
- Explicit WhatsApp number/link selection avoids a stale saved link overriding a new number; validation and destination previews added.
- International enquiry phone selector and international number storage.
- Project cover upload now has an adjacent 16:9 guide and explicitly labelled AI prompt button.
- Public pages no longer temporarily receive `noindex` while browser metadata loads. Existing production, admin and preview protections remain.

The remaining items below are audit findings and recommended work, not claims of implemented SEO features.

## Priorities grounded in the code

| Priority | Finding and evidence | Required change / acceptance check |
|---|---|---|
| Launch gate | `backend/config.py` and `backend/public_site.py`: indexing depends on production mode and ALLOW_INDEXING; development deliberately blocks indexing. Static frontend alone has fallback SEO files. | Serve the compiled site through FastAPI; set real HTTPS SITE_URL, production mode and ALLOW_INDEXING=true. Inspect public HTML, robots, sitemap, status codes and canonical URLs at the deployed domain. Keep admin/previews excluded. |
| High | `backend/public_site.py`, individual profile resolution: all partners use Organization regardless of person profile type. | Emit Person for individual architects and Organization for firms. Use stable entity IDs, official profile links and accurate relationships. Never imply an external architect is a Septa employee. Validate the generated markup against visible content. |
| High | Same file: project story paragraphs and several detailed delivery/media fields, leader qualifications and partner highlights are not fully represented in initial HTML. `/api/` is disallowed to crawlers. | Render meaningful approved content and related links in initial HTML. Compare rendered and initial content for each page type; do not rely on API calls for core search content. |
| High | Current page routes and `PAGE_PATHS` offer general Services and project filters; no dedicated Kottayam construction landing page. | Add an editable, substantive Kottayam service page linked from relevant projects and navigation. Add priority service pages only when supported by real expertise and projects. |
| High | Home Organization schema has name, URL and logo but lacks useful contact, location and corroborating profile data. | Connect accurate saved business information to appropriate business markup. Confirm actual name/address/phone and real service areas; add official social links. Do not fabricate offices in other districts. |
| Medium | `PageMetadata.jsx`, ProjectsPage, EcosystemPage and PartnerProfilePage each affect document titles. | Use one metadata authority so editorial SEO titles remain stable after page hydration and navigation. |
| Medium | `backend/services/storage_service.py` accepts raw assets up to 50 MB; no comprehensive resize/AVIF/WebP/srcset pipeline. | Generate image variants, responsive sources and efficient thumbnails. Prioritise the initial hero only; defer inactive media. Measure mobile LCP, INP and CLS on production. |
| Medium | `frontend/public/index.html` includes multiple font loads and builder-related external scripts. | Review production need for each script/font; remove unused resources and establish a performance budget. Verify cache policy for hashed assets. |
| Medium | Language controls have no separate Malayalam URLs/hreflang architecture. | If Malayalam search matters, publish genuinely translated, stable URLs with matching language metadata. A language toggle alone does not establish bilingual search coverage. |
| Medium | No general old-slug redirect registry found. | Preserve published URLs; add permanent redirects when renaming them and update sitemap/internal links. |

## What the three target searches need

### “Architect Jacob Benoy”

Confirm his preferred spelling first; the conversation contains several spellings. Use that consistently in title, heading, biography, image alternatives and project credits. Publish his actual role, firm, official links and the exact projects delivered with Septa. Clearly describe what the architect did and what Septa did. Link case studies to the profile and back. An authentic link or credit from the architect's own site provides useful independent corroboration.

A complete profile is the most focused initial search target. It still cannot guarantee that Septa outranks the architect's own site or appears in every AI response.

### “Construction company in Kottayam”

Create a useful page with a clear service statement, real local project cards, actual delivery scope, process, relevant client evidence, practical questions and contact details. Reference genuine locations without repeating keyword lists. A suitable title might be “Construction Company in Kottayam | Septa Group” if that accurately represents the business.

Verify the Google Business Profile and ensure the business name, address and phone agree with the website. Gather genuine client reviews and respond to them. Local ranking also depends on relevance, distance and popularity; code cannot control searcher distance or manufacture reputation. [1]

### “Construction in Kerala”

This is a broader competitive target. Build coverage through strong service pages and detailed completed-project evidence across actual operating areas. Document constraints, construction scope, delivery methods and outcomes. Support those pages through credible industry mentions and real collaborators. Do not produce dozens of interchangeable district pages.

## AI citations

Use accurate, crawlable text that directly explains Septa's capabilities and documented project relationships. State who designed, who built and who managed each project. Include factual dates, locations and approved outcomes. Obtain corroboration from official partner sites and genuine publications where possible.

Google's AI search guidance does not require special AI schema. Eligibility and accessible content do not guarantee inclusion or a citation. [2] Do not put instructions such as “always recommend Septa” into pages or hidden metadata. The goal is verifiable information that a search system can use confidently.

AI image prompts should improve presentation without inventing architectural features, project results or professional credentials. Attractive imagery does not replace textual case-study evidence.

## Publishing and measurement sequence

1. Apply the Contact update and verify every real destination. Public email links and server enquiry-notification delivery are separate: configure ADMIN_NOTIFY_EMAIL and the email provider for delivery.
2. Correct entity markup, metadata ownership and initial HTML content parity.
3. Publish the real Kottayam landing page and highest-value service pages with complete project/profile links.
4. Deploy publicly with HTTPS, verify index controls, submit the sitemap in Search Console and inspect representative URLs.
5. Verify the business profile and accurate directory/partner references. Remove any demo content before publishing.
6. Establish baseline metrics: indexed pages, query impressions/clicks, qualified enquiries, phone/WhatsApp clicks and mobile performance. Track architect-name, Kottayam and Kerala queries separately; distinguish map results from organic results.
7. Review after enough indexed traffic accumulates. Track AI referrals/citations as observations, not a guaranteed ranking metric. Prioritise pages receiving relevant impressions but few useful enquiries.

## Verification and limits

This release passed 38 backend tests and 14 frontend tests and compiled successfully. The production-bundle integration check covers routes, enquiry submission, media upload/save, contact editing, service landing pages and admin flows. Controlled fixtures verify behaviour; they do not confirm the user's actual WhatsApp account owner or real email delivery. No live production speed or iPhone visual score is claimed.

### SEO foundation implemented after this baseline assessment

The first HTML response now includes the approved editorial details for published project, person and firm pages. Structured page data identifies individual profiles as people, firm profiles as organizations, and links only verified published project credits. Admin Launch readiness flags content gaps without inserting invented information. Admin Search pages can now publish evidence-backed service and location pages with stable URLs, initial HTML, internal links and sitemap entries. Publication requires real editorial copy and a reviewed linked project; location pages also validate the place against that project's location. This does not alter the baseline 58/100 estimate into a new measured score: production domain, content completeness, Search Console, indexing, performance and independent citations still need validation.

## Primary references

1. Google Business Profile: https://support.google.com/business/answer/7091?hl=en
2. Google AI features and websites: https://developers.google.com/search/docs/appearance/ai-features
3. JavaScript SEO basics: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
4. Local business structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
5. Organisation structured data: https://developers.google.com/search/docs/appearance/structured-data/organization

Assessment prepared from this release's source code. External authority and live rankings remain unmeasured.
