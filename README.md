# Free Hosting - Free Discord Bot Hosting

A professional hosting platform for Discord bots, built with vanilla HTML, CSS, and JavaScript. Designed for integration with Wisp.gg server infrastructure.

## Tagline

**Free Discord Bot Hosting. Simple. Fast. Reliable.**

## Features

- **Landing Page** - Modern homepage with features overview and how-it-works section
- **Authentication System** - Login and registration with JWT tokens
- **User Dashboard** - Manage servers, view statistics, and control bots
- **Server Management** - Console, file manager, resource monitoring, and power controls
- **Wisp.gg Integration** - Clean API abstraction layer for Wisp.gg panel
- **Status Page** - System status monitoring
- **FAQ Page** - Expandable FAQ with common questions
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Professional UI** - Dark theme with blue accents, inspired by modern hosting platforms

## Architecture

The frontend is designed to work with a backend API that handles Wisp.gg integration:

```
Browser → Frontend API → Backend API → Wisp.gg API → Discord Bot Container
```

**Important**: The frontend NEVER directly exposes Wisp.gg API keys. All Wisp.gg communication goes through the backend.

## Project Structure

```
Free Hosting/
├── index.html              # Landing page
├── hosting.html            # Hosting information page
├── login.html              # Login page
├── register.html           # Registration page
├── dashboard.html          # User dashboard
├── create-server.html      # Server creation page
├── server.html             # Server management page
├── account.html            # Account settings page
├── status.html             # System status page
├── faq.html                # FAQ page
│
├── css/
│   ├── global.css          # Design system and global styles
│   ├── navbar.css          # Navbar styles
│   ├── dashboard.css        # Dashboard layout styles
│   ├── server.css          # Server management styles
│   └── responsive.css      # Responsive utilities
│
├── js/
│   ├── api.js              # API abstraction layer
│   ├── app.js              # Main application entry point
│   ├── auth.js             # Authentication module
│   ├── dashboard.js        # Dashboard functionality
│   ├── server.js           # Server management functionality
│   ├── files.js            # File manager functionality
│   ├── status.js           # Status page functionality
│   └── ui.js               # UI utilities and helpers
│
├── assets/                 # Static assets (logos, icons)
├── server.js               # Backend Express server
├── package.json            # Dependencies
└── README.md               # Documentation
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Pterodactyl panel (optional but recommended for full functionality)

### Setup

1. **Clone or download the project**

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables** (optional)

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=your-secret-key-here
```

4. **Start the server**

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

5. **Access the site**

Open your browser at `http://localhost:3000`

## Pages

### Landing Page (`index.html`)
- Hero section with call-to-action
- Features overview
- How it works section
- Footer with links

### Hosting Page (`hosting.html`)
- Server configuration information
- Runtime options (Node.js, Python)
- Deployment methods
- Resource information

### Login Page (`login.html`)
- Email and password authentication
- Discord OAuth button (placeholder)
- Forgot password link
- Registration link

### Register Page (`register.html`)
- Username, email, password fields
- Terms of Service checkbox
- Form validation
- Error handling

### Dashboard (`dashboard.html`)
- User statistics (servers, running, stopped, RAM)
- Server list with status indicators
- Sidebar navigation
- Create server link

### Create Server (`create-server.html`)
- Server name input
- Runtime selection (Node.js, Python)
- Version selection
- Resource information (provided by backend)

### Server Management (`server.html`)
- Power controls (Start, Restart, Stop, Kill)
- Console with real-time logs
- Resource monitoring (CPU, RAM, Disk, Network, Uptime)
- File manager with upload/download
- Startup configuration
- Server settings (rename, reinstall, delete)

### Account (`account.html`)
- Profile information
- Password change
- Session management
- Account information display

### Status (`status.html`)
- Service status indicators
- Incident history
- Monitoring data display

### FAQ (`faq.html`)
- Expandable FAQ items
- Common questions and answers

## API Architecture

The frontend uses a clean API abstraction layer (`js/api.js`) that calls backend endpoints:

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user
- `GET /api/auth/discord` - Discord OAuth

### User
- `GET /api/user/profile` - Get profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password
- `GET /api/user/sessions` - Get sessions
- `DELETE /api/user/sessions/:id` - Revoke session
- `DELETE /api/user/sessions` - Revoke all sessions

