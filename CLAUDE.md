# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Prompt Manager is a React-based web application for managing AI prompts with templates, versioning, and real-time synchronization. It uses Convex as the backend database and can run continuously via PM2 process management.

## Development Commands

### Local Development
```bash
npm install                    # Install dependencies
npm run dev                    # Start development server (port 3000 by default)
npm run build                  # Build for production
npm run preview                # Preview production build
```

### Convex Database
```bash
npx convex dev                 # Start Convex development server
npx convex deploy              # Deploy Convex functions to production
npx convex dashboard           # Open Convex dashboard
```

### PM2 Process Management
The app runs on **http://localhost:3010** when using PM2:
```bash
npm run pm2:start              # Start app with PM2
npm run pm2:stop               # Stop PM2 process
npm run pm2:restart            # Restart PM2 process
npm run pm2:logs               # View real-time logs
npm run pm2:status             # Check process status
npm run pm2:delete             # Remove from PM2
```

## Architecture

### Frontend Structure
- **Single-file React app**: [index.tsx](index.tsx) (1500+ lines) contains the entire frontend
- **Component library**: Lucide React for icons
- **State management**: React hooks with Convex real-time queries
- **Styling**: Tailwind CSS via utility classes
- **Build tool**: Vite

### Backend (Convex)
Convex provides real-time database with serverless functions:

**Database Schema** ([convex/schema.ts](convex/schema.ts)):
- `prompts` table: Stores user prompts with title, category, content, tags, timestamps
  - Indexes: by_category, by_updatedAt, by_category_and_updatedAt
  - Search indexes: search_content, search_title
- `versions` table: Version history for prompts
  - Indexes: by_promptId, by_promptId_and_timestamp
- `templates` table: Reusable prompt templates (default + custom)
  - Indexes: by_category, by_isCustom, by_category_and_isCustom
  - Search index: search_content

**Convex Functions**:
- [convex/prompts.ts](convex/prompts.ts): CRUD operations for prompts, category/tag aggregation, version restoration
- [convex/templates.ts](convex/templates.ts): CRUD for custom templates (default templates are immutable)
- [convex/versions.ts](convex/versions.ts): Query prompt version history
- [convex/migrations.ts](convex/migrations.ts): Seed functions for default templates and data migration

### Key Features
1. **Prompt Management**: Create, edit, delete, search, filter prompts by category/tags
2. **Version Control**: Automatic versioning on content changes, restore previous versions
3. **Templates**: Pre-built default templates + custom user templates for quick prompt creation
4. **Real-time Sync**: Convex provides automatic real-time updates across clients
5. **Import/Export**: JSON export/import for custom templates
6. **PM2 Integration**: Continuous operation with auto-restart, memory management, logging

## Configuration Files

- [vite.config.ts](vite.config.ts): Vite configuration with port override (defaults to 3000, PM2 uses 3010)
- [ecosystem.config.cjs](ecosystem.config.cjs): PM2 configuration for process management
- [.env.local](.env.local): Environment variables (VITE_CONVEX_URL, GEMINI_API_KEY)
- [tsconfig.json](tsconfig.json): TypeScript configuration

## Important Implementation Notes

### Convex Integration
- Convex client initialized in [index.tsx](index.tsx:1502) with `VITE_CONVEX_URL`
- Use `useQuery` for real-time data fetching, `useMutation` for data modifications
- All Convex functions are auto-generated TypeScript types in `convex/_generated/`

### Version Control Flow
When updating a prompt ([convex/prompts.ts](convex/prompts.ts:87-118)):
1. Check if content changed
2. If changed, save old content to `versions` table with timestamp
3. Update prompt with new content and updatedAt timestamp
4. User can restore any version via `restoreVersion` mutation

### Template System
- **Default templates**: `isCustom: false`, immutable, provided by [convex/migrations.ts](convex/migrations.ts)
- **Custom templates**: `isCustom: true`, user-created, can be edited/deleted
- Templates apply default values when creating new prompts

### Modal State Management
The app uses a single modal with multiple modes ([index.tsx](index.tsx:241-278)):
- View mode: `viewingPromptId` is set
- Edit mode: `editingPromptId` is set
- Create mode: Both are null, modal open
- Template preview: `previewTemplate` is set
- Template edit: `isEditingTemplate` is true

### PM2 vs Direct Vite
- **Direct Vite** (`npm run dev`): Standard development, runs on port 3000
- **PM2** (`npm run pm2:start`): Production-like continuous operation, port 3010, auto-restart, memory limits

## Common Tasks

### Adding a New Convex Function
1. Add function to appropriate file in `convex/` directory
2. Use `query` for read operations, `mutation` for write operations
3. Define args schema with `v` validators
4. Convex auto-generates TypeScript types on save
5. Import via `import { api } from "./convex/_generated/api"`

### Modifying Database Schema
1. Update [convex/schema.ts](convex/schema.ts)
2. Convex handles migrations automatically for non-breaking changes
3. For breaking changes, create migration in [convex/migrations.ts](convex/migrations.ts)

### Adding Default Templates
Add to the `defaultTemplates` array in [convex/migrations.ts](convex/migrations.ts:8-41) and run the `seedDefaultTemplates` internal mutation via Convex dashboard.
