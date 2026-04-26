output "ngw_id" {
  description = "Nat gateway id and eip"
  value       = aws_nat_gateway.nat.id
}