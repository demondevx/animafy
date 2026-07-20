# Final Release Checklist: Animafy v2.0.0

This checklist confirms that the repository has been fully audited, cleaned, and updated for the v2.0.0 launch. Please review before pushing to GitHub and publishing to NPM.

## 1. Documentation & Metadata
- [x] `README.md` updated with v2 Template and Timeline APIs.
- [x] `packages/animafy/README.md` mirrored to root.
- [x] `docs/components.md` rewritten to include `TimelineBuilder` and Visual Effects.
- [x] `docs/examples.md` rewritten with 4 copy-paste-ready v2 Slash Commands.
- [x] `docs/troubleshooting.md` updated with fixes for 415 Avatar HTTP errors.
- [x] Outdated v1 `.gif` forced avatar extensions removed from all `.md` files.

## 2. Release Documents
- [x] `CHANGELOG.md` created tracking all Additions, Changes, and Fixes.
- [x] `MIGRATION.md` created guiding developers to safe `forceStatic: false` semantics and background color usage.
- [x] `RELEASE_NOTES.md` generated for GitHub Release body.

## 3. Versioning
- [x] Root `package.json` bumped to `2.0.0`.
- [x] ALL Workspace packages (`animafy`, `animafy-core`, `animafy-templates`, etc.) bumped to `2.0.0`.
- [x] Inter-workspace dependencies synchronized to `2.0.0`.
- [x] `package-lock.json` updated via `npm install`.

## 4. Final Code Verification
- [x] `npm run build` executed and passed on all 10 monorepo packages.
- [x] `npm run test` (Vitest) executed and passed.
- [x] `npm pack --dry-run` audited to ensure no bloat/source leaks exist.
- [x] `.gitignore` verified to exclude `node_modules`, `dist`, `.env`, and `*.tgz`.

---

## Instructions to Publish

When you are ready, execute the following commands in your terminal:

**1. Commit to GitHub**
```bash
git add .
git commit -m "chore(release): v2.0.0 massive API overhaul"
git tag v2.0.0
git push origin main --tags
```

**2. Publish to NPM**
```bash
# This publishes ALL monorepo workspaces simultaneously!
npm publish --workspaces --access public
```

Congratulations on completing Animafy v2.0! 🎉
