# HRM System - New Lanka Clothing

A cross-platform desktop HR Management system for garment factories built with Tauri, React, and SQLite.

## Features

- 👥 **Employee Management**: Add, edit, delete, and search employees
- 📊 **Dashboard**: Overview of employee statistics
- 🔍 **Advanced Filters**: Filter by EPF Number, Department, Transport Route, and Working Status
- 💾 **Local Database**: SQLite database stored locally
- 🔄 **Auto-Update**: Automatic updates from GitHub Releases
- 🖥️ **Cross-Platform**: Works on Windows and Linux

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Linux Dependencies

```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/HRM_System.git
   cd HRM_System
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## Auto-Update Setup

To enable auto-updates, you need to generate signing keys:

1. **Generate signing keys**
   ```bash
   npm run tauri signer generate -- -w ~/.tauri/hrm_system.key
   ```

2. **Add the public key** to `src-tauri/tauri.conf.json`:
   ```json
   {
     "plugins": {
       "updater": {
         "pubkey": "YOUR_PUBLIC_KEY_HERE"
       }
     }
   }
   ```

3. **Add secrets to GitHub**:
   - `TAURI_SIGNING_PRIVATE_KEY`: The contents of your private key file
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: The password you used (if any)

4. **Update the endpoint URL** in `tauri.conf.json` with your GitHub username/repo

## Project Structure

```
HRM_System/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── src-tauri/             # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs        # Tauri entry point
│   │   ├── lib.rs         # Database initialization
│   │   ├── commands.rs    # Tauri commands
│   │   └── models.rs      # Data models
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
└── .github/workflows/     # GitHub Actions
    └── release.yml        # Auto-build and release
```

## Database Schema

The SQLite database stores employee information with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| epf_number | TEXT | Primary Key - Employee Provident Fund Number |
| name_with_initials | TEXT | Name with initials (e.g., K.A.S. Perera) |
| full_name | TEXT | Full name |
| dob | TEXT | Date of birth |
| police_area | TEXT | Police area/jurisdiction |
| transport_route | TEXT | Transport route for factory bus |
| mobile_1 | TEXT | Primary mobile number |
| mobile_2 | TEXT | Secondary mobile number |
| address | TEXT | Home address |
| date_of_join | TEXT | Employment start date |
| date_of_resign | TEXT | Resignation date (if applicable) |
| working_status | TEXT | 'active' or 'resign' |
| marital_status | TEXT | Marital status |
| job_role | TEXT | Job role/position |
| department | TEXT | Department name |
| created_at | TEXT | Record creation timestamp |

## License

MIT License - See LICENSE file for details
