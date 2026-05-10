#!/bin/bash
# LocalStack init script — creates the S3 bucket used by the backend
set -euo pipefail

echo "==> Creating S3 bucket: intervai-recordings"
awslocal s3 mb s3://intervai-recordings --region us-east-1

echo "==> Setting bucket CORS"
awslocal s3api put-bucket-cors \
  --bucket intervai-recordings \
  --cors-configuration '{
    "CORSRules": [{
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET","PUT","POST","DELETE","HEAD"],
      "AllowedOrigins": ["http://localhost:3000"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }]
  }'

echo "==> LocalStack S3 init complete"
