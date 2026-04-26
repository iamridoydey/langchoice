variable "subnet_ids_list" {
  description = "Subnet ids list"
  type        = list(string)
}


variable "aws_account_id" {
  description = "Aws account id"
  type        = string
}

variable "eks_addons_list" {
  description = "Eks addons list"
  type        = list(string)
}
