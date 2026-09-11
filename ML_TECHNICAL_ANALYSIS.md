# NowcastAI: Machine Learning and Technical HOD/SIH Viva Analysis

**Repository examined:** `c:\Users\ayush\Desktop\sih-nowcasting`  
**Analysis date:** 2026-09-11  
**Evidence policy:** `VERIFIED` means read from code, configuration, or measured artifact data. `CALCULATED` means derived from verified values. `NOT VERIFIED FROM PROJECT FILES` means the repository does not preserve enough evidence to establish the value. Documentation claims are separated from executable behavior.

## Executive Verdict

NowcastAI is a Next.js/React frontend over a FastAPI/Python backend. The live backend combines a five-feature binary XGBoost classifier with a one-cell ConvLSTM that consumes four grayscale radar frames. The final risk is a manually weighted 60:40 blend. The project demonstrates an end-to-end prototype, but it does not contain a ConvLSTM training loop, persisted validation/test metrics, a verified calibration procedure, or a real lightning-event target. The ConvLSTM standalone script explicitly saves an **untrained** state dict, although the backend treats the file as loadable model weights.

## Evidence Map: Files Analyzed

### Runtime and configuration

- `backend/main.py`: model loading, ConvLSTM duplicate, Open-Meteo request, fusion, SQLite, APIs, scheduler, fallbacks.
- `requirements.txt`: Python dependency declarations.
- `pyrightconfig.json`: Python import-path configuration.
- `frontend/package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`: frontend dependencies and build configuration.
- `frontend/src/app/page.tsx`, `layout.tsx`, `globals.css`: app orchestration, metadata, global styles.
- `frontend/src/components/DashboardView.tsx`, `MapComponent.tsx`, `AlertsView.tsx`, `DataSourcesView.tsx`, `SettingsView.tsx`: display and external-data behavior.

### ML, data, and artifacts

- `ml_models/multi_region_train.py`: remote historical data fetch, target generation, XGBoost training.
- `ml_models/data_labeling.py`: legacy CSV label-generation workflow.
- `ml_models/convlstm_model.py`: ConvLSTM definition and standalone weight-generation path.
- `ml_models/radar_pipeline.py`: RainViewer timestamp and tile download pipeline.
- `ml_models/radar_tensor_prep.py`: image-to-sequence tensor preprocessing.
- `ml_models/labeled_weather_data.csv`: measured local labeled dataset.
- `ml_models/xgboost_multi_model.json`, `xgboost_model.json`: measured XGBoost artifacts.
- `ml_models/convlstm_weights.pth`: measured ConvLSTM state-dict artifact.
- `ml_models/radar_sequence_tensor.pt`, `_ghaziabad.pt`, `_patna.pt`: measured tensor artifacts.
- `ml_models/radar_data_ghaziabad/`, `radar_data_patna/`: measured radar PNG directories.
- `backend/nowcast_history.db`: measured SQLite schema, size, and current record count.
- `PROJECTGUIDE.md`, `PROJECT_FILE_USAGE_ANALYSIS.md`, `readme.md`, `frontend/README.md`: documentation cross-checked against executable files. The documentation references `ml_models/xgboost_train.py`, but that file is absent.

# 1. Complete Technology Stack

## Frontend

| Technology | Version/evidence | Actual use |
|---|---|---|
| Next.js | `16.3.3` in `frontend/package.json` | App Router page, dynamic imports, build/dev/start scripts |
| React | `19.2.8` | Client components and state/effects |
| TypeScript | `^5` | `.tsx`, `.ts`, and strict project configuration |
| Leaflet | `^1.9.4` | Base map and tile layers |
| React Leaflet | `^5.0.0` | React bindings for `MapContainer`, `TileLayer`, `Circle`, `Polyline`, `Popup` |
| Recharts | `^3.10.1` | SQLite-backed thunder/lightning trend chart |
| Lucide React | `^1.37.0` | UI icons |
| Tailwind CSS | `^4`; PostCSS integration | Utility styling in TSX |
| ESLint | `^9`, `eslint-config-next` `16.3.3` | Lint script |
| React Compiler | `babel-plugin-react-compiler` `1.0.0`; `reactCompiler: true` | Next configuration |
| HTTP | Browser `fetch` | Backend, RainViewer, and map/radar requests; no Axios dependency |

## Backend and ML runtime

| Technology | Version/evidence | Actual use |
|---|---|---|
| Python | No project-required version file; active project venv measured as Python executable, exact interpreter version not recorded | Backend and scripts |
| FastAPI | Unpinned in `requirements.txt` | API application in `backend/main.py` |
| Uvicorn | Unpinned | ASGI server named in project setup docs |
| Requests | Unpinned | Open-Meteo and RainViewer HTTP calls |
| SQLite | Python standard-library `sqlite3` | `backend/nowcast_history.db` prediction history |
| APScheduler | Unpinned | 15-minute radar sync job |
| XGBoost | Project venv measured `3.4.1` | Binary atmospheric classifier and JSON artifact loading |
| PyTorch | Project venv measured `2.13.0+cpu` | ConvLSTM inference and tensor serialization |
| Torchvision | Project venv measured `0.28.0+cpu` | Resize, grayscale, and tensor conversion |
| Pandas | Project venv measured `3.0.5` | DataFrame construction and training data handling |
| NumPy | Declared/imported | Label generation with `np.where` |
| Scikit-learn | Declared; `train_test_split` and `classification_report` imported | Split and training-time report in `multi_region_train.py` |
| Open-Meteo tooling | `openmeteo-requests`, `requests-cache`, `retry-requests` | Historical training fetch with cache/retry |
| Pillow | Transitive/runtime dependency used by `PIL.Image` | Radar image reading |
| Torchvision | CPU wheel index specified in requirements | Radar transforms |

There is no evidence in the source of TensorFlow, Keras, LightGBM, Random Forest, a chart server, Redis, Celery, Kafka, or a separate database server.

# 2. Dataset Analysis

## 2.1 Local labeled dataset: `ml_models/labeled_weather_data.csv`

**Measured facts:**

| Property | Value |
|---|---|
| Type | CSV, UTF-8 decode succeeded |
| Disk size | 1,749,383 bytes = 1,708.382 KB = 1.669 MB (decimal MB: 1.749 MB) |
| Rows | 26,304 data rows |
| Columns | 7 |
| Columns | `date`, `temperature`, `humidity`, `pressure`, `precipitation`, `wind_speed`, `target` |
| Data types | `date`: string; five weather columns: `float64`; `target`: `int64` |
| Missing values | 0 in every column |
| Duplicate rows | 0 |
| Date range in file | `2022-12-31 18:30:00+00:00` through `2025-12-31 17:30:00+00:00` |
| Target classes | 2: class 0 and class 1 |
| Class 0 | 26,236, 99.741484% |
| Class 1 | 68, 0.258516% |
| In-memory pandas usage | 3,209,220 bytes = 3.060 MB (measured by `memory_usage(deep=True)`) |

The local file has one row per hourly point for the expected three-year period. Its timestamps indicate UTC storage, while the training fetch uses `timezone: auto`. The local file is not explicitly loaded by `multi_region_train.py`; that script fetches two remote datasets. Therefore it cannot be proven that this CSV is the exact combined training input for `xgboost_multi_model.json`.

### Numeric statistics

| Column | Min | Max | Mean | Standard deviation |
|---|---:|---:|---:|---:|
| `temperature` | 2.500000 | 46.250000 | 24.152003 | 8.022291 |
| `humidity` | 4.592818 | 100.000000 | 64.941445 | 24.077049 |
| `pressure` | 967.014340 | 1001.536300 | 984.216120 | 6.603553 |
| `precipitation` | 0.000000 | 28.300000 | 0.109557 | 0.796343 |
| `wind_speed` | 0.000000 | 33.971867 | 8.473902 | 4.443160 |
| `target` | 0 | 1 | 0.002585 | 0.050780 |

