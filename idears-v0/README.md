# Idea Collector

A simple web application for collecting, voting on, and managing ideas with notes and file attachments.

## Features

- ✅ Create new ideas with title and description
- ✅ Vote on ideas (moves them up in the list)
- ✅ Add detailed notes to ideas
- ✅ Attach files to ideas
- ✅ Persistent storage using JSON files
- ✅ Docker deployment with persistent volumes
- ✅ Comprehensive unit tests

## Tech Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Backend**: Next.js API Routes
- **Storage**: JSON files with persistent Docker volumes
- **Styling**: Tailwind CSS with shadcn/ui components
- **Testing**: Jest with React Testing Library
- **Deployment**: Docker with docker-compose

## Quick Start

### Option 1: Using npm scripts (Recommended)

\`\`\`bash
# Build and run production
npm run docker:build
npm run docker:prod

# Or run development mode
npm run docker:dev

# View logs
npm run docker:logs

# Stop containers
npm run docker:stop
\`\`\`

### Option 2: Manual Docker commands

\`\`\`bash
# Development
docker-compose --profile dev up --build

# Production
docker-compose up --build -d

# View logs
docker-compose logs -f
\`\`\`

### Option 3: Local development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
\`\`\`

## Docker Services

- **Production**: `idea-collector` - Optimized production build on port 3000
- **Development**: `idea-collector-dev` - Development mode with hot reload on port 3001

## API Endpoints

- `GET /api/ideas` - Get all ideas (sorted by votes)
- `POST /api/ideas` - Create a new idea
- `POST /api/ideas/[id]/vote` - Vote on an idea
- `PUT /api/ideas/[id]/notes` - Update idea notes
- `POST /api/ideas/[id]/files` - Upload file attachment
- `GET /api/health` - Health check endpoint

## Data Storage

The application uses JSON files for data persistence:

- `data/ideas.json` - Stores all ideas and metadata
- `data/uploads/` - Stores uploaded file attachments

When deployed with Docker, these files are stored in persistent volumes to ensure data survives container restarts.

## Testing

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── api/ideas/          # API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main application
├── __tests__/              # Test files
├── components/ui/          # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
├── scripts/                # Build and deployment scripts
├── data/                   # Persistent data storage
├── Dockerfile              # Production Docker configuration
├── Dockerfile.dev          # Development Docker configuration
├── docker-compose.yml      # Docker Compose setup
└── package-lock.json       # Dependency lock file
\`\`\`

## Troubleshooting

### Build Issues

If you encounter build issues:

1. Make sure you have the latest Docker version
2. Clear Docker cache: `docker system prune -a`
3. Regenerate package-lock.json: `rm package-lock.json && npm install`
4. Try the build script: `npm run docker:build`

### Port Conflicts

If ports 3000 or 3001 are in use:

1. Stop existing containers: `docker-compose down`
2. Check for running processes: `lsof -i :3000`
3. Modify ports in `docker-compose.yml` if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Test Docker build: `npm run docker:build`
7. Submit a pull request

## License

MIT License
