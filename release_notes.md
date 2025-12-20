# CareSyncOS v1.0.0 Release Notes

**Release Date:** 2025-12-20
**Version:** 1.0.0 (Initial Release)

We are excited to announce the first release of the **CareSyncOS Desktop Application**. This application brings the full power of the CareSync platform to your desktop with enhanced performance, native integration, and security.

## 🚀 Key Features

- **Native Camera Integration**: Capture patient photos, documents, and medical records directly using your device's camera.
- **System Notifications**: Stay updated with real-time desktop alerts for appointments, critical patient updates, and system messages.
- **Persistent Login**: Secure authentication with persistent session handling, reducing the need for frequent logins.
- **Encrypted Storage**: Client-side storage of sensitive data with industry-standard encryption.
- **Dedicated Environment**: Run CareSyncOS in its own optimized window, separate from your web browser clutter.

## 📦 Downloads

The following packages are available for this release:

### Windows (Recommended)

- **File**: `CareSyncOS_Windows_x64.exe`
- **Description**: Standalone executable for Windows 10/11. No installation required; simply run the file.

### Linux

- **Debian/Ubuntu**: `CareSyncOS_Linux_x64.deb`
  - Standard Debian package for Ubuntu, Debian, and Mint.
- **RedHat/Fedora**: `CareSyncOS_Linux_x64.rpm`
  - RPM package for Fedora, CentOS, and RHEL.

## 🔧 Installation Instructions

**Windows:**

1.  Download `CareSyncOS_Windows_x64.exe`.
2.  Double-click to verify and launch the application.
3.  (Optional)Create a shortcut on your desktop for easy access.

**Linux (Debian/Ubuntu):**

```bash
sudo dpkg -i CareSyncOS_Linux_x64.deb
sudo apt-get install -f # If dependencies are missing
```

## 🐛 Known Issues

- Linux users on certain distributions might need to install `gstreamer` plugins (`gst-plugins-good`, `gst-plugins-bad`) manually for camera support.
- Windows installer (MSI) is currently in beta; please use the standalone `.exe` for now.

---

_For support, please contact the IT department or verify the `README.md` included in the distribution._
