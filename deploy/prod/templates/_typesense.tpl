[[ define "typesense" -]]
  group "typesense" {
    service {
      name     = "typesense"
      port     = "http"
      provider = "nomad"

      check {
        type     = "http"
        port     = "http"
        path     = "/health"
        interval = "10s"
        timeout  = "2s"
      }
    }

    network {
      port "http" {
        to = 8108
      }
    }

    task "typesense" {
      driver = "docker"

      config {
        image           = "typesense/typesense:27.1"
        network_mode    = "[[ var "network" . ]]"
        network_aliases = ["typesense"]
        ports           = ["http"]
        args            = ["--data-dir", "/data", "--api-port", "8108", "--api-key", "[[ var "typesense_api_key" . ]]"]

        mount {
          type   = "volume"
          source = "openworks-prod-typesense"
          target = "/data"
        }
      }

      resources {
        cpu    = 500
        memory = 1024
      }
    }
  }
[[- end ]]
