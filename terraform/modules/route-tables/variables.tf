variable "vpc_id" {
  description = "Vpc id"
  type        = string
}


variable "route_tables_obj" {
  description = "Route table objects"
  type = map(object({
    name         = string
    cidr         = string
    gateway_type = string # "igw" or "nat"
    gateway_id   = string
  }))
}



variable "subnet_map" {
  description = "Subnet id and type"
  type = map(object({
    id = string 
    type = string
  }))
}


