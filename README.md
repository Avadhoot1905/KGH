# KGH - Premium Firearms E-Commerce Platform

A full-stack e-commerce platform for firearms, tactical gear, and accessories with advanced features including authentication, appointment scheduling, product management, and real-time order tracking.

## 🚀 Tech Stack

### Frontend
- **Next.js 15.3.3** - React framework with App Router for server-side rendering and optimal performance
- **React 19** - Latest React with concurrent features and improved server components
- **TypeScript** - Type-safe development with full IntelliSense support
- **Tailwind CSS 4** - Utility-first CSS framework for modern, responsive design
- **Lucide React & React Icons** - Comprehensive icon libraries for UI elements
- **Fuse.js** - Powerful fuzzy-search library for product search functionality

### Backend
- **Next.js Server Actions** - Type-safe server-side functions for data mutations
- **NextAuth.js v4** - Complete authentication solution with OAuth providers
- **Prisma ORM** - Type-safe database ORM with migrations and schema management
- **PostgreSQL** - Robust relational database for production-grade data storage
- **bcryptjs** - Secure password hashing (ready for credential auth expansion)

### Additional Tools
- **Razorpay** - Payment gateway integration for secure transactions
- **ESLint** - Code quality and consistency enforcement
- **Turbopack** - Next-generation bundler for faster development

## ✨ Features

### 🔐 Authentication System
- **OAuth Integration**: Google Sign-In via NextAuth.js
- **Session Management**: Database-backed sessions for security and scalability
- **Protected Routes**: Middleware-protected pages requiring authentication
- **Role-Based Access Control**: 
  - `ADMIN` role for store management
  - `NORMAL_USER` role for customers
  - Email-based admin whitelist configuration
- **Prisma Adapter**: Seamless integration between NextAuth and database
- **Automatic Account Linking**: Multiple providers can link to same user

**How It Works:**
1. User clicks "Sign In" button
2. Redirects to Google OAuth consent screen
3. On success, NextAuth creates/updates user in database
4. Session token stored in database and cookie
5. Protected pages verify session server-side
6. Admin routes check user email against whitelist

### 🗄️ Database Architecture (Prisma + PostgreSQL)

**Why Prisma?**
- Type-safe database queries with auto-completion
- Automatic TypeScript types generation
- Easy schema migrations and version control
- Built-in connection pooling
- Query optimization and caching

**Database Models:**

#### Core Models
- **User** - User accounts with profile info, roles, and relationships
- **Account** - OAuth provider connections (NextAuth)
- **Session** - Active user sessions (NextAuth)
- **VerificationToken** - Email verification tokens (NextAuth)

#### Product Management
- **Product** - Main product catalog with pricing, inventory, ratings
- **Category** - Product categorization (Handguns, Rifles, etc.)
- **Brand** - Manufacturer information
- **Type** - Product types (Pistol, Revolver, Shotgun, etc.)
- **Caliber** - Ammunition calibers (.45 ACP, 9mm, etc.)
- **Photo** - Product images with primary photo designation
- **Review** - User reviews with verified purchase status

#### E-Commerce Features
- **Cart** - Shopping cart items with quantities
- **Wishlist** - Saved products for later
- **Order** - Purchase orders with status tracking
- **OrderItem** - Individual items within orders

#### Appointments
- **Appointment** - User appointment requests with admin approval workflow

**Relations:**
- One-to-Many: User → Cart/Wishlist/Orders/Reviews/Appointments
- Many-to-Many: Product ↔ Product (related products)
- Many-to-Many: User ↔ Product (viewed products tracking)
- Cascade Deletes: Automatically clean up related records

### 🛍️ Product Management

**Admin Features:**
- Create/Edit/Delete products
- Manage brands, categories, types, and calibers
- Upload multiple product photos
- Set license requirements
- Tag products (NEW, TOP_SELLER)
- Manage inventory levels
- Set related products for cross-selling

