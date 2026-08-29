# Nowcast AI

## Problem Statement

India faces recurring risks from fast-developing thunderstorm and lightning events that can disrupt infrastructure, agriculture, transportation, and public safety. Traditional weather monitoring often reacts too late, leaving communities with little time to prepare. This project addresses the challenge of early, localized thunderstorm and lightning nowcasting by combining live weather observations, radar-based temporal patterns, and AI-driven risk prediction to provide timely, actionable insights for critical locations.

## Overview

Nowcast AI is an intelligent thunderstorm and lightning nowcasting platform designed to monitor dangerous weather conditions and estimate risk levels in near real time. The system is useful for disaster management teams, urban planners, public safety authorities, researchers, and any stakeholders who need fast awareness of severe weather risk in a specific area.

The platform helps answer a critical question: “How likely is a thunderstorm or lightning event to occur in the next 30–60 minutes at this location?” By fusing environmental telemetry with deep learning and machine learning signals, the system produces risk estimates that can support early warnings and informed decision-making.

This system is built around an AI-powered nowcasting workflow where:

- weather data is collected from live API sources,
- radar information is processed for spatial-temporal patterns,
- ML models evaluate atmospheric conditions,
- multiple prediction signals are fused to estimate thunderstorm and lightning risk,
- the result is shown on a live dashboard for easy monitoring and decision support.

## Key Features

The product provides a modern, operational dashboard with the following user-facing capabilities:

- Real-time weather telemetry for selected regions
- Thunderstorm probability estimation for the next forecast window
- Lightning risk prediction and alert-level monitoring
- Live radar and map-based risk visualization
- Interactive location switching between major monitored regions
- AI model status panel showing active forecasting components
- Risk zone overlays and intensity-based geographic markers
- Forecast history for recent thunderstorm and lightning predictions
- Dark-mode and light-mode dashboard theme support
- Settings panel for radar sync controls and system configuration
- Data sources panel to understand the information stream powering predictions
- Mobile-responsive operational interface for quick monitoring

## System Architecture

```text
User
  ↓
Next.js Frontend Dashboard
  ↓
FastAPI Backend
  ↓
Live Weather API + Radar Data Inputs
  ↓
AI / ML Prediction Engine
  ↓
Risk Fusion Layer
  ↓
Prediction History + Live Monitoring
  ↓
Dashboard, Map, Alerts, and Risk Visualization
```

The architecture follows a practical nowcasting pipeline: the frontend sends location-based requests to the backend, the backend obtains real-time atmospheric inputs and radar context, AI models estimate risk, and the final result is sent back to the user interface for display.

## How the System Works

1. The user opens the dashboard and lands on the live weather monitoring view.
2. The dashboard selects a monitored region such as Ghaziabad or Patna and fetches live forecast data.
3. The frontend sends the selected coordinates to the FastAPI backend through REST API requests.
4. The backend loads current weather variables such as temperature, humidity, pressure, and wind information from Open-Meteo.
5. Radar features and preprocessed tensor data are prepared for temporal pattern analysis.
6. The AI engine evaluates conditions using both machine learning and sequence-based deep learning models.
7. The system computes a fused thunderstorm and lightning risk estimate for the selected location.
8. The backend returns prediction details, confidence, map zones, and storm movement metadata to the frontend.
9. The dashboard updates risk levels, trend history, risk overlays, and monitoring panels in real time.

## Technology Stack

| Technology / Library | Role in the Project |
|----------------------|---------------------|
| Next.js | Frontend application framework for the dashboard UI |
| React | Component-driven UI development |
| TypeScript | Static typing and frontend application logic |
| Tailwind CSS-style utility classes | Rapid design and responsive dashboard styling |
| FastAPI | REST API layer for live prediction and telemetry services |
| Python | Backend logic, model execution, and data processing |
| Uvicorn | ASGI server for running the FastAPI backend |
| PyTorch | Deep learning model inference for ConvLSTM-based radar analysis |
| XGBoost | Tree-based model for atmospheric risk classification |
| Pandas | Data handling and feature preparation |
| Requests | API data retrieval from live weather sources |
| APScheduler | Background task scheduling and radar sync automation |
| SQLite | Local storage of prediction history and time-based records |
| Open-Meteo | Current weather forecast data for selected coordinates |
| Radar tensor preprocessing pipeline | Converts radar inputs into model-ready sequences |

## AI/ML Architecture

The project uses a fused prediction approach designed to improve reliability for severe weather forecasting.

- XGBoost analyzes structured atmospheric variables such as temperature, humidity, pressure, latitude, and longitude to estimate the likelihood of thunderstorm conditions.
- ConvLSTM processes radar image sequences over time to detect storm evolution and pattern changes that may indicate rapid thunderstorm formation.
- The backend combines both model outputs using a weighted fusion strategy to create a final risk probability.
- A confidence score is also calculated to reflect the agreement between the two model pathways.

This hybrid approach is especially useful for nowcasting scenarios where both static atmospheric conditions and dynamic motion-driven radar patterns matter.

## Data Sources

The main project logic relies on several data streams:

- Current weather data from Open-Meteo for temperature, humidity, pressure, and wind variables
- Radar-derived tensor sequences for temporal storm pattern recognition
- Location-specific monitoring for Ghaziabad and Patna regions
- Local prediction history stored in SQLite for recent thunderstorm and lightning trends
- Internal model artifacts located under the machine learning model folder for trained inference

These data sources allow the platform to estimate risk with both present conditions and evolving weather structure in view.

## Dashboard Features

The frontend dashboard comprises a modern operational interface with distinct sections for monitoring and control:

