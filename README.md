# DIS Gateway Frontend

This project includes:

- a Vite/MUI React frontend
- a mock local Node API used for UI design and contract shaping
- an Electron desktop wrapper that starts the mock API locally and loads the built UI against it

## Web Scripts

- `npm run dev`
  Starts the Vite frontend in browser dev mode.
- `npm run api:dev`
  Builds and runs the mock API on `http://127.0.0.1:4010`.
- `npm run build`
  Builds the frontend bundle.

## Desktop Scripts

- `npm run desktop:build`
  Builds the frontend, mock API runtime, and Electron main/preload files.
- `npm run desktop:start`
  Builds everything and launches the Electron desktop app locally.
- `npm run dist:win`
  Creates Windows desktop distributables in `release/`.
- `npm run dist:linux`
  Creates Linux desktop distributables in `release/`.

## Packaging Notes

- The Electron app loads the frontend from the local `dist/` bundle and starts the mock API automatically inside the desktop runtime.
- The renderer keeps using the same `/api`-shaped contract, so swapping the mock server for the real backend later stays straightforward.
- In practice, Windows packages should be built on Windows, and Linux packages should be built on Linux. For your eventual RHEL 8 target, plan to run the Linux packaging step on a Linux build machine or CI runner.

## RHEL 8 AppImage Docker Build

To build a Linux AppImage in a RHEL 8-compatible container and extract the result directly into a local `release-linux/` folder:

```bash
docker build --output ./release-linux -f Dockerfile.rhel8-appimage .
```

This uses a UBI 8 Node 20 base image, runs the Electron Linux AppImage build, and exports the generated `.AppImage` artifact from the final image stage into `release-linux/`.
