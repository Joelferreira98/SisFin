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
- **Navigation**: Added "Confirmações" to main navigation menu (renamed from "Vendas Parceladas")

The installment sales system is now fully operational with comprehensive digital signature workflow, admin approval process, and real-time status tracking.

## Recent Updates (July 12, 2025 - Evening)

### System Integration and Menu Restructuring
- **Automatic Receivables Generation**: When installment sales are approved, the system now automatically creates corresponding receivable entries
- **Menu Reorganization**: Renamed "Vendas Parceladas" to "Confirmações" and removed sale creation functionality from this menu
- **Workflow Optimization**: Sales are now created through the "Contas a Receber" module, while "Confirmações" is used only for viewing and approving sales
- **Integration Testing**: Verified that approved sales correctly generate individual installment entries in accounts receivable

### Technical Implementation
- **Database Integration**: Fixed variable naming conflicts in storage layer for receivables creation
- **Route Updates**: Modified application routes to reflect new menu structure (/confirmations instead of /installment-sales)
- **Interface Simplification**: Removed creation forms from confirmations page, focusing on approval workflow
- **Error Handling**: Improved error handling in receivables generation process

## Latest Updates (July 12, 2025 - Late Evening)

### Multi-User WhatsApp System Implementation
- **Architecture Change**: Implemented multi-user WhatsApp system where admin configures base Evolution API but users manage individual instances
- **Database Schema**: Added `user_whatsapp_instances` table to store individual user WhatsApp instances
- **User Instance Management**: Users can now create, configure, and manage their own WhatsApp instances
- **Admin Configuration**: Admin maintains global Evolution API configuration while users handle personal instances

### New Features
- **Instance Manager**: Created comprehensive WhatsApp instance management interface
- **Tabbed Interface**: Reorganized WhatsApp page with tabs for Instances, Messages, and Admin Configuration
- **User Isolation**: Each user manages their own WhatsApp instances independently
- **Status Tracking**: Real-time status tracking for each instance (connected, connecting, disconnected)
- **CRUD Operations**: Full create, read, update, delete operations for WhatsApp instances

### Technical Implementation
- **Storage Layer**: Added methods for managing user WhatsApp instances in DatabaseStorage
- **API Routes**: Implemented REST endpoints for instance management (/api/whatsapp/instances)
- **Frontend Components**: Created WhatsAppInstanceManager component for instance management
- **Access Control**: Proper user authentication and authorization for instance operations
- **Environment Variables**: Successfully configured EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE_NAME

### User Experience Improvements
- **Intuitive Interface**: Clean, user-friendly interface for managing WhatsApp instances
- **Real-time Updates**: Live status updates via TanStack Query invalidation
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Admin Controls**: Special admin view for global configuration management
- **Responsive Design**: Mobile-friendly interface for all WhatsApp management features

The multi-user WhatsApp system is now fully operational with proper separation between admin global configuration and user-specific instance management.

## Latest Updates (July 12, 2025 - Final Integration)

### Evolution API v2 Full Integration Completed
- **Real Instance Creation**: Implemented complete integration with Evolution API v2 /instance/create endpoint
- **Phone Number Validation**: Added proper phone number formatting to match Evolution API pattern (^\d+[\.\@\w-]+)
- **API Authentication**: Proper apikey header implementation for all Evolution API requests
- **Error Handling**: Comprehensive error handling for API validation failures and network issues

### Technical Improvements
- **Parameter Validation**: Fixed phone number format validation to prevent 400 errors from Evolution API
- **Frontend Validation**: Added real-time input validation for phone number field
- **Status Monitoring**: Implemented real-time status checking via /instance/connect endpoint
- **Instance Management**: Complete CRUD operations with Evolution API synchronization

### User Experience Enhancements
- **Real-time Feedback**: Added loading states and success/error notifications
- **Input Validation**: Frontend validation prevents invalid phone number formats
- **Status Refresh**: Manual status refresh button with visual feedback
- **Error Messages**: Clear, actionable error messages for API failures

