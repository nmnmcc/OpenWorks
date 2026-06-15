variable "network" {
  default = "openworks"
}

variable "postgres_host" {
  default = "postgres"
}

variable "postgres_port" {
  default = "5432"
}

variable "postgres_database" {
  default = "openworks"
}

variable "postgres_user" {
  default = "openworks"
}

variable "postgres_password" {
  default = "openworks"
}

variable "sequin_pg_database" {
  default = "sequin"
}

variable "redis_url" {
  default = "redis://redis:6379"
}

variable "secret_key_base" {
  default = "kdha6AKsFH8PQqkLBlu0MSbROP8t1r6Dku397ZRGTa9Lz6+8wmuVJ2yBtSKhDUg0"
}

variable "vault_key" {
  default = "Lbmg5cVexgkcTfoCI1yOXN1r62e2U2Ir5fxjnQKiXX0="
}

variable "sequin_admin_email" {
  default = "dev@openworks.local"
}

variable "sequin_admin_password" {
  default = "openworks-dev-password"
}

variable "rabbitmq_host" {
  default = "rabbitmq"
}

variable "rabbitmq_port" {
  default = "5672"
}

variable "rabbitmq_user" {
  default = "guest"
}

variable "rabbitmq_password" {
  default = "guest"
}

job "sequin" {
  type = "service"

  group "sequin" {
    restart {
      attempts = 10
      interval = "5m"
      delay    = "10s"
    }

    network {
      port "http" {
        static = 17376
        to     = 7376
      }
    }

    task "sequin" {
      driver = "docker"

      config {
        image           = "sequin/sequin:v0.14.6"
        network_mode    = var.network
        network_aliases = ["sequin"]
        ports           = ["http"]
        volumes         = ["local/sequin.yaml:/config/sequin.yaml:ro"]
      }

      env {
        CONFIG_FILE_PATH = "/config/sequin.yaml"
        PG_HOSTNAME      = var.postgres_host
        PG_PORT          = var.postgres_port
        PG_DATABASE      = var.sequin_pg_database
        PG_USERNAME      = var.postgres_user
        PG_PASSWORD      = var.postgres_password
        REDIS_URL        = var.redis_url
        SECRET_KEY_BASE  = var.secret_key_base
        VAULT_KEY        = var.vault_key
        SERVER_PORT      = "7376"
      }

      template {
        data = <<-EOF
        account:
          name: openworks

        users:
          - account: openworks
            email: ${var.sequin_admin_email}
            password: ${var.sequin_admin_password}

        databases:
          - name: openworks
            hostname: ${var.postgres_host}
            port: ${var.postgres_port}
            database: ${var.postgres_database}
            username: ${var.postgres_user}
            password: ${var.postgres_password}
            slot:
              name: openworks_sequin
              create_if_not_exists: true
            publication:
              name: openworks_sequin
              create_if_not_exists: true
              init_sql: "create publication openworks_sequin for tables in schema public"

        sinks:
          - name: search-sync
            database: openworks
            destination:
              type: rabbitmq
              host: ${var.rabbitmq_host}
              port: ${var.rabbitmq_port}
              exchange: openworks.cdc
              username: ${var.rabbitmq_user}
              password: ${var.rabbitmq_password}
              virtual_host: /
              tls: false
        EOF

        destination = "local/sequin.yaml"
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }
}
