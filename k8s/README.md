# k8s — Kubernetes Manifests

Raw Kubernetes manifests that are not part of a Helm chart. Applied once during cluster setup, then managed in Git.

## Structure

```
k8s/
├── argocd/
│   └── appset.yaml                    ArgoCD ApplicationSet — manages frontend + backend
└── external-secrets/
    ├── cluster-secret-store.yaml      Connects External Secrets to AWS Secrets Manager
    └── mongodb-external-secret.yaml   Syncs MongoDB credentials into the cluster
```

## ArgoCD

### appset.yaml

An `ApplicationSet` that generates two ArgoCD `Application` resources — one for the frontend chart and one for the backend chart — from a single template.

```yaml
generators:
  - list:
      elements:
        - app: langchoice-backend
          chartPath: helm-charts/langchoice-backend
        - app: langchoice-frontend
          chartPath: helm-charts/langchoice-frontend
```

Both apps use `syncPolicy.automated` with `prune: true` and `selfHeal: true`:

- **prune** — if you delete a resource from the Helm chart, ArgoCD removes it from the cluster
- **selfHeal** — if someone manually edits a resource in the cluster, ArgoCD reverts it to match Git

Apply once after ArgoCD is installed:

```bash
kubectl apply -f k8s/argocd/appset.yaml

# Verify both apps were created
argocd app list
```

To force a sync without waiting for the 3-minute poll:

```bash
argocd app sync langchoice-frontend
argocd app sync langchoice-backend
```

To hard-refresh (clears manifest cache — useful after fixing a Helm error):

```bash
argocd app get langchoice-frontend --hard-refresh
```

## External Secrets

External Secrets Operator (ESO) runs in the cluster and syncs secrets from AWS Secrets Manager into Kubernetes `Secret` objects. This means credentials are never stored in Git.

### cluster-secret-store.yaml

Defines a `ClusterSecretStore` — tells ESO how to connect to AWS Secrets Manager and which IAM role to use:

```yaml
apiVersion: external-secrets.io/v1
kind: ClusterSecretStore
metadata:
  name: external-secrets
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-east-1
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets
            namespace: external-secrets
```

The service account must be annotated with the IRSA role ARN before this will work:

```bash
kubectl annotate serviceaccount external-secrets \
  -n external-secrets \
  eks.amazonaws.com/role-arn=<role-arn-from-terraform-output>
kubectl rollout restart deployment external-secrets -n external-secrets

# Verify the store is ready
kubectl get clustersecretstore
# STATUS should be: Valid   True
```

### mongodb-external-secret.yaml

Defines an `ExternalSecret` that pulls MongoDB credentials from the AWS secret named `mongodb-secret` and creates a Kubernetes `Secret` with the same name in the `langchoice` namespace:

```yaml
  data:
    - secretKey: mongodb-root-password
      remoteRef:
        key: mongodb-secret
        property: rootPassword

    - secretKey: mongodb-passwords
      remoteRef:
        key: mongodb-secret
        property: password

    - secretKey: mongodb-password
      remoteRef:
        key: mongodb-secret
        property: password
    
    - secretKey: mongodb-username
      remoteRef:
        key: mongodb-secret
        property: username

    - secretKey: mongodb-database
      remoteRef:
        key: mongodb-secret
        property: database
```

The Bitnami MongoDB Helm chart reads from this Kubernetes Secret via `auth.existingSecret: mongodb-secret`.

Apply after the ClusterSecretStore is ready:

```bash
kubectl apply -f k8s/external-secrets/cluster-secret-store.yaml
kubectl apply -f k8s/external-secrets/mongodb-external-secret.yaml

# Verify sync
kubectl get externalsecret mongodb-secret -n langchoice
# STATUS should be: Synced   True

# Confirm the K8s Secret was created
kubectl get secret mongodb-secret -n langchoice
```

## AWS secret format

Your secret in AWS Secrets Manager must have this JSON structure:

```json
{
  "username": "langchoice",
  "password": "your-app-password",
  "rootPassword": "your-root-password",
  "database": "langchoice-db"
}
```

Create or update it with:

```bash
aws secretsmanager create-secret \
  --name mongodb-secret \
  --region us-east-1 \
  --secret-string '{
    "username": "langchoice",
    "password": "your-app-password",
    "rootPassword": "your-root-password"
    "database": "langchoice-db"
  }'
```