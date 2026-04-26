output "list_of_ec2" {
  description = "List of ec2 instance"
  value = module.ec2.ec2_instance_ips
}

output "sg" {
  value = module.sg.sg_ids
}


output "managed_sg" {
  value = module.sg.managed_security_group_ids
}


output "aws_eks_arn" {
  description = "Eks cluster arn"
  value       = module.eks.aws_eks_arn
}



output "aws_eks_admin_entry" {
  description = "Eks cluster admin entry"
  value       = module.eks.aws_eks_admin_entry_arn
}