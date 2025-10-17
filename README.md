# Arcana Editor - AI-Powered Scenario Editor

A modern React application for creating and editing scenarios with AI assistance, built with React Router DOM and featuring a beautiful, responsive UI/UX design.

## Features

- 🎭 **Scenario Editor**: Rich text editor with AI-powered completion suggestions
- 🔐 **Authentication**: Secure user authentication with Firebase
- 📊 **Dashboard**: Manage and organize your scenarios
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🚀 **Fast Performance**: Built with Vite for optimal development and build performance
- 📱 **Mobile Responsive**: Works perfectly on all device sizes

## Tech Stack

- **React 18** with TypeScript
- **React Router DOM** for client-side routing
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Firebase** for authentication and data storage
- **Lucide React** for icons

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

3. Set up Firebase configuration:
   - Create a Firebase project
   - Enable Authentication and Firestore
   - Copy your Firebase config to `src/lib/firebase.ts`

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── editor/         # Editor-specific components
│   ├── providers/      # Context providers
│   └── ui/            # Basic UI components
├── pages/             # Page components
├── lib/               # Utility libraries
├── types/             # TypeScript type definitions
└── main.tsx          # Application entry point
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
