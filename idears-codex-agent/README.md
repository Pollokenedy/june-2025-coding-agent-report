# Idea Collector Webapp

A simple Node.js application to collect ideas with notes, attachments and voting functionality.

## Development

Install dependencies and run tests:

```bash
npm install
npm test
```

Start the development server:

```bash
npm start
```

The app will be available at `http://localhost:3000`.

## Docker

Build and run using Docker:

```bash
docker build -t idea-app .
```

Use a persistent volume to store the SQLite database and uploaded files:

```bash
docker run -p 3000:3000 \
  -v $(pwd)/data/data.db:/app/data.db \
  -v $(pwd)/uploads:/app/uploads \
  idea-app
```

This will mount the database and uploads directory so data is preserved across container restarts.
