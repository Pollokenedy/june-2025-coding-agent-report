# Idea Collection Webapp

A simple Node.js webapp to collect, vote, and add notes/files to ideas. Built with Express, lowdb, and supports file uploads. Designed for Docker deployment with persistent storage.

## Features
- Add new ideas
- List and vote on ideas (ideas with more votes move up)
- Add notes to ideas
- Attach files to ideas
- REST API
- Unit tests with Jest and Supertest

## Getting Started

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the server:
   ```bash
   node index.js
   ```
3. The API will be available at `http://localhost:3000`

### API Endpoints
- `GET /ideas` - List all ideas (sorted by votes)
- `POST /ideas` - Add a new idea (`{ title, notes? }`)
- `POST /ideas/:id/vote` - Vote for an idea
- `POST /ideas/:id/notes` - Add/update notes (`{ notes }`)
- `POST /ideas/:id/files` - Attach a file (multipart/form-data, field: `file`)

### File Uploads
Uploaded files are served from `/uploads/`.

### Running Tests
```bash
npm test
```

### Docker Usage
Build and run the container, mounting volumes for persistent storage:
```bash
docker build -t idears-cursor .
docker run -p 3000:3000 -v $(pwd)/uploads:/app/uploads -v $(pwd)/db.json:/app/db.json idears-cursor
```

## License
MIT 