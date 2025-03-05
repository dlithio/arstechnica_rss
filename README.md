# Ars Technica RSS Feed Reader

A Next.js application that displays and filters RSS feed content from Ars Technica with user authentication and preference syncing using Supabase.

## Features

- Displays articles from the Ars Technica RSS feed
- Category-based filtering to hide unwanted topics
- User authentication (signup/login)
- Syncs blocked categories across devices when logged in
- Light/dark mode toggle
- Responsive design

## Technical Stack

- Next.js 15.2 with App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase for authentication and database
- RSS Parser for feed processing

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
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

4. Set up the Supabase database:

   - Run the SQL migration script located in `supabase/migrations/` to create the blocked_categories table

5. Run the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Schema

The app uses a single table in Supabase:

**blocked_categories**

- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `categories`: TEXT[] (array of blocked category names)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ
