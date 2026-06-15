job "prod" {
  type = "service"

  [[ template "postgres" . ]]
  [[ template "redis" . ]]
  [[ template "rabbitmq" . ]]
  [[ template "typesense" . ]]
  [[ template "sequin" . ]]
  [[ template "app" . ]]
}