- Dashboard: live risk overview with prediction metrics and current weather status
- Radar / Map: full-screen map visualization with risk zones and spatial severity overlays
- Satellite: data-layer view for imagery and environmental context
- Lightning: risk-focused monitoring for lightning probability and severe weather signals
- Alerts: notification-oriented display for alerting and critical weather concerns
- Data Sources: information about the live inputs feeding the system
- Settings: toggles for theme mode and radar synchronization
- Location control: quick switch between monitored regions
- Layer controls: checkboxes for radar, satellite, lightning, weather model, and risk zones

The interface is designed for fast situational awareness and supports both monitoring and operational review.

## Complete Project Structure

```text
sih-nowcasting/
├── backend/
│   ├── main.py                     # FastAPI backend with prediction APIs, model loading, SQLite history, and background radar sync
│   ├── nowcast_history.db         # Local database storing recent thunderstorm and lightning prediction history
│   └── __pycache__/               # Python bytecode cache
├── frontend/
│   ├── .next/                     # Next.js build output
│   ├── node_modules/              # Installed frontend dependencies
│   ├── public/                    # Static frontend assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Main dashboard UI and navigation system
│   │   │   └── globals.css        # Global styling
│   │   └── components/
│   │       ├── AlertsView.tsx     # Alerts and warning UI
│   │       ├── DashboardView.tsx  # Core live prediction dashboard widgets
│   │       ├── DataSourcesView.tsx# Data source panel
│   │       ├── MapComponent.tsx   # Interactive risk map rendering
│   │       └── SettingsView.tsx   # Settings and toggle controls
│   ├── package.json               # Frontend dependencies and scripts
│   ├── package-lock.json          # Lock file for Node dependencies
│   ├── next.config.ts             # Next.js configuration
│   ├── tsconfig.json              # TypeScript configuration
│   ├── eslint.config.mjs          # Frontend linting configuration
│   ├── next-env.d.ts              # Next.js TypeScript declarations
│   └── README.md                  # Frontend documentation
├── ml_models/
│   ├── convlstm_model.py         # ConvLSTM model definition
│   ├── convlstm_weights.pth       # Trained ConvLSTM model weights
│   ├── xgboost_model.json         # Trained XGBoost model
│   ├── xgboost_multi_model.json   # Multi-location XGBoost model
│   ├── radar_pipeline.py          # Radar image download and processing pipeline
│   ├── radar_tensor_prep.py       # Radar tensor preparation for model input
│   ├── multi_region_train.py      # Training logic for multi-region model handling
│   ├── xgboost_train.py           # XGBoost training workflow
│   ├── labeled_weather_data.csv   # Labelled weather data used in model training
│   ├── radar_sequence_tensor.pt   # Radar tensor dataset for general use
│   ├── radar_sequence_tensor_ghaziabad.pt
│   ├── radar_sequence_tensor_patna.pt
│   ├── radar_data_ghaziabad/      # Region-specific radar data
│   ├── radar_data_patna/          # Region-specific radar data
│   └── data_labeling.py           # Weather data labeling workflow
├── .gitignore                    # Git ignore rules
├── pyrightconfig.json            # Python static typing configuration
├── requirements.txt              # Backend Python dependencies
├── venv/                         # Python environment for project execution
└── README.md                     # Project root documentation
```

## Installation and Setup

### 1. Backend Setup

From the project root:

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Then start the backend server:

```bash
cd backend
uvicorn main:app --reload
```

The backend will run on the local FastAPI server and expose the prediction endpoints.

### 2. Frontend Setup

From the project root:

```bash
cd frontend
npm install
npm run dev
```

This starts the Next.js dashboard locally, which connects to the backend at `http://127.0.0.1:8000`.

## API / Data Flow

The application follows a straightforward API-driven flow:

- The frontend brings up the live dashboard and selects a geography.
- It requests current risk predictions from `/api/realtime-risk`.
- The backend fetches current weather values from Open-Meteo.
- It loads model artifacts and performs risk inference using XGBoost and ConvLSTM.
- The backend returns the result as a JSON payload containing:
  - thunderstorm probability,
  - lightning probability,
  - confidence,
  - risk level,
  - forecast window,
  - storm movement,
  - AI model status,
  - geographic risk zones.
- The frontend updates the dashboard cards, map overlays, and trend history.
- The `/api/history` endpoint provides recent historical risk values for monitoring and trend visualization.
- Settings endpoints allow the user to toggle radar synchronization and fetch configuration state.

## Use Case

This system is valuable in disaster management and early warning scenarios where a few minutes of lead time can reduce risk to people, infrastructure, and services. It can support:

- local thunderstorm early warning,
- urban safety monitoring,
- emergency response planning,
- infrastructure protection during severe weather windows,
- research and forecasting experimentation for Indian weather conditions.

By making risk information visible and actionable through a live dashboard, the system turns technical weather intelligence into operational insight.

## Future Improvements

The current solution provides a strong foundation for more advanced nowcasting. Future improvements may include:

- broader geographical coverage beyond current monitored cities
- additional radar and satellite data sources
- improved training with larger, more diverse weather datasets
- actual lightning event datasets for better supervised learning
- more advanced alerting and push notification mechanisms
- longer historical forecasting records for seasonal pattern analysis
- integration with official weather and disaster management APIs

## Team / Project Information

This project is designed as a professional AI-powered weather intelligence and disaster-risk monitoring solution for demonstration, evaluation, and further development.

Project Focus:

- Thunderstorm nowcasting
- Lightning risk detection
- AI-assisted weather prediction
- Real-time monitoring dashboard
- Early warning and decision support

---

This README captures the functional scope, architecture, and implementation intent of the project based on the observed backend logic and the main dashboard application interface.
