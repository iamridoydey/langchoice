
resource "aws_key_pair" "default" {
  key_name   = var.ssh_key.key_name
  public_key = file(var.ssh_key.public_key_location)
}


resource "aws_instance" "instances" {
  for_each                    = var.ec2_instance_data
  subnet_id                   = each.value.subnet_id
  security_groups             = each.value.security_groups
  ami                         = each.value.ami
  instance_type               = each.value.instance_type
  key_name                    = aws_key_pair.default.key_name
  associate_public_ip_address = each.value.assoc_public_ip

  root_block_device {
    volume_type = "gp3"
    volume_size = each.value.volume_size
  }

  tags = {
    Name      = each.value.name
    user      = each.value.user
    os_family = each.value.os_family
  }
}