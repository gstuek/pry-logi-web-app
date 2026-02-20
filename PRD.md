# PRY Logi - Logistics Management System

A comprehensive bilingual (Thai/English) logistics management web application for tracking shipments, managing jobs, invoicing, and generating reports with role-based access control.

**Current Phase: Phase 4 - Tracking Module & Photo Upload (COMPLETED)**

**Experience Qualities**:
1. **Professional** - Clean, organized interface that instills confidence in managing complex logistics operations
2. **Efficient** - Quick navigation and clear information hierarchy that minimizes clicks and cognitive load for daily operations
3. **Trustworthy** - Secure authentication, clear role permissions, and reliable data presentation that users can depend on

**Complexity Level**: Complex Application (advanced functionality with multiple views, role-based access, internationalization, and Firebase integration)
- This is a full-featured enterprise logistics system with authentication, authorization, multi-language support, and multiple interconnected modules for different business functions.

## Essential Features

### 1. Firebase Authentication with Google Workspace
- **Functionality**: Users sign in using their Google Workspace accounts, with user profiles stored in Firestore
- **Purpose**: Secure, enterprise-grade authentication leveraging existing Google infrastructure
- **Trigger**: User visits app without active session or clicks logout
- **Progression**: Login page → Google Sign-In button → Google OAuth flow → Firestore user lookup → Dashboard redirect
- **Success criteria**: Users can sign in with Google, see their name in header, and access only routes permitted by their role

### 2. Role-Based Access Control
- **Functionality**: Five role types (admin, manager, ops, finance, sales) with different navigation access levels
- **Purpose**: Ensure users only access features relevant to their job function and permissions
- **Trigger**: After successful authentication, role is fetched from Firestore user document
- **Progression**: Login → Fetch user doc → Load role → Filter sidebar navigation → Show/hide admin settings
- **Success criteria**: Admin sees all navigation items including Settings; other roles see appropriate subset; unauthorized access attempts redirect to dashboard

### 3. Bilingual Interface (Thai/English)
- **Functionality**: Complete interface translation with language toggle in header
- **Purpose**: Support Thai-speaking operations team and English-speaking international partners
- **Trigger**: User clicks TH/EN toggle button in header
- **Progression**: Click toggle → Save preference to localStorage → Update all labels/text → Interface re-renders in selected language
- **Success criteria**: All navigation, buttons, and labels switch between Thai and English; preference persists across sessions

### 4. Responsive Sidebar Navigation
- **Functionality**: Left sidebar with icon-labeled navigation links that collapses on mobile
- **Purpose**: Quick access to all major system modules with clear visual organization
- **Trigger**: User clicks navigation item or hamburger menu on mobile
- **Progression**: Desktop: sidebar always visible → Click nav item → Navigate to page | Mobile: Collapsed by default → Tap hamburger → Sidebar slides in → Tap item → Navigate and collapse
- **Success criteria**: All navigation items visible and clickable; smooth transitions; mobile-friendly collapse behavior; active route highlighted

### 5. Module Placeholder Pages
- **Functionality**: Eight core module pages (Dashboard, Jobs, Tracking, Invoices, Reports, Master Data, Maintenance, Admin) with "under development" placeholders
- **Purpose**: Establish navigation structure and routing foundation for future development phases
- **Trigger**: User clicks navigation item
- **Progression**: Click nav item → Route changes → Page title displays → "กำลังพัฒนา/Under Development" message shown
- **Success criteria**: Each route renders correctly; page titles display in current language; no broken links or 404 errors

### 6. Tracking Module with Visual Timeline
- **Functionality**: View all jobs with current tracking status; drill down to detailed tracking timeline with 9 workflow steps; visual progress indicator
- **Purpose**: Provide real-time visibility into job progress for operations team and customers
- **Trigger**: User navigates to /tracking; clicks job card; views timeline
- **Progression**: Tracking list → Filter by status/vehicle → Click job → Timeline view → 9-step progress bar → View step details (timestamp, updated by, notes)
- **Success criteria**: All jobs display with current step badge; timeline shows completed/current/pending states; filters work correctly; mobile responsive

### 7. Status Update with Role-Based Access
- **Functionality**: Ops/Admin/Manager can update job tracking status; add notes; select next workflow step
- **Purpose**: Enable operations team to keep job status current and communicate progress
- **Trigger**: User clicks "Update Status" button on tracking detail page
- **Progression**: Click button → Dialog opens → Select next step → Add optional notes → Save → Timeline updates → Current step advances
- **Success criteria**: Only authorized roles see update button; step validation prevents skipping; notes are persisted; timestamps recorded with user info

