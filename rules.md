Build a production-ready, extremely simple multi-tenant real-estate property catalog SaaS for independent brokers.

CORE IDEA
Each broker gets their own branded website/domain.
Example:
sharma.com → Sharma's properties only
mukherjee.com → Mukherjee's properties only

All brokers use ONE shared application and ONE Supabase project.
Tenant isolation is mandatory using broker/tenant IDs + Supabase RLS.

IMPORTANT PRODUCT GOAL
This is NOT a 99acres/MagicBricks marketplace.
It is a private digital property catalog for individual brokers.

Broker lists ONLY their own properties.
Customers browse properties and contact that broker directly.

TECH STACK
- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Cloudflare Pages
- Cloudflare DNS/custom domains

KEEP THE SYSTEM SIMPLE
Do not add AI.
Do not add unnecessary features.
Do not add complex dashboards.
Do not add social features.
Do not add customer accounts.
Do not add unnecessary animations.
Do not add excessive text.
Prefer simple, maintainable code over abstractions.

TARGET USERS
Primary customer:
Older people / family decision-makers searching for property.

Therefore UI must be:
- Extremely minimal
- Large readable typography
- High contrast
- Large buttons
- Clear spacing
- Very little text
- Mobile-first
- No clutter
- No confusing menus
- No unnecessary popups

CUSTOMER WEBSITE

Homepage:
- Broker/company name
- Simple hero section
- Property search/filter
- Featured/recent properties
- Direct Call button
- Direct WhatsApp button

Customer filters should remain minimal:
- Budget
- Location
- Property type

PROPERTY CARD
Show only important information:
- Property image
- Price / price range
- Location
- Property type
- Size
- Bedrooms if applicable
- Parking if applicable
- A few key bullet points

Do NOT create large paragraphs.

PROPERTY DETAILS PAGE
Show:
- Large image gallery
- Price
- Location
- Property type
- Size
- Bedrooms
- Parking
- Important property facts as bullet points
- Nearby locations/amenities
- Large "Call" button
- Large "WhatsApp" button

WhatsApp must directly open a chat with the broker's configured WhatsApp number.

Call must use a tel: link to directly call the broker.

NEARBY LOCATION / AMENITY FEATURE
This is a major product feature.

Each property should be able to show nearby useful places such as:
- Schools
- Colleges
- Hospitals
- Metro/train stations
- Bus/transport
- Markets
- Parks
- Other important landmarks

Keep this simple and visual.

Example:
Nearby:
• School – 5 min
• Hospital – 8 min
• Metro – 10 min
• Market – 4 min

Do not overcomplicate this with AI or advanced maps initially.

BROKER ADMIN

Broker can:
- Login
- Add property
- Edit property
- Delete/unpublish property
- Upload multiple property images
- Set price
- Set location
- Set property type
- Set size
- Add important bullet-point facts
- Add nearby amenities
- Set property status
- Configure phone number
- Configure WhatsApp number
- Configure broker/company name
- Manage their own listings only

IMAGE STORAGE
Do NOT store image binaries inside PostgreSQL.

Use Supabase Storage.

Images must be compressed/resized in the frontend before upload.
Use sensible web image sizes and quality to reduce storage/bandwidth.

Store only image metadata/URLs in PostgreSQL.

MULTI-TENANCY

Database structure must support many brokers.

Every broker-owned record must contain tenant/broker ID.

Example:
brokers
properties
property_images
nearby_amenities

Properties belong to one broker.
Images belong to one property.
Amenities belong to one property.

Use Supabase Row Level Security.

Broker A must NEVER be able to read/edit Broker B's properties through the client, API, or manipulated IDs.

Public customers should only receive publicly published properties for the correct broker/domain.

CUSTOM DOMAINS

The same application must support multiple domains.

Example:
sharma.com
mukherjee.com
royproperties.com

The frontend detects the incoming hostname and resolves it to the correct broker/tenant.

Do NOT create separate deployments or separate databases for every broker.

One codebase.
One Supabase backend.
Many tenants.
Many domains.

ARCHITECTURE

Browser
  ↓
Cloudflare
  ↓
React/Vite application
  ↓
Supabase
  ├── Auth
  ├── PostgreSQL
  ├── RLS
  └── Storage

Domain → Tenant resolution → Broker → Properties

SECURITY
- Never trust broker/tenant ID supplied by frontend.
- Enforce tenant isolation with Supabase RLS.
- Keep public access limited to published property data.
- Broker authentication required for admin operations.
- Never expose service-role keys in frontend code.
- Validate uploads and form inputs.
- Prevent one tenant from accessing another tenant's records.

DATABASE
Design a clean normalized schema.

At minimum consider:
- brokers
- domains
- properties
- property_images
- nearby_amenities

Use UUID primary keys.
Use timestamps.
Use foreign keys.
Use indexes for frequently queried fields.

SEARCH
Customer search should efficiently filter:
- broker/tenant
- price
- location
- property type
- published status

DO NOT build a complex search engine.

PROJECT STRUCTURE
Keep the React project clean and understandable.
Avoid unnecessary folders and abstraction layers.

Use reusable components only where they genuinely reduce duplication.

PERFORMANCE
- Lazy-load property images.
- Generate/use optimized images.
- Avoid loading every image at once.
- Use pagination or limited property results where appropriate.
- Keep JavaScript bundle reasonable.
- Avoid heavy UI libraries unless truly necessary.

DESIGN RULE
Every screen should answer:
"What does the user need to do here?"

Remove anything that does not help.

CUSTOMER FLOW

1. Customer opens broker's domain.
2. Sees simple property catalog.
3. Filters by budget/location/type.
4. Opens property.
5. Views photos + short bullet facts + nearby amenities.
6. Taps Call or WhatsApp.
7. Done.

BROKER FLOW

1. Login.
2. Add property.
3. Upload images.
4. Add price/details/bullet facts.
5. Add nearby amenities.
6. Publish.
7. Customer sees it immediately.

DEVELOPMENT RULES

Before coding:
- Inspect the existing project.
- Reuse existing configuration/components when sensible.
- Do not rewrite working code unnecessarily.
- Identify missing pieces.
- Create a concise implementation plan.

Then implement in small logical steps.

DO NOT:
- Explain every line of code.
- Generate unnecessary documentation.
- Create unnecessary files.
- Install unnecessary packages.
- Refactor unrelated code.
- Repeat completed work.
- Replace working architecture without a strong reason.

When a task is complete:
- Briefly state what changed.
- List only important files changed.
- Mention any required environment variables/configuration.
- Stop.

Build the MVP first.
Do not build future features until the MVP works.

## Git & GitHub

The project is hosted in a GitHub repository.

After completing each development phase:
1. Check the changed files.
2. Run the relevant build/test checks.
3. Create a concise commit.
4. Push the commit to the configured GitHub repository.

Do NOT:
- Force push
- Reset or delete existing commits
- Change remote repository settings
- Commit secrets, `.env` files, API keys, passwords, or service-role keys
- Push broken code knowingly

Before the first push, verify that:
- Git remote is configured correctly
- `.gitignore` exists
- Secrets are excluded
- The project builds successfully

Use small, meaningful commits rather than one huge commit.