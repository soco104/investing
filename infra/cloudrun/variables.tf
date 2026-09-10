variable "project_id" {
  description = "Google Cloud project ID."
  type        = string
}

variable "region" {
  description = "Google Cloud region. us-east1 keeps the app close to U.S. Eastern school users."
  type        = string
  default     = "us-east1"
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string
  default     = "futurefund-classroom"
}

variable "artifact_repository" {
  description = "Artifact Registry Docker repository name."
  type        = string
  default     = "futurefund"
}

variable "image" {
  description = "Container image to deploy. The default lets Terraform create the first Cloud Run service before the app image exists."
  type        = string
  default     = "us-docker.pkg.dev/cloudrun/container/hello"
}

variable "allow_unauthenticated" {
  description = "Allow public HTTPS access to the login page. Keep true for the MVP web app unless fronted by IAP or a school IdP proxy."
  type        = bool
  default     = true
}

variable "min_instances" {
  description = "Minimum Cloud Run instances during school hours. Use 1 to avoid cold starts for the small pilot."
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum Cloud Run instances for the pilot."
  type        = number
  default     = 5
}

variable "db_instance_name" {
  description = "Cloud SQL instance name."
  type        = string
  default     = "futurefund-db"
}

variable "db_name" {
  description = "Application database name."
  type        = string
  default     = "futurefund"
}

variable "bootstrap_admin_email" {
  description = "Optional initial admin email created during Cloud Run startup."
  type        = string
  default     = ""
}

variable "bootstrap_admin_password_hash" {
  description = "Optional bcrypt hash for the initial admin password."
  type        = string
  default     = ""
  sensitive   = true
}

variable "db_user" {
  description = "Application database user."
  type        = string
  default     = "futurefund_app"
}

variable "db_tier" {
  description = "Cloud SQL machine tier for the pilot."
  type        = string
  default     = "db-f1-micro"
}

variable "market_poll_schedule" {
  description = "Cloud Scheduler cron expression for market-data polling."
  type        = string
  default     = "*/15 8-15 * * 1-5"
}

variable "market_poll_timezone" {
  description = "Timezone for school-day scheduled work."
  type        = string
  default     = "America/New_York"
}

variable "sso_authorization_url" {
  description = "Optional district OIDC authorization URL used to start SSO login."
  type        = string
  default     = ""
}

variable "sso_client_id" {
  description = "Optional district OIDC client ID."
  type        = string
  default     = ""
}

variable "sso_redirect_uri" {
  description = "Optional district OIDC redirect URI registered with the identity provider."
  type        = string
  default     = ""
}

variable "sso_scope" {
  description = "OIDC scopes requested during district SSO login."
  type        = string
  default     = "openid email profile"
}
