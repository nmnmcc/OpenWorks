variable "network" {
  default = "openworks"
}

variable "rabbitmq_user" {
  default = "guest"
}

variable "rabbitmq_password" {
  default = "guest"
}

job "rabbitmq" {
  type = "service"

  group "rabbitmq" {
    network {
      port "amqp" {
        static = 15672
        to     = 5672
      }
      port "management" {
        static = 25672
        to     = 15672
      }
    }

    task "rabbitmq" {
      driver = "docker"

      config {
        image           = "rabbitmq:4-management"
        network_mode    = var.network
        network_aliases = ["rabbitmq"]
        ports           = ["amqp", "management"]

        mount {
          type   = "volume"
          source = "openworks-rabbitmq"
          target = "/var/lib/rabbitmq"
        }
      }

      env {
        RABBITMQ_DEFAULT_USER = var.rabbitmq_user
        RABBITMQ_DEFAULT_PASS = var.rabbitmq_password
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }
}
