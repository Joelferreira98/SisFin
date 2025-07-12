# Finance Manager - Replit.md

## Overview

This is a comprehensive financial management application built with a full-stack TypeScript architecture. The application allows users to manage clients, track receivables and payables, generate reports, and send automated WhatsApp reminders. It features a modern React frontend with shadcn/ui components and a robust Express.js backend with PostgreSQL database integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless adapter
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Replit Auth (OIDC-based) with session management
- **Session Storage**: PostgreSQL-based session store using connect-pg-simple

### Database Schema
The application uses a well-structured PostgreSQL schema with the following main entities:
- **Users**: Stores user profile information from Replit Auth
- **Clients**: Customer/client information with contact details
- **Receivables**: Money owed to the business by clients
- **Payables**: Money the business owes to suppliers/receivers
- **WhatsApp Messages**: Communication log for automated reminders
- **Sessions**: Session storage for authentication

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC (OpenID Connect)
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Authorization**: Route-level authentication middleware
- **User Management**: Automatic user creation/updates from auth provider

### Client Management
- **Features**: Full CRUD operations for client records
- **Data**: Name, WhatsApp, document (CPF/CNPJ), email, address
- **Validation**: Zod schema validation on both client and server
- **UI**: Modal-based forms with table display

### Financial Tracking
- **Receivables**: Track money owed by clients with due dates and status
- **Payables**: Track money owed to suppliers with due dates and status
- **Status Management**: Pending, paid, overdue status tracking
- **Reporting**: Financial summaries and analytics

### WhatsApp Integration
- **Purpose**: Send automated payment reminders
- **Message Templates**: Customizable message templates
- **Logging**: Track all sent messages with timestamps
- **Client Association**: Messages linked to specific clients

## Data Flow

1. **Authentication Flow**:
   - User authenticates via Replit Auth
   - Session created and stored in PostgreSQL
   - User profile synchronized with local database

2. **Client Operations**:
   - Frontend forms validated with Zod schemas
   - API requests sent to Express routes
   - Database operations performed via Drizzle ORM
   - Real-time updates via TanStack Query

3. **Financial Operations**:
   - Receivables/Payables managed through modal forms
   - Status updates trigger dashboard recalculations
   - Due date tracking for automated reminders

4. **WhatsApp Notifications**:
   - Background jobs check for overdue items
   - Automated message generation based on templates
   - Message delivery tracking and logging

## Key Features

### Installment Sales System
- **Digital Signature Workflow**: Clients can confirm sales by uploading document photos
- **Approval Process**: Admins can approve/reject sales with notes
- **Status Tracking**: Pending → Confirmed → Approved/Rejected workflow
- **Image Compression**: Automatic image compression to handle large files
- **Secure Tokens**: Unique confirmation tokens for each sale
- **Real-time Updates**: Live status updates via TanStack Query

### Payment Confirmation Flow
1. **Sale Creation**: Admin creates installment sale and generates confirmation link
2. **Client Confirmation**: Client accesses public confirmation page via token
3. **Document Upload**: Client uploads compressed document photo as digital signature
4. **Admin Review**: Admin reviews submitted document and approves/rejects
5. **Status Updates**: Real-time status tracking throughout the process

## External Dependencies

### Database
- **Provider**: Neon serverless PostgreSQL
- **Connection**: Environment-based connection string
- **Migration**: Drizzle Kit for schema management

### Authentication
- **Provider**: Replit Auth (OIDC)
- **Configuration**: Environment variables for client credentials
- **Session**: PostgreSQL-based session storage

### Frontend Libraries
- **UI Components**: Extensive shadcn/ui component library
- **Icons**: Lucide React icons
- **Validation**: Zod schema validation
- **HTTP Client**: Fetch API with TanStack Query
- **Image Processing**: Canvas API for image compression

### Development Tools
- **Build**: Vite with React plugin
- **TypeScript**: Strict configuration with path aliases
- **Linting**: ESLint with TypeScript rules
- **Styling**: Tailwind CSS with PostCSS

## Deployment Strategy

### Development
- **Server**: Express.js with Vite middleware for HMR
- **Database**: Neon serverless PostgreSQL
- **Environment**: Environment variables for configuration
- **Hot Reload**: Vite provides fast development experience

### Production
- **Build Process**: 
  - Frontend: Vite builds optimized React bundle
  - Backend: esbuild bundles Express.js application
- **Static Assets**: Served from dist/public directory
- **Database**: Same Neon PostgreSQL instance
- **Environment**: Production environment variables

### Key Configuration Files
- **Vite Config**: Custom configuration with path aliases and plugins
- **Drizzle Config**: Database schema and migration configuration
- **TypeScript Config**: Strict typing with path mapping
- **Tailwind Config**: Custom design system configuration

The application follows a modern full-stack architecture with clear separation of concerns, type safety throughout, and a focus on developer experience and user interface quality.

## Recent Updates (July 12, 2025)

### Installment Sales System Implementation
- **New Features**: Complete installment sales management system with digital signature workflow
- **Database Schema**: Added installment_sales table with comprehensive status tracking
- **API Endpoints**: Full CRUD operations for installment sales with approval workflow
- **Frontend Components**: Dedicated management interface and public confirmation page
- **Image Handling**: Implemented image compression and payload size optimization (10MB limit)
- **Security**: Secure token-based confirmation system with proper authentication

### Technical Improvements
- **Payload Optimization**: Increased server payload limit to 10MB for image uploads
- **Image Compression**: Client-side image compression using Canvas API
- **Error Handling**: Comprehensive error handling for large file uploads
- **Status Management**: Four-state workflow (pending → confirmed → approved/rejected)
- **Real-time Updates**: Live status updates via TanStack Query invalidation

### User Interface Enhancements
- **Tabbed Interface**: Organized sales by status with clear visual indicators
- **Modal Workflows**: Intuitive modal-based forms for creation and approval
- **Image Preview**: Real-time image preview with compression feedback
- **Responsive Design**: Mobile-friendly confirmation page for client access
- **Navigation**: Added "Vendas Parceladas" to main navigation menu

The installment sales system is now fully operational with comprehensive digital signature workflow, admin approval process, and real-time status tracking.