### Per-class measurements

| Target | Count | Temperature mean | Humidity mean | Pressure mean | Precipitation mean | Wind mean |
|---|---:|---:|---:|---:|---:|---:|
| 0 | 26,236 | 24.150722 | 64.875440 | 984.231217 | 0.089743 | 8.446567 |
| 1 | 68 | 24.646324 | 90.407671 | 978.391524 | 7.754412 | 19.020564 |

Target generation in `data_labeling.py` and `multi_region_train.py` is a deterministic proxy: `target=1` when `precipitation >= 2.5` **and** `wind_speed >= 15.0`; otherwise `target=0`. This is not a directly observed thunderstorm or lightning label.

## 2.2 Remote training datasets

`multi_region_train.py` calls `https://archive-api.open-meteo.com/v1/archive` for:

- Ghaziabad: latitude `28.66`, longitude `77.43`.
- Patna: latitude `25.59`, longitude `85.13`.
- Date request: `2023-01-01` to `2025-12-31`.
- Hourly variables: temperature, relative humidity, surface pressure, precipitation, wind speed.
- `dropna()` is applied before labeling.

The code concatenates the two returned frames, but does not save the combined frame. Exact returned row counts after API response and `dropna()`, per-region class distributions, missing counts, duplicate counts, disk size, and encoding are **NOT VERIFIED FROM PROJECT FILES**. The local 26,304-row CSV cannot be silently substituted for the two-region combined frame.

# 3. Train/Validation/Test Split

`multi_region_train.py` uses:

```python
train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
```

Verified facts:

- Training percentage: 80%.
- Test percentage: 20%.
- Validation percentage: 0%; no validation set is created.
- Random split, not chronological.
- Seed: `42`.
- Stratification: yes, on `y`.
- Cross-validation: none found.
- Early stopping: none; `.fit(X_train, y_train)` has no evaluation set.
- Leakage prevention: no explicit temporal grouping or location grouping.
- Exact train/test counts for the remote combined frame: **NOT VERIFIED FROM PROJECT FILES** because the fetched data is not persisted and API results can vary. If the combined frame were exactly `N`, the nominal counts are governed by the library's 80/20 split, but `N` after `dropna()` is not stored.
- The local CSV has no recorded split metadata and no local training output tied to it.

# 4. Preprocessing Pipeline

1. Historical training data is fetched by `fetch_and_label_data()` in `multi_region_train.py`.
2. Five API arrays are placed into a pandas DataFrame; latitude and longitude are constant columns.
3. `.dropna()` removes rows with missing values. No imputation is used.
4. The target is generated using the precipitation/wind thresholds above.
5. XGBoost selects exactly `temperature`, `humidity`, `pressure`, `latitude`, and `longitude`; `precipitation` and `wind_speed` create the label but are not input features.
6. `train_test_split` creates a stratified random train/test split.
7. No normalization, standardization, one-hot encoding, categorical encoding, outlier removal, resampling, or feature engineering is present.
8. No scaler is fitted, so there is no train/test scaler difference.
9. At inference, `backend/main.py` creates a one-row DataFrame with the five same feature names and calls `predict_proba`.
10. Radar preprocessing in `radar_tensor_prep.py` sorts supported image filenames, chooses the last four, opens RGB, resizes to `(64,64)`, converts to one grayscale channel, applies `ToTensor()` and stacks frames.
11. `ToTensor()` produces float tensor values; measured stored tensor dtype is `torch.float32`. The code does not explicitly normalize with a custom mean/std transform.
12. The backend adds a batch dimension with `.unsqueeze(0)` before ConvLSTM inference.

# 5. XGBoost Analysis

## Live artifact and training code

- Live artifact: `ml_models/xgboost_multi_model.json`, 555,185 bytes = 542.173 KB = 0.555 MB.
- Backend path: `backend/main.py`, `XGB_PATH`, followed by `xgb_model.load_model(XGB_PATH)`.
- Older artifact: `ml_models/xgboost_model.json`, 272,752 bytes; measured as 150 trees with only three features (`temperature`, `humidity`, `pressure`). It is not loaded by the backend.
- Live artifact features measured from JSON: `temperature`, `humidity`, `pressure`, `latitude`, `longitude`.
- Classes measured: binary; class 0 and class 1.
- Booster measured: `gbtree`.
- Trees measured: 200.
- JSON objective measured: `binary:logistic`.

## Configuration verified from `multi_region_train.py`

| Parameter | Value |
|---|---|
| Objective | `binary:logistic` |
| Estimators | 200 |
| Max depth | 6 |
| Learning rate | 0.05 |
| Evaluation metric requested | `auc` |
| Random seed | 42 |
| Positive weighting | `negative_cases / positive_cases` from training split |
| Subsample | NOT VERIFIED as explicitly set; default behavior applies |
| Column sampling | NOT VERIFIED as explicitly set; default behavior applies |
| Minimum child weight | NOT VERIFIED as explicitly set; library default/artifact wrapper metadata does not preserve the source value |
| Gamma | NOT VERIFIED as explicitly set |
| L1 regularization (`reg_alpha`) | NOT VERIFIED as explicitly set |
| L2 regularization (`reg_lambda`) | NOT VERIFIED as explicitly set |
| Early stopping | Not used |

The artifact confirms five features, 200 trees, binary logistic objective, and one target, but a serialized XGBoost model does not preserve every Python constructor argument as a complete training manifest. Values not assigned in the source must not be presented as tuned facts.

## How it works here

Each tree learns a sequence of threshold splits over the five numeric features. The 200 tree outputs are added as boosting corrections. The logistic objective converts the accumulated score into a class-1 probability. In this application class 1 represents the precipitation/wind proxy risk, not verified lightning probability. The backend takes `predict_proba(...)[0][1]` as `xgb_prob`.

XGBoost is suitable for small/medium tabular weather snapshots because it handles nonlinear feature interactions and does not require feature scaling. A Random Forest comparison, ablation study, or selection experiment is not present, so “selected over Random Forest” is **NOT VERIFIED FROM PROJECT FILES**.

# 6. ConvLSTM Analysis

## Architecture

The architecture appears in both `ml_models/convlstm_model.py` and duplicated in `backend/main.py`:

- Input shape: `(batch, sequence, channel, height, width)`.
- Measured production tensor shape before batching: `(4, 1, 64, 64)`.
- Backend model input after `unsqueeze(0)`: `(1, 4, 1, 64, 64)`.
- Time steps: 4.
- Channels: 1 grayscale channel.
- Spatial size: 64 x 64.
- One ConvLSTM cell/layer.
- Input channels: 1; hidden channels: 16.
- Convolution kernel: 3 x 3, padding 1, bias enabled.
- Gate output: 4 x 16 channels, split into input, forget, output, and candidate gates.
- Gate activations: sigmoid for input/forget/output; tanh for candidate and cell-to-hidden step.
- Fully connected layer: 65,536 inputs (`16*64*64`) to 128.
- Hidden activation: ReLU.
- Output layer: 128 to 1.
- Final activation: sigmoid, producing a scalar in approximately `[0,1]`.
- Loss function, optimizer, learning rate, epochs, training split, validation split, and random seed: **NOT VERIFIED FROM PROJECT FILES**. No ConvLSTM training loop exists.
- Device: installed project PyTorch is CPU (`2.13.0+cpu`); no explicit `.to('cuda')` appears. Exact runtime device is not recorded, but the supplied dependency is CPU-only.
- Dtype: stored tensors and model parameters measured as `torch.float32`.

## Parameters

