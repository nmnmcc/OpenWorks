[[ define "rabbitmq" -]]
  group "rabbitmq" {
    service {
      name     = "rabbitmq"
      port     = "amqp"
      provider = "nomad"

      check {
        type     = "tcp"
        port     = "amqp"
        interval = "10s"
        timeout  = "2s"
      }
    }

    network {
      port "amqp" {
        to = 5672
      }
    }

    task "rabbitmq" {
      driver = "docker"

      config {
        image           = "rabbitmq:4"
        network_mode    = "[[ var "network" . ]]"
        network_aliases = ["rabbitmq"]
        ports           = ["amqp"]

        mount {
          type   = "volume"
          source = "openworks-prod-rabbitmq"
          target = "/var/lib/rabbitmq"
        }
      }

      env {
        RABBITMQ_DEFAULT_USER = "[[ var "rabbitmq_user" . ]]"
        RABBITMQ_DEFAULT_PASS = "[[ var "rabbitmq_password" . ]]"
      }

      resources {
        cpu    = 300
        memory = 512
      }
    }
  }
[[- end ]]
