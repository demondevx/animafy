# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-07-20

### Added
- **Timeline API (`TimelineBuilder`)**: Create multi-frame GIFs with specific timings and built-in transitions (e.g., crossfade).
- **Template Engine**: Shipped built-in templates to automatically render standard graphics without manual layout positioning.
  - `rankCard()`
  - `profileCard()`
  - `welcomeCard()`
  - `leaderboardCard()`
  - `levelUpCard()`
- **Visual Effects System**:
  - `drawRect()` and `drawCircle()`
  - `drawLine()`
  - `drawProgressBar()`
  - `drawGradient()` (Linear and Radial)
  - `setShadow()` and `clearShadow()`
  - `setFilter()` and `clearFilter()`
  - `setOpacity()`
  - State management (`pushState()`, `popState()`) to isolate effects.
- **Dynamic Avatar Handling**: Supported seamless `exportPNG()` and `exportGIF()` routing. Discord's automatic fallback behavior (`forceStatic: false`) is fully documented and encouraged.
- **Text Wrapping Support**: Intelligently handles multi-line rendering when `maxWidth` is passed to `drawText()`.

### Changed
- Refactored project architecture into a scalable Monorepo workspace setup.
- Deprecated forced `.gif` extensions in Discord avatar fetches.

### Fixed
- Fixed `createAnimafy()` not properly forwarding initialization options (`workerPoolSize`, `cache.ttl`).
- Fixed `setBackground` execution order. The background color is now cleanly painted before operations loop, preventing transparency wiping.
- Fixed `setFilter` and `setShadow` leaking state across rendering frames.
- Fixed 415 HTTP Fetch errors regarding avatar `.gif` forced fetches.
