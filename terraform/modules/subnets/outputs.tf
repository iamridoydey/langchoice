# output "subnet_ids" {
#   description = "Map of subnet IDs by name"
#   value       = { for s in aws_subnet.main : s.tags.Name => s.id }
# }

output "subnet_map" {
  value = {
    for k, s in aws_subnet.main :
    k => {
      id   = s.id
      type = s.tags["type"]
    }
  }
}


output "public_subnet_ids" {
  description = "Public subnet ids"
  value = [
    for k, s in aws_subnet.main : s.id
    if s.tags["type"] == "public"
  ]
}

output "private_subnet_ids" {
  description = "Private subnet ids"
  value = [
    for k, s in aws_subnet.main : s.id
    if s.tags["type"] == "private"
  ]
}