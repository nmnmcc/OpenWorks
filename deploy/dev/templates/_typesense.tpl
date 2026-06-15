[[ define "typesense" -]]
  group "typesense" {
    service {
      name     = "typesense"
      port     = "http"
      provider = "nomad"
    }

    network {
      port "http" {
        to           = 8108
        host_network = "loopback"
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
[[- end ]]
