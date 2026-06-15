[[ define "app" -]]
  group "app" {
    network {
      port "backend" {
        host_network = "loopback"
      }
      port "frontend" {
        host_network = "loopback"
      }
    }

    task "migrate" {
      lifecycle {
        hook    = "prestart"
        sidecar = false
      }

      driver = "raw_exec"

      config {
        command = "/bin/sh"
        args    = ["-c", "cd [[ var "project_root" . ]] && exec devenv shell -- sh -c 'cd packages/backend && until yarn drizzle-kit migrate 2>&1; do echo \"Waiting for database...\"; sleep 2; done'"]
      }

      template {
        data = <<-EOF
        {{- range nomadService "postgres" }}
        DATABASE_URL=postgresql://[[ var "postgres_user" . ]]:[[ var "postgres_password" . ]]@{{ .Address }}:{{ .Port }}/[[ var "postgres_db" . ]]
        {{- end }}
        EOF

        destination = "local/migrate.env"
        env         = true
      }
    }

    task "backend" {
      driver = "raw_exec"

      config {
        command = "/bin/sh"
        args    = ["-c", "cd [[ var "project_root" . ]] && exec devenv shell -- sh -c 'cd packages/backend && exec yarn run -T tsx watch src/index.ts'"]
      }

      env {
        PORT            = "${NOMAD_PORT_backend}"
        BETTER_AUTH_URL = "http://localhost:${NOMAD_PORT_backend}"
        CORS_ORIGINS    = "http://localhost:${NOMAD_PORT_frontend}"
        TYPESENSE_API_KEY    = "[[ var "typesense_api_key" . ]]"
        S3_ACCESS_KEY_ID     = "[[ var "rustfs_root_user" . ]]"
        S3_SECRET_ACCESS_KEY = "[[ var "rustfs_root_password" . ]]"
        S3_BUCKET            = "[[ var "rustfs_bucket" . ]]"
        S3_REGION            = "us-east-1"
      }

      template {
        data = <<-EOF
        {{- range nomadService "postgres" }}
        DATABASE_URL=postgresql://[[ var "postgres_user" . ]]:[[ var "postgres_password" . ]]@{{ .Address }}:{{ .Port }}/[[ var "postgres_db" . ]]
        {{- end }}
        {{- range nomadService "rabbitmq" }}
        RABBITMQ_URL=amqp://[[ var "rabbitmq_user" . ]]:[[ var "rabbitmq_password" . ]]@{{ .Address }}:{{ .Port }}
        {{- end }}
        {{- range nomadService "typesense" }}
        TYPESENSE_HOST={{ .Address }}
        TYPESENSE_PORT={{ .Port }}
        {{- end }}
        {{- range nomadService "rustfs" }}
        S3_ENDPOINT=http://{{ .Address }}:{{ .Port }}
        MEDIA_PUBLIC_BASE_URL=http://{{ .Address }}:{{ .Port }}/[[ var "rustfs_bucket" . ]]
        {{- end }}
        EOF

        destination = "local/backend.env"
        env         = true
      }
    }

    task "frontend" {
      driver = "raw_exec"

      config {
        command = "/bin/sh"
        args    = ["-c", "cd [[ var "project_root" . ]] && exec devenv shell -- sh -c 'cd packages/frontend && exec yarn next dev --turbopack'"]
      }

      env {
        PORT        = "${NOMAD_PORT_frontend}"
        BACKEND_URL = "http://localhost:${NOMAD_PORT_backend}"
      }
    }
  }
[[- end ]]
