[[ define "app" -]]
  group "app" {
    network {
      port "backend" {
        static = [[ var "backend_port" . ]]
        to     = 30000
      }
      port "frontend" {
        static = [[ var "frontend_port" . ]]
        to     = 3000
      }
    }

    service {
      name     = "backend"
      port     = "backend"
      provider = "nomad"

      check {
        type     = "tcp"
        port     = "backend"
        interval = "10s"
        timeout  = "2s"
      }
    }

    service {
      name     = "frontend"
      port     = "frontend"
      provider = "nomad"

      check {
        type     = "tcp"
        port     = "frontend"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "migrate" {
      lifecycle {
        hook    = "prestart"
        sidecar = false
      }

      driver = "docker"

      config {
        image        = "[[ var "image_migrate" . ]]"
        network_mode = "[[ var "network" . ]]"
        entrypoint   = ["/bin/sh", "-c"]
        args         = ["until cd /app/packages/backend && yarn drizzle-kit migrate 2>&1; do echo 'Waiting for database...'; sleep 2; done"]
      }

      env {
        DATABASE_URL = "postgresql://[[ var "postgres_user" . ]]:[[ var "postgres_password" . ]]@postgres:5432/[[ var "postgres_db" . ]]"
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }

    task "backend" {
      driver = "docker"

      config {
        image           = "[[ var "image_backend" . ]]"
        network_mode    = "[[ var "network" . ]]"
        network_aliases = ["backend"]
        ports           = ["backend"]
      }

      env {
        PORT                 = "30000"
        NODE_ENV             = "production"
        BETTER_AUTH_URL      = "[[ var "backend_url" . ]]"
        CORS_ORIGINS         = "[[ var "frontend_url" . ]]"
        DATABASE_URL         = "postgresql://[[ var "postgres_user" . ]]:[[ var "postgres_password" . ]]@postgres:5432/[[ var "postgres_db" . ]]"
        RABBITMQ_URL         = "amqp://[[ var "rabbitmq_user" . ]]:[[ var "rabbitmq_password" . ]]@rabbitmq:5672"
        TYPESENSE_HOST       = "typesense"
        TYPESENSE_PORT       = "8108"
        TYPESENSE_API_KEY    = "[[ var "typesense_api_key" . ]]"
        S3_ENDPOINT          = "[[ var "s3_endpoint" . ]]"
        S3_ACCESS_KEY_ID     = "[[ var "s3_access_key_id" . ]]"
        S3_SECRET_ACCESS_KEY = "[[ var "s3_secret_access_key" . ]]"
        S3_BUCKET            = "[[ var "s3_bucket" . ]]"
        S3_REGION            = "[[ var "s3_region" . ]]"
        MEDIA_PUBLIC_BASE_URL = "[[ var "media_public_base_url" . ]]"
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }

    task "frontend" {
      driver = "docker"

      config {
        image           = "[[ var "image_frontend" . ]]"
        network_mode    = "[[ var "network" . ]]"
        network_aliases = ["frontend"]
        ports           = ["frontend"]
      }

      env {
        PORT        = "3000"
        HOSTNAME    = "0.0.0.0"
        NODE_ENV    = "production"
        BACKEND_URL = "http://backend:30000"
      }

      resources {
        cpu    = 300
        memory = 512
      }
    }
  }
[[- end ]]
