# Ars Technica RSS Feed Reader

A Next.js application that displays and filters RSS feed content from Ars Technica with user authentication and preference syncing using Supabase.

## Features

- Displays articles from the Ars Technica RSS feed
- Category-based filtering to hide unwanted topics
- User authentication (signup/login)
- Syncs blocked categories across devices when logged in
- Tracks article read status using "last visit" timestamps
- Light/dark mode toggle
- Responsive design

## Technical Stack

- Next.js 15.2 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase for authentication and database
- RSS Parser for feed processing
- Jest and React Testing Library for testing

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd ars-test
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:

   - Create a `.env.local` file in the root directory
   - Add your Supabase keys:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

4. Set up the Supabase database:

   - Run the SQL migration scripts located in `supabase/migrations/` to create the required tables

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development Commands

- `npm run dev`: Start the development server with Turbopack
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint to check code quality
- `npm run typecheck`: Run TypeScript type checking
- `npm run test`: Run Jest tests
- `npm run format`: Format code with Prettier
- `npm run validate:all`: Run all validation checks (typecheck, format, stylelint, test, lint)

## Database Schema

The app uses two tables in Supabase:

**blocked_categories**

- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `categories`: TEXT[] (array of blocked category names)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

**last_visit**

- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `last_visited_at`: TIMESTAMPTZ
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

## For New Developers

If you're new to JavaScript, React, or Next.js development, check out the [README for beginners](./README-noob.md) for an introduction to the project structure and key concepts.
