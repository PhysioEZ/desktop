# PhysioEZ Desktop Application

**PhysioEZ** is a modern, comprehensive clinic management system designed to streamline healthcare facility operations. This repository hosts the **Desktop Application** version of the platform, providing a secure, high-performance native experience for clinic staff.

Built on a robust stack of **Tauri**, **React**, and **Node.js**, PhysioEZ Desktop combines the flexibility of web technologies with the power of native system integration.

---

## 🚀 Technology Stack

### Core Frameworks
- **Desktop Shell**: [Tauri v2](https://tauri.app/) (Rust) - Ultra-lightweight, secure desktop bundler.
- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) - High-performance UI rendering.
- **Backend**: [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) - Scalable REST API.
- **Database**: MySQL - Relational data persistence.

### Frontend Libraries
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/) - Utility-first CSS framework.
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) - Minimalist global state.
- **Routing**: [React Router v7](https://reactrouter.com/) - Client-side routing.
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful, consistent icons.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) - Smooth UI interactions.
- **HTTP Client**: Axios - API communication.

### Backend Libraries
- **Database Driver**: `mysql2` - High-performance MySQL client.
- **Security**: `cors`, `helmet` (implied best practice), `express-rate-limit`.
- **Logging**: `morgan` - HTTP request logger.
- **Auth**: JWT-based stateless authentication.

---

## 📂 Project Structure

The project is organized into three main distinct parts:

```
/srv/http/admin/desktop/
├── frontend/             # The User Interface (React + Vite)
│   ├── src/
│   │   ├── admin/        # Admin-specific views and logic
│   │   ├── reception/    # Receptionist workflow components
│   │   ├── components/   # Shared UI components (Modals, Forms, Buttons)
│   │   ├── store/        # Global state stores (Zustand)
│   │   └── utils/        # Helper functions and formatters
│
├── server/               # The Local Backend API (Node.js)
│   ├── src/
│   │   ├── api/          # Route definitions (Admin, Auth, Reception)
│   │   ├── config/       # Database and environment config
│   │   ├── middleware/   # Auth and Error handling middleware
│   │   └── scripts/      # Maintenance and cron scripts
│   └── uploads/          # Local file storage for patient documents
│
├── src-tauri/            # Native Desktop Configuration (Rust)
│   ├── src/              # Rust source code for system hooks
│   ├── tauri.conf.json   # Tauri configuration (Permissions, Window settings)
│   └── capabilities/     # Security scopes and plugin configs
```

---

## 🌟 Key Modules

### 1. Reception Module
Focused on day-to-day clinic operations:
- **Patient Management**: Registration, search, and profile management.
- **Appointment Scheduling**: Booking, rescheduling, and calendar views.
- **Billing**: Invoicing, payment tracking, and digital receipts.

### 2. Admin Module
Focused on clinic oversight and configuration:
- **Dashboard**: Real-time statistics on revenue, footfall, and treatments.
- **Staff Management**: Role-based access control and employee directories.
- **Report Generation**: Detailed financial and operational reports.

### 3. Native Integration
By using Tauri, the application can:
- **Access the Camera**: Directly capture profile photos and medical documents.
- **File System**: Save reports and logs securely to the local disk.
- **Notifications**: Send native OS notifications for urgent alerts.

---

## 🛠️ Development Setup

For a step-by-step guide on setting up the developer environment, please refer to [**instructions.md**](./instructions.md).

### Quick Summary

1.  **Database**: Start your local MySQL server and ensure the `prospine` database exists.
2.  **Server**:
    ```bash
    cd server
    npm install
    npm run dev
    ```
3.  **Frontend/Desktop**:
    ```bash
    # From the root directory
    npm install
    npm run tauri dev
    ```

---

## 🔒 Security & Architecture

- **Data Privacy**: Patient data is handled with strict confidentiality. Sensitive fields are encrypted at rest where applicable.
- **API Security**: All API endpoints (except login) require a strict Bearer Token authenticated via `server/src/middleware/auth.js`.
- **Rate Limiting**: The server implements global and strict rate limiting to prevent abuse.
- **Isolation**: The Admin and Reception modules are logically separated to prevent privilege escalation.

---

## © License

Copyright (c) 2025 PhysioEZ. All rights reserved.
See [LICENSE](./LICENSE) for more details.
