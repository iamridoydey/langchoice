output "sg_ids" {
  description = "Security group ids"
  value       = { for k, v in aws_security_group.security_groups : v.name => v.id }
}


output "control_security_group_ids" {
  description = "Control security group ids"
  value = toset([
    for v in aws_security_group.security_groups : v.id
    if length(regexall("control", v.name)) > 0
  ])
}

output "managed_security_group_ids" {
  description = "Managed security group ids"
  value = toset([
    for v in aws_security_group.security_groups : v.id
    if length(regexall("managed", v.name)) > 0
  ])
}
