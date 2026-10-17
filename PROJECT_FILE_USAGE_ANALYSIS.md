# Project File Usage Analysis

Analysis date: 2026-09-11

Scope: 114 tracked project files were inventoried and traced. Ignored/generated environments (`venv/`, `frontend/node_modules/`, `frontend/.next/`, and Python `__pycache__/` directories) were treated as generated/runtime support rather than application source. Their contents were not candidates for project-file deletion. The working tree already contained a modification to `backend/nowcast_history.db`; that change was not made during this analysis.

## 1. Executive Summary

The project is a two-process application:

- `backend/main.py` is the FastAPI entry point and owns model loading, radar synchronization, API routes, SQLite history, and the fusion calculation.
- `frontend/src/app/page.tsx` is the Next.js App Router page and owns navigation, API calls, mock fallback data, settings state, and dynamic loading of the view components.
- The backend directly requires the multi-region XGBoost model, ConvLSTM weights, two location-specific radar tensors, and the radar pipeline/preparation modules.
- The location-specific radar PNG directories are read indirectly by `radar_tensor_prep.py` when radar synchronization is enabled.
- The five SVGs in `frontend/public/` are default create-next-app assets with no application references. They are the only files classified as safe deletion candidates from static application analysis.
- Several ML training/preparation files and artifacts are not part of the live request path, but they remain useful for retraining, regeneration, or historical reproducibility. They are manual-check candidates, not safe deletion candidates.

| Classification | Count / scope |
|---|---:|
| Files analyzed | 114 tracked files |
| Definitely used or required by the live application | 22 files plus the 69 radar PNG inputs indirectly read by the preparation pipeline |
| Probably used / useful operational or development files | 10 files |
| Probably unused from the live runtime | 7 files |
| Highly likely unused / orphan-like | 7 files |
| Safe deletion candidates | 5 files: the unreferenced default public SVGs |
| Manual verification required | 14 files or artifact groups |
| Tests found | None |
| Frontend route files found | One App Router page: `/` |
| Backend route modules found | None; all routes are in `backend/main.py` |

Counts above are file-level review counts; the radar PNG count is called out separately because the live preparation code discovers files by directory listing rather than naming each PNG.

## 2. SAFE TO DELETE

These files have no references from source, configuration, package scripts, framework metadata, documentation links used by the application, or build configuration. They are default static assets from the Next.js starter scaffold and are not loaded by the current UI.

### `frontend/public/file.svg`

- Status: Unreferenced default static asset.
- Why unused: No source, stylesheet, HTML, metadata, route, or configuration reference was found.
- References checked: All frontend TypeScript/TSX, CSS, MJS, JSON, Markdown, and gitignore files; no `file.svg` or `/file.svg` reference.
- Dependency analysis: No project module depends on it.
- Deletion impact: No effect on the current application build or runtime based on static analysis.
- Confidence: HIGH.
- Recommendation: SAFE TO DELETE.

### `frontend/public/globe.svg`

- Status: Unreferenced default static asset.
- Why unused: No source, stylesheet, HTML, metadata, route, or configuration reference was found.
- References checked: All frontend TypeScript/TSX, CSS, MJS, JSON, Markdown, and gitignore files; no `globe.svg` or `/globe.svg` reference.
- Dependency analysis: No project module depends on it.
- Deletion impact: No effect on the current application build or runtime based on static analysis.
- Confidence: HIGH.
- Recommendation: SAFE TO DELETE.

### `frontend/public/next.svg`

- Status: Unreferenced default static asset.
- Why unused: No source, stylesheet, HTML, metadata, route, or configuration reference was found.
- References checked: All frontend TypeScript/TSX, CSS, MJS, JSON, Markdown, and gitignore files; no `next.svg` or `/next.svg` reference.
- Dependency analysis: No project module depends on it.
- Deletion impact: No effect on the current application build or runtime based on static analysis.
- Confidence: HIGH.
- Recommendation: SAFE TO DELETE.

### `frontend/public/vercel.svg`

