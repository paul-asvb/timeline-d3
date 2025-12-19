# Timeline D3 - React SPA with Vite

This project is a single React SPA using Vite for development and building.

## Project Structure

```
/
├── src/            # React SPA source files
├── public/         # Static assets
├── package.json    # Project configuration
├── vite.config.ts  # Vite configuration
└── .github/        # GitHub Actions workflows
```

## Development

### Prerequisites

- Node.js v20+
- pnpm v8+

### Installation

```bash
pnpm install
```

### Running the app

```bash
# Start the development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Available Scripts

- `pnpm dev` - Start development server with hot reloading
- `pnpm build` - Build production-ready static files
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run linting
- `pnpm format` - Format code

## Deployment

The application is configured for GitHub Pages deployment. The GitHub Actions workflow:

1. Installs dependencies
2. Builds the application using Vite
3. Deploys to GitHub Pages on main branch pushes

### Environment Variables

- `NEXT_PUBLIC_BASE_PATH` - Set to `/timeline-d3/` for GitHub Pages deployment

## Technology Stack

- **Framework**: React 19
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Data Visualization**: D3.js
- **Package Manager**: pnpm

## Key Features

1. **Fast Development**: Vite provides instant hot module replacement
2. **Static Export**: Configured for static HTML/CSS/JS output suitable for GitHub Pages
3. **Base Path Support**: Proper handling of GitHub Pages base path
4. **Modern Tooling**: Uses latest React 19, Vite 5, and Tailwind CSS

## License

MIT