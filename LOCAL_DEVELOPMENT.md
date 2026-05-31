# Running AVA Locally

This guide walks you through starting the AVA Control Plane (backend + frontend) on your local machine.

## Prerequisites

- Python 3.11+
- Node.js 22+
- AWS CLI configured with valid credentials (`aws configure`)
- AWS account with Bedrock model access enabled

## 1. Clone and Configure Environment

```bash
git clone https://github.com/aws-samples/ava
cd ava

# Create your environment file from the example
cp .env.example .env
```

Edit `.env` with your values:

```dotenv
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=arn:aws:bedrock:us-east-1:<ACCOUNT_ID>:inference-profile/global.anthropic.claude-opus-4-5-20251101-v1:0
APP_ENV=dev
LOG_LEVEL=INFO
AGENT_NAME=kyc
DEPLOYMENT_MODE=fastapi
```

## 2. Start the Backend (FastAPI)

```bash
cd platform/control_plane/backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy the root .env into the backend directory (the backend reads .env from its own folder)
cp ../../../.env .env

# Start the dev server
export PYTHONPATH=src
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

Or use the provided script:

```bash
cd platform/control_plane/backend
cp ../../../.env .env
./run_dev.sh
```

The API will be available at:
- http://localhost:8000 — root
- http://localhost:8000/docs — Swagger UI
- http://localhost:8000/redoc — ReDoc

### Alternative: Docker Compose

```bash
cd platform/control_plane/backend
docker compose up --build
```

This exposes the backend on port 8000 and mounts your `~/.aws` credentials read-only.

## 3. Start the Frontend (React + Vite)

Open a new terminal:

```bash
cd platform/control_plane/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend will be available at http://localhost:5173.

> The `predev` script automatically copies the FSI Foundry offerings registry into the public folder so the catalog page works locally.

## 4. Connecting Frontend to Backend

The backend CORS configuration already allows requests from `http://localhost:5173` (Vite's default port). No proxy configuration is needed — the frontend API client points to `http://localhost:8000` by default in development.

If your frontend uses a different port, add it to the `CORS_ORIGINS` list in `platform/control_plane/backend/src/core/config.py` or set it via environment variable.

## 5. Authentication (Dev Mode)

By default, the backend runs with `USE_DEV_AUTH=True`, which bypasses Cognito authentication. This lets you develop locally without setting up a Cognito user pool.

For production-like auth locally, set these in your backend `.env`:

```dotenv
USE_DEV_AUTH=False
COGNITO_USER_POOL_ID=your-pool-id
COGNITO_CLIENT_ID=your-client-id
COGNITO_REGION=us-east-1
```

## 6. Running a Single FSI Foundry Use Case (Standalone)

If you only want to run a specific agent use case without the full Control Plane:

```bash
cd applications/fsi_foundry
./scripts/main/deploy.sh
```

This launches an interactive wizard to select and deploy a use case directly.

## Quick Reference

| Component | URL | Command |
|-----------|-----|---------|
| Backend API | http://localhost:8000 | `cd platform/control_plane/backend && ./run_dev.sh` |
| API Docs | http://localhost:8000/docs | — |
| Frontend UI | http://localhost:5173 | `cd platform/control_plane/frontend && npm run dev` |

## Troubleshooting

**Backend won't start — missing `.env`**
The `run_dev.sh` script expects a `.env` file in the backend directory. Copy from root: `cp .env.example platform/control_plane/backend/.env` and fill in your values.

**Frontend shows empty catalog**
Make sure the `predev` script ran. It copies `applications/fsi_foundry/data/registry/offerings.json` into `public/`. If it failed, run manually:
```bash
cp applications/fsi_foundry/data/registry/offerings.json platform/control_plane/frontend/public/offerings.json
```

**CORS errors in browser console**
Verify the frontend is running on port 5173. If using a different port, update `CORS_ORIGINS` in the backend config.

**AWS credential errors**
Ensure your AWS CLI is configured (`aws sts get-caller-identity` should succeed) and that Bedrock model access is enabled in your account/region.

**"Error: No Response" in agent UIs**
Your AWS account may not have access to the selected model. Check the Bedrock Model Catalog in the AWS Console and update `BEDROCK_MODEL_ID` in your `.env` accordingly.
