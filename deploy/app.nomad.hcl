variable "project_root" {}

job "app" {
  type = "service"

  group "app" {
    network {
      port "backend" {}
      port "frontend" {}
    }

    task "backend" {
      driver = "raw_exec"

      config {
        command = "/bin/sh"
        args    = ["-c", "cd ${var.project_root}/packages/backend && exec yarn run -T tsx watch src/index.ts"]
      }

      env {
        PORT            = "${NOMAD_PORT_backend}"
        BETTER_AUTH_URL = "http://localhost:${NOMAD_PORT_backend}"
        CORS_ORIGINS    = "http://localhost:${NOMAD_PORT_frontend}"
      }
    }

    task "frontend" {
      driver = "raw_exec"

      config {
        command = "/bin/sh"
        args    = ["-c", "cd ${var.project_root}/packages/frontend && exec yarn next dev --turbopack"]
      }

      env {
        PORT        = "${NOMAD_PORT_frontend}"
        BACKEND_URL = "http://localhost:${NOMAD_PORT_backend}"
      }
    }
  }
}
