# Terraform — AWS Infrastructure

This Terraform project provisions all AWS infrastructure for LangChoice. It is structured with reusable modules so each component can be planned and applied independently.

## What gets created

| Resource | Details |
|---|---|
| VPC | `10.0.0.0/16` |
| Public subnets | `10.0.1.0/24` (us-east-1a), `10.0.3.0/24` (us-east-1b) |
| Private subnets | `10.0.2.0/24` (us-east-1a), `10.0.4.0/24` (us-east-1b) |
| Internet Gateway | Routes public subnet traffic to internet |
| NAT Gateway | Lets private subnet nodes reach internet (pull images, etc.) |
| Route tables | Public → IGW, Private → NAT |
| Security groups | Jenkins EC2, EKS cluster, EKS nodes |
| EC2 instance | Jenkins server in public subnet |
| EKS cluster | v1.32, API authentication mode |
| EKS node group | 2 nodes (min 1, max 3) in private subnets |
| IAM roles | Cluster role, worker role, admin role, IRSA roles |
| OIDC provider | Enables IRSA (IAM Roles for Service Accounts) |
| IRSA — EBS CSI | Allows EBS CSI Driver to create/attach EBS volumes |
| IRSA — LBC | Allows AWS Load Balancer Controller to create ALBs |
| IRSA — ESO | Allows External Secrets to read from Secrets Manager |
| Ansible inventory | Auto-generated `inventory.ini` with EC2 IPs |

## Structure

```
terraform/
├── main.tf              Root — calls all modules
├── variables.tf         Input variable definitions
├── outputs.tf           Outputs (EC2 IPs, role ARNs, etc.)
├── provider.tf          AWS provider config
├── backend.tf           S3 remote state config
├── inventory-generator.tf  Generates Ansible inventory file
├── templates/
│   └── inventory.tpl    Template for inventory.ini
├── lbc-policy/
│   └── iam_policy.json  AWS Load Balancer Controller IAM policy
└── modules/
    ├── vpc/             Creates VPC
    ├── subnets/         Creates subnets with overlap validation
    ├── igw/             Creates Internet Gateway
    ├── ngw/             Creates NAT Gateway + Elastic IP
    ├── route-tables/    Creates and associates route tables
    ├── sg/              Creates security groups
    ├── ec2/             Creates Jenkins EC2 instance
    └── eks/             Creates EKS cluster, node group, IAM, OIDC, IRSA
```

## Setup

```bash
cd terraform

# 1. Copy and fill in variables
cp terraform.tfvars.example terraform.tfvars

# 2. Initialise — downloads providers, connects to S3 state backend
terraform init

# 3. Preview changes
terraform plan

# 4. Apply
terraform apply
```

## Required variables

```hcl
# terraform.tfvars
aws_region     = "us-east-1"
key_pair_name  = "langchoice-key"    # must create and stored it in your ./.ssh folder
```

## Outputs

After apply, these outputs are available:

```bash
terraform output list_of_ec2                              # Jenkins EC2 public IP
terraform output aws_load_balancer_controller_role_arn    # used when installing LBC via Helm
terraform output external_secrets_role_arn                # used when annotating ESO service account
```

## Remote state

State is stored in S3 with DynamoDB locking. Configure `backend.tf` with your own bucket and table before running `terraform init`:

```hcl
terraform {
  backend "s3" {
    bucket         = "your-tfstate-bucket"
    key            = "langchoice/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
  }
}
```

## Subnet validation

The `subnets` module includes Terraform `precondition` checks that run before any subnet is created:

- Every subnet CIDR must be contained within the VPC CIDR
- No two subnets may overlap

If either check fails, `terraform plan` prints a clear error message identifying which subnet caused the problem. This prevents silent misconfiguration.

## IRSA — how it works

IRSA (IAM Roles for Service Accounts) lets pods assume IAM roles without storing credentials. The flow is:

1. EKS cluster has an OIDC endpoint
2. Terraform registers this endpoint as an OIDC provider in IAM
3. Each IAM role has a trust policy that allows `sts:AssumeRoleWithWebIdentity` from a specific Kubernetes service account
4. The pod's service account is annotated with the role ARN
5. EKS injects temporary AWS credentials into the pod automatically

Three IRSA roles are created — one each for EBS CSI Driver, AWS Load Balancer Controller, and External Secrets Operator.

## Destroying

```bash
# Destroy everything
terraform destroy

# Or destroy a specific module
terraform destroy -target=module.eks
```