| Layer | Calculation | Parameters |
|---|---|---:|
| ConvLSTM convolution weights | `64 * 17 * 3 * 3` | 9,792 |
| ConvLSTM bias | `64` | 64 |
| `fc1` weights | `128 * 65,536` | 8,388,608 |
| `fc1` bias | `128` | 128 |
| `fc2` weights | `1 * 128` | 128 |
| `fc2` bias | `1` | 1 |
| **Total** | sum | **8,398,721** |

The 17 convolution input channels are one current-frame channel plus 16 hidden channels. The model is dominated by `fc1`: 8,388,736 of 8,398,721 parameters including its bias, approximately 99.88% calculated from the layer counts.

## Memory calculations

For float32, bytes per element = 4.

- One frame: `1 * 64 * 64 = 4,096` elements; `4,096 * 4 = 16,384 bytes` = 16 KiB.
- One four-frame sequence: `4 * 1 * 64 * 64 = 16,384` elements; `16,384 * 4 = 65,536 bytes` = 64 KiB.
- One batch with batch size 1: `1 * 4 * 1 * 64 * 64 = 16,384` elements; `16,384 * 4 = 65,536 bytes` = 64 KiB.
- Three stored tensor payloads: `3 * 65,536 = 196,608 bytes` = 192 KiB, excluding `.pt` serialization overhead.
- Full ConvLSTM parameter payload: `8,398,721 * 4 = 33,594,884 bytes` = 32.038 MiB.
- The measured `convlstm_weights.pth` file is 33,598,145 bytes = 32.041 MiB, close to parameter payload plus serialization metadata.
- Adam optimizer-state memory: **NOT VERIFIED FROM PROJECT FILES** because no optimizer or training checkpoint is present. For context only, an Adam checkpoint with two float32 state tensors per parameter would require `2 * 33,594,884 = 67,189,768` bytes before step/scalar overhead, but this is a theoretical calculation, not a project artifact.

A ConvLSTM is used because radar is spatial and temporal. A plain CNN processes one image at a time and does not maintain a recurrent cell state across frames. Here the convolution preserves local spatial structure while the recurrent hidden/cell state carries information from the four-frame sequence. The repository does not prove that the weights learned useful temporal patterns.

## Weight provenance warning

`convlstm_model.py` calls the saved state “untrained” in `test_model()` and saves a newly initialized model. No training dataset, loss loop, optimizer, epoch count, validation code, or checkpoint metadata exists. Therefore, the provenance and predictive quality of `convlstm_weights.pth` are **NOT VERIFIED FROM PROJECT FILES**.

# 7. Radar Dataset and Pipeline

## Acquisition

- Provider: RainViewer.
- Metadata endpoint: `https://api.rainviewer.com/public/weather-maps.json`.
- Backend synchronization: `automated_radar_sync()` in `backend/main.py` runs for Ghaziabad and Patna when enabled.
- Scheduler: APScheduler interval of 15 minutes.
- Default sync state: `RADAR_SYNC_ENABLED = False`.
- Metadata selection: `past[-4:]`, so up to four latest past timestamps.
- Tile endpoint pattern: `https://tilecache.rainviewer.com/v2/radar/{timestamp}/{zoom}/{x}/{y}/2/1_1.png`.
- Download zoom in backend pipeline: 7.
- One tile per selected timestamp per region.
- Rate delay: `time.sleep(1)` after successful download.
- Missing metadata: returns empty timestamps and aborts.
- Failed individual download: logged and skipped.
- No HTTP timeout is supplied.
- Data is current remote radar imagery when the sync is run; committed PNGs/tensors are historical snapshots and can become stale.

## Stored data measured in repository

- Ghaziabad PNG files: 39.
- Patna PNG files: 40.
- Total PNG files: 79.
- All measured images: 256 x 256, PIL mode `P`.
- Ghaziabad PNG disk total: 53,430 bytes = 52.178 KB.
- Patna PNG disk total: 54,800 bytes = 53.516 KB.
- Combined PNG disk total: 108,230 bytes = 105.694 KB.
- The pipeline can accumulate files; it does not delete old images.
- `radar_tensor_prep.py` lexicographically sorts supported extensions and chooses the last four filenames. This is filename ordering, not an explicit timestamp comparison beyond the naming convention.

## Tensor preparation

For each selected image: RGB conversion, resize to 64 x 64, grayscale to one channel, `ToTensor()`, then `torch.stack`. Measured artifacts:

| Tensor file | Shape | Dtype | Elements | Raw payload | File size |
|---|---|---|---:|---:|---:|
| `radar_sequence_tensor.pt` | `(4,1,64,64)` | float32 | 16,384 | 65,536 B | 67,211 B |
| `radar_sequence_tensor_ghaziabad.pt` | `(4,1,64,64)` | float32 | 16,384 | 65,536 B | 67,409 B |
| `radar_sequence_tensor_patna.pt` | `(4,1,64,64)` | float32 | 16,384 | 65,536 B | 67,381 B |

The generic tensor is referenced only by the standalone ConvLSTM test path; the backend dynamically selects the Ghaziabad tensor when `lat > 27.0`, otherwise Patna. Longitude is not used for this selection.

# 8. Fusion Model

The exact backend formula is:

```text
fused_probability = 0.6 * xgb_prob + 0.4 * convlstm_prob
risk_percentage = round(fused_probability * 100, 2)
lightning_probability = round(risk_percentage * 0.85, 2)
```

- XGBoost weight: 60%.
- ConvLSTM weight: 40%.
- Weights are manually specified constants, not learned.
- Formula selection experiment: **NOT VERIFIED FROM PROJECT FILES**.
- `lightning_probability` is a deterministic 0.85 multiplier of rounded thunderstorm risk; it is not an independently trained lightning model.

### Risk thresholds

- Severe: `risk_percentage > 75.0`.
- High: `risk_percentage > 50.0` and `<=75.0`.
- Moderate: `risk_percentage >25.0` and `<=50.0`.
- Low: `<=25.0`.

### Worked example

Using actual code values as a numerical example, if `xgb_prob=0.80` and `convlstm_prob=0.50`:

`fused = (0.80*0.6)+(0.50*0.4)=0.48+0.20=0.68`; risk = `68.00%`; lightning = `68.00*0.85=57.80%`; confidence = `100 - |0.80-0.50|*100 = 70.0%`; risk level = **High** because 68 is greater than 50 and not greater than 75. These input probabilities are illustrative values permitted by the implemented formula; they are not a captured live response.

# 9. Confidence Calculation

The exact formula is:

```text
confidence = round(100 - abs(xgb_prob - convlstm_prob) * 100, 1)
```

It takes the absolute disagreement between the two model outputs. Equal outputs produce 100; a difference of 0.30 produces 70.0. It is best described as a **model-agreement heuristic**. There is no calibration set, reliability curve, Brier score, held-out accuracy mapping, or statistical confidence interval. It does not represent model accuracy and must not be defended as calibrated confidence.

# 10. Current Weather Data

`backend/main.py` requests:

```text
https://api.open-meteo.com/v1/forecast
?latitude={lat}&longitude={lon}
&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m
&timezone=auto
```

| Display/value | API parameter | Unit/display | Used by ML? | Notes |
|---|---|---|---|---|
| Temperature | `temperature_2m` | Celsius in API/display key `temperature_celsius` | Yes | Current Open-Meteo value |
| Humidity | `relative_humidity_2m` | Percent | Yes | Current relative humidity |
| Pressure | `surface_pressure` | hPa in display | Yes | Explicitly surface pressure, not sea-level/station pressure |
| Wind speed | `wind_speed_10m` | km/h as displayed | No, except returned movement speed | Used as displayed storm speed |
| Wind direction | `wind_direction_10m` | Requested but not assigned/displayed from API | No | Backend returns hard-coded `SW → NE` instead |
| Rainfall | No current precipitation parameter requested | Frontend displays `0 mm` | No | Not returned by backend |

