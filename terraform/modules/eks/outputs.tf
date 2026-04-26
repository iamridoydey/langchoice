output "aws_eks_arn" {
  description = "Eks cluster arn"
  value       = aws_eks_cluster.langchoice_cluster.arn
}



output "aws_eks_admin_entry_arn" {
  description = "Eks cluster admin entry"
  value       = aws_eks_access_entry.admin.principal_arn
}

output "aws_load_balancer_controller_role_arn" {
  description = "IRSA role ARN for AWS Load Balancer Controller"
  value       = aws_iam_role.aws_load_balancer_controller.arn
}
