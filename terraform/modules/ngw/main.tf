# Allocate an EIP
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = var.nat_public_subnet_id

  tags = {
    Name = "nat-gateway"
  }
}

