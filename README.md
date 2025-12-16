# timemaschine

A medical events timeline visualization with interactive features.

## Features

- ✅ **Interactive Timeline**: Visualize medical events over time
- ✅ **Drag to Pan**: Click and drag to navigate the timeline
- ✅ **Scroll to Zoom**: Use mouse wheel to zoom in/out (0.5x to 5x range)
- ✅ **Double-Click Zoom**: Double-click events to focus on them
- ✅ **Event Organization**: Events organized by type in separate rows
- ✅ **Detailed Tooltips**: Hover over events for detailed information
- ✅ **Responsive Design**: Adapts to different screen sizes

## Development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Static Build & Deployment

This project supports static export for easy deployment:

### Build for Production

```bash
pnpm build
```

This will create a static build in the `out/` directory.

### GitHub Pages Deployment

The project includes a GitHub Actions workflow (`.github/workflows/static-build.yml`) that automatically:

1. Builds the static site on every push to `main`
2. Deploys to GitHub Pages
3. Uploads build artifacts for download

### Environment Variables

For GitHub Pages deployment, set the base path:

```bash
NEXT_PUBLIC_BASE_PATH=/timemaschine pnpm build
```

## Interaction Guide

- **Drag to Pan**: Click and drag anywhere on the timeline
- **Scroll to Zoom**: Use mouse wheel to zoom in/out
- **Double-Click Events**: Double-click any event to zoom in on it
- **Hover for Details**: Hover over events to see tooltips with detailed information
- **Zoom Level**: Current zoom level is displayed in the top-right corner

## Data Format

The application expects event data in JSON format at `/public/events.json`:

```json
{
  "Changes": [
    {
      "ChangeType": "NewSeries",
      "Date": "20251009T120945",
      "ID": "event-id",
      "Path": "/series/event-id",
      "ResourceType": "Series",
      "Seq": 12345
    }
  ]
}
```

## Technologies

- Next.js 16 with App Router
- D3.js for interactive visualizations
- TypeScript for type safety
- Tailwind CSS for styling
- pnpm for package management

## Remember

<https://visjs.github.io/vis-timeline/examples/timeline/basicUsage.html>