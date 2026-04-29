# Ansible — Jenkins EC2 Provisioning

This Ansible project configures the Jenkins EC2 instance created by Terraform. It installs and starts Docker and Jenkins, ready to run the CI pipeline.

## What it does

Running the playbook on a fresh EC2 instance:

- Installs Java 21 (required by Jenkins)
- Adds the Jenkins apt/yum repository and GPG key
- Installs and starts Jenkins as a systemd service
- Installs Docker
- Adds the `jenkins` user to the `docker` group so Jenkins can build images
- Installs `kubectl` so Jenkins can interact with the cluster if needed

## Structure

```
ansible/
├── playbook.yml              Main playbook — applies both roles to [servers]
├── example.inventory.ini     Template showing expected inventory format
├── roles/
│   ├── jenkins/              Installs and configures Jenkins
│   │   ├── tasks/main.yml    Install Java → add repo → install Jenkins → start
│   │   ├── handlers/main.yml Restart Jenkins on config change
│   │   ├── defaults/main.yml Default variable values
│   │   └── vars/main.yml     Role-specific variables
│   └── docker/               Installs Docker Engine
│       ├── tasks/
│       │   ├── main.yml               Entry point — delegates by OS family
│       │   ├── ubuntu_spec_tasks.yml  Ubuntu/Debian install path
│       │   ├── redhat_spec_tasks.yml  RHEL install path
│       │   └── amazon_spec_tasks.yml  Amazon Linux install path
│       ├── handlers/main.yml
│       ├── defaults/main.yml
│       └── vars/main.yml
```

## How to run

Terraform generates the inventory file automatically. After `terraform apply`:

```bash
cd ansible

# The inventory is written to inventory.ini by Terraform
ansible-playbook -i inventory.ini playbook.yml
```

Or use the example inventory manually:

```bash
cp example.inventory.ini inventory.ini
# edit inventory.ini — replace the IP with your EC2 public IP
ansible-playbook -i inventory.ini playbook.yml
```

## Inventory format

```ini
[all:vars]
ansible_ssh_private_key_file=~/.ssh/langchoice-key
ansible_python_interpreter=/usr/bin/python3
ansible_host_key_checking=false

[servers]
jenkins-server ansible_host=<EC2_PUBLIC_IP> ansible_user=ubuntu
```

## After running

1. Open `http://<EC2_PUBLIC_IP>:8080`
2. Get the initial admin password:
   ```bash
   sudo cat /var/lib/jenkins/secrets/initialAdminPassword
   ```
3. Complete the Jenkins setup wizard
4. Add DockerHub and GitHub credentials (see main README)
5. Create a Pipeline job pointing at the repo root `Jenkinsfile`

## Common issue — Docker permission denied in pipeline

If Jenkins jobs fail with `permission denied while trying to connect to the Docker API`:

```bash
# The jenkins process was started before being added to docker group
# Restart picks up the new group membership
sudo systemctl restart jenkins
```