[all:vars]
ansible_ssh_private_key_file=${ssh_key_path}
ansible_python_interpreter=/usr/bin/python3
ansible_host_key_checking=false

# ─────────────────────────────────────────────
# Ubuntu Servers
# ─────────────────────────────────────────────
[servers]
%{ for name, inst in ubuntu ~}
%{ if inst.os_family == "ubuntu" ~}
${name} ansible_host=${inst.public_ip} ansible_user=${inst.user}
%{ endif ~}
%{ endfor ~}


# ─────────────────────────────────────────────
# Amazon Linux Servers
# ─────────────────────────────────────────────
%{ for name, inst in amazon ~}
%{ if inst.os_family == "amazon" ~}
${name} ansible_host=${inst.public_ip} ansible_user=${inst.user}
%{ endif ~}
%{ endfor ~}


# ─────────────────────────────────────────────
# RedHat Servers
# ─────────────────────────────────────────────
%{ for name, inst in redhat ~}
%{ if inst.os_family == "redhat" ~}
${name} ansible_host=${inst.public_ip} ansible_user=${inst.user}
%{ endif ~}
%{ endfor ~}