- Status: Unreferenced default static asset.
- Why unused: No source, stylesheet, HTML, metadata, route, or configuration reference was found.
- References checked: All frontend TypeScript/TSX, CSS, MJS, JSON, Markdown, and gitignore files; no `vercel.svg` or `/vercel.svg` reference.
- Dependency analysis: No project module depends on it.
- Deletion impact: No effect on the current application build or runtime based on static analysis.
- Confidence: HIGH.
- Recommendation: SAFE TO DELETE.

### `frontend/public/window.svg`

- Status: Unreferenced default static asset.
- Why unused: No source, stylesheet, HTML, metadata, route, or configuration reference was found.
- References checked: All frontend TypeScript/TSX, CSS, MJS, JSON, Markdown, and gitignore files; no `window.svg` or `/window.svg` reference.
- Dependency analysis: No project module depends on it.
- Deletion impact: No effect on the current application build or runtime based on static analysis.
- Confidence: HIGH.
- Recommendation: SAFE TO DELETE.

## 3. HIGHLY LIKELY UNUSED - MANUAL VERIFICATION

These files appear unused by the live deployed request path, but their removal could affect model retraining, offline experiments, cached data, developer workflows, or future deployment procedures.

### `ml_models/xgboost_model.json`

- File type: XGBoost JSON model artifact.
- Appears to do: Stores the output of `xgboost_train.py`, the original single-region training workflow.
- References/imports searched: Backend model paths, Python imports, source/config files, package scripts, documentation references, and filename references.
- Dependency analysis: `backend/main.py` loads `xgboost_multi_model.json`, not this file. `xgboost_train.py` would regenerate this file but does not load it.
- Indirect/config/framework use: None found.
- Why it appears unused: It is a predecessor/single-region artifact and is not in the live backend path.
- Deletion impact: Live inference should be unaffected; the original training output would be lost.
- Confidence: HIGH for live-runtime non-use; MEDIUM for repository-wide non-use.
- Recommendation: MANUAL CHECK.

### `ml_models/radar_sequence_tensor.pt`

- File type: PyTorch tensor artifact.
- Appears to do: General/non-location-specific radar sequence used by the standalone `convlstm_model.py` test routine.
- References/imports searched: Backend tensor path construction, all Python code, configuration, scripts, and documentation.
- Dependency analysis: `backend/main.py` dynamically chooses `radar_sequence_tensor_ghaziabad.pt` or `radar_sequence_tensor_patna.pt`; it does not load this base tensor. `convlstm_model.py` refers to it only inside its standalone `test_model()` path.
- Indirect/config/framework use: No live framework use found.
- Why it appears unused: The production backend uses location-specific replacements.
- Deletion impact: Live inference should be unaffected; running `python convlstm_model.py` as currently written would fail to find its expected tensor.
- Confidence: HIGH for live-runtime non-use; MEDIUM overall.
- Recommendation: MANUAL CHECK.

### `ml_models/convlstm_model.py`

- File type: Python model definition and standalone test/generation script.
- Appears to do: Defines a ConvLSTM architecture equivalent to the class embedded in `backend/main.py`; its `__main__` path loads a generic tensor and writes ConvLSTM weights.
- References/imports searched: Python imports, backend imports, package scripts, build configuration, documentation, and filename references.
- Dependency analysis: `backend/main.py` does not import this module; it duplicates the architecture locally. The weights file produced by its test routine is consumed by the backend.
- Indirect/config/framework use: No automatic Python discovery or configured script entry point found.
- Why it appears unused: It is an offline/training/model-generation script rather than a server dependency.
- Deletion impact: Live inference may continue using the existing weights, but regeneration or verification of those weights would be affected.
- Confidence: HIGH for live-runtime non-use; MEDIUM overall.
- Recommendation: MANUAL CHECK.

### `ml_models/xgboost_train.py`

- File type: Python offline training script.
- Appears to do: Trains the original single-region XGBoost model from `labeled_weather_data.csv` and writes `xgboost_model.json`.
- References/imports searched: Package scripts, backend imports, file references, documentation, and build configuration.
- Dependency analysis: No runtime import or package script invokes it. Its output is not the backend model path.
- Indirect/config/framework use: None found.
- Why it appears unused: It is a manually run training utility for an older artifact.
- Deletion impact: No expected live application impact; retraining the original model would be lost.
- Confidence: HIGH for live-runtime non-use; MEDIUM overall.
- Recommendation: MANUAL CHECK.

