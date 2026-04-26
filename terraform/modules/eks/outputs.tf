output "aws_eks_arn" {
  description = "Eks cluster arn"
  value       = aws_eks_cluster.langchoice_cluster.arn
}



output "aws_eks_admin_entry" {
  description = "Eks cluster admin entry"
  value       = aws_eks_access_entry.admin.principal_arn
}