### Servers
- `GET /api/servers` - List servers
- `GET /api/servers/:id` - Get server details
- `POST /api/servers` - Create server
- `DELETE /api/servers/:id` - Delete server
- `PATCH /api/servers/:id` - Rename server
- `POST /api/servers/:id/reinstall` - Reinstall server

### Power Controls
- `POST /api/servers/:id/power` - Power action (start/stop/restart/kill)

### Console
- `GET /api/servers/:id/console` - Get console logs
- `POST /api/servers/:id/console` - Send command

### Resources
- `GET /api/servers/:id/resources` - Get resource usage

### Files
- `GET /api/servers/:id/files` - List files
- `GET /api/servers/:id/files/content` - Get file content
- `POST /api/servers/:id/files` - Create file
- `PUT /api/servers/:id/files` - Update file
- `DELETE /api/servers/:id/files` - Delete file
- `POST /api/servers/:id/files/rename` - Rename file
- `POST /api/servers/:id/files/directory` - Create directory
- `POST /api/servers/:id/files/upload` - Upload file
- `GET /api/servers/:id/files/download` - Download file

### Status
- `GET /api/status` - Get system status
- `GET /api/status/incidents` - Get incidents

## Design System

### Colors

- **Primary**: Blue (#2563eb)
- **Secondary**: Cyan (#0891b2)
- **Background**: Very dark navy (#0a0e14)
- **Card Background**: Dark navy (#1a2332)
- **Text**: White (#ffffff)
- **Text Secondary**: Gray (#9ca3af)
- **Text Muted**: Dark gray (#6b7280)
- **Success**: Green (#10b981)
- **Warning**: Orange (#f59e0b)
- **Danger**: Red (#ef4444)

### Components

- **Cards** - Dark background with subtle border
- **Buttons** - Primary (blue), Secondary (dark), Danger (red)
- **Forms** - Clean inputs with focus states
- **Status Indicators** - Colored dots with labels
- **Tables** - Clean data tables with hover states
- **Alerts** - Success, error, warning, info variants

## Security

- Passwords are never stored in localStorage
- Pterodactyl API keys are never exposed in frontend JavaScript
- All sensitive actions require backend validation
- JWT tokens for authentication
- CORS configured for development
- Input validation on all forms

## Empty States

When backend data is unavailable, the frontend displays proper empty states instead of fake data:

- Statistics show "—" instead of fake numbers
- Server lists show "No servers found"
- Console shows "Console unavailable"
- File manager shows "Unable to load files"
- Status page shows "Monitoring data unavailable"

## Customization

### Modify Colors

Edit `css/global.css` and modify the CSS variables in `:root`:

```css
:root {
    --primary: #2563eb;
    --secondary: #0891b2;
    --bg-primary: #0a0e14;
    --bg-secondary: #111827;
    /* ... */
}
```

### Modify Navigation

Edit the navbar in each HTML file or create a shared navbar component.

## Deployment

### Deploy to Vercel

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/free-hosting.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Configure environment variables:
     - `JWT_SECRET` - Your secret key
     - `DISCORD_CLIENT_ID` - Your Discord Client ID
     - `DISCORD_CLIENT_SECRET` - Your Discord Client Secret
     - `DISCORD_REDIRECT_URI` - `https://your-project.vercel.app/api/auth/discord/callback`
     - `WISPGG_API_KEY` - Your Wisp.gg API key (optional)
   - Click "Deploy"

3. **Update Discord OAuth Redirect URI**
   - Go to Discord Developer Portal
   - Your Application → OAuth2 → Redirects
   - Add: `https://your-project.vercel.app/api/auth/discord/callback`

### Deploy locally

```bash
npm install
npm start
```

### Deploy to other platforms

The frontend can be deployed to any static web server:

- Apache
- Nginx
- Netlify
- GitHub Pages

The backend (`server.js`) should be deployed separately and configured with proper environment variables.

## Troubleshooting

### Server won't start
- Check Node.js installation: `node --version`
- Check dependencies: `npm install`
- Check port availability

### API errors
- Verify backend is running
- Check API endpoint configuration in `js/api.js`
- Check browser console for errors

### Styling issues
- Verify CSS files are linked correctly
- Check browser console for CSS errors
- Clear browser cache

## Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **API Client**: Axios
- **Security**: bcryptjs

## License

MIT

## Support

For questions or issues, please open an issue on the repository.
