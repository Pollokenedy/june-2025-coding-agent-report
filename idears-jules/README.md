# Idea Collection Webapp

## Overview
This application allows users to collaboratively collect, manage, and prioritize ideas. Users can submit new ideas, vote on existing ones, add textual notes for further clarification, and attach relevant files to each idea. The application provides a simple web interface and a RESTful API for idea management. Data is stored persistently using Docker volumes.

## Features
- **Add Ideas**: Submit new ideas with a textual description.
- **Vote on Ideas**: Increment the vote count for an idea. Ideas are displayed sorted by votes.
- **Add Notes**: Attach multiple textual notes to an idea for additional details or discussion.
- **Attach Files**: Upload and associate files (e.g., images, documents) with an idea.
- **Persistent Storage**: Ideas, notes, and attachments are stored in a Docker volume to ensure data persistence across container restarts.
- **Web Interface**: Basic frontend to interact with the application.

## Prerequisites
- **Docker**: Docker must be installed and running on your system to build and run this application. Download from [docker.com](https://www.docker.com/products/docker-desktop/).

## Building and Running with Docker

1.  **Build the Docker Image**:
    Open your terminal in the project root directory and run:
    ```bash
    docker build -t idea-app .
    ```

2.  **Run the Docker Container**:
    After building the image, run the container with the following command:
    ```bash
    docker run -d -p 3000:3000 -v idea-data:/usr/src/app/data --name idea-app-container idea-app
    ```
    Explanation of the command:
    -   `-d`: Run the container in detached mode (in the background).
    -   `-p 3000:3000`: Map port 3000 on your host machine to port 3000 in the container (where the app runs).
    -   `-v idea-data:/usr/src/app/data`: Mount a Docker named volume called `idea-data` to the `/usr/src/app/data` directory inside the container. This is where `ideas.json` and uploaded files are stored, ensuring data persistence. Docker will create the `idea-data` volume automatically if it doesn't already exist.
    -   `--name idea-app-container`: Assigns a name to the running container for easier management.
    -   `idea-app`: The name of the image to run.

    You should then be able to access the application at [http://localhost:3000](http://localhost:3000).

## API Endpoints
The application exposes the following RESTful API endpoints:

-   **`GET /ideas`**:
    -   Retrieves a list of all ideas, sorted by votes in descending order.
-   **`POST /ideas`**:
    -   Creates a new idea.
    -   Request body: `{ "text": "Your idea text" }`
    -   Response: The newly created idea object.
-   **`POST /ideas/:id/vote`**:
    -   Increments the vote count for the idea with the specified `id`.
    -   Response: The updated idea object.
-   **`POST /ideas/:id/notes`**:
    -   Adds a textual note to the idea with the specified `id`.
    -   Request body: `{ "note": "Your note text" }`
    -   Response: The updated idea object.
-   **`POST /ideas/:id/attachments`**:
    -   Uploads a file and associates it with the idea specified by `id`.
    -   Request: `multipart/form-data` with a file field named `attachmentFile`.
    -   Response: The updated idea object, including metadata for the new attachment.

## Tech Stack
-   **Backend**: Node.js, Express.js
-   **Frontend**: HTML, CSS, JavaScript (vanilla)
-   **Testing**: Jest, Supertest
-   **Containerization**: Docker
-   **File Uploads**: Multer
-   **ID Generation**: UUID

To stop the container: `docker stop idea-app-container`
To remove the container: `docker rm idea-app-container`
To inspect the volume: `docker volume inspect idea-data`
To remove the volume (warning: this deletes app data): `docker volume rm idea-data`
