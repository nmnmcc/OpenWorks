[[ define "postgres" -]]
  group "postgres" {
    service {
      name     = "postgres"
      port     = "db"
      provider = "nomad"
    }

    network {
      port "db" {
        to           = 5432
        host_network = "loopback"
      }
    }

    task "postgres" {
      driver = "docker"

      config {
        image           = "postgres:17"
        network_mode    = "[[ var "network" . ]]"
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
        POSTGRES_DB       = "[[ var "postgres_db" . ]]"
        POSTGRES_USER     = "[[ var "postgres_user" . ]]"
        POSTGRES_PASSWORD = "[[ var "postgres_password" . ]]"
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
            CREATE DATABASE [[ var "sequin_db" . ]];
            GRANT ALL PRIVILEGES ON DATABASE [[ var "sequin_db" . ]] TO $POSTGRES_USER;
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
[[- end ]]