### Integration Results
- **Working Creation**: Successfully creates instances in Evolution API and local database
- **Status Sync**: Real-time status synchronization between Evolution API and local system
- **Clean Deletion**: Proper cleanup of instances from both Evolution API and local database
- **Format Compliance**: Phone numbers automatically formatted to meet Evolution API requirements

The Evolution API v2 integration is now fully functional with proper validation, error handling, and real-time synchronization.

## Latest Updates (July 12, 2025 - WhatsApp Automation)

### Automatic WhatsApp Messaging for Installment Sales
- **Feature**: Automatic WhatsApp link sending when installment sales are created
- **Integration**: Uses user's active WhatsApp instance to send confirmation requests
- **Message Content**: Includes sale details, total amount, installment count, and confirmation link
- **User Experience**: Seamless integration - clients automatically receive confirmation links
- **Error Handling**: Sales creation succeeds even if WhatsApp sending fails

### Technical Implementation
- **Instance Management**: Messages sent using user's active WhatsApp instance instead of global service
- **Method Enhancement**: Updated sendTextMessage to accept instanceName parameter
- **User Instance Detection**: Added getUserActiveInstance method to find connected user instances
- **Logging**: Enhanced logging for message sending success/failure tracking
- **Testing Endpoint**: Added /api/whatsapp/test-message for manual message testing

### System Improvements
- **Deletion Process**: Improved instance deletion to remove from both application and Evolution API
- **Status Updates**: Better phone number extraction from Evolution API responses
- **Error Resilience**: Sales creation continues even if WhatsApp service is unavailable
- **Multi-Instance Support**: All messaging methods now support user-specific instances

The automatic WhatsApp messaging system is now fully operational, providing seamless client communication when installment sales are created.

## Latest Updates (July 13, 2025 - Complete WhatsApp Notification System)

### Comprehensive WhatsApp Notification Workflow
- **Complete Cycle**: Full WhatsApp notification system for installment sales lifecycle
- **Three-Stage Process**: 
  1. Confirmation request when sale is created
  2. Approval/rejection notification when admin reviews
  3. Automatic receivables creation on approval
- **Client Journey**: Seamless communication from sale creation to final approval

### New Notification Types
- **Approval Notifications**: Congratulatory messages with sale details and next steps
- **Rejection Notifications**: Professional rejection messages with optional reasoning
- **Template Types**: Extended to include 'approval' and 'rejection' message templates
- **Consistent Formatting**: All messages follow standardized format with emojis and clear structure

### Technical Implementation
- **WhatsApp Service Enhancement**: Added sendSaleApprovalNotification and sendSaleRejectionNotification methods
- **Automated Messaging**: Notifications sent automatically when admin approves/rejects sales
- **Error Resilience**: Approval/rejection process continues even if WhatsApp fails
- **Database Logging**: All notifications logged with appropriate template types
- **Instance Management**: Uses user's active WhatsApp instance with admin fallback

### User Experience Improvements
- **Client Awareness**: Clients receive immediate feedback on their sale status
- **Professional Communication**: Clear, friendly messages for both approval and rejection
- **Seamless Integration**: No additional steps required from admin - notifications are automatic
- **Complete Transparency**: Full communication trail available in WhatsApp messages history

The WhatsApp notification system now provides complete end-to-end communication for the installment sales process, ensuring clients are always informed of their sale status.

## Latest Updates (July 13, 2025 - Enhanced Rejection Flow)

### Advanced Rejection Handling with Link Regeneration
- **Smart Rejection Flow**: When sales are rejected, status resets to "pending" allowing client resubmission
- **Automatic Link Regeneration**: Rejection notifications include new confirmation links for corrections
- **Document Reset**: Previous document photos are cleared on rejection to allow fresh submissions
- **WhatsApp Integration**: Automatic link resending via WhatsApp when regenerating tokens

### New Features
- **Resubmission Workflow**: Clients can correct issues and resubmit documents using new links
- **Token Regeneration**: Admin can manually regenerate confirmation tokens for rejected sales
- **Enhanced UI**: Added "Reenviar Link" button in rejected sales tab for easy link resending
- **Automatic Messaging**: New confirmation links are automatically sent via WhatsApp when regenerated