**User Features:**
- Advanced filtering (brand, type, caliber, category, price range)
- Fuzzy search with Fuse.js
- Sort by price, rating, or newest
- Paginated product listings
- Product detail pages with related items
- Customer reviews and ratings
- View history tracking

### 🛒 Shopping Cart System

**Features:**
- Add/remove items with quantity control
- Real-time price calculations
- Persistent cart across sessions (database-backed)
- Inventory validation
- Quick checkout flow
- Cart item count in navbar

**Implementation:**
- Server actions for cart mutations (`addToCart`, `removeFromCart`, `updateQuantity`)
- Optimistic UI updates for instant feedback
- Database queries ensure data consistency
- Protected by authentication

### ❤️ Wishlist System

**Features:**
- Save products for later
- One-click add/remove toggle
- Separate wishlist page
- Move items to cart
- Visual indicators on product cards

**Implementation:**
- Toggle-based server action
- Prevents duplicate entries with unique constraints
- Fast lookups with database indexes
- Real-time UI updates

### 📅 Appointment System

**Complete workflow with database integration:**

**User Side:**
1. Floating red appointment button (visible when authenticated)
2. Click opens appointment popup form
3. Fill in date, time, and reason
4. Submit creates appointment with `PENDING` status
5. View appointment status in popup
6. Prevent duplicate active appointments

**Admin Side:**
1. Admin dashboard at `/mod` route
2. "View Appointments" button opens admin popup
3. See all appointments with filtering:
   - All appointments
   - Pending only
   - Approved only
   - Declined only
4. One-click approve/decline actions
5. Real-time status updates
6. View user details for each appointment

**Database Flow:**
```
User submits → createAppointment() → Validates auth → Checks for active appointment
→ Creates in DB with PENDING status → Returns appointment

Admin reviews → getAllAppointments() → Validates admin → Fetches from DB
→ Displays with user info

Admin approves/declines → approveAppointment()/declineAppointment() 
→ Validates admin → Updates status in DB → Returns updated appointment

User checks status → getUserAppointment() → Validates auth → Fetches latest from DB
→ Shows current status (PENDING/APPROVED/DECLINED)
```

### 👤 User Profile

**Features:**
- View/edit profile information
- Order history
- Appointment history
- Saved addresses
- Account settings

### 🔍 Search & Filters

**Advanced Search:**
- Fuzzy search across product names and descriptions
- Real-time search suggestions
- Search history (optional)

**Filters:**
- Multi-select brand filter
- Type and caliber filters
- Category filtering
- Price range slider
- License requirement toggle
- Product tags (New/Top Seller)

**Sorting:**
- Price: Low to High
- Price: High to Low
- Newest First
- Highest Rated

### 📦 Order Management

**Features:**
- Order creation from cart
- Order status tracking (PENDING, COMPLETED, CANCELLED)
- Order history
- Order details with itemized list
- Total calculations with tax

**Future Enhancement Ready:**
- Razorpay integration for payments
- Order confirmation emails
- Shipment tracking

## 🏗️ Project Structure

```
├── prisma/
│   ├── schema.prisma          # Database schema definition
│   ├── seed.ts                # Database seeding script
│   └── migrations/            # Version-controlled DB migrations
├── src/
│   ├── auth.ts                # NextAuth configuration
│   ├── actions/               # Server actions
│   │   ├── appointments.ts    # Appointment CRUD operations
│   │   ├── auth.ts           # Auth-related actions
│   │   ├── cart.ts           # Cart management
│   │   ├── products.ts       # Product operations
│   │   ├── profile.ts        # User profile actions
│   │   └── wishlist.ts       # Wishlist operations
│   ├── app/
│   │   ├── (admin)/          # Admin-only routes
│   │   │   └── mod/          # Product management dashboard
│   │   ├── (protected)/      # Auth-required routes
│   │   │   ├── Cart/         # Shopping cart page
│   │   │   ├── profile/      # User profile
│   │   │   └── Wishlist/     # Wishlist page
│   │   ├── api/auth/         # NextAuth API routes
│   │   ├── components1/      # Shared components
│   │   ├── ProductDetail/    # Product detail pages
│   │   ├── Shop/             # Product listing page
│   │   └── page.tsx          # Landing page
│   └── styles/               # Global styles
└── public/                   # Static assets
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Google OAuth credentials (for authentication)
- pnpm (recommended) or npm

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kgh"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Razorpay (Optional)
RAZORPAY_KEY_ID="your-razorpay-key"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
```

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database (optional - adds sample data)
pnpm run seed

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📝 Available Scripts