These are API/model-provided current values, not a verified local station observation. The exact observation/model status and timestamp from Open-Meteo's response are not preserved in the backend response. The backend generates `last_updated` using local `datetime.now()` and appends the literal `IST`; timezone correctness is not verified.

# 11. Actual Live Data Validation

## Weather chain

1. `frontend/src/app/page.tsx` calls `GET /api/realtime-risk?lat=...&lon=...`.
2. `backend/main.py` builds the Open-Meteo forecast URL above.
3. `requests.get(url)` retrieves JSON; the code does not call `raise_for_status()` or validate the schema.
4. `current` values are extracted.
5. Five values are passed to XGBoost; temperature, humidity, and pressure are returned to the frontend.
6. Wind speed is returned as `storm_movement.speed_kmh`.
7. The frontend renders returned weather and movement values.

## Radar chain

- Backend sync, when explicitly enabled, calls RainViewer metadata and tile endpoints, stores PNGs, and regenerates `.pt` tensors.
- Realtime risk does not itself trigger a radar download. It loads the existing region tensor.
- Frontend `MapComponent.tsx` independently requests RainViewer metadata and displays the latest tile URL.
- `DashboardView.tsx` independently requests RainViewer metadata for up to five timeline frames.

## Hardcoded, fallback, or synthetic behavior

- Backend storm direction is always `SW → NE`; the requested API wind direction is ignored.
- Backend forecast window is always `Next 30-60 Minutes`.
- Backend map zones use fixed coordinate offsets and radii: 3,000 m, 4,500 m, and 6,000 m.
- Backend lightning value is derived by `0.85`, not an external lightning feed.
- Backend radar failure leaves `convlstm_prob=0.0` because all radar inference exceptions are swallowed.
- If ConvLSTM weight loading fails, the randomly initialized model remains instantiated; the backend does not force a zero output in this case.
- Frontend backend failure waits 1.5 seconds and injects synthetic weather, risk, trend, movement, map zone, and status values.
- Frontend mock displays hardcoded values such as 32/29 C, 62/78% humidity, pressure 1004 hPa, and fake trends.
- Frontend mock radar timeline uses generated SVG data URIs.
- Frontend displays rainfall as `0 mm` regardless of backend/API data.
- The frontend production API URL is hard-coded to a temporary Cloudflare Tunnel URL; local development uses `http://127.0.0.1:8000`.
- No stale-data age check, request timeout, retry policy, response timestamp validation, authentication, or rate limiting is implemented in the backend.
- UI source labels claim IMD, INSAT-3D, and Earth Networks, but executable integrations for those services are not present. Verified external sources are Open-Meteo and RainViewer.

# 12. Backend API Analysis

| Method | Endpoint | Parameters | Response/purpose |
|---|---|---|---|
| GET | `/` | none | `{"status":"FastAPI Backend is running!"}` health-style response |
| GET | `/api/settings` | none | `{radar_sync_enabled: boolean}` |
| POST | `/api/settings/radar/toggle` | none | Flips process-global radar flag; queues immediate background sync when enabling |
| GET | `/api/history` | optional `lat` default 28.66, `lon` default 77.43 | Up to six matching rows, chronological order, with `time`, `thunder`, `lightning`; empty result becomes one zero point |
| GET | `/api/realtime-risk` | optional `lat`, `lon` | Weather, fused risk, lightning heuristic, confidence, movement, statuses, fixed map zones; queues SQLite write |

There are no radar-specific backend HTTP endpoints. Radar synchronization is reached through the settings toggle and scheduler. CORS allows all origins, methods, headers, and credentials.

# 13. SQLite Analysis

- File: `backend/nowcast_history.db`.
- Measured disk size: 32,768 bytes = 32.000 KB.
- Tables: `history` and SQLite internal `sqlite_sequence`.
- Current measured records: 290.
- Current timestamp range: `2026-08-29 16:48:01` through `2026-09-11 17:10:35`.
- Schema:

```sql
history(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME,
  lat REAL,
  lon REAL,
  thunder_prob REAL,
  lightning_prob REAL
)
```

The backend inserts one record per realtime request using a background task. The history endpoint selects the six newest exact latitude/longitude matches and the frontend plots the two returned series. There is no retention policy, index, migration, or concurrent-write design beyond ordinary SQLite connections. Database size and row count are runtime-state measurements and may change after this analysis.

# 14. Complete Memory and Disk Table

| Component | Disk size | In-memory/raw size | Calculation/source |
|---|---:|---:|---|
| `labeled_weather_data.csv` | 1,749,383 B | 3,209,220 B pandas deep usage | Direct measurement |
| Ghaziabad radar PNG directory | 53,430 B | Individual decoded memory not stored | 39 files; source PNGs 256x256 palette; exact PIL allocation not used by pipeline as a resident batch |
| Patna radar PNG directory | 54,800 B | Individual decoded memory not stored | 40 files; same measurement |
| One radar frame | n/a | 16,384 B raw float32 | `1*64*64*4` |
| One radar sequence | 67,211/67,409/67,381 B `.pt` | 65,536 B raw | `4*1*64*64*4` |
| All three stored tensors | 202,001 B files | 196,608 B raw payload | sum of measured files/raw payloads |
| XGBoost live JSON | 555,185 B | Runtime allocation not measured | JSON file size; exact loaded heap size NOT VERIFIED |
| ConvLSTM weights | 33,598,145 B | 33,594,884 B float32 parameters | `8,398,721*4`; file includes serialization overhead |
| SQLite history DB | 32,768 B | SQLite page/cache memory NOT VERIFIED | Direct file measurement |
| Radar PNGs plus tensor files | 310,231 B | Raw selected tensors 196,608 B | PNG directory totals + three `.pt` files |
| Main dataset + live XGBoost + ConvLSTM + tensors + DB | 36,137,482 B | Exact sum below | Disk sum of 1,749,383 + 555,185 + 33,598,145 + 202,001 + 32,768 = **36,137,482 bytes** = 34.46 MiB; this excludes radar PNG directories and includes all three tensors |
| Total above plus radar PNG directories | 36,245,712 B | Raw model/tensor memory as above | Adds 108,230 B PNG directories; excludes Python/frontend/runtime overhead |

The verified total is **36,137,482 bytes** before PNG directories and **36,245,712 bytes** including them. Full inference RAM, decoded map tiles, Python process, XGBoost heap, PyTorch activations, and frontend memory are **NOT VERIFIED FROM PROJECT FILES**.

# 15. End-to-End Training and Inference Pipeline

```text
Open-Meteo archive API
  -> pandas DataFrame for Ghaziabad and Patna
  -> dropna()
  -> threshold target generation
  -> concatenate regions
  -> select five XGBoost features
  -> stratified random 80/20 split, seed 42
  -> XGBoost binary training, 200 estimators
  -> classification report printed (values not saved)
  -> save xgboost_multi_model.json

RainViewer metadata
  -> select latest four past timestamps
  -> download one tile per timestamp/region
  -> save radar PNGs
  -> select latest four filenames
  -> RGB -> 64x64 -> grayscale -> ToTensor -> stack
  -> save radar_sequence_tensor_<region>.pt
  -> ConvLSTM inference using existing state dict

Backend startup
  -> load xgboost_multi_model.json
  -> construct ConvLSTM
  -> attempt to load convlstm_weights.pth

Live request
  -> frontend sends latitude/longitude
  -> backend calls Open-Meteo current endpoint
  -> five weather/location features -> XGBoost class-1 probability
  -> latitude threshold selects Ghaziabad or Patna tensor
  -> ConvLSTM probability or zero on radar inference exception
  -> 60:40 fusion
  -> risk class, lightning heuristic, agreement heuristic, zones
  -> asynchronous SQLite history write
  -> JSON response -> frontend dashboard/map/chart
```

