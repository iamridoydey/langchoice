variable "vpc_id" {
  description = "Vpc id"
  type        = string
}

variable "sg_rules" {
  description = "Security group rules"
  type = list(object({
    name = string
    rules = list(object({
      traffic_type = string # "ingress" or "egress"
      description  = string
      protocol     = string
      from_port    = number
      to_port      = number
      cidr_blocks = list(string)
    }))
  }))
}