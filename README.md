# Arcana Editor - AI-Powered Scenario Editor

A modern React application for creating and editing scenarios with AI assistance, built with React Router DOM and featuring a beautiful, responsive UI/UX design.

## Features

- 🎭 **Scenario Editor**: Rich text editor with AI-powered completion suggestions
- 🔐 **Authentication**: Secure user authentication with Firebase + JWT + API Key validation
- 📊 **Dashboard**: Manage and organize your scenarios
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🚀 **Fast Performance**: Built with Vite for optimal development and build performance
- 📱 **Mobile Responsive**: Works perfectly on all device sizes
- 🔒 **Security**: API key validation, JWT authentication, and whitelist control
- 🌐 **Backend API**: Firebase Functions with Express.js for scalable backend

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router DOM** for client-side routing
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Firebase SDK** for authentication and data storage
- **Lucide React** for icons

### Backend
- **Firebase Functions** (Node.js 18)
- **Express.js** for HTTP server
- **Firebase Admin SDK** for server-side operations
- **JWT** for token-based authentication
- **CORS** for cross-origin requests

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd arcana-editor
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `env.example` to `.env`
   - Fill in your Firebase configuration
   - Set your API base URL and API key

4. Set up Firebase:
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Deploy Firebase Functions (see Backend Setup below)

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:3000`

### Backend Setup

1. Navigate to functions directory:
```bash
cd functions
```

2. Install dependencies:
```bash
npm install
```

3. Build the functions:
```bash
npm run build
```

4. Deploy to Firebase (or run locally with emulator):
```bash
# Deploy
npm run deploy

# Or run emulator
npm run serve
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
.
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   │   ├── editor/         # Editor-specific components
│   │   ├── providers/      # Context providers (Auth, etc.)
│   │   └── ui/            # Basic UI components (Button, Input, etc.)
│   ├── pages/             # Page components
│   ├── lib/               # Utility libraries
│   │   ├── api.ts         # API client
│   │   └── firebase.ts    # Firebase configuration
│   ├── types/             # TypeScript type definitions
│   └── main.tsx           # Application entry point
├── functions/              # Backend (Firebase Functions)
│   ├── src/
│   │   ├── index.ts       # Main entry point
│   │   ├── middleware/    # Auth middleware
│   │   │   └── auth.ts   # API key & JWT validation
│   │   └── routes/       # API routes
│   │       ├── login.ts  # Authentication endpoints
│   │       ├── user.ts   # User management endpoints
│   │       └── whitelist.ts # Whitelist management
│   └── package.json
├── docs/                  # Documentation
│   ├── architecture.md    # System architecture
│   ├── API設計書.md       # API design document (Japanese)
│   └── 要件定義書_第一段階.md
└── package.json
```

## Features Overview

### Scenario Editor
- Rich text editing with real-time statistics
- AI-powered content suggestions
- Tag management system
- Export/import functionality
- Auto-save capabilities

### Dashboard
- Overview of all scenarios
- Quick access to create new scenarios
- Statistics and analytics
- Search and filter functionality

### Authentication
- Email/password authentication
- User profile management
- Secure session handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