The documented pipeline says “trained ConvLSTM,” but the available ConvLSTM source has no training stage. That distinction should be stated directly in a viva.

# 16. Model Evaluation

Verified evaluation code exists only in `multi_region_train.py`: it calls `model.predict(X_test)` and prints `classification_report(y_test, y_pred, target_names=['Clear (0)', 'Risk (1)'])`. It does not save or commit the output.

| Metric | Project result | Meaning |
|---|---|---|
| Accuracy | NOT VERIFIED FROM PROJECT FILES | Fraction of correct class predictions |
| Precision | NOT VERIFIED FROM PROJECT FILES | Of predicted positives, fraction actually positive |
| Recall | NOT VERIFIED FROM PROJECT FILES | Of actual positives, fraction found |
| F1 | NOT VERIFIED FROM PROJECT FILES | Harmonic mean of precision and recall |
| ROC-AUC | Requested as XGBoost training `eval_metric='auc'`, numeric value NOT VERIFIED | Ranking quality across thresholds |
| Confusion matrix | Not explicitly calculated/saved | Counts TP, TN, FP, FN |
| MAE/RMSE | Not used | Regression errors; not applicable to the implemented classifier |
| Validation loss | No validation set or loss log | NOT VERIFIED |
| Test loss | Not calculated | NOT VERIFIED |
| ConvLSTM metrics | None found | NOT VERIFIED |

The 99.74% class-0 prevalence in the local CSV means accuracy alone could be misleading. No precision/recall result or event-based independent test is available to demonstrate generalization.

# 17. Data Leakage and Reliability Check

- **Target leakage:** The label uses precipitation and wind speed, while the XGBoost features omit those two variables. Direct target-feature leakage is not visible in the feature list. However, the target is a deterministic weather-threshold proxy, so the model is learning a proxy relationship rather than independently observed thunderstorm occurrence.
- **Temporal leakage:** The split is random over hourly records, not chronological. Neighboring hours from the same weather episodes can land in both train and test, so temporal dependence may inflate test performance. This is a potential temporal leakage/generalization problem.
- **Location leakage:** Latitude and longitude are input features, while the two regions are combined and randomly split. The model can learn region identity; exact cross-location generalization is not tested.
- **Duplicate leakage:** The measured local CSV has zero duplicate full rows. The remote combined frame's duplicate status is NOT VERIFIED. No deduplication is performed in `multi_region_train.py`.
- **Preprocessing leakage:** No fitted scaler is used. Labeling happens before splitting, but it uses only row-local source fields. No clear fitted-transform leakage is visible.
- **Train/test contamination:** Exact remote frame provenance and API cache contents are not a reproducible frozen dataset. The training output does not record a hash or data snapshot.
- **ConvLSTM leakage:** There is no training pipeline to inspect. Sequence overlap, chronological split, and target alignment are NOT VERIFIED.
- **Staleness:** Existing radar tensors can be old because realtime inference loads files and does not force synchronization; the sync flag defaults off.

# 18. HOD Questions and Project-Specific Answers

Each item includes the requested four fields. Answers use the code and measured artifacts, not generic claims.

## A. Basic ML

### 1
**Question:** What problem does this project solve?  
**Simple answer:** It estimates near-term weather risk for a selected location.  
**Technical answer:** It fuses a tabular binary classifier with a radar-sequence neural output.  
**Project-specific evidence:** `backend/main.py` `/api/realtime-risk`.

### 2
**Question:** Is this classification or regression?  
**Simple answer:** Classification with a probability output.  
**Technical answer:** XGBoost uses `binary:logistic`; the final scalar is thresholded into four labels.  
**Evidence:** `multi_region_train.py`, `backend/main.py`.

### 3
**Question:** What is the target?  
**Simple answer:** A high-risk weather proxy.  
**Technical answer:** `1` iff precipitation is at least 2.5 and wind speed at least 15.  
**Evidence:** `multi_region_train.py` and `data_labeling.py`.

### 4
**Question:** Is the target actual lightning?  
**Simple answer:** No.  
**Technical answer:** It is a precipitation/wind threshold label; lightning is later derived as risk times 0.85.  
**Evidence:** label code and fusion code in `backend/main.py`.

### 5
**Question:** Why combine two model families?  
**Simple answer:** Weather features and radar images carry different information.  
**Technical answer:** XGBoost sees structured atmospheric/location values; ConvLSTM sees spatial evolution across frames.  
**Evidence:** five-feature DataFrame and `(4,1,64,64)` tensor path.

### 6
**Question:** What is a probability in this system?  
**Simple answer:** A model score interpreted as class-1 risk.  
**Technical answer:** XGBoost `predict_proba()[0][1]` and sigmoid ConvLSTM output are blended.  
**Evidence:** `backend/main.py`.

## B. Dataset

### 7
**Question:** What local dataset did you find?  
**Simple answer:** `labeled_weather_data.csv`.  
**Technical answer:** It contains 26,304 rows and 7 columns.  
**Evidence:** direct pandas measurement.

### 8
**Question:** What are the feature names?  
**Simple answer:** Temperature, humidity, pressure, latitude, longitude for live XGBoost.  
**Technical answer:** The local CSV additionally has date, precipitation, wind speed, and target; live features are the five listed.  
**Evidence:** CSV schema and `main.py` input DataFrame.

### 9
**Question:** How imbalanced is the local label?  
**Simple answer:** Extremely imbalanced.  
**Technical answer:** 68 positives versus 26,236 negatives; positive rate 0.258516%.  
**Evidence:** measured `value_counts()`.

### 10
**Question:** Are there missing rows?  
**Simple answer:** No missing values in the local CSV.  
**Technical answer:** Every column has zero missing values; remote training applies `dropna()`.  
**Evidence:** pandas measurement and `multi_region_train.py`.

### 11
**Question:** Are there duplicate rows?  
**Simple answer:** No in the local CSV.  
**Technical answer:** Full-row duplicate count is zero locally; remote combined data is not checked.  
**Evidence:** measured `df.duplicated().sum()`.

### 12
**Question:** What is the pressure range?  
**Simple answer:** 967.014340 to 1001.536300 in the local file.  
**Technical answer:** Mean 984.216120 and standard deviation 6.603553.  
**Evidence:** measured `describe()`.

## C. Data Preprocessing

### 13
**Question:** How are labels generated?  
**Simple answer:** By two thresholds.  
**Technical answer:** Logical AND of precipitation >= 2.5 and wind speed >= 15.0.  
**Evidence:** `np.where` in both label scripts.

### 14
**Question:** Is scaling used?  
**Simple answer:** No.  
**Technical answer:** No scaler, normalization, or standardization appears in the pipeline.  
**Evidence:** `multi_region_train.py` and `main.py`.

### 15
**Question:** Why is precipitation not an XGBoost input?  
**Simple answer:** It is used to construct the target.  
**Technical answer:** The selected feature list contains only five fields and excludes precipitation and wind speed.  
**Evidence:** `features = [...]` in `multi_region_train.py`.

### 16
**Question:** How are radar images transformed?  
**Simple answer:** Resize, grayscale, tensor conversion, stack.  
**Technical answer:** RGB image -> 64x64 -> one channel -> float tensor -> four-frame stack.  
**Evidence:** transform pipeline in `radar_tensor_prep.py`.

### 17
**Question:** How does inference preprocessing differ from training preprocessing?  
**Simple answer:** No difference is documented for XGBoost; ConvLSTM training preprocessing is absent.  
**Technical answer:** Runtime uses the same visible radar transform code, but no trained sequence dataset contract exists.  
**Evidence:** no ConvLSTM training script.

### 18
**Question:** How are outliers handled?  
**Simple answer:** They are not explicitly handled.  
**Technical answer:** There is no clipping, winsorization, or outlier filter.  
**Evidence:** all preprocessing files.

## D. XGBoost

