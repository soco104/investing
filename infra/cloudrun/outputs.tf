output "cloud_run_url" {
  description = "Cloud Run service URL."
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_repository" {
  description = "Artifact Registry repository for application images."
  value       = google_artifact_registry_repository.app.name
}

output "cloud_sql_connection_name" {
  description = "Cloud SQL connection name for local migration and debugging."
  value       = google_sql_database_instance.main.connection_name
}

output "service_account_email" {
  description = "Cloud Run runtime service account."
  value       = google_service_account.app.email
}
