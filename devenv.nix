{
  pkgs,
  ...
}:

with pkgs;

{
  packages = [
    git
    fish
    go-task
  ];

  enterShell = ''
    export DATABASE_URL="postgresql:///openworks_dev?host=$PGHOST"
  '';

  services.postgres = {
    enable = true;
    listen_addresses = "";
    initialDatabases = [{ name = "openworks_dev"; }];
  };

  languages = {
    javascript = {
      enable = true;
      package = nodejs-slim_24;
      yarn = {
        enable = true;
        package = yarn-berry_4;
        install.enable = true;
      };
    };
  };
}
