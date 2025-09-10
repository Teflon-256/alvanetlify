# AlvaCapital Trading Platform

## Overview

AlvaCapital is a comprehensive trading platform that provides portfolio management, referral tracking, and copy trading capabilities. The platform allows users to connect multiple trading accounts from different brokers (Exness, Bybit, Binance), track their performance, manage referrals, and participate in copy trading through master-copier relationships. Built as a full-stack web application with a modern React frontend and Express.js backend, it emphasizes real-time data management and user-friendly interfaces for financial trading operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS styling
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **Design System**: Dark theme with custom CSS variables, Inter and Playfair Display fonts

### Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect and session management
- **API Design**: RESTful endpoints with centralized error handling and request logging
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Database Schema
- **Users Table**: Stores user profiles with referral codes and hierarchical referral relationships
- **Trading Accounts**: Multi-broker account connections with balance and P&L tracking
- **Referral System**: Earnings tracking and referral link management with click/conversion analytics
- **Master-Copier Connections**: Copy trading relationships with status management
- **Sessions Table**: Secure session storage for authentication persistence

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC for secure authentication
- **Session Management**: Server-side sessions with PostgreSQL storage and configurable TTL
- **Route Protection**: Middleware-based authentication checks for protected endpoints
- **User Context**: Centralized user state management through React Query

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL database with connection pooling
- **Drizzle Kit**: Database migration and schema management tools

### Authentication Services
- **Replit Auth**: OIDC-based authentication service
- **OpenID Client**: Standards-compliant authentication flow implementation

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### External Integrations
- **Trading Brokers**: Support for Exness, Bybit, and Binance account connections
- **Real-time Data**: Portfolio balance and P&L tracking capabilities
- **Referral Analytics**: Click and conversion tracking for referral links