### 19
**Question:** Why XGBoost?  
**Simple answer:** It is effective for nonlinear tabular data.  
**Technical answer:** The project uses gradient-boosted trees for five numeric atmospheric/location fields.  
**Evidence:** `XGBClassifier` in `multi_region_train.py`.

### 20
**Question:** Why not Random Forest?  
**Simple answer:** The repository does not document a comparison.  
**Technical answer:** No Random Forest experiment, metric table, or selection rationale exists.  
**Evidence:** dependency/source scan; answer is NOT VERIFIED beyond the absence.

### 21
**Question:** What is the live model objective?  
**Simple answer:** Binary logistic classification.  
**Technical answer:** JSON inspection reports `binary:logistic` and `gbtree`.  
**Evidence:** `xgboost_multi_model.json`.

### 22
**Question:** How many trees and what depth?  
**Simple answer:** 200 trees, maximum depth 6.  
**Technical answer:** Both are explicit in training code; JSON contains 200 tree structures.  
**Evidence:** `multi_region_train.py` and artifact measurement.

### 23
**Question:** How is class imbalance addressed?  
**Simple answer:** With positive-class weighting.  
**Technical answer:** `scale_pos_weight = negative_cases / positive_cases` from the training partition.  
**Evidence:** `multi_region_train.py`; exact remote numeric weight is NOT VERIFIED.

### 24
**Question:** What does class 1 mean?  
**Simple answer:** Threshold-defined risk.  
**Technical answer:** It is not an observed storm/lightning event class.  
**Evidence:** target construction code.

### 25
**Question:** Is early stopping used?  
**Simple answer:** No.  
**Technical answer:** `fit()` receives only training arrays, with no eval set or early-stopping argument.  
**Evidence:** `multi_region_train.py`.

### 26
**Question:** What does the model output used by the backend?  
**Simple answer:** The probability of class 1.  
**Technical answer:** `predict_proba(input_features)[0][1]`.  
**Evidence:** `backend/main.py`.

## E. ConvLSTM

### 27
**Question:** What is the ConvLSTM input shape?  
**Simple answer:** Four 64x64 grayscale frames.  
**Technical answer:** Stored `(4,1,64,64)`, batched `(1,4,1,64,64)`.  
**Evidence:** measured `.pt` tensors and backend `unsqueeze(0)`.

### 28
**Question:** How many ConvLSTM layers are present?  
**Simple answer:** One cell/layer.  
**Technical answer:** `SpatialRiskPredictor` contains one `ConvLSTMCell` with 16 hidden channels.  
**Evidence:** `convlstm_model.py`.

### 29
**Question:** Why ConvLSTM instead of CNN plus LSTM?  
**Simple answer:** It keeps convolutional spatial structure inside recurrence.  
**Technical answer:** Gates operate on feature maps, so spatial neighborhoods are retained while hidden state evolves.  
**Evidence:** concatenation and `Conv2d` inside `ConvLSTMCell`.

### 30
**Question:** How many parameters are present?  
**Simple answer:** 8,398,721.  
**Technical answer:** 9,856 recurrent parameters plus 8,388,865 fully connected parameters.  
**Evidence:** direct state-dict/model measurement.

### 31
**Question:** What activation reaches the final score?  
**Simple answer:** Sigmoid.  
**Technical answer:** `fc2` output is passed through `nn.Sigmoid()`.  
**Evidence:** `SpatialRiskPredictor.forward()`.

### 32
**Question:** Was ConvLSTM trained in this repository?  
**Simple answer:** It cannot be established.  
**Technical answer:** No training loop exists; standalone code says it saves untrained weights.  
**Evidence:** `convlstm_model.py::test_model()`.

### 33
**Question:** What loss and optimizer were used?  
**Simple answer:** Unknown.  
**Technical answer:** No ConvLSTM training code or checkpoint metadata contains them.  
**Evidence:** repository ML source scan.

## F. Radar Data

### 34
**Question:** Which radar provider is used?  
**Simple answer:** RainViewer.  
**Technical answer:** Metadata and tile URLs are RainViewer public endpoints.  
**Evidence:** `radar_pipeline.py`, `MapComponent.tsx`.

### 35
**Question:** How many historical radar PNGs are present?  
**Simple answer:** 79.  
**Technical answer:** 39 Ghaziabad and 40 Patna.  
**Evidence:** direct directory measurement.

### 36
**Question:** What is the original radar image size?  
**Simple answer:** 256x256 in the stored images.  
**Technical answer:** All 79 measured PNGs are PIL mode P and 256x256.  
**Evidence:** direct Pillow measurement.

### 37
**Question:** How are latest frames selected?  
**Simple answer:** Last four sorted filenames.  
**Technical answer:** `sorted(os.listdir(...))[-4:]`; the code does not calculate the newest timestamp independently.  
**Evidence:** `radar_tensor_prep.py`.

### 38
**Question:** What happens if fewer than four frames exist?  
**Simple answer:** Tensor preparation returns `None`.  
**Technical answer:** It prints an error and does not save a sequence.  
**Evidence:** `len(image_files) < 4` branch.

### 39
**Question:** Is radar sync live on every prediction?  
**Simple answer:** No.  
**Technical answer:** Sync is scheduled and disabled by default; realtime inference loads the existing tensor.  
**Evidence:** `RADAR_SYNC_ENABLED=False`, scheduler, and risk endpoint.

## G. Model Training

### 40
**Question:** Where is XGBoost training implemented?  
**Simple answer:** `multi_region_train.py`.  
**Technical answer:** It fetches two regions, labels, splits, fits, reports, and saves JSON.  
**Evidence:** function `train_multi_region_model()`.

### 41
**Question:** Where is ConvLSTM training implemented?  
**Simple answer:** Nowhere in the repository.  
**Technical answer:** Only architecture definition and standalone initialization/inference are present.  
**Evidence:** `convlstm_model.py` and source inventory.

### 42
**Question:** How many ConvLSTM epochs were run?  
**Simple answer:** Unknown.  
**Technical answer:** There is no epoch loop or training log.  
**Evidence:** ConvLSTM source.

### 43
**Question:** How is the XGBoost model saved?  
**Simple answer:** As JSON.  
**Technical answer:** `model.save_model('xgboost_multi_model.json')`.  
**Evidence:** `multi_region_train.py`.

### 44
**Question:** Is training reproducible?  
**Simple answer:** Only partially.  
**Technical answer:** XGBoost has seed 42, but remote API data, cache state, package versions, and full training manifest are not frozen.  
**Evidence:** requirements are unpinned; API fetch code.

### 45
**Question:** What does the cache do?  
**Simple answer:** It supports historical API fetches.  
**Technical answer:** `requests_cache.CachedSession('.cache', expire_after=-1)` plus retry wrapper is used by multi-region training.  
**Evidence:** `multi_region_train.py`.

## H. Train/Validation/Test Split

### 46
**Question:** What is the split?  
**Simple answer:** 80% train and 20% test.  
**Technical answer:** `test_size=0.2`, stratified, random state 42.  
**Evidence:** `train_test_split` call.

### 47
**Question:** Is there validation data?  
**Simple answer:** No.  
**Technical answer:** No third partition or validation `eval_set` exists.  
**Evidence:** training code.

### 48
**Question:** Is the split chronological?  
**Simple answer:** No.  
**Technical answer:** It is a random row split.  
**Evidence:** scikit-learn call without time ordering logic.

### 49
**Question:** What are exact remote train/test counts?  
**Simple answer:** Unknown from committed files.  
**Technical answer:** The fetched frames are not persisted after concatenation and `dropna()`.  
**Evidence:** `multi_region_train.py` only prints combined size.

### 50
**Question:** Is cross-validation used?  
**Simple answer:** No.  
**Technical answer:** Only `train_test_split` is imported and called.  
**Evidence:** training script.

