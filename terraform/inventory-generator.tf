
locals {
  ubuntu_host  = { for name, inst in module.ec2.instances_map : name => inst if inst.os_family == "ubuntu" }
  amazon_host  = { for name, inst in module.ec2.instances_map : name => inst if inst.os_family == "amazon" }
  redhat_host  = { for name, inst in module.ec2.instances_map : name => inst if inst.os_family == "redhat" }
  control_host = { for name, inst in module.ec2.instances_map : name => inst if can(regex("control", name)) }
}


resource "local_file" "provisioner" {
  content = templatefile("${path.module}/templates/inventory.tpl", {
    ssh_key_path = "~/.ssh/${module.ec2.key_name}"
    ubuntu       = local.ubuntu_host
    amazon       = local.amazon_host
    redhat       = local.redhat_host
    control      = local.control_host
  })

  filename        = "${path.module}/../ansible/inventory.ini"
  file_permission = "0644"
}