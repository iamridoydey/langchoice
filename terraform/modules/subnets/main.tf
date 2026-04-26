locals {
  # ── containment check ────────────────────────────────────────────────────
  # A subnet is inside the VPC if:
  #   1. its prefix is longer (more specific) than the VPC prefix
  #   2. its network address, when masked to the VPC prefix length, equals
  #      the VPC network address
  #
  # Example: vpc=10.0.0.0/16, subnet=10.0.1.0/24
  #   step1: /24 >= /16 ✓
  #   step2: cidrnetmask("10.0.0.0/16") == cidrnetmask("10.0.1.0/16")
  #          "255.255.0.0"              == "255.255.0.0"               ✓
  #
  # Rogue: vpc=10.0.0.0/16, subnet=192.168.1.0/24
  #   step2: cidrnetmask("10.0.0.0/16") == cidrnetmask("192.168.1.0/16")
  #          "255.255.0.0"              == "255.255.0.0"  — wait, masks are equal!
  #          So we also compare the masked network addresses, not just the masks.
  #          cidrhost("10.0.0.0/16",0)     = "10.0.0.0"
  #          cidrhost("192.168.1.0/16", 0) = "192.168.0.0"  ≠ "10.0.0.0"  ✗ blocked

  subnet_in_vpc = {
    for key, s in var.subnet_objects : key => (
      tonumber(split("/", s.cidr)[1]) >= tonumber(split("/", var.vpc_cidr)[1])
      &&
      cidrhost(var.vpc_cidr, 0) == cidrhost(
        "${split("/", s.cidr)[0]}/${split("/", var.vpc_cidr)[1]}",
        0
      )
    )
  }

  subnet_cidrs = [for s in var.subnet_objects : s.cidr]

  # ── overlap check ─────────────────────────────────────────────────────────
  # Two CIDRs overlap when one contains the other's first or last host address.
  # We use cidrhost(cidr, 0) for first address and cidrhost(cidr, -1) for last.
  # Then we check containment by comparing masked network addresses.
  #
  # contains(a, ip) without cidrcontains:
  #   mask ip to a's prefix length → if the result equals a's network → ip is inside a
  #
  # Example: does 10.0.1.0/24 overlap 10.0.1.128/25?
  #   first IP of /25 = 10.0.1.128
  #   mask to /24     = 10.0.1.0   == network of /24 (10.0.1.0) ✓ → overlap!

  overlapping_pairs = [
    for pair in flatten([
      for i, a in local.subnet_cidrs : [
        for j, b in local.subnet_cidrs :
        { a = a, b = b }
        if i < j
      ]
    ]) :
    "${pair.a} overlaps ${pair.b}"
    if(
      # first IP of b falls inside a?
      cidrhost(
        "${cidrhost(pair.b, 0)}/${split("/", pair.a)[1]}",
        0
      ) == cidrhost(pair.a, 0)
      ||
      # first IP of a falls inside b?
      cidrhost(
        "${cidrhost(pair.a, 0)}/${split("/", pair.b)[1]}",
        0
      ) == cidrhost(pair.b, 0)
    )
  ]
}


resource "aws_subnet" "main" {
  for_each = var.subnet_objects
  vpc_id     = var.vpc_id
  availability_zone = each.value.az
  cidr_block = each.value.cidr
  tags       = each.value.tags

  lifecycle {
    precondition {
      condition     = local.subnet_in_vpc[each.key]
      error_message = "Subnet '${each.key}' CIDR ${each.value.cidr} is outside VPC CIDR ${var.vpc_cidr}."
    }

    precondition {
      condition     = length(local.overlapping_pairs) == 0
      error_message = "Overlapping subnet CIDRs detected: ${join(", ", local.overlapping_pairs)}"
    }
  }
}