## I. Memory and Complexity

### 51
**Question:** How much raw memory is one radar frame?  
**Simple answer:** 16,384 bytes.  
**Technical answer:** `4096 float32 values * 4 bytes`.  
**Evidence:** tensor shape measurement.

### 52
**Question:** How much raw memory is one sequence?  
**Simple answer:** 65,536 bytes.  
**Technical answer:** `4*1*64*64*4`.  
**Evidence:** measured shape/dtype.

### 53
**Question:** How much parameter memory does ConvLSTM need?  
**Simple answer:** 33,594,884 bytes for float32 parameters.  
**Technical answer:** `8,398,721*4`, excluding activations and runtime overhead.  
**Evidence:** direct parameter count.

### 54
**Question:** What dominates model size?  
**Simple answer:** The first fully connected layer.  
**Technical answer:** `fc1` has 8,388,736 parameters including bias because it flattens 65,536 spatial features.  
**Evidence:** architecture calculation.

### 55
**Question:** What is ConvLSTM convolution complexity per frame?  
**Simple answer:** It processes all 64x64 locations with a 3x3 convolution.  
**Technical answer:** Approximate multiply count is `64*17*3*3*64*64 = 40,108,032` per frame, excluding bias/activation overhead; for four frames, `160,432,128`.  
**Evidence:** architecture dimensions; this is a calculated operation estimate, not a profiler result.

### 56
**Question:** What is full inference RAM?  
**Simple answer:** Not measured.  
**Technical answer:** Raw input and parameters are known, but PyTorch buffers, activations, allocator overhead, and XGBoost heap were not profiled.  
**Evidence:** artifact measurements only.

## J. API/Backend Integration

### 57
**Question:** What is the main endpoint?  
**Simple answer:** `GET /api/realtime-risk`.  
**Technical answer:** It fetches weather, calls both models, fuses outputs, and returns dashboard JSON.  
**Evidence:** `backend/main.py`.

### 58
**Question:** How does the frontend get history?  
**Simple answer:** It calls `/api/history` after realtime risk.  
**Technical answer:** Backend returns at most six exact-coordinate records for Recharts.  
**Evidence:** `page.tsx`, `main.py`, `DashboardView.tsx`.

### 59
**Question:** How is radar synchronization controlled?  
**Simple answer:** A settings toggle controls a process-global flag.  
**Technical answer:** POST toggle flips the flag and queues sync; scheduler checks it every 15 minutes.  
**Evidence:** settings routes and `automated_radar_sync()`.

### 60
**Question:** Does the API validate external HTTP status?  
**Simple answer:** Radar does; weather does not.  
**Technical answer:** Radar calls `raise_for_status()`, while the Open-Meteo request directly calls `.json()`.  
**Evidence:** `radar_pipeline.py` versus `main.py`.

### 61
**Question:** Is the backend secured?  
**Simple answer:** No authentication is visible.  
**Technical answer:** CORS is fully open and there is no auth, rate limit, or API-key handling.  
**Evidence:** CORS middleware in `main.py`.

## K. Real-Time Inference

### 62
**Question:** How often does the frontend request risk?  
**Simple answer:** On load/location change and every 900,000 ms.  
**Technical answer:** That interval is 15 minutes.  
**Evidence:** `setInterval(fetchRiskData, 900000)`.

### 63
**Question:** What if radar inference fails?  
**Simple answer:** ConvLSTM probability becomes zero.  
**Technical answer:** The inner exception handler swallows the error and fusion continues with `convlstm_prob=0.0`.  
**Evidence:** risk endpoint.

### 64
**Question:** What if the weather API fails?  
**Simple answer:** Backend returns HTTP 500; frontend then uses mock data.  
**Technical answer:** Backend outer exception raises `HTTPException(500)`; page catch injects synthetic values.  
**Evidence:** `main.py`, `page.tsx`.

### 65
**Question:** How is stale radar detected?  
**Simple answer:** It is not detected.  
**Technical answer:** The tensor has no freshness timestamp checked during prediction.  
**Evidence:** backend tensor load path.

### 66
**Question:** How is latest weather timestamp shown?  
**Simple answer:** A server-generated local clock string is shown.  
**Technical answer:** `datetime.now().strftime('%H:%M:%S IST')`; API timestamp is not returned.  
**Evidence:** `main.py` response.

## L. Model Fusion

### 67
**Question:** Why 60:40 fusion?  
**Simple answer:** The code gives atmospheric XGBoost more weight.  
**Technical answer:** Constants are `0.6` and `0.4`; selection evidence is absent.  
**Evidence:** fusion expression; weight-selection experiment NOT VERIFIED.

### 68
**Question:** Are fusion weights learned?  
**Simple answer:** No.  
**Technical answer:** They are literal constants in the request handler.  
**Evidence:** `backend/main.py`.

### 69
**Question:** Is lightning independently predicted?  
**Simple answer:** No.  
**Technical answer:** It is `round(risk_percentage*0.85,2)`.  
**Evidence:** fusion code.

### 70
**Question:** What are risk boundaries?  
**Simple answer:** Low <=25, Moderate >25, High >50, Severe >75.  
**Technical answer:** Comparisons are strict `>` at 25, 50, and 75.  
**Evidence:** conditional chain in `main.py`.

## M. Evaluation

### 71
**Question:** What test accuracy did the project achieve?  
**Simple answer:** It is not recorded.  
**Technical answer:** `classification_report` prints metrics at training time, but no output is committed.  
**Evidence:** `multi_region_train.py`.

### 72
**Question:** Is AUC used?  
**Simple answer:** It is requested during XGBoost training.  
**Technical answer:** `eval_metric='auc'`, but no evaluation set or numeric log is saved.  
**Evidence:** constructor and fit call.

### 73
**Question:** Is ConvLSTM validation loss available?  
**Simple answer:** No.  
**Technical answer:** No ConvLSTM training/evaluation code exists.  
**Evidence:** repository ML files.

### 74
**Question:** Why is accuracy insufficient here?  
**Simple answer:** The data is heavily imbalanced.  
**Technical answer:** A majority-class predictor would appear strong with 99.741484% negatives; recall/precision and event-level tests are essential.  
**Evidence:** measured class distribution.

### 75
**Question:** Does confidence mean accuracy?  
**Simple answer:** No.  
**Technical answer:** It is only inverse absolute disagreement of the two outputs and is not calibrated.  
**Evidence:** exact confidence formula.

## N. Limitations

### 76
**Question:** What is the largest ML limitation?  
**Simple answer:** The target is a proxy, not a verified event label.  
**Technical answer:** The model optimizes a threshold-created class rather than measured thunderstorm/lightning occurrence.  
**Evidence:** labeling code.

### 77
**Question:** What is the largest ConvLSTM limitation?  
**Simple answer:** Training is not evidenced.  
**Technical answer:** The source saves newly initialized “untrained” weights and provides no metrics.  
**Evidence:** `convlstm_model.py`.

### 78
**Question:** What is the split limitation?  
**Simple answer:** Random hourly splitting can overstate temporal generalization.  
**Technical answer:** Neighboring hours from the same weather event can cross partitions.  
**Evidence:** random `train_test_split`.

### 79
**Question:** What happens during frontend outage?  
**Simple answer:** The UI shows synthetic mock data.  
**Technical answer:** The catch branch waits 1.5 seconds and writes hardcoded risk/weather/trend objects.  
**Evidence:** `page.tsx`.

### 80
**Question:** Is the storm direction truly predicted?  
**Simple answer:** No.  
**Technical answer:** Direction is a static `SW → NE` string; only speed comes from current wind speed.  
**Evidence:** `main.py`.

## O. Future Improvements

### 81
**Question:** What should improve the target first?  
**Simple answer:** Use observed storm/lightning event labels.  
**Technical answer:** Align radar/weather windows with verified lightning or thunderstorm observations and forecast horizons.  
**Evidence:** current target is threshold proxy.

