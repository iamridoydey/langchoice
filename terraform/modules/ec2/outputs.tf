output "ec2_instance_ips" {
  description = "All instance ids"
  value       = { for k, v in aws_instance.instances : k => v.public_ip }
}

output "instances_map" {
  value = {
    for name, inst in aws_instance.instances :
    name => {
      public_ip = inst.public_ip
      user      = inst.tags.user
      os_family = inst.tags.os_family
    }
  }
}


output "ec2_instances_data" {
  description = "Ec2 instances data"
  value       = aws_instance.instances
}


output "key_name" {
  description = "Authorized key name"
  value       = aws_key_pair.default.key_name
}