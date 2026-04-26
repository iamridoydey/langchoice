# state.tf
terraform {
  backend "s3" {
    bucket = "full-flow-devops-project" 
    key    = "langchoice.tfstate"
    region = "us-east-1"
    encrypt = true
    use_lockfile = true
  }
}