{
  pkgs,
  inputs,
  ...
}:

let
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
    inputs.hashicorp.packages.${pkgs.system}.nomad
    openssl
  ];

  env = {
    PLAYWRIGHT_BROWSERS_PATH = "${playwright-driver.browsers}";
    PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = "true";
    PLAYWRIGHT_MCP_EXECUTABLE_PATH = "${playwright.browsers}/chromium-${chromium-rev}/chrome-linux64/chrome";
    DATABASE_URL = "postgresql://openworks:openworks@127.0.0.1:15432/openworks";
    RABBITMQ_URL = "amqp://guest:guest@127.0.0.1:15672";
    TYPESENSE_HOST = "127.0.0.1";
    TYPESENSE_PORT = "18108";
    TYPESENSE_API_KEY = "openworks-dev-key";
    S3_ENDPOINT = "http://127.0.0.1:19000";
    S3_ACCESS_KEY_ID = "openworks";
    S3_SECRET_ACCESS_KEY = "openworks-dev-key";
    S3_BUCKET = "openworks";
    S3_REGION = "us-east-1";
    MEDIA_PUBLIC_BASE_URL = "http://127.0.0.1:19000/openworks";
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
