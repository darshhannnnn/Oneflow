#!/bin/bash

# Deploy Grafana to Cloud Run

# Build and push Grafana image
docker build -f monitoring/Dockerfile.grafana -t us-central1-docker.pkg.dev/xenon-notch-477511-g5/oneflow/grafana:latest monitoring/
docker push us-central1-docker.pkg.dev/xenon-notch-477511-g5/oneflow/grafana:latest

# Deploy to Cloud Run
gcloud run deploy oneflow-grafana \
  --image=us-central1-docker.pkg.dev/xenon-notch-477511-g5/oneflow/grafana:latest \
  --platform=managed \
  --region=us-central1 \
  --allow-unauthenticated \
  --port=3000 \
  --memory=512Mi \
  --cpu=1 \
  --project=xenon-notch-477511-g5

echo "Grafana deployed! Get URL:"
gcloud run services describe oneflow-grafana --region=us-central1 --project=xenon-notch-477511-g5 --format='value(status.url)'
