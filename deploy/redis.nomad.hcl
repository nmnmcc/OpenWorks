variable "network" {
  default = "openworks"
}

job "redis" {
  type = "service"

  group "redis" {
    network {
      port "redis" {
        static = 16379
        to     = 6379
      }
    }

    task "redis" {
      driver = "docker"

      config {
        image           = "redis:7"
        network_mode    = var.network
        network_aliases = ["redis"]
        ports           = ["redis"]
      }

      resources {
        cpu    = 100
        memory = 128
      }
    }
  }
}