```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm seed         # Push schema and seed database
```

## 🗃️ Database Management

### Prisma Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio (GUI for database)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

### Prisma Benefits in This Project

1. **Type Safety**: All database queries are type-checked at compile time
2. **Auto-completion**: Full IntelliSense for queries and models
3. **Migrations**: Version-controlled schema changes
4. **Relations**: Automatic JOIN queries with `include`
5. **Performance**: Optimized queries with connection pooling
6. **Development Speed**: No SQL writing for common operations

## 🔐 Admin Access

To grant admin access, add user emails to the whitelist in:
`src/app/(admin)/layout.tsx`

```typescript
const allowedAdmins: string[] = [
  "admin@example.com",
  "another-admin@example.com"
];
```

## 🎨 Styling

- **Tailwind CSS 4**: Modern utility classes
- **Custom CSS**: Component-specific styles in `.css` files
- **CSS Modules**: Scoped styles for specific components
- **Responsive Design**: Mobile-first approach

## 🔒 Security Features

- Server-side session validation
- CSRF protection via NextAuth
- SQL injection prevention (Prisma)
- XSS protection (React)
- Secure password hashing (bcryptjs)
- Environment variable protection
- Role-based access control
- Protected API routes

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Works on any platform supporting Next.js:
- Railway
- Render
- AWS Amplify
- Netlify
- Self-hosted

**Database Requirements:**
- Ensure PostgreSQL is accessible from deployment platform
- Use connection pooling for production (PgBouncer recommended)
- Set `DATABASE_URL` in production environment

## 🛠️ Future Enhancements

- [ ] Payment gateway integration (Razorpay ready)
- [ ] Email notifications for orders and appointments
- [ ] Advanced analytics dashboard
- [ ] Product recommendations with ML
- [ ] Live chat support
- [ ] Multi-currency support
- [ ] Inventory management alerts
- [ ] Bulk product import/export
- [ ] Customer reviews moderation
- [ ] Advanced reporting

## 📚 Key Technologies Explained

### Why Next.js?
- **Server-Side Rendering**: Better SEO and initial load performance
- **App Router**: Modern routing with layouts and nested routes
- **Server Actions**: Type-safe API without writing endpoints
- **Image Optimization**: Automatic image optimization with `next/image`
- **File-based Routing**: Intuitive project structure

### Why Prisma?
- **Developer Experience**: Best-in-class TypeScript support
- **Type Safety**: Catch database errors at compile time
- **Migrations**: Track schema changes in version control
- **Performance**: Efficient queries with automatic optimization
- **Multi-database**: Easy to switch databases if needed

### Why NextAuth?
- **OAuth Support**: Easy integration with Google, GitHub, etc.
- **Session Management**: Secure, database-backed sessions
- **Adapters**: Works seamlessly with Prisma
- **Security**: Built-in CSRF protection and secure cookies
- **Extensible**: Custom callbacks and JWT customization

### Why PostgreSQL?
- **ACID Compliance**: Data integrity guaranteed
- **Relations**: Complex queries with JOINs
- **Scalability**: Handles large datasets efficiently
- **JSON Support**: Store flexible data when needed
- **Full-text Search**: Built-in search capabilities

## 📄 License

This project is private and proprietary.

## 👨‍💻 Contributing

This is a private project. For questions or issues, contact the development team.

---

Built with ❤️ using Next.js, Prisma, and PostgreSQL