### Technical Implementation
- **Database Updates**: Clear document fields on rejection to allow fresh submissions
- **API Endpoints**: Added /api/installment-sales/:id/regenerate-token endpoint for token regeneration
- **WhatsApp Service**: Enhanced rejection notifications to include new confirmation links
- **Error Handling**: Robust error handling ensures process continues even if WhatsApp fails
- **Status Management**: Intelligent status transitions from rejected back to pending

### User Experience Improvements
- **Seamless Recovery**: Clients can easily fix issues and resubmit without starting over
- **Clear Communication**: Rejection messages include specific reasons and next steps
- **Admin Controls**: Simple interface for admins to trigger link regeneration
- **Real-time Updates**: Instant status updates and link regeneration with live feedback

The enhanced rejection flow ensures no sales are permanently lost due to initial document issues, providing a complete recovery path for clients while maintaining admin control.

## Latest Updates (July 13, 2025 - System Personalization Complete)

### Complete System Branding and Personalization
- **Dynamic System Name**: Customizable system name displayed in header and page titles
- **Custom Logo Support**: Upload and display custom logos in the application header
- **Dynamic Favicon**: Configurable favicon that updates automatically based on admin settings
- **System Description**: Customizable meta description for SEO and branding purposes
- **Real-time Updates**: All personalization changes reflect immediately across the application

### Technical Implementation
- **System Settings Hook**: Created `useSystemSettings` hook for centralized settings management
- **Dynamic Head Component**: Implemented `SystemHead` component for dynamic title and favicon updates
- **Header Integration**: Updated header component to display custom logos and system names
- **Admin Interface**: Enhanced admin panel with comprehensive system configuration options
- **Database Storage**: All personalization settings stored in system_settings table

### User Experience Improvements
- **Consistent Branding**: Unified branding experience across all application pages
- **Admin-Friendly Interface**: Intuitive admin interface for managing system appearance
- **Immediate Feedback**: Real-time preview of branding changes without page refresh
- **Professional Appearance**: Support for custom logos and branding for business use
- **SEO Optimization**: Dynamic meta tags and descriptions for better search engine visibility

The system personalization feature is now fully operational, allowing complete customization of the application's appearance and branding to match any business requirements.

## Latest Updates (July 13, 2025 - PWA Implementation and Enhanced Logo Management)

### Progressive Web App (PWA) Complete Implementation
- **PWA Manifest**: Dynamic manifest generation based on system settings with custom name, description, and icons
- **Service Worker**: Offline capability with caching strategy for improved performance
- **Install Prompt**: Automatic PWA installation prompt for supported browsers
- **Mobile Optimization**: Full mobile-first design with native app-like experience
- **Cross-platform Support**: Works on iOS, Android, and desktop with proper touch icons and meta tags

### Enhanced Logo Management System
- **Dual Input Support**: Logo configuration supports both URL input and direct file upload
- **Image Upload**: Base64 encoding for uploaded images with 5MB size limit and format validation
- **Real-time Preview**: Live preview of logos and favicons with error handling
- **File Format Support**: PNG, JPG, GIF, SVG formats supported with automatic compression
- **User-friendly Interface**: Tabbed interface for URL vs upload with clear visual feedback

### Technical Implementation
- **PWA Service Worker**: Automatic registration with cache management and offline support
- **Dynamic Manifest**: Server-side manifest generation using system settings
- **Logo Component**: Reusable LogoUploader component with comprehensive validation
- **Mobile Meta Tags**: Proper iOS and Android meta tags for native app experience
- **Cross-browser Support**: Full PWA compatibility across modern browsers

### User Experience Improvements
- **Native App Feel**: Standalone display mode with proper theme colors and icons
- **Offline Functionality**: Core features work without internet connection
- **Install Prompts**: Automatic prompts for adding to home screen
- **Touch Optimization**: Proper touch icons and mobile-optimized interface
- **Fast Loading**: Service worker caching for instant app loading

The PWA implementation transforms the financial management system into a fully-featured mobile application with offline capabilities, native app experience, and professional branding customization.