### 8. Photo Upload per Tracking Step
- **Functionality**: Upload up to 5 photos per workflow step; max 5MB per photo; stored in Firebase Storage organized by job/step
- **Purpose**: Document job progress with visual evidence; proof of pickup, transit condition, delivery
- **Trigger**: User clicks "Upload Photos" button on any completed or current tracking step
- **Progression**: Click upload → File picker opens → Select photos (1-5) → Upload to Storage → Metadata saved to Firestore → Thumbnails display on step card
- **Success criteria**: Photos upload successfully; file size enforced; thumbnails load; organized by step; deletable by authorized users

### 9. Document Photo Upload
- **Functionality**: Separate document upload section with three categories: Invoice, Delivery Order (DO), Proof of Delivery (POD)
- **Purpose**: Store key business documents separate from workflow photos; easy access for finance and admin
- **Trigger**: User navigates to Documents tab on tracking detail page; clicks upload on specific document type
- **Progression**: Documents tab → Three cards (Invoice/DO/POD) → Click upload → Select files → Upload to documents folder → Display by type
- **Success criteria**: Documents organized by type; multiple uploads per type allowed; accessible to all authenticated users; finance role can access all

### 10. Auto-Delete with TTL
- **Functionality**: When job reaches "Payment Received" status (step 9), automatically set deleteAt timestamp: +30 days for workflow photos, +90 days for documents
- **Purpose**: Comply with data retention policies; automatically clean up storage; reduce storage costs
- **Trigger**: Job status updated to "Payment Received"
- **Progression**: Status update to step 9 → Query all workflow photos → Set deleteAt = now + 30 days → Query all document photos → Set deleteAt = now + 90 days → Save paymentReceivedDate
- **Success criteria**: Firestore TTL deletes expired photo documents; Cloud Function triggers on document deletion; Storage file deleted; deletion logged

### 11. Cloud Function Photo Cleanup
- **Functionality**: Firebase Cloud Function triggered when photo document deleted by TTL; deletes corresponding Storage file; logs deletion
- **Purpose**: Ensure Storage and Firestore stay in sync; prevent orphaned files; maintain audit trail
- **Trigger**: Firestore photo document deleted (by TTL or manual)
- **Progression**: Document deleted → Function triggered → Read storagePath → Delete file from Storage → Write deletion log → Complete
- **Success criteria**: Function executes within 10 seconds; Storage file deleted successfully; deletion logged with reason/timestamp; errors logged for troubleshooting

## Edge Case Handling

- **Unauthenticated Access**: Redirect to /login for any route except /login when no active session detected
- **Role Data Missing**: If user document lacks role field, default to lowest permission level (sales) and log warning
- **Firebase Connection Failure**: Show error toast with retry option; maintain last known auth state if temporary network issue
- **Invalid Routes**: 404 page with navigation back to dashboard
- **Concurrent Sessions**: Allow multiple browser sessions; logout affects only current session
- **Language Preference Lost**: Default to Thai if localStorage is cleared or inaccessible

## Design Direction

The design should evoke **operational confidence and professional efficiency** - a tool that logistics professionals trust for mission-critical work. The interface should feel modern yet familiar, with clear information hierarchy and purposeful use of color to indicate status and priority. The aesthetic should be clean and uncluttered, prioritizing readability and quick information scanning over decorative elements.

## Color Selection

**Approach**: A professional blue-based palette that conveys trust and stability, with warm accents for actions and alerts. The color scheme balances corporate professionalism with modern web application aesthetics.

- **Primary Color**: Deep ocean blue `oklch(0.45 0.12 250)` - Represents trust, stability, and logistics industry standards
- **Secondary Colors**: 
  - Slate gray `oklch(0.55 0.02 250)` for secondary actions and muted elements
  - Cool gray `oklch(0.92 0.005 250)` for backgrounds and subtle separations
- **Accent Color**: Vibrant amber `oklch(0.72 0.15 65)` - High-visibility color for CTAs, active states, and important notifications
- **Foreground/Background Pairings**:
  - Primary (Deep Blue `oklch(0.45 0.12 250)`): White text `oklch(0.99 0 0)` - Ratio 9.2:1 ✓
  - Accent (Vibrant Amber `oklch(0.72 0.15 65)`): Dark gray text `oklch(0.20 0.01 250)` - Ratio 9.8:1 ✓
  - Background (White `oklch(0.99 0 0)`): Dark text `oklch(0.20 0.01 250)` - Ratio 16.5:1 ✓
  - Muted (Cool Gray `oklch(0.92 0.005 250)`): Medium gray text `oklch(0.50 0.01 250)` - Ratio 5.2:1 ✓

## Font Selection

**Approach**: Combine a clean sans-serif for UI elements with excellent Thai language support. IBM Plex Sans Thai provides professional appearance with exceptional Thai character rendering.

- **Primary Typeface**: IBM Plex Sans Thai - Modern, highly legible, purpose-built for Thai-English bilingual interfaces

- **Typographic Hierarchy**:
  - H1 (Page Titles): IBM Plex Sans Thai SemiBold / 32px / -0.02em letter spacing / 1.2 line height
  - H2 (Section Headers): IBM Plex Sans Thai SemiBold / 24px / -0.01em letter spacing / 1.3 line height
  - H3 (Subsections): IBM Plex Sans Thai Medium / 18px / 0em letter spacing / 1.4 line height
  - Body (Main Content): IBM Plex Sans Thai Regular / 16px / 0em letter spacing / 1.5 line height
  - Small (Labels/Captions): IBM Plex Sans Thai Regular / 14px / 0em letter spacing / 1.4 line height
  - Navigation Items: IBM Plex Sans Thai Medium / 15px / 0em letter spacing / 1.3 line height

## Animations

**Approach**: Subtle, functional animations that guide attention and provide feedback without slowing down operations. Use purposeful motion to indicate state changes and navigation transitions.

- Sidebar collapse/expand: 250ms ease-in-out transform
- Navigation item hover: 150ms ease background color transition
- Page transitions: 200ms fade-in for content
- Button press states: 100ms scale transform (0.98) for tactile feedback
- Toast notifications: 300ms slide-in from top-right
- Language toggle: 200ms cross-fade between text labels

## Component Selection

**Components**:
- **Sidebar**: Shadcn Sidebar component with custom navigation items, collapsible on mobile with Sheet overlay
- **Button**: Shadcn Button with variants (default, outline, ghost) for primary actions, secondary actions, and icon-only buttons
- **Avatar**: Shadcn Avatar for user profile display in header
- **Dropdown Menu**: Shadcn Dropdown Menu for user menu (logout, settings quick access)
- **Separator**: Shadcn Separator for visual division between navigation groups
- **Sheet**: Shadcn Sheet for mobile sidebar overlay
- **Toast**: Sonner for notifications (login success, errors, confirmations)
- **Card**: Shadcn Card for future module content containers
- **Badge**: Shadcn Badge for status indicators in future modules

**Customizations**:
- Custom navigation component combining Sidebar structure with phosphor-icons for clear visual hierarchy
- Custom auth guard wrapper component for route protection
- Custom language context provider for i18n state management
- Custom Firebase hook abstractions for auth state management

**States**:
- Navigation items: Hover (accent background), Active (primary background with accent border-left), Inactive (transparent)
- Buttons: Default, Hover (slight brightness increase), Active (pressed scale), Disabled (reduced opacity, no pointer)
- Sidebar: Expanded (full width with labels), Collapsed (icon-only), Mobile (sheet overlay)
- Auth states: Loading (skeleton), Authenticated (full UI), Unauthenticated (redirect)

**Icon Selection**:
- Home/Dashboard: `House` (Phosphor) - Universal home icon
- Jobs/Sales: `ShoppingCart` (Phosphor) - Represents sales and orders
- Tracking: `MapPin` (Phosphor) - Location and tracking visualization
- Invoices: `Receipt` (Phosphor) - Billing and financial documents
- Reports: `ChartBar` (Phosphor) - Data analysis and reporting
- Master Data: `Database` (Phosphor) - Core data management
- Maintenance: `Wrench` (Phosphor) - System maintenance and tools
- Admin/Settings: `Gear` (Phosphor) - Configuration and administration
- Logout: `SignOut` (Phosphor) - Clear logout action
- Language: `Translate` (Phosphor) - Language switching
- Menu (mobile): `List` (Phosphor) - Hamburger menu alternative

**Spacing**:
- Page padding: `px-6 py-4` (24px horizontal, 16px vertical)
- Section gaps: `gap-6` (24px between major sections)
- Component internal padding: `p-4` (16px for cards and containers)
- Navigation item padding: `px-4 py-3` (16px horizontal, 12px vertical)
- Button padding: `px-4 py-2` for default, `px-6 py-3` for large primary actions
- Header height: `h-16` (64px fixed height)
- Sidebar width: Desktop expanded `w-64` (256px), collapsed `w-16` (64px), mobile full overlay

**Mobile**:
- Breakpoint: 768px (Tailwind `md:`)
- Below 768px: Sidebar becomes full-screen sheet overlay, triggered by hamburger menu in header
- Header: Stack user info and language toggle if needed, keep logo and menu button prominent
- Content: Full-width with reduced horizontal padding (`px-4` instead of `px-6`)
- Touch targets: Minimum 44px height for all interactive elements
- Navigation: Full-height sheet with larger touch targets (`py-4` instead of `py-3`)
