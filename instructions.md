# ProSpine Desktop Application

This repository contains the source code for the ProSpine Desktop Application, built with Tauri, React, and Node.js.

## Project Structure

- **`frontend/`**: The React + Vite frontend application.
- **`server/`**: The Node.js + Express backend API.
- **`src-tauri/`**: The Tauri (Rust) shell for the desktop application.

## Prerequisites

- Node.js (v18+ recommended)
- MySQL Server
- Rust & Cargo (for Tauri development)

## Development Setup

### 1. Database Setup
Ensure you have a MySQL database running. The application expects a database named `prospine` (configurable).

### 2. Backend Setup
The backend handles API requests, authentication, and database interactions.

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the `server` directory (if it doesn't exist) with the following content:
   ```
   PORT=3000
   DB_HOST=127.0.0.1
   DB_USER=prospine
   DB_PASS=1234
   DB_NAME=prospine
   NODE_ENV=development
   CHAT_ENCRYPTION_KEY=2L92k78hExeiUiS1xQTBP8VQciGyLcAQkNPNWilGgC0
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`.

### 3. Frontend Setup
The frontend is the user interface built with React.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   The frontend will typically run on `http://localhost:5173`.

### 4. Running the Desktop App (Tauri)
To run the application as a native desktop app:

1. Navigate to the root directory:
   ```bash
   cd ..
   ```

2. Install root dependencies:
   ```bash
   npm install
   ```

3. Run the Tauri development command:
   ```bash
   npm run tauri dev
   ```
   This will launch the desktop application window.

## Important Notes

- **Migration from PHP**: The backend has been fully migrated from PHP to Node.js. All `db.php` and `security.php` logic has been ported to `server/src/config/db.js` and `server/src/middleware/auth.js`.
- **Rate Limiting**: The server implements rate limiting (100 req/min global, 10 req/min auth).
- **Scripts**: Utility scripts (like `debug_dues.js`) are located in `server/src/scripts`.
