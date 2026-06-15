{
  pkgs,
  inputs,
  ...
}:

with pkgs;

{
  packages = [
    git
    fish
    go-task
    inputs.hashicorp.packages.${pkgs.system}.nomad
    inputs.hashicorp.packages.${pkgs.system}.nomad-pack
    openssl
  ];

  languages.javascript = {
    enable = true;
    package = nodejs-slim_24;
    yarn = {
      enable = true;
      package = yarn-berry_4;
    };
  };
}
