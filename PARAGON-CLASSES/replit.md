# Overview

This is a full-stack web application for Paragon Classes, a physics coaching institute that provides online learning management for Class 11th and 12th students. The application serves both teachers and students with features like batch management, fee tracking, study materials, and notifications.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

## January 2025 - PWA Export for Free Deployment
- Converted app to Progressive Web App (PWA) with complete mobile installation capability
- Added service worker for offline functionality and fast loading
- Created web app manifest for native app-like experience on mobile devices
- Added install prompt button on landing page for easy mobile installation
- Prepared complete export package with deployment instructions for free platforms
- App can now be installed on phones like native apps without app store fees

## January 2025 - Final Polish and Branding
- Added Nitin Mathur's professional profile photo to hero section and footer
- Implemented light blue color scheme for calming, professional appearance
- Updated statistics to reflect authentic credentials (25+ years, 3000+ students)
- Enhanced owner and faculty branding throughout the application

## January 2025 - Enhanced Session Persistence
- Extended session duration from 1 week to 30 days
- Added rolling session renewal on user activity
- Improved cookie settings for better cross-browser compatibility
- Sessions persist in PostgreSQL database across app restarts
- Users stay logged in longer, reducing repeated login requirements

## January 2025 - Simplified Class Information
- Removed detailed scheduling and timing information from landing page
- Kept clean, simple class names: "Class 11th Physics" and "Class 12th Physics"
- Focused landing page content on essential information only

## January 2025 - Theme System Implementation
- Added comprehensive 6-theme system (Light, Dark, Ocean Blue, Forest Green, Royal Purple, Sunset Orange)
- Created theme provider with localStorage persistence
- Updated all components to use theme-aware CSS variables
- Added dropdown theme selector in header

## January 2025 - Enhanced Landing Page for New Users
- Added prominent sign-up section with 3-step registration process
- Enhanced hero section with enrollment badge and clear CTAs
- Created detailed batch information and success statistics
- Made entire landing page theme-aware with proper contrast
- Added professional footer with instructor information

# System Architecture

The application follows a modern full-stack architecture with a clear separation between frontend and backend:

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: shadcn/ui components built on top of Radix UI primitives
- **Styling**: Tailwind CSS for utility-first styling
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Management**: Express sessions with PostgreSQL store
- **File Uploads**: Multer middleware for handling file uploads

# Key Components

## Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **Authorization**: Role-based access control (teacher/student)
- **Security**: HTTP-only cookies with secure configuration

## Database Schema
The application uses Drizzle ORM with the following key entities:
- **Users**: Stores user profiles with role-based access (teacher/student)
- **Batches**: Class groupings (11th/12th Physics) with scheduling and fee information
- **Payments**: Fee payment tracking with Stripe integration
- **StudyMaterials**: File upload and management system
- **Notifications**: Announcement system for batch-specific or global messages
- **Sessions**: Secure session storage for authentication

## Payment Integration
- **Provider**: Stripe payment processing
- **Features**: Online payment collection, payment status tracking, and invoice generation
- **Security**: Server-side payment intent creation with client-side confirmation

## File Management
- **Storage**: Local file system with organized directory structure
- **Supported Formats**: PDF, DOC, DOCX, PPT, PPTX files
- **Validation**: File type and size restrictions (50MB limit)
- **Access Control**: Batch-specific file access permissions

# Data Flow

## Authentication Flow
1. User initiates login through Replit Auth
2. OpenID Connect handles authentication
3. User session is created and stored in PostgreSQL
4. Role-based routing determines dashboard access

## Content Management Flow
1. Teachers upload study materials through the file upload interface
2. Files are validated and stored in the local uploads directory
3. File metadata is stored in the database with batch associations
4. Students access materials based on their batch enrollment

## Payment Processing Flow
1. Teachers create payment records for students
2. Students receive payment notifications
3. Stripe payment intent is created server-side
4. Client-side Stripe Elements handle secure payment collection
5. Payment status is updated upon successful transaction

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@stripe/stripe-js & @stripe/react-stripe-js**: Payment processing
- **@radix-ui/***: Accessible UI primitives
- **wouter**: Lightweight React router

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the application
- **Tailwind CSS**: Utility-first CSS framework
- **React Hook Form**: Form state management
- **Zod**: Schema validation

## Authentication & Security
- **openid-client**: OpenID Connect implementation
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store

# Deployment Strategy

The application is designed for deployment on Replit with the following considerations:

## Build Process
- **Frontend**: Vite builds the React application to `dist/public`
- **Backend**: esbuild bundles the Express server to `dist/index.js`
- **Database**: Drizzle migrations are applied via `db:push` command

## Environment Configuration
- **DATABASE_URL**: Neon PostgreSQL connection string
- **SESSION_SECRET**: Secure session encryption key
- **STRIPE_SECRET_KEY**: Stripe API key for payment processing
- **REPLIT_DOMAINS**: Allowed domains for Replit Auth
- **ISSUER_URL**: OpenID Connect issuer URL

## Development vs Production
- **Development**: Uses Vite dev server with HMR and middleware mode
- **Production**: Serves static files from Express with built assets
- **Database**: Same Neon PostgreSQL instance for both environments

The architecture prioritizes developer experience with TypeScript throughout, modern React patterns, and a clean separation of concerns between authentication, business logic, and presentation layers.