### 82
**Question:** What split should be used for nowcasting research?  
**Simple answer:** A chronological or rolling-origin split.  
**Technical answer:** Keep later episodes entirely held out and prevent overlapping sequences across partitions.  
**Evidence:** current random split is the limitation.

### 83
**Question:** How should ConvLSTM be made defensible?  
**Simple answer:** Add a real training and evaluation pipeline.  
**Technical answer:** Persist dataset manifest, seed, optimizer, loss, epochs, validation/test metrics, and checkpoint provenance.  
**Evidence:** all are currently missing.

### 84
**Question:** How should confidence be improved?  
**Simple answer:** Calibrate it on held-out data.  
**Technical answer:** Use reliability analysis and a calibration method such as temperature scaling or isotonic regression, then report calibration metrics.  
**Evidence:** current score is agreement heuristic only.

### 85
**Question:** How should radar freshness be handled?  
**Simple answer:** Store and validate timestamps.  
**Technical answer:** Associate each tensor with source timestamps, reject data beyond an age threshold, and define an explicit unavailable-radar policy.  
**Evidence:** current tensors have no checked freshness.

### 86
**Question:** How should API reliability improve?  
**Simple answer:** Add timeouts, retries, and schema checks.  
**Technical answer:** Validate status codes, required JSON fields, timestamps, units, and fallback provenance.  
**Evidence:** weather request currently lacks these controls.

### 87
**Question:** How should the model be compared with alternatives?  
**Simple answer:** Run controlled baselines.  
**Technical answer:** Compare XGBoost with logistic regression, Random Forest, calibrated boosting, and radar-only/weather-only ablations on identical temporal splits.  
**Evidence:** no comparison exists.

### 88
**Question:** How should ConvLSTM memory be reduced?  
**Simple answer:** Reduce the oversized dense layer.  
**Technical answer:** Add pooling or convolutional downsampling before the fully connected head; currently `16*64*64 -> 128` creates 8,388,608 weights.  
**Evidence:** measured architecture.

# 19. Difficult HOD Questions: Short Defensible Answers

| Difficult question | Defensible project-specific answer |
|---|---|
| Why XGBoost instead of Random Forest? | The code uses XGBoost, but no comparison experiment is present; a superiority claim is NOT VERIFIED. |
| Why ConvLSTM instead of CNN+LSTM? | The implemented cell applies convolution to concatenated input/hidden maps, retaining spatial locality inside recurrence. |
| Why 60:40 fusion? | It is a manual constant favoring atmospheric features; selection method is NOT VERIFIED. |
| What if radar is unavailable? | Radar inference exceptions are swallowed and ConvLSTM probability stays 0.0; this is a degraded fusion, not a separately calibrated fallback. |
| What if the weather API fails? | Backend raises HTTP 500 and frontend displays synthetic mock values after a 1.5-second delay. |
| How do you prevent stale data? | The current code does not check radar age or API timestamp freshness. |
| How much RAM does inference require? | Known raw parameter payload is 33,594,884 B and one input is 65,536 B; total process RAM is NOT VERIFIED. |
| How many ConvLSTM parameters? | 8,398,721 measured/calculated from the state dict shapes. |
| What is tensor shape? | `(4,1,64,64)` stored and `(1,4,1,64,64)` at backend inference. |
| How many values are stored? | 16,384 float32 values per tensor/sequence. |
| Why float32? | It is the measured PyTorch dtype produced/stored by `ToTensor()` and the artifacts; no precision comparison is present. |
| How do you know it generalizes? | The repository cannot demonstrate this: metrics are not persisted and ConvLSTM training is absent. |
| What is test performance? | NOT VERIFIED FROM PROJECT FILES. |
| How was imbalance handled? | XGBoost `scale_pos_weight` uses negative/positive counts from the training split. |
| How was leakage avoided? | No scaler leakage is apparent, but random temporal splitting leaves temporal leakage risk. |
| Why is pressure different from Google Weather? | The code explicitly requests Open-Meteo `surface_pressure`; differences can arise from provider/model/time/location, but a provider comparison was not performed. |
| Is weather observed or model-based? | It comes from Open-Meteo `/v1/forecast` current fields; station-observation provenance is NOT VERIFIED. |
| Is confidence calibrated? | No; it is inverse model disagreement. |
| Is storm movement predicted? | No; direction is hardcoded and speed is current wind speed. |
| Is rainfall backend-driven? | No; rainfall is not requested/returned and frontend displays `0 mm`. |
| Are IMD/INSAT/Earth Networks connected? | No executable integration was found; UI labels are claims not supported by source calls. |
| What is the most important production weakness? | The system can present synthetic or degraded outputs without a strong user-visible data-quality contract. |

# 20. Project-Specific Cheat Sheet

| Topic | Exact value | Where verified |
|---|---|---|
| Dataset | `ml_models/labeled_weather_data.csv` | File measurement |
| Dataset size | 26,304 rows, 7 columns | pandas measurement |
| Positive/negative | 68 / 26,236 | pandas measurement |
| Live XGBoost features | temperature, humidity, pressure, latitude, longitude | `main.py`, artifact JSON |
| Target | precipitation >=2.5 AND wind_speed >=15 | labeling/training code |
| Train split | 80% | `multi_region_train.py` |
| Validation split | None | training code |
| Test split | 20% | `multi_region_train.py` |
| Exact remote train/test counts | NOT VERIFIED FROM PROJECT FILES | fetched frame not persisted |
| XGBoost trees | 200 | source + JSON measurement |
| XGBoost depth | 6 | training source |
| XGBoost learning rate | 0.05 | training source |
| XGBoost artifact | 555,185 B | file measurement |
| ConvLSTM input | `(1,4,1,64,64)` batched | tensors + backend |
| ConvLSTM parameters | 8,398,721 | model measurement |
| ConvLSTM optimizer/epochs | NOT VERIFIED FROM PROJECT FILES | no training loop |
| Batch size | 1 at backend inference; training batch size NOT VERIFIED | `unsqueeze(0)` |
| Radar frames per sequence | 4 | pipeline/source |
| Radar source image size | 256x256 stored PNGs | Pillow measurement |
| Radar tensor dtype | float32 | tensor measurement |
| One sequence raw memory | 65,536 B | calculated |
| ConvLSTM parameter memory | 33,594,884 B float32 | calculated |
| ConvLSTM weight file | 33,598,145 B | file measurement |
| Radar tensor files | 67,211 B, 67,409 B, 67,381 B | file measurement |
| Radar PNG count | 39 Ghaziabad, 40 Patna | directory measurement |
| Scheduler | every 15 minutes, default disabled | `main.py` |
| Fusion weights | XGBoost 0.6, ConvLSTM 0.4 | `main.py` |
| Lightning formula | rounded risk percentage * 0.85 | `main.py` |
| Confidence | `100 - abs(xgb-convlstm)*100`, rounded 1 decimal | `main.py` |
| Test accuracy | NOT VERIFIED FROM PROJECT FILES | report not saved |
| Test F1 | NOT VERIFIED FROM PROJECT FILES | report not saved |
| Database | `backend/nowcast_history.db`, 32,768 B, 290 current rows | SQLite measurement |

# Final Viva Position

The strongest accurate presentation is: **NowcastAI is an end-to-end prototype with a verified XGBoost training script and a verified ConvLSTM inference architecture, connected through a live FastAPI fusion service.** Its main technical caveats are that the event label is a weather-threshold proxy, the XGBoost split is random and has no validation partition, the ConvLSTM training provenance and metrics are absent, the confidence score is not calibrated, radar freshness is not enforced, direction/rainfall/lightning are partly hardcoded or derived, and frontend offline mode can show synthetic values.
