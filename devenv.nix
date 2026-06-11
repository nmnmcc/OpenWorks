{
  pkgs,
  config,
  ...
}:

let
  kafkaPort = 19092;
  meiliPort = 17700;
  garageS3Port = 13900;
  garageRpcPort = 13902;
  garageAdminPort = 13901;
  garageWebPort = 13903;
  browsers =
    (builtins.fromJSON (builtins.readFile "${pkgs.playwright-driver}/browsers.json")).browsers;
  chromium-rev = (builtins.head (builtins.filter (x: x.name == "chromium") browsers)).revision;
in

with pkgs;

{
  packages = [
    git
    fish
    go-task
    garage
    openssl
  ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${playwright-driver.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
    PLAYWRIGHT_MCP_EXECUTABLE_PATH = "${playwright.browsers}/chromium-${chromium-rev}/chrome-linux64/chrome";
    MEILI_URL = "http://127.0.0.1:${toString meiliPort}";
    KAFKA_BROKERS = "127.0.0.1:${toString kafkaPort}";
    S3_ENDPOINT = "http://127.0.0.1:${toString garageS3Port}";
    S3_BUCKET = "openworks";
    MEDIA_PUBLIC_BASE_URL = "http://openworks.web.localhost:${toString garageWebPort}";
  };

  enterShell = ''
    export DATABASE_URL="postgresql:///openworks_dev?host=$PGHOST&port=$PGPORT"
    if [ -f "$DEVENV_STATE/garage/credentials.env" ]; then
      source "$DEVENV_STATE/garage/credentials.env"
    fi
  '';

  services.postgres = {
    enable = true;
    listen_addresses = "127.0.0.1";
    initialDatabases = [
      { name = "openworks_dev"; }
      { name = "sequin"; }
    ];
    settings.wal_level = "logical";
  };

  services.meilisearch = {
    enable = true;
    listenPort = meiliPort;
  };

  # 自定义 listener 名绕过 devenv 对 PLAINTEXT:// 端口的重写，将 broker 固定在指定端口。
  services.kafka = {
    enable = true;
    settings = {
      "listeners" = [
        "BROKER://127.0.0.1:${toString kafkaPort}"
        "CONTROLLER://localhost:${toString (kafkaPort + 1)}"
      ];
      "advertised.listeners" = [ "BROKER://127.0.0.1:${toString kafkaPort}" ];
      "inter.broker.listener.name" = "BROKER";
      "listener.security.protocol.map" = [
        "CONTROLLER:PLAINTEXT"
        "BROKER:PLAINTEXT"
      ];
    };
  };

  processes.kafka.ready = lib.mkForce {
    exec = "${apacheKafka}/bin/kafka-topics.sh --list --bootstrap-server 127.0.0.1:${toString kafkaPort}";
    initial_delay = 5;
    probe_timeout = 5;
  };

  services.redis.enable = true;

  processes.sequin = {
    exec = ''
      set -euo pipefail

      psql -h 127.0.0.1 -p "$PGPORT" -d postgres -tc \
        "SELECT 1 FROM pg_database WHERE datname = 'sequin'" \
        | grep -q 1 || createdb -h 127.0.0.1 -p "$PGPORT" sequin

      CONFIG_DIR="$DEVENV_STATE/sequin"
      mkdir -p "$CONFIG_DIR"
      cat > "$CONFIG_DIR/sequin.yaml" <<EOF
      account:
        name: "openworks"

      users:
        - account: "openworks"
          email: "dev@openworks.local"
          password: "openworks-dev-password"

      databases:
        - name: "openworks"
          hostname: "127.0.0.1"
          port: $PGPORT
          database: "openworks_dev"
          username: "$USER"
          password: "postgres"
          slot:
            name: "openworks_sequin"
            create_if_not_exists: true
          publication:
            name: "openworks_sequin"
            create_if_not_exists: true
            init_sql: "create publication openworks_sequin for table posts"

      sinks:
        - name: "posts-search"
          database: "openworks"
          source:
            include_tables:
              - "public.posts"
          destination:
            type: "kafka"
            hosts: "127.0.0.1:${toString kafkaPort}"
            topic: "openworks.public.posts"
            compression: "none"
      EOF

      docker rm -f openworks-sequin >/dev/null 2>&1 || true

      exec docker run --rm --name openworks-sequin --network host \
        -v "$CONFIG_DIR/sequin.yaml:/config/sequin.yaml:ro" \
        -e CONFIG_FILE_PATH=/config/sequin.yaml \
        -e PG_HOSTNAME=127.0.0.1 \
        -e PG_PORT="$PGPORT" \
        -e PG_DATABASE=sequin \
        -e PG_USERNAME="$USER" \
        -e PG_PASSWORD=postgres \
        -e REDIS_URL="redis://127.0.0.1:${toString config.processes.redis.ports.main.value}" \
        -e SECRET_KEY_BASE="kdha6AKsFH8PQqkLBlu0MSbROP8t1r6Dku397ZRGTa9Lz6+8wmuVJ2yBtSKhDUg0" \
        -e VAULT_KEY="Lbmg5cVexgkcTfoCI1yOXN1r62e2U2Ir5fxjnQKiXX0=" \
        -e SERVER_PORT=7376 \
        sequin/sequin:v0.14.6
    '';

    process-compose.depends_on = {
      postgres.condition = "process_healthy";
      kafka.condition = "process_healthy";
      redis.condition = "process_healthy";
    };
  };

  processes.garage = {
    exec = ''
      set -euo pipefail
      GARAGE_DIR="$DEVENV_STATE/garage"
      mkdir -p "$GARAGE_DIR/data" "$GARAGE_DIR/meta"

      if [ ! -f "$GARAGE_DIR/rpc_secret" ]; then
        openssl rand -hex 32 > "$GARAGE_DIR/rpc_secret"
      fi
      RPC_SECRET=$(cat "$GARAGE_DIR/rpc_secret")

      cat > "$GARAGE_DIR/garage.toml" <<TOML
      metadata_dir = "$GARAGE_DIR/meta"
      data_dir = "$GARAGE_DIR/data"
      db_engine = "lmdb"
      replication_factor = 1

      rpc_bind_addr = "127.0.0.1:${toString garageRpcPort}"
      rpc_secret = "$RPC_SECRET"

      [s3_api]
      s3_region = "garage"
      api_bind_addr = "127.0.0.1:${toString garageS3Port}"

      [s3_web]
      bind_addr = "127.0.0.1:${toString garageWebPort}"
      root_domain = ".web.localhost"
      index = "index.html"

      [admin]
      api_bind_addr = "127.0.0.1:${toString garageAdminPort}"
      TOML

      exec garage -c "$GARAGE_DIR/garage.toml" server
    '';
  };

  processes.garage-setup = {
    exec = ''
      set -euo pipefail
      GARAGE_DIR="$DEVENV_STATE/garage"
      GARAGE_CONFIG="$GARAGE_DIR/garage.toml"

      until garage -c "$GARAGE_CONFIG" status >/dev/null 2>&1; do
        echo "Waiting for Garage..."
        sleep 1
      done

      if [ ! -f "$GARAGE_DIR/.initialized" ]; then
        NODE_ID=$(garage -c "$GARAGE_CONFIG" status | awk '/^[0-9a-f]{16}/ {print $1; exit}')
        garage -c "$GARAGE_CONFIG" layout assign -z dc1 -c 1G "$NODE_ID"
        garage -c "$GARAGE_CONFIG" layout apply --version 1

        garage -c "$GARAGE_CONFIG" bucket create openworks

        KEY_OUTPUT=$(garage -c "$GARAGE_CONFIG" key create openworks-dev-key)
        ACCESS_KEY=$(echo "$KEY_OUTPUT" | awk '/Key ID:/ {print $3}')
        SECRET_KEY=$(echo "$KEY_OUTPUT" | awk '/Secret key:/ {print $3}')
        printf 'export S3_ACCESS_KEY_ID="%s"\nexport S3_SECRET_ACCESS_KEY="%s"\n' "$ACCESS_KEY" "$SECRET_KEY" > "$GARAGE_DIR/credentials.env"

        garage -c "$GARAGE_CONFIG" bucket allow --read --write --owner openworks --key openworks-dev-key

        touch "$GARAGE_DIR/.initialized"
        echo "Garage initialized. Restart shell to load credentials."
      fi

      garage -c "$GARAGE_CONFIG" bucket website --allow openworks

      source "$GARAGE_DIR/credentials.env"
      node --input-type=module <<'SCRIPT'
      import { createHash, createHmac } from "node:crypto";
      const endpoint = "http://127.0.0.1:${toString garageS3Port}";
      const bucket = "openworks";
      const region = "garage";
      const host = "127.0.0.1:${toString garageS3Port}";
      const accessKeyId = process.env.S3_ACCESS_KEY_ID;
      const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
      const corsXml = '<?xml version="1.0" encoding="UTF-8"?><CORSConfiguration><CORSRule><AllowedOrigin>http://localhost:3000</AllowedOrigin><AllowedMethod>PUT</AllowedMethod><AllowedHeader>*</AllowedHeader><MaxAgeSeconds>3600</MaxAgeSeconds></CORSRule></CORSConfiguration>';
      const now = new Date();
      const dateStamp = now.toISOString().replace(/-/g, "").slice(0, 8);
      const amzDate = dateStamp + "T" + now.toISOString().slice(11, 19).replace(/:/g, "") + "Z";
      const payloadHash = createHash("sha256").update(corsXml).digest("hex");
      const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
      const canonicalRequest = ["PUT", "/" + bucket, "cors=", "content-type:application/xml\nhost:" + host + "\nx-amz-content-sha256:" + payloadHash + "\nx-amz-date:" + amzDate + "\n", signedHeaders, payloadHash].join("\n");
      const credentialScope = dateStamp + "/" + region + "/s3/aws4_request";
      const stringToSign = "AWS4-HMAC-SHA256\n" + amzDate + "\n" + credentialScope + "\n" + createHash("sha256").update(canonicalRequest).digest("hex");
      const hmac = (key, data) => createHmac("sha256", key).update(data).digest();
      const signingKey = hmac(hmac(hmac(hmac("AWS4" + secretAccessKey, dateStamp), region), "s3"), "aws4_request");
      const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");
      const res = await fetch(endpoint + "/" + bucket + "?cors", {
        method: "PUT",
        body: corsXml,
        headers: {
          "content-type": "application/xml",
          "x-amz-content-sha256": payloadHash,
          "x-amz-date": amzDate,
          authorization: "AWS4-HMAC-SHA256 Credential=" + accessKeyId + "/" + credentialScope + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature,
        },
      });
      if (!res.ok) process.exit(1);
      SCRIPT
      echo "Garage setup complete."
    '';

    process-compose.depends_on = {
      garage.condition = "process_started";
    };
  };

  languages.javascript = {
    enable = true;
    package = nodejs-slim_24;
    yarn = {
      enable = true;
      package = yarn-berry_4;
    };
  };
}
