variable "project_root" {
  description = "Absolute path to the project root"
  type        = string
}

variable "network" {
  description = "Docker network name"
  type        = string
  default     = "openworks"
}

// Postgres

variable "postgres_user" {
  type    = string
  default = "openworks"
}

variable "postgres_password" {
  type    = string
  default = "openworks"
}

variable "postgres_db" {
  type    = string
  default = "openworks"
}

variable "sequin_db" {
  type    = string
  default = "sequin"
}

// RabbitMQ

variable "rabbitmq_user" {
  type    = string
  default = "guest"
}

variable "rabbitmq_password" {
  type    = string
  default = "guest"
}

// Typesense

variable "typesense_api_key" {
  type    = string
  default = "openworks-dev-key"
}

// RustFS

variable "rustfs_root_user" {
  type    = string
  default = "openworks"
}

variable "rustfs_root_password" {
  type    = string
  default = "openworks-dev-key"
}

variable "rustfs_bucket" {
  type    = string
  default = "openworks"
}

// Sequin

variable "secret_key_base" {
  type    = string
  default = "kdha6AKsFH8PQqkLBlu0MSbROP8t1r6Dku397ZRGTa9Lz6+8wmuVJ2yBtSKhDUg0"
}

variable "vault_key" {
  type    = string
  default = "Lbmg5cVexgkcTfoCI1yOXN1r62e2U2Ir5fxjnQKiXX0="
}

variable "sequin_admin_email" {
  type    = string
  default = "dev@openworks.local"
}

variable "sequin_admin_password" {
  type    = string
  default = "openworks-dev-password"
}
