pipeline {
  agent any

  environment {
    FRONTEND_IMAGE = 'iamridoydey/langchoice-frontend'
    BACKEND_IMAGE  = 'iamridoydey/langchoice-backend'
    VERSION        = "${BUILD_ID}"
  }

  stages {

    // ── 1. Checkout ───────────────────────────────────────────────────────
    stage('checkout') {
      steps {
        git(
          url:           'https://github.com/iamridoydey/langchoice.git',
          credentialsId: 'github-token',
          branch:        'main'
        )
      }
    }

    // ── 2. Detect changes ─────────────────────────────────────────────────
    // Only build what actually changed.
    // HEAD~1 compares current commit with previous commit.
  stage('detect-changes') {
    steps {
      script {

        // Check if build was triggered manually
        def manualTrigger = currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause').size() > 0

        if (manualTrigger) {
          // Manual trigger — build everything
          echo "Manual trigger detected — building all services"
          env.BUILD_FRONTEND = 'true'
          env.BUILD_BACKEND  = 'true'
        } else {
          // Webhook trigger — only build what changed
          def changedFiles = sh(
            script: 'git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD',
            returnStdout: true
          ).trim()

          echo "Changed files:\n${changedFiles}"

          env.BUILD_FRONTEND = changedFiles.contains('frontend/') ? 'true' : 'false'
          env.BUILD_BACKEND  = changedFiles.contains('backend/')  ? 'true' : 'false'

          echo "Build frontend : ${env.BUILD_FRONTEND}"
          echo "Build backend  : ${env.BUILD_BACKEND}"

          if (env.BUILD_FRONTEND == 'false' && env.BUILD_BACKEND == 'false') {
            currentBuild.result = 'NOT_BUILT'
            error('No application code changed — skipping build')
          }
        }
      }
    }
  }

    // ── 3. Commit hash ────────────────────────────────────────────────────
    // Tag images with both BUILD_ID and commit hash so any running
    // image can be traced back to the exact Git commit.
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

    // ── 5. Build images (parallel) ────────────────────────────────────────
    stage('build-images') {
      parallel {

        stage('build-frontend') {
          when {
            expression { env.BUILD_FRONTEND == 'true' }
          }
          steps {
            echo 'Building frontend image...'
            sh """
              docker build \
                -t ${FRONTEND_IMAGE}:${VERSION} \
                -t ${FRONTEND_IMAGE}:${COMMIT_HASH} \
                -t ${FRONTEND_IMAGE}:latest \
                ./frontend
            """
          }
        }

        stage('build-backend') {
          when {
            expression { env.BUILD_BACKEND == 'true' }
          }
          steps {
            echo 'Building backend image...'
            sh """
              docker build \
                -t ${BACKEND_IMAGE}:${VERSION} \
                -t ${BACKEND_IMAGE}:${COMMIT_HASH} \
                -t ${BACKEND_IMAGE}:latest \
                ./backend
            """
          }
        }

      }
    }

    // ── 6. Push images (parallel) ─────────────────────────────────────────
    stage('push-images') {
      parallel {

        stage('push-frontend') {
          when {
            expression { env.BUILD_FRONTEND == 'true' }
          }
          steps {
            echo 'Pushing frontend image...'
            sh """
              docker push ${FRONTEND_IMAGE}:${VERSION}
              docker push ${FRONTEND_IMAGE}:${COMMIT_HASH}
              docker push ${FRONTEND_IMAGE}:latest
            """
          }
        }

        stage('push-backend') {
          when {
            expression { env.BUILD_BACKEND == 'true' }
          }
          steps {
            echo 'Pushing backend image...'
            sh """
              docker push ${BACKEND_IMAGE}:${VERSION}
              docker push ${BACKEND_IMAGE}:${COMMIT_HASH}
              docker push ${BACKEND_IMAGE}:latest
            """
          }
        }

      }
    }

    // ── 7. Update manifests ───────────────────────────────────────────────
    // Jenkins updates values.yaml with the new image tag.
    // ArgoCD polls the repo and syncs the new tag to the cluster.
    //
    // [skip ci] in the commit message prevents the CI loop:
    //   → Jenkins webhook sees [skip ci] → skips triggering a new build
    //   → ArgoCD sees the values.yaml change → syncs to cluster
    stage('update-manifests') {
      steps {
        withCredentials([string(credentialsId: 'github-token', variable: 'GH_TOKEN')]) {
          script {
            // Extract to local Groovy vars first.
            // Groovy env.VAR inside sh "" works for simple strings
            // but shell conditionals need plain shell vars — assign them
            // at the top of the sh block to avoid expansion issues.
            def buildFrontend = env.BUILD_FRONTEND
            def buildBackend  = env.BUILD_BACKEND
            def commitHash    = env.COMMIT_HASH
            def version       = env.VERSION

            sh """
              git config user.email "jenkins@langchoice.com"
              git config user.name  "Jenkins"

              # Authenticate push using GitHub personal access token
              git remote set-url origin https://${GH_TOKEN}@github.com/iamridoydey/langchoice.git

              # Pull latest to avoid push rejection if repo changed
              git pull origin main --rebase

              # ── Update frontend values.yaml ──────────────────────────
              # Matches:  tag: "anything"
              # Replaces: tag: "abc1234"
              if [ "${buildFrontend}" = "true" ]; then
                sed -i 's|tag: ".*"|tag: "${commitHash}"|' helm-charts/langchoice-frontend/values.yaml
                git add helm-charts/langchoice-frontend/values.yaml
                echo "Frontend tag updated to ${commitHash}"
              fi

              # ── Update backend values.yaml ───────────────────────────
              if [ "${buildBackend}" = "true" ]; then
                sed -i 's|tag: ".*"|tag: "${commitHash}"|' helm-charts/langchoice-backend/values.yaml
                git add helm-charts/langchoice-backend/values.yaml
                echo "Backend tag updated to ${commitHash}"
              fi

              # Only commit if there are staged changes
              # git diff --cached --quiet exits 0 if nothing staged
              if git diff --cached --quiet; then
                echo "No manifest changes to commit — nothing to push"
              else
                # [skip ci] stops Jenkins from triggering on this commit
                git commit -m "ci: update image tag to ${commitHash} [skip ci]"
                git push origin main
                echo "Manifests pushed successfully"
              fi
            """
          }
        }
      }
    }

  } // end stages

  // ── Post actions ──────────────────────────────────────────────────────────
  post {

    always {
      echo "Build #${BUILD_ID} finished"

      // Clean up local Docker images to prevent disk fill-up on Jenkins EC2
      // COMMIT_HASH may be empty if pipeline failed before stage 3 — || true handles that
      sh """
        docker rmi ${FRONTEND_IMAGE}:${VERSION}      || true
        docker rmi ${FRONTEND_IMAGE}:${COMMIT_HASH}  || true
        docker rmi ${FRONTEND_IMAGE}:latest          || true
        docker rmi ${BACKEND_IMAGE}:${VERSION}       || true
        docker rmi ${BACKEND_IMAGE}:${COMMIT_HASH}   || true
        docker rmi ${BACKEND_IMAGE}:latest           || true
        docker logout                                || true
      """

      // Clean workspace so leftover files don't affect the next build
      cleanWs()
    }

    success {
      echo "Build #${BUILD_ID} succeeded — tags: ${VERSION} / ${COMMIT_HASH}"
    }

    failure {
      echo "Build #${BUILD_ID} failed — check logs above"
    }

  }
}