# Oder Foot Media API

This project provides a lightweight media upload service built with Express, Multer, and AWS S3-compatible object storage.

## Features
- upload single file
- upload multiple files
- list media objects from a bucket
- get media metadata by object key
- delete media object
- bucket and folder configuration for multi-tenant or multi-app use

## Environment config
Copy `.env.example` to `.env` and update values if needed.

```bash
cp .env.example .env
```

Example values:
```env
APP_ENV=Dev
APP_PORT=5002
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
AWS_ENDPOINT=http://localhost:9000
AWS_S3_FORCE_PATH_STYLE=true
```

`src/configs/minio.config.js` provides the AWS SDK S3 client configuration. It supports AWS credentials, MinIO credentials (`MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` or `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`), and an S3-compatible endpoint.

## MinIO with Docker
```bash
docker compose -f docker-compose.-minio.yaml up -d
```

## API endpoints
### Upload single file
```bash
curl -F "file=@/path/to/image.png" "http://localhost:5002/api/v1/media/upload?bucket=images&folder=avatars"
```

### Upload multiple files
```bash
curl -F "files=@/path/to/a.png" -F "files=@/path/to/b.png" "http://localhost:5002/api/v1/media/uploads?bucket=images&folder=avatars"
```

### List media
```bash
curl "http://localhost:5002/api/v1/media?bucket=images&prefix=avatars/"
```

### Get media by object name
```bash
curl "http://localhost:5002/api/v1/media/avatars%2F1700000000000-image.png?bucket=images"
```

### Delete media
```bash
curl -X DELETE "http://localhost:5002/api/v1/media/avatars%2F1700000000000-image.png?bucket=images"
```

This uses AWS SDK S3 operations, compatible with MinIO and AWS S3.

Uploaded files are staged locally before they are transferred to MinIO. Set the `folder` query parameter to group files under `uploads/<folder>` locally and in MinIO; for example, `folder=qr` writes to `uploads/qr`, while `folder=a` and `folder=b` write to separate directories. The default is `uploads/`. Temporary local files are removed after the transfer.
