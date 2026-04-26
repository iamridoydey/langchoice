output "route_table_ids" {
  description = "Route table ids"
  value       = { for k, v in aws_route_table.route_tables : k => v.id }
}

