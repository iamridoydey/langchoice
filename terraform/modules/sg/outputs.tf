output "sg_ids" {
  description = "Security group ids"
  value       = { for k, v in aws_security_group.security_groups : v.name => v.id }
}


output "public_security_group_ids" {
  description = "Public security group ids"
  value = toset([
    for v in aws_security_group.security_groups : v.id
    if length(regexall("public", v.tags["type"])) > 0
  ])
}

output "private_security_group_ids" {
  description = "Private security group ids"
  value = toset([
    for v in aws_security_group.security_groups : v.id
    if length(regexall("private", v.tags["type"])) > 0
  ])
}
