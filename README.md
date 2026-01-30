# PhysioEZ

**PhysioEZ** is a comprehensive clinic management system designed to streamline operations within healthcare facilities. It provides a centralized platform for managing patient records, appointments, employee workflows, and medical data. The desktop applications provided here act as a secure, native wrapper for the cloud-based PhysioEZ platform, enhancing it with native features like permanent storage, camera access, and system notifications.

## Desktop Applications

This directory contains the native desktop installers for PhysioEZ:

- **Windows**: `PhysioEZ_Windows_x64.exe`
- **Linux (Debian/Ubuntu)**: `PhysioEZ_Linux_x64.deb`
- **Linux (RedHat/Fedora)**: `PhysioEZ_Linux_x64.rpm`

### Features

- **Native Camera Access**: Directly capture patient photos and documents using the device camera.
- **Persistent Login**: Securely stores session tokens for uninterrupted access.
- **System Notifications**: Native desktop popups for important alerts.
- **Encrypted Storage**: Client-side data handling for sensitive information.

---

## System Overview

PhysioEZ separates functionality for various personnel (admin, doctors, reception, and assistants), ensuring secure, role-based access.

### 1. System Purpose

PhysioEZ centralizes:

- Role-based access and routing
- Module separation (admin, doctor, reception, etc.)
- Secure database interactions
- Client-side encrypted data handling
- System-wide logging and auditing

### 2. Architecture

The system is built on a modular architecture where:

- Each role has an isolated module directory.
- Sensitive patient data is encrypted/decrypted client-side.
- All events are strictly logged for audit purposes.

### 3. Usage & Deployment

The core system runs as a web application. These desktop clients provide the optimal way for staff to interact with the platform, offering better performance and hardware integration than a standard web browser.

**Security Note**: This application handles sensitive medical data. Ensure your device is secure and you do not share your credentials.

---

_Built with Tauri, Rust, and Modern Web Technologies._
