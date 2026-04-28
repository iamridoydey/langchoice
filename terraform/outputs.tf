output "list_of_ec2" {
  description = "List of ec2 instance"
  value = module.ec2.ec2_instance_ips
}

output "sg" {
  value = module.sg.sg_ids
}


output "public_sg" {
  value = module.sg.public_security_group_ids
}


output "aws_eks_arn" {
  description = "Eks cluster arn"
  value       = module.eks.aws_eks_arn
}



output "aws_eks_admin_entry" {
  description = "Eks cluster admin entry"
  value       = module.eks.aws_eks_admin_entry_arn
}



output "aws_load_balancer_controller_role_arn" {
  description = "IRSA role ARN for AWS Load Balancer Controller"
  value       = module.eks.aws_load_balancer_controller_role_arn
}


output "external_secrets_role_arn" {
  description = "IRSA role for external secret"
  value = module.eks.external_secrets_role_arn
}
