# variables.tf

variable "vpc_id" {
  description = "VPC id"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block e.g. 10.0.0.0/16"
  type        = string

  validation {
    condition     = can(cidrnetmask(var.vpc_cidr))
    error_message = "vpc_cidr must be a valid CIDR block e.g. 10.0.0.0/16"
  }
}

variable "subnet_objects" {
  description = "Subnet cidr values and names"
  type = map(object({
    cidr = string
    az   = string
    tags = object({
      Name = string
      type = string
    })
  }))

  validation {
    condition = alltrue([
      for s in var.subnet_objects :
      can(cidrnetmask(s.cidr))
    ])
    error_message = "All subnet cidr values must be valid CIDR blocks."
  }
}
