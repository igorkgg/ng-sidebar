---
name: fix-ng-sidebar-publish
description: Fix and republish the ng-sidebar9plus fork (github.com/igorkgg/ng-sidebar) for Angular 17–22. Use when working in the ng-sidebar repo on packaging, building, verifying or publishing ng-sidebar9plus releases.
---

# Fix ng-sidebar9plus packaging (17.x – 22.x)

## Context

`ng-sidebar9plus` is the user's fork of ng-sidebar (MIT, Eugene Cheung), repo `github.com/igorkgg/ng-sidebar`.
Its main consumer is the `bosh-frontend` Angular app, which is being upgraded one major at a time to Angular 22
and is currently on Angular 20.

**No published version works on Angular 20+:**

| Version | Problem |
|---|---|
| 14.0.2, 15.0.0, 16.0.0 | Fully compiled Ivy output (`ɵɵdefineComponent`) that calls `ɵɵclassMapInterpolate3/5`, private instructions removed in Angular 20. At runtime: `TypeError: (void 0) is not a function at Sidebar_Template` on every change detection. |
| 17.0.0 – 21.0.0 | Published from the repo root with no build output. The tarball has only `src/`, `demo/`, `angular.json`, `ng-package.json`, tsconfigs and so on: no `fesm2022/`, no `main`/`module`/`exports`/`typings`. It can't be imported at all. |

## Root causes (same on every 17–21 branch)

1. **Wrong folder published.** `ng-package.json` has `"dest": "dist"`, but `npm publish` was run from the root.
   The root `package.json` has no `main`/`module`/`exports`/`files`, and `dist/` is (most likely) gitignored, so
   npm left it out.
2. **Empty `peerDependencies`** from 18.0.0 on (`{}`). 17.0.0 has `>=17.0.0`, which is too loose.
3. **`compilationMode` not set.** Published libraries must use **partial** compilation (`ɵɵngDeclareComponent`),
   which the consuming app links with its own Angular version. Full compilation writes private instructions into
   the package, which is what broke 14–16.
4. **`SidebarModule.forRoot()` removed** in 17.0.0+ (14.x had it). That's a breaking change for consumers:
   bosh-frontend calls `SidebarModule.forRoot()`.

Build setup in 19–21: builder `@angular/build:ng-packagr`, options `{ "project": "ng-package.json", "tsConfig": "tsconfig.json" }`,
`ng-package.json` → `{ "dest": "dist", "lib": { "entryFile": "src/public-api.ts" } }`.
17–18 use `@angular-devkit/build-angular:ng-packagr`. Source files: `src/sidebar.component.ts`, `src/sidebar-container.component.ts`,
`src/close.directive.ts`, `src/sidebar.module.ts`, `src/utils.ts`, `src/public-api.ts`. The components are standalone
and `SidebarModule` imports and exports them.

## Fix (apply on each major line being republished)

Work on the branch or tag of the major (N = 17…22). Keep that major's Angular devDependencies (`@angular/*`, `ng-packagr`, `typescript` at N).

1. **Root `package.json`** (ng-packagr copies it to `dist/package.json`):
   ```json
   "version": "N.0.1",
   "peerDependencies": {
     "@angular/common": "^N.0.0",
     "@angular/core": "^N.0.0"
   },
   "dependencies": { "tslib": "^2.3.0" },
   "sideEffects": false,
   "scripts": {
     "build": "ng build",
     "prepublishOnly": "echo 'Publish the build: npm run build && npm publish ./dist' && exit 1"
   }
   ```
   The `prepublishOnly` guard blocks publishing from the root. ng-packagr strips `scripts` from
   `dist/package.json`. **Check this in the generated file**, so the guard doesn't block `npm publish ./dist`.
   The existing `prepare` script (`npm run lint && npm run build`) can stay.

2. **Force partial compilation** in `tsconfig.json`, or in a dedicated tsconfig used by the build target:
   ```json
   "angularCompilerOptions": { "compilationMode": "partial" }
   ```

3. **Restore `forRoot()` for backward compatibility.** Ask the user first: it's their API decision. Recommended:
   ```ts
   import { ModuleWithProviders, NgModule } from '@angular/core';

   @NgModule({
     imports: [SidebarContainer, Sidebar, CloseSidebar],
     exports: [SidebarContainer, Sidebar, CloseSidebar],
   })
   export class SidebarModule {
     static forRoot(): ModuleWithProviders<SidebarModule> {
       return { ngModule: SidebarModule };
     }
   }
   ```

4. **Optional clean-up:** `tsconfig.module.json` (old `lib_esmodule/` output) and `tslint.json` are unused leftovers.

## Verify before publishing (all must pass)

```bash
npm run build
cat dist/package.json        # has "module"/"typings"/"exports" → fesm2022/..., the peerDependencies, tslib dependency, NO "scripts"
grep -l "ɵɵngDeclareComponent" dist/fesm2022/*.mjs    # must match → partial compilation
grep -c "Interpolate[0-9]" dist/fesm2022/*.mjs         # must be 0
npm pack ./dist --dry-run    # contents: fesm2022/, index.d.ts (+ .d.ts), package.json, README.md, LICENSE
```

Test the package in a real consumer before publishing:
```bash
cd dist && npm pack          # → ng-sidebar9plus-N.0.1.tgz
# in bosh-frontend (or another Angular N app):
npm i /path/to/ng-sidebar/dist/ng-sidebar9plus-N.0.1.tgz
```

## How bosh-frontend uses the library (must keep working)

- `app.module.ts`: `import { SidebarModule } from 'ng-sidebar9plus';` … `SidebarModule.forRoot()` in `imports`.
- `app.component.html`:
  - `<ng-sidebar-container [animate]="...">`, with a `<div ng-sidebar-content>` child
  - `<ng-sidebar>` with inputs `mode`, `position`, `closeOnClickOutside`, `sidebarClass`, `dockedSize`, `dock`,
    `animate` and two-way `[(opened)]`, plus output `(onClosed)`
  - three `<ng-sidebar>` instances in one container
- Global styles target `.ng-sidebar`, `.ng-sidebar__content`, `.ng-sidebar__backdrop` and the class passed via `sidebarClass`
  (`gg-sidebar ...`). Keep the rendered class names unchanged.

## Publishing (only the user runs `npm publish` or `npm deprecate`; never run them without explicit confirmation)

- One patch per major: `17.0.1`, `18.0.1`, `19.0.1`, `20.0.1`, `21.0.1`, each built with its own Angular major.
  Later, `22.0.0` for Angular 22.
- **Always use `./dist`, never bare `dist`**: npm parses a bare `dist` as the registry package named "dist" (fails with "cannot publish over 0.1.2").
- **Older majors need a dist-tag**, or npm moves `latest` back to them:
  ```bash
  npm publish ./dist --tag v20-lts   # 17–20 (use v17-lts, v18-lts, …)
  npm publish ./dist                 # newest major only → becomes "latest"
  ```
- Deprecate the broken releases:
  ```bash
  npm deprecate ng-sidebar9plus@"17.0.0 || 18.0.0 || 19.0.0 || 20.0.0 || 21.0.0" "Published without build output; use the .0.1 release of the same major"
  ```
- What bosh-frontend needs: **20.0.1 now**, **21.0.1** at its Angular 21 step, **22.0.0** at the Angular 22 step.
  The other majors only matter for other consumers.

## Ground rules

- Don't change component behaviour, inputs/outputs, templates or rendered CSS class names; this is a packaging fix.
- Commit each major's fix separately (for example `fix: publish build output from dist, partial compilation, peer deps`).
- Report the `dist/package.json` contents and the verification output to the user before they publish.
