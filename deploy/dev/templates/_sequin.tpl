[[ define "sequin" -]]
  group "sequin" {
    service {
      name     = "sequin"
      port     = "http"
      provider = "nomad"
    }

    restart {
      attempts = 10
      interval = "5m"
      delay    = "10s"
    }

    network {
      port "http" {
        to           = 7376
        host_network = "loopback"
      }
    }

    task "sequin" {
      driver = "docker"

      config {
        image           = "sequin/sequin:v0.14.6"
        network_mode    = "[[ var "network" . ]]"
        network_aliases = ["sequin"]
        ports           = ["http"]
        volumes         = ["local/sequin.yaml:/config/sequin.yaml:ro"]
      }

      env {
        CONFIG_FILE_PATH = "/config/sequin.yaml"
        PG_HOSTNAME      = "postgres"
        PG_PORT          = "5432"
        PG_DATABASE      = "[[ var "sequin_db" . ]]"
        PG_USERNAME      = "[[ var "postgres_user" . ]]"
        PG_PASSWORD      = "[[ var "postgres_password" . ]]"
        REDIS_URL        = "redis://redis:6379"
        SECRET_KEY_BASE  = "[[ var "secret_key_base" . ]]"
        VAULT_KEY        = "[[ var "vault_key" . ]]"
        SERVER_PORT      = "7376"
      }

      template {
        data = <<-EOF
        account:
          name: openworks

        users:
          - account: openworks
            email: [[ var "sequin_admin_email" . ]]
            password: [[ var "sequin_admin_password" . ]]

        databases:
          - name: openworks
            hostname: postgres
            port: 5432
            database: [[ var "postgres_db" . ]]
            username: [[ var "postgres_user" . ]]
            password: [[ var "postgres_password" . ]]
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
              username: [[ var "rabbitmq_user" . ]]
              password: [[ var "rabbitmq_password" . ]]
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
[[- end ]]
