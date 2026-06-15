variable "network" {
  default = "openworks"
}

variable "rustfs_root_user" {
  default = "openworks"
}

variable "rustfs_root_password" {
  default = "openworks-dev-key"
}

variable "rustfs_bucket" {
  default = "openworks"
}

job "rustfs" {
  type = "service"

  group "rustfs" {
    network {
      port "s3" {
        static = 19000
        to     = 9000
      }
      port "console" {
        static = 19001
        to     = 9001
      }
    }

    task "rustfs" {
      driver = "docker"

      config {
        image           = "rustfs/rustfs"
        network_mode    = var.network
        network_aliases = ["rustfs"]
        ports           = ["s3", "console"]
        args            = ["server", "/data", "--console-address", ":9001"]

        mount {
          type   = "volume"
          source = "openworks-rustfs"
          target = "/data"
        }
      }

      env {
        RUSTFS_ROOT_USER     = var.rustfs_root_user
        RUSTFS_ROOT_PASSWORD = var.rustfs_root_password
      }

      resources {
        cpu    = 100
        memory = 256
      }
    }

    task "setup" {
      lifecycle {
        hook    = "poststart"
        sidecar = false
      }

      driver = "docker"

      config {
        image        = "minio/mc"
        network_mode = var.network
        entrypoint   = ["/bin/sh", "-c"]
        args = [
          "until mc alias set local http://rustfs:9000 ${var.rustfs_root_user} ${var.rustfs_root_password} 2>/dev/null; do sleep 2; done && mc mb --ignore-existing local/${var.rustfs_bucket} && mc anonymous set download local/${var.rustfs_bucket}",
        ]
      }

      resources {
        cpu    = 50
        memory = 64
      }
    }
  }
}
