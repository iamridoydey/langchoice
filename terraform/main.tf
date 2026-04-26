
# vpc module
module "vpc" {
  source   = "./modules/vpc"
  vpc_cidr = var.vpc_cidr
  vpc_tag  = var.vpc_tag
}


# vpc subnets
module "subnets" {
  source         = "./modules/subnets"
  vpc_id         = module.vpc.vpc_id
  vpc_cidr       = var.vpc_cidr
  subnet_objects = var.subnet_objects
}

# Internet gateway
module "igw" {
  source = "./modules/igw"
  vpc_id = module.vpc.vpc_id
}


# Nat gateway (Only need when you want a private subnet)
module "ngw" {
  source               = "./modules/ngw"
  nat_public_subnet_id = module.subnets.public_subnet_ids[0]
}


locals {
  # Route tables
  route_tables_obj = {
    "public" = {
      name         = "public_rt"
      cidr         = "0.0.0.0/0"
      gateway_type = "igw"
      gateway_id   = module.igw.igw_id
    },
    # (Only need when you want a private subnet that should attached with a route table)
    "private" = {
      name         = "private_rt"
      cidr         = "0.0.0.0/0"
      gateway_type = "nat"
      gateway_id   = module.ngw.ngw_id
    }
  }

  # Security group rules
  sg_rules = [
    {
      name = "jenkins-server-sg"
      rules = [
        {
          traffic_type = "ingress"
          description  = "Allow SSH Access"
          protocol     = "tcp"
          from_port    = 22
          to_port      = 22
          cidr_blocks  = ["0.0.0.0/0"]
        },
        {
          traffic_type = "ingress"
          description  = "Allow HTTP Access"
          protocol     = "tcp"
          from_port    = 80
          to_port      = 80
          cidr_blocks  = ["0.0.0.0/0"]
        },
        {
          traffic_type = "ingress"
          description  = "Allow HTTP Access"
          protocol     = "tcp"
          from_port    = 443
          to_port      = 443
          cidr_blocks  = ["0.0.0.0/0"]
        },
        {
          traffic_type = "egress"
          description  = "Allow all outbound"
          protocol     = "-1"
          from_port    = 0
          to_port      = 0
          cidr_blocks  = ["0.0.0.0/0"]
        }
      ]
    },
    {
      name = "eks-cluseter-sg"
      rules = [
        {
          traffic_type = "ingress"
          description  = "Allow SSH Access"
          protocol     = "tcp"
          from_port    = 22
          to_port      = 22
          cidr_blocks  = ["0.0.0.0/0"]
        },
        {
          traffic_type = "egress"
          description  = "Allow all outbound"
          protocol     = "-1"
          from_port    = 0
          to_port      = 0
          cidr_blocks  = ["0.0.0.0/0"]
        }
      ]
    }
  ]


  # Eks Addons list
  eks_addons_list = ["vpc-cni", "kube-proxy", "coredns", "aws-ebs-csi-driver", "metrics-server", "aws-load-balancer-controller"]
}

# Route table
module "route_tables" {
  source           = "./modules/route-tables"
  vpc_id           = module.vpc.vpc_id
  route_tables_obj = local.route_tables_obj
  subnet_map       = module.subnets.subnet_map
}


# Security Group
module "sg" {
  source   = "./modules/sg"
  vpc_id   = module.vpc.vpc_id
  sg_rules = local.sg_rules
}


# EC2
module "ec2" {
  source = "./modules/ec2"

  ec2_instance_data = {
    "jenkins-server" = {
      subnet_id       = module.subnets.public_subnet_ids[0]
      security_groups = module.sg.managed_security_group_ids
      ami             = data.aws_ami.ubuntu.id
      instance_type   = "t3.micro"
      key             = module.ec2.key_name
      assoc_public_ip = true
      name            = "control-ubuntu"
      user            = "ubuntu"
      os_family       = "ubuntu"
      volume_size     = 15
    }
  }

  ssh_key = var.ssh_key
}


module "eks" {
  source = "./modules/eks"
  aws_account_id = data.aws_caller_identity.current.account_id
  # Eks will be in private subnet
  subnet_ids_list = module.subnets.private_subnet_ids
  eks_addons_list = local.eks_addons_list
}