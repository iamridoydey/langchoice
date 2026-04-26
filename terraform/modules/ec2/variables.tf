variable "ec2_instance_data" {
  description = "Ec2 instance data"
  type = map(object(
    {
      subnet_id       = string
      security_groups = set(string)
      ami             = string
      instance_type   = string
      key             = string
      assoc_public_ip = bool
      name            = string
      user            = string
      os_family       = string
      volume_size     = number
    }
  ))
}




variable "ssh_key" {
  description = "Ssh key data"
  type = object({
    key_name            = string
    public_key_location = string
  })
}