### `ml_models/multi_region_train.py`

- File type: Python offline data-fetching and model-training script.
- Appears to do: Fetches historical Open-Meteo data for Ghaziabad and Patna, labels it, trains, and writes `xgboost_multi_model.json`.
- References/imports searched: Backend imports, package scripts, build/deployment files, documentation, and filename references.
- Dependency analysis: The generated `xgboost_multi_model.json` is directly required by the backend, but this source script is not imported or automatically executed.
- Indirect/config/framework use: None found.
- Why it appears unused: It is the producer of a required artifact, not part of runtime inference.
- Deletion impact: Existing inference can continue while the artifact remains; retraining or rebuilding the model would be affected.
- Confidence: HIGH for live-runtime non-use; MEDIUM overall.
- Recommendation: MANUAL CHECK.

### `ml_models/data_labeling.py`

- File type: Python offline labeling script.
- Appears to do: Converts a presumed `historical_weather_data.csv` into `labeled_weather_data.csv` using threshold-based labels.
- References/imports searched: All project files, scripts, package scripts, and configuration.
- Dependency analysis: No project file references or supplies `historical_weather_data.csv`; `labeled_weather_data.csv` exists and is consumed by `xgboost_train.py` only.
- Indirect/config/framework use: None found.
- Why it appears unused: Its expected input is absent and the script is not automatically invoked.
- Deletion impact: Live application should be unaffected; the old labeling workflow would be lost.
- Confidence: HIGH for live-runtime non-use; MEDIUM overall.
- Recommendation: MANUAL CHECK.

### `ml_models/.cache.sqlite`

- File type: SQLite cache database.
- Appears to do: Persistent cache likely created by `requests_cache` in `multi_region_train.py`.
- References/imports searched: Filename/path references, cache configuration, scripts, package files, and git metadata.
- Dependency analysis: The training script configures a cache named `.cache` and does not reference `.cache.sqlite` explicitly. The backend does not use it.
- Indirect/config/framework use: It may be automatically opened by `requests-cache` during offline/training runs.
- Why it appears unused: It is not part of live inference and no exact filename reference was found.
- Deletion impact: Live application should be unaffected; a future training run may redownload data and recreate the cache.
- Confidence: MEDIUM.
- Recommendation: MANUAL CHECK.

### `ml_models - Shortcut.lnk`

- File type: Windows shell shortcut.
- Appears to do: User convenience link to the ML models directory.
- References/imports searched: All source, configuration, package scripts, deployment files, and documentation.
- Dependency analysis: No application dependency can consume a Windows shortcut file.
- Indirect/config/framework use: None found; it may still be part of a developer desktop workflow.
- Why it appears unused: It is outside the runtime dependency graph and has no project references.
- Deletion impact: No expected application impact; the shortcut itself would no longer be available to the user.
- Confidence: HIGH for application non-use; MEDIUM for user-workflow non-use.
- Recommendation: MANUAL CHECK.

## 4. DEFINITELY USED

### Runtime entry points and frontend application

