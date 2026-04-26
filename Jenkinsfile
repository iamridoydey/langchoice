pipeline {
  agent any

  environment {
    FRONTEND_IMAGE   = 'iamridoydey/langchoice-frontend'
    BACKEND_IMAGE    = 'iamridoydey/langchoice-backend'
    VERSION          = "${BUILD_ID}"
    MANIFEST_REPO    = 'https://github.com/iamridoydey/langchoice-manifests.git'
  }

  stages {

    // ── 1. Checkout app code ──────────────────────────────────────────────
    stage('checkout') {
      steps {
        git(
          url: 'https://github.com/iamridoydey/langchoice.git',
          credentialsId: 'github-creds',
          branch: 'main'
        )
      }
    }

    // ── 2. Detect which service changed ──────────────────────────────────
    // Only build what actually changed — no point rebuilding frontend
    // if only backend files were touched and vice versa.
    stage('detect-changes') {
      steps {
        script {
          def changedFiles = sh(
            script: 'git diff --name-only HEAD~1 HEAD',
            returnStdout: true
          ).trim()

          echo "Changed files:\n${changedFiles}"

          env.BUILD_FRONTEND = changedFiles.contains('frontend/') ? 'true' : 'false'
          env.BUILD_BACKEND  = changedFiles.contains('backend/')  ? 'true' : 'false'

          echo "Build frontend : ${env.BUILD_FRONTEND}"
          echo "Build backend  : ${env.BUILD_BACKEND}"
        }
      }
    }

    // ── 3. Generate short commit hash ────────────────────────────────────
    // We tag images with both BUILD_ID (sequential) and commit hash
    // so that we can trace any running image back to the exact commit.
    stage('generate-commit-hash') {
      steps {
        script {
          env.COMMIT_HASH = sh(
            script: 'git rev-parse --short HEAD',
            returnStdout: true
          ).trim()
          echo "Commit hash: ${env.COMMIT_HASH}"
        }
      }
    }

    // ── 4. DockerHub login ────────────────────────────────────────────────
    stage('dockerhub-login') {
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'dockerhub',
          usernameVariable: 'DOCKERHUB_USER',
          passwordVariable: 'DOCKERHUB_PASS'
        )]) {
          sh 'echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin'
        }
        echo 'DockerHub login successful'
      }
    }

    // ── 5. Build images (parallel, skips unchanged service) ───────────────
    stage('build-images') {
      parallel {              

        stage('build-frontend') {
          when {
            expression { env.BUILD_FRONTEND == 'true' }
          }
          steps {
            script {
              echo 'Building frontend image...'
              sh """
                docker build \
                  -t ${env.FRONTEND_IMAGE}:${env.VERSION} \
                  -t ${env.FRONTEND_IMAGE}:${env.COMMIT_HASH} \
                  -t ${env.FRONTEND_IMAGE}:latest \
                  ./frontend
              """
            }
          }
        }

        stage('build-backend') {
          when {
            expression { env.BUILD_BACKEND == 'true' }
          }
          steps {
            script {
              echo 'Building backend image...'
              sh """
                docker build \
                  -t ${env.BACKEND_IMAGE}:${env.VERSION} \
                  -t ${env.BACKEND_IMAGE}:${env.COMMIT_HASH} \
                  -t ${env.BACKEND_IMAGE}:latest \
                  ./backend
              """
            }
          }
        }

      }
    }

    // ── 6. Push images (parallel, skips unchanged service) ────────────────
    stage('push-images') {
      parallel {

        stage('push-frontend') {
          when {
            expression { env.BUILD_FRONTEND == 'true' }
          }
          steps {
            script {
              echo 'Pushing frontend image...'
              sh "docker push ${env.FRONTEND_IMAGE}:${env.VERSION}"
              sh "docker push ${env.FRONTEND_IMAGE}:${env.COMMIT_HASH}"
              sh "docker push ${env.FRONTEND_IMAGE}:latest"
            }
          }
        }

        stage('push-backend') {
          when {
            expression { env.BUILD_BACKEND == 'true' }
          }
          steps {
            script {
              echo 'Pushing backend image...'
              sh "docker push ${env.BACKEND_IMAGE}:${env.VERSION}"
              sh "docker push ${env.BACKEND_IMAGE}:${env.COMMIT_HASH}"
              sh "docker push ${env.BACKEND_IMAGE}:latest"
            }
          }
        }

      }
    }

    // ── 7. Update manifest repo so ArgoCD picks up the new tag ────────────
    // Jenkins clones the separate manifest repo, edits values.yaml,
    // and pushes the commit. ArgoCD polls this repo and syncs the
    // new image tag to the cluster automatically.
  stage('update-manifests') {
    when {
      expression { env.BUILD_FRONTEND == 'true' || env.BUILD_BACKEND == 'true' }
    }

  steps {

    withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
      sh """
        # Need to setup to push the code in the repo
        git config user.email "jenkins@langchoice.com"
        git config user.name  "Jenkins"

        # Set the remote URL with token so we can push
        git remote set-url origin https://${GH_TOKEN}@github.com/iamridoydey/langchoice.git

        # Update frontend tag
        if [ "${env.BUILD_FRONTEND}" = "true" ]; then
          sed -i 's|tag: ".*" | tag: "${env.COMMIT_HASH}" |' helm-charts/langchioce-frontend/values.yaml
          echo "Updated langchoice-frontend tag to build-${env.VERSION}"
        fi

        # Update backend tag
        if [ "${env.BUILD_BACKEND}" = "true" ]; then
          sed -i 's|tag: ".*" |tag: "${env.COMMIT_HASH}" |' helm-charts/langchioce-backend/values.yaml
          echo "Updated langchoice-backend tag to ${env.COMMIT_HASH}"
        fi

        git add helm-charts/langchoice-frontend/values.yaml helm-charts/langchoice-backend/values.yaml
        git commit -m "jenkins-ci: Update image tag to ${env.COMMIT_HASH}"
        git push
      """
    }
  }
}
  } // end stages  

  // ── Post actions ─────────────────────────────────────────────────────────
  post {

    always {
      echo "Build #${env.BUILD_ID} finished"

      // Remove local docker images to prevent disk fill-up on Jenkins EC2
      // || true means: don't fail the pipeline if image doesn't exist
      sh """
        docker rmi ${env.FRONTEND_IMAGE}:${env.VERSION}    || true
        docker rmi ${env.FRONTEND_IMAGE}:${env.COMMIT_HASH} || true
        docker rmi ${env.FRONTEND_IMAGE}:latest             || true
        docker rmi ${env.BACKEND_IMAGE}:${env.VERSION}     || true
        docker rmi ${env.BACKEND_IMAGE}:${env.COMMIT_HASH}  || true
        docker rmi ${env.BACKEND_IMAGE}:latest              || true
        docker logout                                        || true
      """

      // Clean workspace — runs even on failure so disk doesn't fill up
      cleanWs()
    }

    success {
      echo "Build #${env.BUILD_ID} succeeded. Image tags: ${env.VERSION} / ${env.COMMIT_HASH}"
    }

    failure {
      echo "Build #${env.BUILD_ID} failed. Check the logs above."
    }

  }

}