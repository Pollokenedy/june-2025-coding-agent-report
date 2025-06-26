# Ideas App

> Simple web application for collecting and voting on ideas.

## Requirements

- Node.js >=14
- Docker (optional)

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

Open your browser at http://localhost:3000

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Docker

Build and run the container:

```bash
docker build -t ideas-app .
docker run -p 3000:3000 -v ideas_data:/data ideas-app
```

Or with docker-compose:

```bash
docker-compose up --build
```