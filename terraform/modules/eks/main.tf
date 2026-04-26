##########################################################################################
#                                    EKS Cluster                                         #
##########################################################################################

resource "aws_eks_cluster" "langchoice_cluster" {
  name    = "langchoice-cluster"
  version = "1.32"   # fix: 1.34 does not exist

  access_config {
    authentication_mode = "API"
  }

  role_arn = aws_iam_role.eks_cluster_role.arn

  vpc_config {
    subnet_ids = var.subnet_ids_list
  }

  depends_on = [
    aws_iam_role_policy_attachment.cluster_AmazonEKSClusterPolicy,
  ]
}

##########################################################################################
#                                    EKS Node Group                                      #
##########################################################################################

resource "aws_eks_node_group" "langchoice_node_group" {
  cluster_name    = aws_eks_cluster.langchoice_cluster.name
  node_group_name = "langchoice-node-group"
  node_role_arn   = aws_iam_role.eks_worker_role.arn
  subnet_ids      = var.subnet_ids_list

  instance_types = ["m7i-flex.xlarge"]  # fix: correct instance type format

  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 1
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.worker_AmazonEKSWorkerNodePolicy,
    aws_iam_role_policy_attachment.worker_AmazonEKS_CNI_Policy,
    aws_iam_role_policy_attachment.worker_AmazonEC2ContainerRegistryReadOnly,
  ]
}

##########################################################################################
#                                 IAM — Cluster Role                                     #
##########################################################################################

resource "aws_iam_role" "eks_cluster_role" {
  name = "langchoice-eks-cluster-role"  # fix: unique name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sts:AssumeRole",
        "sts:TagSession"
      ]
      Principal = {
        Service = "eks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cluster_AmazonEKSClusterPolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name  # fix: correct role reference
}

##########################################################################################
#                                 IAM — Worker Node Role                                 #
##########################################################################################

resource "aws_iam_role" "eks_worker_role" {
  name = "langchoice-eks-worker-role"  # fix: unique name, different from cluster role

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = {
        Service = "ec2.amazonaws.com"  # fix: worker nodes are EC2, not eks.amazonaws.com
      }
    }]
  })
}

# fix: use for_each instead of count, and correct role reference
resource "aws_iam_role_policy_attachment" "worker_AmazonEKSWorkerNodePolicy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_worker_role.name
}

resource "aws_iam_role_policy_attachment" "worker_AmazonEKS_CNI_Policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_worker_role.name
}

resource "aws_iam_role_policy_attachment" "worker_AmazonEC2ContainerRegistryReadOnly" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_worker_role.name
}

##########################################################################################
#                              EKS Cluster Admin Access                                  #
##########################################################################################

# IAM role for cluster admin (e.g. your CI/CD or operator role)
resource "aws_iam_role" "eks_admin_role" {
  name = "langchoice-eks-admin-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "sts:AssumeRole",
        "sts:TagSession"
      ]
      Principal = {
        AWS = "arn:aws:iam::${var.aws_account_id}:root"  # your AWS account root
      }
    }]
  })
}

resource "aws_eks_access_entry" "admin" {
  cluster_name  = aws_eks_cluster.langchoice_cluster.name
  principal_arn = aws_iam_role.eks_admin_role.arn 
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "admin" {
  cluster_name  = aws_eks_cluster.langchoice_cluster.name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = aws_iam_role.eks_admin_role.arn 

  access_scope {
    type = "cluster"
  }
}



##########################################################################################
#                                       Addons                                           #
##########################################################################################
resource "aws_eks_addon" "name" {
  count = length(var.eks_addons_list)
  addon_name = var.eks_addons_list[count.index]
  cluster_name = aws_eks_cluster.langchoice_cluster.name
}