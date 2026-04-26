
variable "vpc_cidr" {
  description = "Vpc cidr"
  type        = string
  
  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be a valid CIDR block e.g. 10.0.0.0/16"
  }
}

variable "vpc_tag" {
  description = "Vpc tag"
  type        = string
}