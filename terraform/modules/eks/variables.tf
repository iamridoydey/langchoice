variable "subnet_ids_list" {
  description = "Subnet ids list"
  type        = list(string)
}


variable "aws_account_arn" {
  description = "Aws root account arn"
  type        = string
}

variable "eks_addons_list" {
  description = "Eks addons list"
  type        = list(string)
}


variable "instance_types" {
  description = "Instance Types"
  type        = list(string)
}