- `backend/main.py`: Required FastAPI module. The documented command `uvicorn main:app --reload` imports it. It initializes SQLite, loads model artifacts, imports the radar helpers, starts the scheduler, and defines `/`, `/api/settings`, `/api/settings/radar/toggle`, `/api/history`, and `/api/realtime-risk`.
- `frontend/src/app/page.tsx`: Required Next.js App Router page for `/`. It calls the backend endpoints, dynamically imports `AlertsView`, `DataSourcesView`, `SettingsView`, and `MapComponent`, and statically imports `DashboardView`.
- `frontend/src/app/layout.tsx`: Framework-required root layout. It imports `globals.css`, configures fonts, metadata, and the document shell.
- `frontend/src/app/globals.css`: Directly imported by the root layout and used for Tailwind/global styling.
- `frontend/src/app/favicon.ico`: App Router convention-discovered favicon. Next.js generated build output references it even though application code does not import it.
- `frontend/src/components/DashboardView.tsx`: Statically imported by `page.tsx`; renders live metrics, charts, radar timeline, and a dynamic `MapComponent`.
- `frontend/src/components/MapComponent.tsx`: Dynamically imported from both `page.tsx` and `DashboardView.tsx`; uses Leaflet, React Leaflet, remote map tiles, and RainViewer radar tiles.
- `frontend/src/components/AlertsView.tsx`: Dynamically imported from `page.tsx` for the alerts tab.
- `frontend/src/components/DataSourcesView.tsx`: Dynamically imported from `page.tsx` for the data tab.
- `frontend/src/components/SettingsView.tsx`: Dynamically imported from `page.tsx` for the settings tab and calls the radar toggle API through a callback.

### Backend runtime artifacts and helper modules

- `ml_models/xgboost_multi_model.json`: Directly loaded by `backend/main.py` through `XGB_PATH`.
- `ml_models/convlstm_weights.pth`: Directly loaded by `backend/main.py` through `CONVLSTM_PATH`.
- `ml_models/radar_sequence_tensor_ghaziabad.pt`: Dynamically selected and loaded for latitudes above 27 degrees.
- `ml_models/radar_sequence_tensor_patna.pt`: Dynamically selected and loaded for latitudes at or below 27 degrees.
- `ml_models/radar_pipeline.py`: Imported by `backend/main.py` under the alias `download_new_radar_images`; used by scheduled radar synchronization when enabled.
- `ml_models/radar_tensor_prep.py`: Imported by `backend/main.py`; processes the latest four images from a location-specific radar directory and writes the location-specific tensor.
- `ml_models/radar_data_ghaziabad/`: Indirect runtime input directory read with `os.listdir` by `radar_tensor_prep.py` when Ghaziabad synchronization runs.
- `ml_models/radar_data_patna/`: Indirect runtime input directory read with `os.listdir` by `radar_tensor_prep.py` when Patna synchronization runs.
- `ml_models/radar_data_ghaziabad/*.png` and `ml_models/radar_data_patna/*.png`: Potential inputs to the preparation pipeline. The code discovers files by extension and selects the latest four lexicographically; individual old frames may no longer be selected, but the directories are live pipeline inputs and should be retained unless history/retention policy is confirmed.
- `backend/nowcast_history.db`: Runtime SQLite database path. `main.py` creates the database/table if needed, inserts predictions, and reads history for the frontend trend chart. It is currently modified in the working tree, apparently by runtime activity.

### Required frontend build/development files

- `frontend/package.json`: Defines `dev`, `build`, `start`, and `lint` scripts and declares the React, Next.js, Leaflet, charting, icon, TypeScript, Tailwind/PostCSS, and ESLint dependencies.
- `frontend/package-lock.json`: npm lockfile used to reproduce the dependency tree during installation and deployment.
- `frontend/next.config.ts`: Next.js configuration; enables the React compiler.
- `frontend/tsconfig.json`: TypeScript compiler configuration used by Next.js and the editor/build.
- `frontend/next-env.d.ts`: Next.js-generated TypeScript declarations included by `tsconfig.json`; it also imports generated route types.
- `frontend/eslint.config.mjs`: ESLint configuration loaded by the `lint` package script.
- `frontend/postcss.config.mjs`: PostCSS configuration used by the Tailwind CSS import in `globals.css`.
- `requirements.txt`: Declares Python dependencies needed by the backend and ML pipeline, including FastAPI, Uvicorn, PyTorch, XGBoost, pandas, requests, APScheduler, and Open-Meteo tooling.
- `pyrightconfig.json`: Python analysis configuration that adds `ml_models` to import search paths.
- `.gitignore` and `frontend/.gitignore`: Repository/tooling configuration that excludes virtual environments, caches, build output, dependencies, environment files, and other generated content.

## 5. SPECIAL CASES

