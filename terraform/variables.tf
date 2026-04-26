# Ami data of ubuntu, amazon-linux and redhut linux
data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}


data "aws_ami" "amazon_linux" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["137112412989"] # Amazon
}


data "aws_ami" "redhat_linux" {
  most_recent = true

  filter {
    name   = "name"
    values = ["RHEL-9.*_HVM-*-x86_64-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["309956199498"] # Red Hat
}

data "aws_caller_identity" "current" {}


variable "vpc_cidr" {
  description = "Vpc cidr"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_tag" {
  description = "Vpc tag"
  type        = string
  default     = "main"
}


variable "subnet_objects" {
  description = "Subnet cidr values and names"
  type = map(object(
    {
      cidr = string
      tags = object(
        {
          Name    = string
          type = string
        }
      )
    }
  ))

  default = {
    "public-1a" = {
      cidr = "10.0.1.0/24"
      tags = {
        Name    = "public-1a-subnet"
        type = "public"
      }
    },
    "private-1a" = {
      cidr = "10.0.2.0/24"
      tags = {
        Name    = "public-1b-subnet"
        type = "public"
      }
    },
    "public-1b" = {
      cidr = "10.0.3.0/24"
      tags = {
        Name    = "public-1c-subnet"
        type = "public"
      }
    },
    "private-1b" = {
      cidr = "10.0.4.0/24"
      tags = {
        Name    = "public-1d-subnet"
        type = "public"
      }
    }
  }
}



variable "ssh_key" {
  description = "Ssh key data"
  type = object({
    key_name            = string
    public_key_location = string
  })

  default = {
    key_name            = "langchoice-key"
    public_key_location = "~/.ssh/langchoice-key.pub"
  }
}


