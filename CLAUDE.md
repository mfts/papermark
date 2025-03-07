# Papermark Dev Guide

## Build & Run Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run dev:prisma` - Generate Prisma client and run migrations
- `npm run email` - Start email preview server (port 3001)
- `npm run trigger:v3:dev` - Run Trigger.dev locally

## Code Style
- **Formatting**: Use Prettier with 2-space indentation, double quotes
- **Imports**: Order - next, react, third-party, components, lib, styles, relative
- **TypeScript**: Strict mode, prefer explicit types over `any`
- **Components**: Use functional components with proper props typing
- **Naming**: PascalCase for components, camelCase for variables/functions
- **Error Handling**: Use try/catch for async operations, avoid uncaught rejections
- **State Management**: Prefer SWR for data fetching with proper error handling
- **CSS**: Use Tailwind CSS utility classes, prefer composition over custom classes

## Project Structure
- `/app`: Next.js App Router components and routes
- `/components`: Reusable UI components
- `/lib`: Utility functions and business logic
- `/pages`: Next.js Pages Router (legacy)
- `/prisma`: Database schema and migrations