# OneFlow Monitoring Stack

Optional Grafana monitoring setup for OneFlow application.

## Overview

This directory contains configuration for deploying Grafana to Cloud Run for monitoring OneFlow metrics.

## Components

- **Dockerfile.grafana** - Custom Grafana image with GCP monitoring plugin
- **deploy-grafana.sh** - Deployment script for Cloud Run
- **provisioning/** - Auto-configuration for Grafana
  - **datasources/gcp.yml** - Google Cloud Monitoring data source
  - **dashboards/dashboard.yml** - Dashboard provisioning config

## Deployment

### Prerequisites

- gcloud CLI authenticated
- Docker installed
- Artifact Registry repository created

### Deploy Grafana

```bash
cd monitoring
./deploy-grafana.sh
```

This will:
1. Build Grafana Docker image with GCP plugin
2. Push to Artifact Registry
3. Deploy to Cloud Run as `oneflow-grafana` service

### Access Grafana

After deployment, get the URL:

```bash
gcloud run services describe oneflow-grafana \
  --region=us-central1 \
  --project=xenon-notch-477511-g5 \
  --format='value(status.url)'
```

Default credentials:
- Username: `admin`
- Password: `admin` (change on first login)

## Alternative: Use Google Cloud Monitoring

For simpler setup, use built-in Google Cloud Monitoring:

```
https://console.cloud.google.com/run/detail/us-central1/oneflow/metrics?project=xenon-notch-477511-g5
```

## Cost

- Grafana on Cloud Run: ~$5-10/month (if always running)
- Google Cloud Monitoring: Free for Cloud Run metrics

## Notes

- This is **optional** - main app works without it
- Grafana provides more customization than GCP console
- Useful for production monitoring and alerting
