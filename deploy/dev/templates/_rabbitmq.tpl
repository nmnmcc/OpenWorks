[[ define "rabbitmq" -]]
  group "rabbitmq" {
    service {
      name     = "rabbitmq"
      port     = "amqp"
      provider = "nomad"
    }

    network {
      port "amqp" {
        to           = 5672
        host_network = "loopback"
      }
      port "management" {
        to           = 15672
        host_network = "loopback"
      }
    }

    task "rabbitmq" {
      driver = "docker"

      config {
        image           = "rabbitmq:4-management"
        network_mode    = "[[ var "network" . ]]"
        network_aliases = ["rabbitmq"]
        ports           = ["amqp", "management"]

        mount {
          type   = "volume"
          source = "openworks-rabbitmq"
          target = "/var/lib/rabbitmq"
        }
      }

      env {
        RABBITMQ_DEFAULT_USER = "[[ var "rabbitmq_user" . ]]"
        RABBITMQ_DEFAULT_PASS = "[[ var "rabbitmq_password" . ]]"
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }
[[- end ]]
