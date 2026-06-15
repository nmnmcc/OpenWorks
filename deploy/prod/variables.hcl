// Docker images (required)

variable "image_backend" {
  description = "Backend Docker image (e.g., ghcr.io/nmnmcc/openworks-backend:latest)"
  type        = string
}

variable "image_frontend" {
  description = "Frontend Docker image (e.g., ghcr.io/nmnmcc/openworks-frontend:latest)"
  type        = string
}

variable "image_migrate" {
  description = "Migration Docker image — must contain drizzle-kit and migration files (build from Dockerfile.backend --target builder)"
  type        = string
}

// Network

variable "network" {
  description = "Docker network name"
  type        = string
  default     = "openworks"
}

// Public URLs (required)

variable "backend_url" {
  description = "Public URL of the backend API, used by better-auth and CORS (e.g., https://example.com/api)"
  type        = string
}

variable "frontend_url" {
  description = "Public URL of the frontend, used as CORS origin (e.g., https://example.com)"
  type        = string
}

variable "media_public_base_url" {
  description = "Public URL for serving uploaded media (e.g., https://cdn.example.com/openworks)"
  type        = string
}

// Host ports

variable "backend_port" {
  description = "Host port for the backend service"
  type        = number
  default     = 30000
}

variable "frontend_port" {
  description = "Host port for the frontend service"
  type        = number
  default     = 3000
}

// Postgres (required)

variable "postgres_user" {
  type = string
}

variable "postgres_password" {
  type = string
}

variable "postgres_db" {
  type    = string
  default = "openworks"
}

variable "sequin_db" {
  type    = string
  default = "sequin"
}

// RabbitMQ (required)

variable "rabbitmq_user" {
  type = string
}

variable "rabbitmq_password" {
  type = string
}

// Typesense (required)

variable "typesense_api_key" {
  type = string
}

// S3 (required)

variable "s3_endpoint" {
  description = "S3-compatible endpoint URL (e.g., https://s3.amazonaws.com)"
  type        = string
}

variable "s3_access_key_id" {
  type = string
}

variable "s3_secret_access_key" {
  type = string
}

variable "s3_bucket" {
  type    = string
  default = "openworks"
}

variable "s3_region" {
  type    = string
  default = "us-east-1"
}

// Sequin (required)

variable "secret_key_base" {
  type = string
}

variable "vault_key" {
  type = string
}

variable "sequin_admin_email" {
  type = string
}

variable "sequin_admin_password" {
  type = string
}
