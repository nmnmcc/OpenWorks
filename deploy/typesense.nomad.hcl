variable "network" {
  default = "openworks"
}

variable "typesense_api_key" {
  default = "openworks-dev-key"
}

job "typesense" {
  type = "service"

  group "typesense" {
    network {
      port "http" {
        static = 18108
        to     = 8108
      }
    }

    task "typesense" {
      driver = "docker"

      config {
        image           = "typesense/typesense:27.1"
        network_mode    = var.network
        network_aliases = ["typesense"]
        ports           = ["http"]
        args            = ["--data-dir", "/data", "--api-port", "8108", "--api-key", var.typesense_api_key]

        mount {
          type   = "volume"
          source = "openworks-typesense"
          target = "/data"
        }
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }
}