- `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, and `frontend/src/app/favicon.ico` are used through Next.js App Router conventions, not ordinary caller imports alone.
- `frontend/src/app/globals.css` is framework-loaded through the root layout.
- `frontend/next-env.d.ts` is generated by Next.js and included by the TypeScript configuration. It should not be judged unused because it has no ordinary application import.
- `frontend/package-lock.json` is not imported by TypeScript, but npm uses it for deterministic installation.
- `frontend/next.config.ts`, `frontend/postcss.config.mjs`, `frontend/eslint.config.mjs`, `frontend/tsconfig.json`, and both gitignore files are consumed by their respective tools rather than by application code.
- The dynamic imports in `page.tsx` and `DashboardView.tsx` mean `AlertsView`, `DataSourcesView`, `SettingsView`, and `MapComponent` do not appear as ordinary static imports in every dependency search, but they are real runtime dependencies.
- `MapComponent.tsx` loads remote OpenStreetMap/Carto base-map tiles and RainViewer radar metadata/tiles at runtime. These external resources are not represented as local files.
- `DashboardView.tsx` creates mock radar SVG data URIs in code when the backend is unavailable. No local radar image asset is needed for that fallback.
- `backend/main.py` adds `ml_models` to `sys.path` and imports helper modules by bare module name. This is a runtime path dependency that static import graph tools may miss.
- `radar_tensor_prep.py` discovers PNGs with `os.listdir` and a generated directory name. Individual radar PNGs therefore have indirect, data-driven references rather than explicit filename references.
- `xgboost_multi_model.json`, `convlstm_weights.pth`, and the two location tensors are loaded through constructed paths and must not be classified as unused merely because no import statement names them.
- The frontend has no `.env` file or environment configuration file in the tracked inventory. API base URL selection is hard-coded in `page.tsx` using `NODE_ENV`; deployment may still provide environment behavior outside the repository.
- There are no tests, test directories, database migration files, Docker files, CI workflows, Vercel configuration files, or separate frontend API route files in the tracked inventory.
- The root documentation files are not runtime dependencies, but they are useful operational/deployment references and should be kept unless documentation removal is intentional.
- `LICENSE` is not application code, but removing it could affect legal/project distribution expectations.

## 6. ORPHANED FILES

No file can be proven to be completely orphaned from every possible external workflow with static analysis alone. The following are the closest matches:

- `frontend/public/file.svg`, `frontend/public/globe.svg`, `frontend/public/next.svg`, `frontend/public/vercel.svg`, and `frontend/public/window.svg`: No local application, build, framework, route, or documentation reference exists. They are classified as SAFE TO DELETE because they are unused starter assets and are not framework conventions.
- `ml_models - Shortcut.lnk`: No application reference exists and Windows shortcuts are not consumed by the Python or Next.js runtime. It may still be a developer convenience file, so it remains MANUAL CHECK rather than SAFE TO DELETE.
- `ml_models/data_labeling.py`: Its input `historical_weather_data.csv` is absent, no caller exists, and it is not configured as a script entry point. It is likely leftover or incomplete, but remains MANUAL CHECK because it documents a possible data-preparation workflow.

## 7. DEPENDENCY / REFERENCE FINDINGS

- The live backend uses `xgboost_multi_model.json`; `xgboost_model.json` is a separate older artifact produced by the single-region training script and is not loaded by the server.
- The live backend uses two location-specific tensors; the generic `radar_sequence_tensor.pt` is only referenced by the standalone ConvLSTM test routine.
- `backend/main.py` duplicates the ConvLSTM architecture from `ml_models/convlstm_model.py` rather than importing the model class. The module is therefore useful for offline generation/testing but not part of the live Python import graph.
- `radar_pipeline.py` and `radar_tensor_prep.py` are imported conditionally. If either import fails, the server still starts with radar synchronization disabled, which can make those modules appear unused during ordinary startup even though they are required when the setting is enabled.
- Radar synchronization is disabled by default. The radar helper modules and radar directories are dormant until `POST /api/settings/radar/toggle` enables them, but they remain runtime-capable dependencies.
- Existing radar data is both tracked and mutable: the pipeline downloads new PNGs and the tensor preparation script overwrites location-specific `.pt` files. These are operational data artifacts, not immutable source files.
- `data_labeling.py` expects `historical_weather_data.csv`, but that file was not present in the tracked inventory. `labeled_weather_data.csv` does exist and is consumed only by `xgboost_train.py`.
- The frontend declares a `riskData` prop in `DataSourcesView.tsx` but does not use it. This is an unused parameter inside a used component, not an unused file.
- The frontend header exposes `Lightning` and maps it to an `activeTab` value, but `renderContent()` has no `lightning` case. This is a behavioral gap, not an orphaned file.
- The frontend has mock fallback data and remote RainViewer calls. A static file scan cannot prove whether the deployed backend URL or external service availability matches the local configuration.
- The tracked database is currently modified. Because the backend writes prediction history asynchronously, database changes may be normal runtime state rather than source changes.
- Documentation describes deployment and files that are not all present in the current tracked inventory, including a placeholder Render URL and references to a historical data input. Documentation should not be used as proof that a runtime file exists.

## 8. FINAL DELETION CHECKLIST

| File | Status | Delete? | Reason | Confidence |
|---|---|---:|---|---|
| `frontend/public/file.svg` | SAFE TO DELETE | Yes | Unreferenced default scaffold asset | HIGH |
| `frontend/public/globe.svg` | SAFE TO DELETE | Yes | Unreferenced default scaffold asset | HIGH |
| `frontend/public/next.svg` | SAFE TO DELETE | Yes | Unreferenced default scaffold asset | HIGH |
| `frontend/public/vercel.svg` | SAFE TO DELETE | Yes | Unreferenced default scaffold asset | HIGH |
| `frontend/public/window.svg` | SAFE TO DELETE | Yes | Unreferenced default scaffold asset | HIGH |
| `ml_models/xgboost_model.json` | MANUAL CHECK | No | Old training output; not live model path | HIGH live / MEDIUM overall |
| `ml_models/radar_sequence_tensor.pt` | MANUAL CHECK | No | Used by standalone ConvLSTM test path | HIGH live / MEDIUM overall |
| `ml_models/convlstm_model.py` | MANUAL CHECK | No | Offline model generation/testing workflow | MEDIUM |
| `ml_models/xgboost_train.py` | MANUAL CHECK | No | Offline training workflow for old artifact | MEDIUM |
| `ml_models/multi_region_train.py` | MANUAL CHECK | No | Producer of the live XGBoost artifact | MEDIUM |
| `ml_models/data_labeling.py` | MANUAL CHECK | No | Incomplete/legacy labeling workflow; missing input | MEDIUM |
| `ml_models/.cache.sqlite` | MANUAL CHECK | No | Possible requests-cache training artifact | MEDIUM |
| `ml_models - Shortcut.lnk` | MANUAL CHECK | No | User workflow shortcut, not runtime code | MEDIUM |
| `backend/main.py` | REQUIRED | No | FastAPI entry point and all backend routes | HIGH |
| `frontend/src/app/page.tsx` | REQUIRED | No | Next.js `/` route and application orchestration | HIGH |
| `frontend/src/app/layout.tsx` | REQUIRED | No | App Router root layout | HIGH |
| `frontend/src/app/globals.css` | REQUIRED | No | Directly imported global stylesheet | HIGH |
| `frontend/src/app/favicon.ico` | REQUIRED | No | Next.js App Router convention asset | HIGH |
| `frontend/src/components/DashboardView.tsx` | REQUIRED | No | Main dashboard component | HIGH |
| `frontend/src/components/MapComponent.tsx` | REQUIRED | No | Dynamic map component | HIGH |
| `frontend/src/components/AlertsView.tsx` | REQUIRED | No | Dynamic alerts view | HIGH |
| `frontend/src/components/DataSourcesView.tsx` | REQUIRED | No | Dynamic data-source view | HIGH |
| `frontend/src/components/SettingsView.tsx` | REQUIRED | No | Dynamic settings view | HIGH |
| `ml_models/xgboost_multi_model.json` | REQUIRED | No | Direct backend model load | HIGH |
| `ml_models/convlstm_weights.pth` | REQUIRED | No | Direct backend weight load | HIGH |
| `ml_models/radar_sequence_tensor_ghaziabad.pt` | REQUIRED | No | Dynamic live tensor load | HIGH |
| `ml_models/radar_sequence_tensor_patna.pt` | REQUIRED | No | Dynamic live tensor load | HIGH |
| `ml_models/radar_pipeline.py` | REQUIRED | No | Conditional backend import for radar sync | HIGH |
| `ml_models/radar_tensor_prep.py` | REQUIRED | No | Conditional backend import for tensor refresh | HIGH |
| `ml_models/radar_data_ghaziabad/*.png` | KEEP | No | Indirect input to radar tensor preparation | MEDIUM |
| `ml_models/radar_data_patna/*.png` | KEEP | No | Indirect input to radar tensor preparation | MEDIUM |
| `backend/nowcast_history.db` | KEEP | No | Runtime prediction history database | HIGH |
| `frontend/package.json` | REQUIRED | No | Build and development scripts/dependencies | HIGH |
| `frontend/package-lock.json` | REQUIRED | No | npm dependency lockfile | HIGH |
| `frontend/next.config.ts` | REQUIRED | No | Next.js configuration | HIGH |
| `frontend/tsconfig.json` | REQUIRED | No | TypeScript/Next.js configuration | HIGH |
| `frontend/next-env.d.ts` | REQUIRED | No | Next.js generated type declarations | HIGH |
| `frontend/eslint.config.mjs` | REQUIRED | No | ESLint configuration for `lint` script | HIGH |
| `frontend/postcss.config.mjs` | REQUIRED | No | PostCSS/Tailwind build configuration | HIGH |
| `requirements.txt` | REQUIRED | No | Python dependency specification | HIGH |
| `pyrightconfig.json` | KEEP | No | Python analysis/import-path configuration | HIGH |
| `.gitignore` | KEEP | No | Repository generated-file/environment rules | HIGH |
| `frontend/.gitignore` | KEEP | No | Frontend generated-file/environment rules | HIGH |
| `readme.md` | KEEP | No | Root operational/project documentation | HIGH |
| `PROJECTGUIDE.md` | KEEP | No | Detailed architecture and setup documentation | HIGH |
| `frontend/README.md` | KEEP | No | Frontend setup/deployment documentation | HIGH |
| `LICENSE` | KEEP | No | Legal/project distribution document | HIGH |
| `ml_models/labeled_weather_data.csv` | KEEP | No | Input for the offline XGBoost training workflow | MEDIUM |

The checklist groups the 69 radar PNGs by their two runtime-discovered directories because the code does not maintain individual filename references. All remaining tracked files not called out as safe/manual candidates are covered by the required/keep classifications above.

## 9. IMPORTANT WARNING

Static analysis cannot reliably detect every runtime-generated path, dynamic import, external caller, deployment setting, or framework convention. In this project, the most important limitations are:

- Radar PNG usage is generated from directory names, file extensions, sorting, and the latest-four selection in `radar_tensor_prep.py`.
- Backend helper imports depend on `sys.path` mutation and conditional imports.
- Model and tensor paths are constructed with `os.path.join` and location-dependent strings.
- Next.js discovers the App Router page, root layout, global stylesheet, generated type declarations, and favicon through conventions.
- RainViewer, OpenStreetMap, Carto, Open-Meteo, and the configured production API are external runtime dependencies not represented as local files.
- The frontend uses `NODE_ENV` to choose a hard-coded production API URL; deployment infrastructure may supply additional behavior not visible in this repository.
- The SQLite database is mutable runtime state and may be changed by the running backend.
- The Windows shortcut may matter to a developer even though it has no application dependency.
- Training scripts may be intentionally retained for reproducibility even when they are not deployed.

Therefore, only the five unreferenced default SVG assets are marked SAFE TO DELETE. The ML scripts, model artifacts, cache database, shortcut, and radar data should receive an explicit maintainer decision before deletion.
