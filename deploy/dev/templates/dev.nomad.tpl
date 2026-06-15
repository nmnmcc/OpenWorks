job "dev" {
  type = "service"

  [[ template "postgres" . ]]
  [[ template "redis" . ]]
  [[ template "rabbitmq" . ]]
  [[ template "typesense" . ]]
  [[ template "rustfs" . ]]
  [[ template "sequin" . ]]
  [[ template "app" . ]]
}
