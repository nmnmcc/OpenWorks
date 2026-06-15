variable "network" {
  default = "openworks"
}

job "infra" {
  type = "service"

  group "postgres" {
    network {
      port "db" {
        static = 15432
        to     = 5432
      }
    }

    task "postgres" {
      driver = "docker"

      config {
        image           = "postgres:17"
        network_mode    = var.network
        network_aliases = ["postgres"]
        ports           = ["db"]
        args            = ["-c", "config_file=/etc/postgresql/custom.conf"]

        volumes = [
          "local/custom.conf:/etc/postgresql/custom.conf:ro",
          "local/init-sequin.sh:/docker-entrypoint-initdb.d/init-sequin.sh:ro",
        ]

        mount {
          type   = "volume"
          source = "openworks-postgres"
          target = "/var/lib/postgresql/data"
        }
      }

      env {
        POSTGRES_DB       = "openworks"
        POSTGRES_USER     = "openworks"
        POSTGRES_PASSWORD = "openworks"
      }

      template {
        data = <<-EOF
        listen_addresses = '*'
        wal_level = logical
        EOF

        destination = "local/custom.conf"
      }

      template {
        data = <<-EOF
        #!/bin/bash
        set -e
        psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
            CREATE DATABASE sequin;
            GRANT ALL PRIVILEGES ON DATABASE sequin TO openworks;
        EOSQL
        EOF

        destination = "local/init-sequin.sh"
        perms       = "0755"
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }

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
        RABBITMQ_DEFAULT_USER = "guest"
        RABBITMQ_DEFAULT_PASS = "guest"
      }

      resources {
        cpu    = 200
        memory = 512
      }
    }
  }

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
        args            = ["--data-dir", "/data", "--api-port", "8108", "--api-key", "openworks-dev-key"]

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
        RUSTFS_ROOT_USER     = "openworks"
        RUSTFS_ROOT_PASSWORD = "openworks-dev-key"
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
          "until mc alias set local http://rustfs:9000 openworks openworks-dev-key 2>/dev/null; do sleep 2; done && mc mb --ignore-existing local/openworks && mc anonymous set download local/openworks",
        ]
      }

      resources {
        cpu    = 50
        memory = 64
      }
    }
  }

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
        PG_HOSTNAME      = "postgres"
        PG_PORT          = "5432"
        PG_DATABASE      = "sequin"
        PG_USERNAME      = "openworks"
        PG_PASSWORD      = "openworks"
        REDIS_URL        = "redis://redis:6379"
        SECRET_KEY_BASE  = "kdha6AKsFH8PQqkLBlu0MSbROP8t1r6Dku397ZRGTa9Lz6+8wmuVJ2yBtSKhDUg0"
        VAULT_KEY        = "Lbmg5cVexgkcTfoCI1yOXN1r62e2U2Ir5fxjnQKiXX0="
        SERVER_PORT      = "7376"
      }

      template {
        data = <<-EOF
        account:
          name: openworks

        users:
          - account: openworks
            email: dev@openworks.local
            password: openworks-dev-password

        databases:
          - name: openworks
            hostname: postgres
            port: 5432
            database: openworks
            username: openworks
            password: openworks
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
              host: rabbitmq
              port: 5672
              exchange: openworks.cdc
              username: guest
              password: guest
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
