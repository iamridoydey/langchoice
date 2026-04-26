resource "aws_security_group" "security_groups" {
  for_each = { for idx, sg in var.sg_rules : idx => sg }
  name     = each.value.name
  vpc_id   = var.vpc_id

  dynamic "ingress" {
    for_each = [for r in each.value.rules : r if r.traffic_type == "ingress"]
    content {
      description = ingress.value.description
      protocol    = ingress.value.protocol
      from_port   = ingress.value.from_port
      to_port     = ingress.value.to_port
      cidr_blocks = ingress.value.cidr_blocks
    }
  }

  dynamic "egress" {
    for_each = [for r in each.value.rules : r if r.traffic_type == "egress"]
    content {
      description = egress.value.description
      protocol    = egress.value.protocol
      from_port   = egress.value.from_port
      to_port     = egress.value.to_port
      cidr_blocks = egress.value.cidr_blocks
    }
  }

  tags = {
    Name = each.value.name
  }
}
