# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint checks

## Architecture Overview

This is a Next.js travel planning application using Feature-Sliced Design (FSD) architecture with the following structure:

### Core Architecture
- **Framework**: Next.js 15 with React 19 and TypeScript
- **Database**: Supabase with both public and admin clients (`src/shared/api/supabase.ts`)
- **Styling**: Tailwind CSS with dark/light theme support
- **Maps**: Google Maps JavaScript API via `@react-google-maps/api`

### Directory Structure (FSD)
- `src/app/` - Next.js App Router pages and API routes
- `src/entities/` - Business entities (media, place, trip, visit) with hooks and types
- `src/features/` - Feature implementations (place/nearby-places, trip/create-trip)
- `src/shared/` - Shared utilities (API clients, providers, UI components)
- `src/widgets/` - Composite UI components (header, maps, galleries, forms)

### Key Components
- **Place Management**: Search, save, and categorize places using Google Maps API
- **Trip Planning**: Create trips with custom routes and timelines
- **Media Handling**: Upload and gallery functionality for travel media
- **Authentication**: Supabase auth with profile management

### Environment Setup
Requires environment variables for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- Google Maps API key

### Development Notes
- Uses TypeScript strict mode with path aliases (`@/*` → `./src/*`)
- Korean language support (HTML lang="ko")
- Responsive design with mobile-first approach
- Theme switching capability built-in

## Communication Guidelines
- **Language**: Always respond in Korean (한국어) when communicating with the user
- All explanations, error messages, and general communication should be in Korean
- Code comments and documentation can remain in English as per development standards