resource "aws_route_table" "route_tables" {
  vpc_id   = var.vpc_id
  for_each = var.route_tables_obj

  route {
    cidr_block     = each.value.cidr
    gateway_id     = each.value.gateway_type == "igw" ? each.value.gateway_id : null
    nat_gateway_id = each.value.gateway_type == "nat" ? each.value.gateway_id : null
  }

  tags = {
    Name = each.value.name
  }
}


resource "aws_route_table_association" "rt_assoc" {
  for_each = var.subnet_map
  subnet_id      = each.value.id
  route_table_id = aws_route_table.route_tables[each.value.type].id
}