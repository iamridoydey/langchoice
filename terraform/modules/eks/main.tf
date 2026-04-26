##########################################################################################
#                                    EKS Cluster                                         #
##########################################################################################

resource "aws_eks_cluster" "langchoice_cluster" {
  name    = "langchoice-cluster"
  version = "1.32"

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

  instance_types = var.instance_types

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
  name = "langchoice-eks-cluster-role"

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
  role       = aws_iam_role.eks_cluster_role.name
}

##########################################################################################
#                                 IAM — Worker Node Role                                 #
##########################################################################################

resource "aws_iam_role" "eks_worker_role" {
  name = "langchoice-eks-worker-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRole"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

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

resource "aws_eks_access_entry" "admin" {
  cluster_name  = aws_eks_cluster.langchoice_cluster.name
  principal_arn = var.aws_account_arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "admin" {
  cluster_name  = aws_eks_cluster.langchoice_cluster.name
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
  principal_arn = var.aws_account_arn

  access_scope {
    type = "cluster"
  }
}

##########################################################################################
#                                    OIDC Provider                                       #
##########################################################################################

# Fetches the TLS certificate of the OIDC endpoint to get its thumbprint.
data "tls_certificate" "eks" {
  url = aws_eks_cluster.langchoice_cluster.identity[0].oidc[0].issuer
}

# Registers the OIDC provider in IAM so pods can assume IAM roles
resource "aws_iam_openid_connect_provider" "eks" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.eks.certificates[0].sha1_fingerprint]
  url             = aws_eks_cluster.langchoice_cluster.identity[0].oidc[0].issuer

  depends_on = [aws_eks_cluster.langchoice_cluster]
}

##########################################################################################
#                            IRSA — EBS CSI Driver                                       #
##########################################################################################

resource "aws_iam_role" "ebs_csi_driver" {
  name = "langchoice-ebs-csi-driver-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        # reference the resource we created above — no data source needed
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          # reference the resource we created above — consistently no data source
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:ebs-csi-controller-sa"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ebs_csi_driver" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
  role       = aws_iam_role.ebs_csi_driver.name
}

##########################################################################################
#                        IRSA — AWS Load Balancer Controller                             #
##########################################################################################

resource "aws_iam_role" "aws_load_balancer_controller" {
  name = "langchoice-aws-load-balancer-controller-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = "sts:AssumeRoleWithWebIdentity"
      Principal = {
        Federated = aws_iam_openid_connect_provider.eks.arn
      }
      Condition = {
        StringEquals = {
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:sub" = "system:serviceaccount:kube-system:aws-load-balancer-controller"
          "${replace(aws_iam_openid_connect_provider.eks.url, "https://", "")}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}


resource "aws_iam_policy" "aws_load_balancer_controller" {
  name        = "langchoice-aws-load-balancer-controller-policy"
  description = "IAM policy for AWS Load Balancer Controller"
  policy      = file("${path.module}/../../lbc-policy/iam_policy.json")
}

resource "aws_iam_role_policy_attachment" "aws_load_balancer_controller" {
  policy_arn = aws_iam_policy.aws_load_balancer_controller.arn
  role       = aws_iam_role.aws_load_balancer_controller.name
}

##########################################################################################
#                                       Addons                                           #
##########################################################################################

resource "aws_eks_addon" "addons" {
  for_each     = toset(var.eks_addons_list)
  addon_name   = each.value
  cluster_name = aws_eks_cluster.langchoice_cluster.name

  service_account_role_arn = each.value == "aws-ebs-csi-driver" ? aws_iam_role.ebs_csi_driver.arn : null

  depends_on = [
    aws_eks_node_group.langchoice_node_group
  ]
}