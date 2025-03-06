# Ars Technica RSS Feed Reader: Guide for New JavaScript Developers

This guide is designed for developers who are new to JavaScript, React, and Next.js, but have experience with other programming languages like Python. It explains the project structure, key concepts, and how the different pieces fit together.

## Project Overview

This application is an RSS feed reader that fetches and displays articles from Ars Technica. It allows users to filter articles by category, has user authentication, and syncs user preferences between devices.

## Project Structure Explained

### Root Directory

These files in the root directory control the application's configuration:

- `package.json`: Similar to Python's `requirements.txt` or `pyproject.toml`, it defines dependencies and scripts. In JavaScript, dependencies are managed through npm (Node Package Manager).
- `tsconfig.json`: Configures TypeScript, which adds static typing to JavaScript (similar to Python type hints).
- `next.config.js`: Configuration for Next.js (the web framework).
- `jest.config.js`: Configuration for Jest (the testing framework).
- `eslint.config.mjs`: Rules for the ESLint linter (similar to Python's pylint or flake8).
- `postcss.config.mjs`: Configuration for PostCSS (handles CSS transformations).

### `/src` Directory (Main Source Code)

Most of your development work will happen here:

#### `/src/app`

Next.js 15 uses the "App Router" pattern, which is folder-based routing. Each folder under `/app` becomes a URL route:

- `page.tsx`: The main component rendered at the route (similar to a Python Flask/Django view).
- `layout.tsx`: Defines the layout that wraps around the page.
- `globals.css`: Contains global CSS styles.

#### `/src/app/api`

Contains server-side API endpoints:

- `/fetchRSS/route.ts`: API endpoint that fetches and parses RSS feeds from Ars Technica.

#### `/src/app/components`

Contains React components, which are reusable UI elements (somewhat like Python classes):

- `RSSFeedViewer.tsx`: Main component that displays the RSS feed.
- `FeedItem.tsx`: Displays a single RSS feed article.
- `FeedList.tsx`: Displays a list of feed items.
- `AuthForm.tsx`: Handles user login/signup.
- Other UI components.

#### `/src/app/contexts`

Contains React Context providers, which manage application state:

- `AuthContext.tsx`: Manages authentication state.
- `FeedContext.tsx`: Manages RSS feed data and user preferences.

#### `/src/app/services`

Contains business logic services:

- `feedService.ts`: Functions to fetch and process RSS feeds.
- `blockedCategories.ts`: Functions to manage category filtering.
- `lastVisitService.ts`: Functions to track when users last visited.

#### `/src/app/utils`

Contains utility functions:

- `dateUtils.ts`: Date formatting and processing.
- `localStorage.ts`: Browser local storage management.

#### `/src/lib`

Contains shared libraries:

- `supabase.ts`: Configuration for Supabase (the backend service).

#### `/src/types`

Contains TypeScript type definitions:

- `feed.ts`: Types for RSS feed data.
- `jest.d.ts`: Types for the Jest testing framework.

### `/public` Directory

Contains static assets like images and icons.

### `/supabase` Directory

Contains database migration files for Supabase:

- `migrations/*.sql`: SQL scripts that set up the database schema.

## Key JavaScript/React Concepts for Python Developers

### 1. Component-Based Architecture

React uses components (reusable UI elements) rather than templates:

```javascript
// Python template equivalent in Django
{% if user.is_authenticated %}
  <h1>Welcome, {{ user.username }}</h1>
{% else %}
  <h1>Please log in</h1>
{% endif %}

// React/JSX component approach
function Greeting({ user }) {
  return (
    <h1>
      {user ? `Welcome, ${user.username}` : 'Please log in'}
    </h1>
  );
}
```

### 2. JSX Syntax

JSX is JavaScript XML - it lets you write HTML-like code in JavaScript:

```javascript
// This looks like HTML but it's actually JSX
return (
  <div className="container">
    <h1>Hello, {username}</h1>
    <button onClick={handleClick}>Click me</button>
  </div>
);
```

### 3. Hooks for State Management

React uses "hooks" (functions that let you use React features):

```javascript
// useState is like having a class attribute that triggers re-rendering when changed
const [count, setCount] = useState(0);

// useEffect is for side effects (like fetching data) - similar to __init__ or lifecycle methods
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
```

### 4. Context API vs Global State

React Context is similar to Python's global variables but with proper scope control:

```javascript
// Create a context
const ThemeContext = createContext('light');

// Provide a value
<ThemeContext.Provider value="dark">
  <App />
</ThemeContext.Provider>;

// Use the value
const theme = useContext(ThemeContext);
```

### 5. Async/Await vs Python's async

JavaScript's async/await is similar to Python's:

```javascript
// Python
async def fetch_data():
    response = await requests.get(url)
    data = await response.json()
    return data

# JavaScript
async function fetchData() {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
```

## Development Workflow

### Running the Application

```bash
npm run dev  # Starts development server (like `python manage.py runserver`)
```

### Testing

```bash
npm run test  # Runs Jest tests (like `pytest`)
```

### Type Checking

```bash
npm run typecheck  # Checks TypeScript types (like `mypy`)
```

### Linting

```bash
npm run lint  # Runs ESLint (like `flake8`)
```

### Code Formatting

```bash
npm run format  # Formats code with Prettier (like `black`)
```

## Key Differences from Python Development

1. **Front-end vs Back-end**: JavaScript typically runs in the browser, though Next.js blurs this line with server-side rendering.

2. **Asynchronous by Default**: JavaScript is single-threaded and heavily relies on asynchronous programming (callbacks, promises, async/await).

3. **Package Management**: npm/yarn vs pip, with `package.json` instead of `requirements.txt`.

4. **Module System**: JavaScript uses import/export syntax rather than Python's import statements.

5. **Types**: TypeScript adds optional static typing to JavaScript, similar to Python type hints but with stronger enforcement.

6. **Building & Bundling**: JavaScript projects typically need a build step to transform and bundle code, unlike Python.

7. **Component-Based**: UI is built with components rather than templates.

## Next.js Specific Concepts

1. **App Router**: Routes are based on the file system. A folder named `/app/about` creates a route at `/about`.

2. **Server Components vs Client Components**:

   - Server components run on the server (marked with 'use server' directive)
   - Client components run in the browser (marked with 'use client' directive)

3. **API Routes**: Files in `/app/api` create API endpoints automatically.

4. **Server-Side Rendering (SSR)**: Next.js can render pages on the server before sending them to the client.

## Working with This Project

To make changes to this project, follow these steps:

1. Understand the feature you want to build
2. Identify which components need to be modified
3. Make changes to the relevant files
4. Test your changes using `npm run test`
5. Format and lint your code with `npm run format` and `npm run lint`
6. Run the application with `npm run dev` to see your changes

## Resources for Learning

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [JavaScript for Python Developers](https://www.valentinog.com/blog/python-js/)
