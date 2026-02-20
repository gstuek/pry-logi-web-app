# PRY Logi - Logistics Management System (Phase 1)

A bilingual (Thai/English) logistics management web application built with React, TypeScript, Tailwind CSS, and Firebase.

## Phase 1 Features

✅ **Firebase Authentication**
- Google Sign-In with Google Workspace accounts
- Role-based access control (admin, manager, ops, finance, sales)
- User data stored in Firestore

✅ **Responsive Layout & Navigation**
- Professional header with app logo, user info, language toggle, and logout
- Left sidebar navigation with icons
- Collapsible mobile menu
- Role-based navigation items (admin-only settings)

✅ **Internationalization (i18n)**
- Thai/English language support
- Toggle button in header
- Persisted language preference
- All UI text translated

✅ **Module Placeholder Pages**
- Dashboard
- Jobs/Sales
- Tracking
- Invoices
- Reports
- Master Data
- Maintenance
- Settings (Admin only)

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui v4
- **Icons**: Phosphor Icons
- **Backend**: Firebase (Auth, Firestore, Storage)
- **i18n**: react-i18next

## Prerequisites

- Node.js 18+ and npm
- Firebase project with:
  - Authentication enabled (Google provider)
  - Firestore database
  - Storage bucket
- Google Workspace domain (or allow all domains for testing)

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Google Authentication:
   - Go to Authentication → Sign-in method
   - Enable Google provider
   - (Optional) Add authorized domains

### 2. Create Firestore Database

1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules (example):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### 3. Add User Document

Manually create a user document in Firestore:
- Collection: `users`
- Document ID: Your Google user UID (get from Firebase Auth after first login)
- Fields:
  ```
  {
    uid: "your-uid",
    name: "Your Name",
    email: "your.email@example.com",
    role: "admin",  // or manager, ops, finance, sales
    active: true,
    createdAt: Timestamp (auto-generated)
  }
  ```

## Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   ```bash
   cp .env.example .env.local
   ```

3. **Edit `.env.local`** with your Firebase config:
   - Go to Project Settings → General → Your apps
   - Copy the config values into `.env.local`

4. **Run development server**:
   ```bash
   npm run dev
   ```

5. **Open browser**:
   ```
   http://localhost:5173
   ```

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── MainLayout.tsx          # Main app layout with header & sidebar
│   ├── pages/
│   │   ├── LoginPage.tsx           # Google Sign-In page
│   │   └── PlaceholderPage.tsx     # Reusable placeholder for modules
│   └── ui/                         # shadcn components (pre-installed)
├── hooks/
│   ├── useAuth.ts                  # Firebase auth hook
│   └── use-mobile.ts               # Responsive breakpoint hook
├── lib/
│   ├── firebase.ts                 # Firebase initialization
│   ├── i18n.ts                     # i18next configuration
│   ├── navigation.ts               # Navigation items & role filtering
│   └── utils.ts                    # Utility functions
├── locales/
│   ├── th.json                     # Thai translations
│   └── en.json                     # English translations
├── types/
│   └── index.ts                    # TypeScript types
├── App.tsx                         # Main app component with routing
└── index.css                       # Global styles & theme
```

## User Roles & Permissions

| Role     | Access                                    |
|----------|-------------------------------------------|
| Admin    | All pages including Settings              |
| Manager  | All pages except Settings                 |
| Ops      | All pages except Settings                 |
| Finance  | All pages except Settings                 |
| Sales    | All pages except Settings                 |

## Development Workflow

### Adding New Users

1. User signs in with Google
2. Manually add user document to Firestore `users` collection with desired role
3. User refreshes page to see role-based navigation

### Changing Language

- Click TH/EN button in header
- Language preference saved to localStorage
- Persists across sessions

### Navigation

- Click sidebar items to navigate
- URL updates with hash routing (`#/dashboard`, `#/jobs`, etc.)
- Mobile: Hamburger menu opens sidebar sheet

## Next Steps (Future Phases)

- [ ] Implement Dashboard with KPIs and charts
- [ ] Build Jobs/Sales module (CRUD operations)
- [ ] Develop Tracking system with map integration
- [ ] Create Invoicing module
- [ ] Build Reports with filtering and export
- [ ] Implement Master Data management
- [ ] Add Maintenance scheduling
- [ ] Build Admin/Settings panel

## Troubleshooting

### "Cannot read properties of undefined" error
- Ensure Firebase config in `.env.local` is correct
- Check Firebase project is active and not in billing grace period

### "User not found" or no role
- Make sure user document exists in Firestore `users` collection
- Verify document ID matches authenticated user's UID

### Navigation not showing
- Check user role in Firestore
- Verify `navigationItems` in `src/lib/navigation.ts` includes user's role

### Language not persisting
- Check browser localStorage is enabled
- Clear cache and try again

## License

Proprietary - PRY Logi Logistics Management System
