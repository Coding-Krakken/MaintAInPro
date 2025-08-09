# 🚀 DevOps Excellence & Infrastructure Engineering

## 📋 Overview

This document establishes the DevOps and infrastructure engineering standards
for MaintAInPro, implementing practices equivalent to those used by elite
technology organizations. The framework ensures reproducible deployments,
comprehensive automation, and operational excellence at enterprise scale.

## 🎯 DevOps Philosophy & Principles

### **Elite Engineering Culture**

#### **Core DevOps Principles**

```yaml
devops_principles:
  collaboration:
    - cross_functional_teams:
        'Development, operations, and security collaboration'
    - shared_responsibility: 'Collective ownership of production systems'
    - blameless_culture: 'Learning-focused incident response'
    - continuous_feedback: 'Real-time feedback loops across teams'

  automation:
    - infrastructure_as_code: '100% infrastructure automation'
    - deployment_automation: 'Fully automated deployment pipelines'
    - testing_automation: 'Comprehensive automated testing'
    - monitoring_automation: 'Self-healing systems with auto-remediation'

  measurement:
    - everything_measured: 'Comprehensive metrics collection'
    - data_driven_decisions: 'Evidence-based optimization'
    - continuous_improvement: 'Regular retrospectives and optimization'
    - performance_budgets: 'Strict performance and quality gates'

  sharing:
    - knowledge_sharing: 'Documentation-first culture'
    - tooling_standardization: 'Consistent tooling across teams'
    - best_practices: 'Shared libraries and patterns'
    - incident_learning: 'Postmortem-driven improvements'
```

### **Deployment Topology & Environments**

#### **Multi-Environment Strategy**

```typescript
interface EnvironmentTopology {
  development: {
    purpose: 'Individual developer workspaces and feature development';
    infrastructure: 'Docker Compose with local services';
    database: 'PostgreSQL container with test data';
    storage: 'Local filesystem with Supabase emulator';
    monitoring: 'Basic logging with development tools';
    deployment: 'Hot reload with watch mode';
  };

  testing: {
    purpose: 'Automated testing and quality assurance';
    infrastructure: 'Kubernetes cluster with limited resources';
    database: 'Managed PostgreSQL with sanitized production data';
    storage: 'Object storage with test data isolation';
    monitoring: 'Test metrics and coverage reporting';
    deployment: 'Automated on feature branch creation';
  };

  staging: {
    purpose: 'Production mirror for integration testing';
    infrastructure: 'Production-equivalent Kubernetes cluster';
    database: 'Multi-AZ managed PostgreSQL with production schema';
    storage: 'Replicated object storage with production-like data';
    monitoring: 'Full observability stack with alerting';
    deployment: 'Automated on main branch merge';
  };

  production: {
    purpose: 'Customer-facing environment with high availability';
    infrastructure: 'Multi-region Kubernetes with auto-scaling';
    database: 'High-availability PostgreSQL with read replicas';
    storage: 'Geo-replicated object storage with CDN';
    monitoring: 'Comprehensive observability with 24/7 alerting';
    deployment: 'Blue-green deployment with approval gates';
  };
}
```

## 🏗️ Infrastructure as Code (IaC)

### **Kubernetes-Native Architecture**

#### **Cluster Configuration**

```yaml
# cluster-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cluster-config
data:
  cluster-settings: |
    cluster:
      name: maintainpro-production
      version: "1.28"
      region: us-west-2
      availability_zones: ["us-west-2a", "us-west-2b", "us-west-2c"]
      
    node_groups:
      system:
        instance_type: m6i.large
        min_size: 3
        max_size: 6
        disk_size: 100
        labels:
          node-type: system
        taints:
          - key: "CriticalAddonsOnly"
            operator: "Exists"
            effect: "NoSchedule"
      
      application:
        instance_type: m6i.xlarge
        min_size: 6
        max_size: 50
        disk_size: 200
        labels:
          node-type: application
        
      compute:
        instance_type: c6i.2xlarge
        min_size: 0
        max_size: 20
        disk_size: 100
        labels:
          node-type: compute
        spot_instances: true

    networking:
      vpc_cidr: "10.0.0.0/16"
      service_cidr: "172.20.0.0/16"
      pod_cidr: "10.244.0.0/16"
      dns_cluster_ip: "172.20.0.10"
      
    addons:
      - name: aws-load-balancer-controller
        version: "v2.6.0"
      - name: cluster-autoscaler
        version: "v1.28.0"
      - name: aws-ebs-csi-driver
        version: "v1.24.0"
```

#### **Application Deployment Manifests**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: maintainpro-web
  labels:
    app: maintainpro-web
    version: v1.0.0
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 1
  selector:
    matchLabels:
      app: maintainpro-web
  template:
    metadata:
      labels:
        app: maintainpro-web
        version: v1.0.0
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '3000'
        prometheus.io/path: '/metrics'
    spec:
      serviceAccountName: maintainpro-web
      securityContext:
        runAsNonRoot: true
        runAsUser: 1001
        fsGroup: 1001
      containers:
        - name: web
          image: maintainpro/web:v1.0.0
          imagePullPolicy: Always
          ports:
            - containerPort: 3000
              name: http
          env:
            - name: NODE_ENV
              value: 'production'
            - name: SUPABASE_URL
              valueFrom:
                secretKeyRef:
                  name: maintainpro-secrets
                  key: supabase-url
            - name: SUPABASE_ANON_KEY
              valueFrom:
                secretKeyRef:
                  name: maintainpro-secrets
                  key: supabase-anon-key
          resources:
            requests:
              memory: '256Mi'
              cpu: '250m'
            limits:
              memory: '512Mi'
              cpu: '500m'
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 2
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: cache
              mountPath: /app/.cache
      volumes:
        - name: tmp
          emptyDir: {}
        - name: cache
          emptyDir: {}
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - maintainpro-web
                topologyKey: kubernetes.io/hostname
      tolerations:
        - key: 'node-type'
          operator: 'Equal'
          value: 'application'
          effect: 'NoSchedule'

---
apiVersion: v1
kind: Service
metadata:
  name: maintainpro-web-service
  labels:
    app: maintainpro-web
spec:
  selector:
    app: maintainpro-web
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
      name: http
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: maintainpro-web-ingress
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS":443}]'
spec:
  rules:
    - host: app.maintainpro.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: maintainpro-web-service
                port:
                  number: 80
```

### **Helm Chart Architecture**

#### **Production Helm Chart**

```yaml
# Chart.yaml
apiVersion: v2
name: maintainpro
description: Enterprise CMMS Platform
type: application
version: 1.0.0
appVersion: '1.0.0'
home: https://maintainpro.com
sources:
  - https://github.com/maintainpro/maintainpro
maintainers:
  - name: Platform Team
    email: platform@maintainpro.com

dependencies:
  - name: postgresql
    version: 12.1.2
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  - name: redis
    version: 17.3.7
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
  - name: prometheus
    version: 15.18.0
    repository: https://prometheus-community.github.io/helm-charts
    condition: monitoring.prometheus.enabled

# values.yaml
global:
  imageRegistry: 'registry.maintainpro.com'
  imagePullSecrets:
    - name: registry-secret
  storageClass: 'gp3'

web:
  enabled: true
  replicaCount: 6
  image:
    repository: maintainpro/web
    tag: '1.0.0'
    pullPolicy: Always

  autoscaling:
    enabled: true
    minReplicas: 6
    maxReplicas: 50
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80

  resources:
    requests:
      memory: '256Mi'
      cpu: '250m'
    limits:
      memory: '512Mi'
      cpu: '500m'

  service:
    type: ClusterIP
    port: 80
    targetPort: 3000

  ingress:
    enabled: true
    className: 'alb'
    annotations:
      alb.ingress.kubernetes.io/scheme: internet-facing
      alb.ingress.kubernetes.io/target-type: ip
      alb.ingress.kubernetes.io/ssl-redirect: '443'
    hosts:
      - host: app.maintainpro.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: maintainpro-tls
        hosts:
          - app.maintainpro.com

edgeFunctions:
  enabled: true
  replicaCount: 3
  image:
    repository: maintainpro/edge-functions
    tag: '1.0.0'
    pullPolicy: Always

  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilizationPercentage: 60

postgresql:
  enabled: false # Using managed database

redis:
  enabled: true
  auth:
    enabled: true
    password: 'change-me'
  master:
    persistence:
      enabled: true
      size: 8Gi
      storageClass: 'gp3'

monitoring:
  prometheus:
    enabled: true
  grafana:
    enabled: true
    adminPassword: 'change-me'
  alertmanager:
    enabled: true

secrets:
  supabaseUrl: 'https://xxx.supabase.co'
  supabaseAnonKey: 'change-me'
  supabaseServiceKey: 'change-me'
  jwtSecret: 'change-me'
```

## 🔄 CI/CD Pipeline Excellence

### **GitHub Actions Workflow**

#### **Comprehensive Pipeline**

```yaml
# .github/workflows/ci-cd.yml
name: Elite CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Phase 1: Code Quality & Security
  quality-gates:
    name: Quality Gates
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Required for SonarQube analysis

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install Dependencies
        run: |
          npm ci --frozen-lockfile
          npm audit --audit-level=moderate

      - name: Code Quality Analysis
        run: |
          npm run lint:strict
          npm run type-check:strict
          npm run format:check

      - name: Unit & Integration Tests
        run: |
          npm run test:coverage
          npm run test:integration
        env:
          CI: true
          COVERAGE_THRESHOLD: 95

      - name: Mutation Testing
        run: npm run test:mutation
        env:
          MUTATION_THRESHOLD: 80

      - name: Security Scanning
        run: |
          npx snyk test --severity-threshold=medium
          npx semgrep --config=auto --error
          npx audit-ci --moderate

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: SonarQube Analysis
        uses: sonarqube-quality-gate-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  # Phase 2: Build & Container Security
  build-and-scan:
    name: Build & Security Scan
    runs-on: ubuntu-latest
    needs: quality-gates

    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      image-tag: ${{ steps.meta.outputs.tags }}

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract Metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-

      - name: Build Container Image
        id: build
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./Dockerfile.production
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Container Security Scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.meta.outputs.tags }}
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'

      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Phase 3: End-to-End Testing
  e2e-testing:
    name: E2E Testing
    runs-on: ubuntu-latest
    needs: build-and-scan

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci --frozen-lockfile

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Run E2E Tests
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload E2E Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: e2e-results-${{ matrix.browser }}
          path: test-results/
          retention-days: 30

  # Phase 4: Performance Testing
  performance-testing:
    name: Performance Testing
    runs-on: ubuntu-latest
    needs: build-and-scan

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci --frozen-lockfile

      - name: Build Application
        run: npm run build
        env:
          NODE_ENV: production

      - name: Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.12.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Bundle Analysis
        run: |
          npm run build:analyze
          npx bundlewatch --config .bundlewatch.config.js

  # Phase 5: Staging Deployment
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [e2e-testing, performance-testing]
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Setup Kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'

      - name: Setup Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.13.0'

      - name: Deploy to Staging
        run: |
          aws eks update-kubeconfig --name maintainpro-staging
          helm upgrade --install maintainpro-staging ./helm/maintainpro \
            --namespace maintainpro-staging \
            --create-namespace \
            --values ./helm/maintainpro/values-staging.yaml \
            --set web.image.tag=${{ github.sha }} \
            --wait --timeout=600s

      - name: Staging Smoke Tests
        run: |
          npm run test:smoke -- --baseURL=https://staging.maintainpro.com

      - name: Security Baseline Test
        run: |
          npx newman run ./tests/security/api-security-tests.json \
            --environment ./tests/security/staging-environment.json

  # Phase 6: Production Deployment
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: deploy-staging
    if: github.event_name == 'release' && github.event.action == 'published'
    environment: production

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: us-west-2

      - name: Setup Kubectl
        uses: azure/setup-kubectl@v3
        with:
          version: 'v1.28.0'

      - name: Setup Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.13.0'

      - name: Blue-Green Deployment
        run: |
          aws eks update-kubeconfig --name maintainpro-production

          # Deploy to green environment
          helm upgrade --install maintainpro-green ./helm/maintainpro \
            --namespace maintainpro-production \
            --values ./helm/maintainpro/values-production.yaml \
            --set web.image.tag=${{ github.sha }} \
            --set deployment.slot=green \
            --wait --timeout=900s

          # Run health checks
          npm run test:health -- --baseURL=https://green.maintainpro.com

          # Switch traffic to green
          kubectl patch service maintainpro-web-service \
            -p '{"spec":{"selector":{"slot":"green"}}}'

          # Wait for traffic validation
          sleep 300

          # Remove blue environment
          helm uninstall maintainpro-blue --namespace maintainpro-production || true

          # Rename green to blue for next deployment
          kubectl label deployment maintainpro-green-web slot=blue --overwrite

      - name: Production Validation
        run: |
          npm run test:smoke -- --baseURL=https://app.maintainpro.com
          npm run test:security -- --baseURL=https://app.maintainpro.com

      - name: Update Deployment Status
        run: |
          curl -X POST https://api.github.com/repos/${{ github.repository }}/deployments \
            -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
            -d '{
              "ref": "${{ github.sha }}",
              "environment": "production",
              "description": "Deployed version ${{ github.ref_name }}",
              "auto_merge": false
            }'

  # Phase 7: Post-Deployment Monitoring
  post-deployment:
    name: Post-Deployment Monitoring
    runs-on: ubuntu-latest
    needs: deploy-production
    if: always()

    steps:
      - name: Monitor Deployment Health
        run: |
          # Monitor key metrics for 10 minutes after deployment
          for i in {1..10}; do
            echo "Health check $i/10"
            curl -f https://app.maintainpro.com/health || exit 1
            sleep 60
          done

      - name: Update Status Checks
        run: |
          # Update external monitoring services
          curl -X POST "${{ secrets.DATADOG_WEBHOOK_URL }}" \
            -d "Deployment completed: ${{ github.sha }}"

          curl -X POST "${{ secrets.PAGERDUTY_WEBHOOK_URL }}" \
            -d "Production deployment successful"
```

## 📊 Configuration Management & Secrets

### **Environment Configuration Strategy**

#### **Multi-Environment Configuration**

```typescript
interface EnvironmentConfig {
  development: {
    database: {
      host: 'localhost';
      port: 5432;
      ssl: false;
      maxConnections: 10;
    };
    redis: {
      host: 'localhost';
      port: 6379;
      ssl: false;
    };
    monitoring: {
      enabled: false;
      level: 'debug';
    };
  };

  staging: {
    database: {
      host: 'staging-db.maintainpro.com';
      port: 5432;
      ssl: true;
      maxConnections: 50;
    };
    redis: {
      host: 'staging-redis.maintainpro.com';
      port: 6379;
      ssl: true;
    };
    monitoring: {
      enabled: true;
      level: 'info';
    };
  };

  production: {
    database: {
      host: 'prod-db.maintainpro.com';
      port: 5432;
      ssl: true;
      maxConnections: 200;
    };
    redis: {
      host: 'prod-redis.maintainpro.com';
      port: 6379;
      ssl: true;
    };
    monitoring: {
      enabled: true;
      level: 'warn';
    };
  };
}
```

#### **Secrets Management with HashiCorp Vault**

```yaml
# vault-config.yaml
vault:
  server:
    ha:
      enabled: true
      replicas: 3

    dataStorage:
      enabled: true
      size: 10Gi
      storageClass: gp3

    auditStorage:
      enabled: true
      size: 5Gi
      storageClass: gp3

    seal:
      awskms:
        enabled: true
        region: us-west-2
        kmsKeyId: 'arn:aws:kms:us-west-2:123456789012:key/12345678-1234-1234-1234-123456789012'

    auth:
      kubernetes:
        enabled: true
        role: 'maintainpro'
        bound_service_account_names: ['maintainpro-web', 'maintainpro-api']
        bound_service_account_namespaces: ['maintainpro-production']
        policies: ['maintainpro-read']

  secrets:
    database:
      path: 'secret/database'
      data:
        username: 'maintainpro_user'
        password: '{{ vault_generated_password }}'
        connection_string:
          'postgresql://maintainpro_user:{{ vault_generated_password
          }}@prod-db.maintainpro.com:5432/maintainpro'

    supabase:
      path: 'secret/supabase'
      data:
        url: 'https://xxx.supabase.co'
        anon_key: '{{ supabase_anon_key }}'
        service_key: '{{ supabase_service_key }}'

    jwt:
      path: 'secret/jwt'
      data:
        secret: '{{ vault_generated_jwt_secret }}'
        issuer: 'maintainpro.com'
        expiry: '15m'

# External Secrets Operator Configuration
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: maintainpro-production
spec:
  provider:
    vault:
      server: 'https://vault.maintainpro.com'
      path: 'secret'
      version: 'v2'
      auth:
        kubernetes:
          mountPath: 'kubernetes'
          role: 'maintainpro'
          serviceAccountRef:
            name: 'external-secrets-sa'

---
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: maintainpro-secrets
  namespace: maintainpro-production
spec:
  refreshInterval: 300s
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: maintainpro-secrets
    creationPolicy: Owner
  data:
    - secretKey: database-url
      remoteRef:
        key: database
        property: connection_string
    - secretKey: supabase-url
      remoteRef:
        key: supabase
        property: url
    - secretKey: supabase-anon-key
      remoteRef:
        key: supabase
        property: anon_key
    - secretKey: jwt-secret
      remoteRef:
        key: jwt
        property: secret
```

## 🔍 Observability & Monitoring Excellence

### **Comprehensive Monitoring Stack**

#### **Prometheus & Grafana Configuration**

```yaml
# monitoring-stack.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
      external_labels:
        cluster: 'maintainpro-production'
        environment: 'production'

    rule_files:
      - "/etc/prometheus/rules/*.yml"

    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093

    scrape_configs:
      # Application Metrics
      - job_name: 'maintainpro-web'
        kubernetes_sd_configs:
          - role: endpoints
        relabel_configs:
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
      
      # Database Metrics
      - job_name: 'postgresql'
        static_configs:
          - targets: ['postgres-exporter:9187']
      
      # Redis Metrics
      - job_name: 'redis'
        static_configs:
          - targets: ['redis-exporter:9121']
      
      # Kubernetes Metrics
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
      
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true

  alerting_rules.yml: |
    groups:
      - name: maintainpro.rules
        rules:
          # SLO-based alerting
          - alert: HighErrorRate
            expr: (sum(rate(http_requests_total{code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.01
            for: 2m
            labels:
              severity: critical
              team: platform
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value | humanizePercentage }} which is above the 1% threshold"
          
          - alert: HighLatency
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.2
            for: 5m
            labels:
              severity: warning
              team: platform
            annotations:
              summary: "High latency detected"
              description: "95th percentile latency is {{ $value }}s which is above the 200ms threshold"
          
          - alert: DatabaseConnectionHigh
            expr: postgres_connections_active / postgres_connections_max > 0.8
            for: 5m
            labels:
              severity: warning
              team: platform
            annotations:
              summary: "Database connection usage high"
              description: "Database connections are at {{ $value | humanizePercentage }} of maximum"
          
          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
            for: 5m
            labels:
              severity: critical
              team: platform
            annotations:
              summary: "Pod is crash looping"
              description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"

---
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
data:
  maintainpro-overview.json: |
    {
      "dashboard": {
        "id": null,
        "title": "MaintAInPro - Platform Overview",
        "tags": ["maintainpro", "platform"],
        "timezone": "browser",
        "panels": [
          {
            "id": 1,
            "title": "Request Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "sum(rate(http_requests_total[5m])) by (method, status)",
                "legendFormat": "{{method}} {{status}}"
              }
            ],
            "yAxes": [
              {
                "label": "Requests/sec",
                "min": 0
              }
            ]
          },
          {
            "id": 2,
            "title": "Response Time",
            "type": "graph",
            "targets": [
              {
                "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "50th percentile"
              },
              {
                "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "95th percentile"
              },
              {
                "expr": "histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))",
                "legendFormat": "99th percentile"
              }
            ],
            "yAxes": [
              {
                "label": "Response time (seconds)",
                "min": 0
              }
            ]
          },
          {
            "id": 3,
            "title": "Error Rate",
            "type": "singlestat",
            "targets": [
              {
                "expr": "(sum(rate(http_requests_total{code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))) * 100",
                "legendFormat": "Error Rate %"
              }
            ],
            "thresholds": "1,5",
            "colorBackground": true
          }
        ],
        "time": {
          "from": "now-1h",
          "to": "now"
        },
        "refresh": "5s"
      }
    }
```

#### **Distributed Tracing with Jaeger**

```yaml
# jaeger-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jaeger-config
data:
  jaeger.yml: |
    query:
      base-path: /jaeger
      
    collector:
      zipkin:
        http-port: 9411
      
    storage:
      type: elasticsearch
      elasticsearch:
        server-urls: https://elasticsearch.maintainpro.com:9200
        username: jaeger
        password: ${ELASTICSEARCH_PASSWORD}
        index-prefix: jaeger
        create-index-templates: true
        version: 7
        
    sampling:
      strategies:
        default_strategy:
          type: probabilistic
          param: 0.1
        per_service_strategies:
          - service: "maintainpro-web"
            type: probabilistic
            param: 0.5
          - service: "maintainpro-api"
            type: probabilistic
            param: 0.8

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger-all-in-one
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
        - name: jaeger
          image: jaegertracing/all-in-one:1.50
          ports:
            - containerPort: 16686
              name: ui
            - containerPort: 14268
              name: collector
            - containerPort: 6831
              name: agent-udp
            - containerPort: 6832
              name: agent-binary
          env:
            - name: COLLECTOR_OTLP_ENABLED
              value: 'true'
            - name: ELASTICSEARCH_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: elasticsearch-credentials
                  key: password
          volumeMounts:
            - name: config
              mountPath: /etc/jaeger
          resources:
            requests:
              memory: '512Mi'
              cpu: '250m'
            limits:
              memory: '1Gi'
              cpu: '500m'
      volumes:
        - name: config
          configMap:
            name: jaeger-config
```

## 🚨 Incident Response & Disaster Recovery

### **Incident Response Automation**

#### **PagerDuty Integration**

```yaml
# alertmanager-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
data:
  alertmanager.yml: |
    global:
      pagerduty_url: 'https://events.pagerduty.com/v2/enqueue'
      
    route:
      group_by: ['alertname', 'cluster', 'service']
      group_wait: 10s
      group_interval: 10s
      repeat_interval: 1h
      receiver: 'web.hook'
      routes:
      - match:
          severity: critical
        receiver: pagerduty-critical
        group_wait: 0s
        repeat_interval: 5m
      - match:
          severity: warning
        receiver: slack-warnings
        group_wait: 1m
        repeat_interval: 4h

    receivers:
    - name: 'web.hook'
      webhook_configs:
      - url: 'http://localhost:5001/'

    - name: pagerduty-critical
      pagerduty_configs:
      - routing_key: '${PAGERDUTY_INTEGRATION_KEY}'
        description: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'
        severity: '{{ .GroupLabels.severity }}'
        client: 'MaintAInPro AlertManager'
        client_url: 'https://grafana.maintainpro.com'
        details:
          environment: '{{ .GroupLabels.environment }}'
          cluster: '{{ .GroupLabels.cluster }}'
          service: '{{ .GroupLabels.service }}'
          runbook: 'https://runbooks.maintainpro.com/{{ .GroupLabels.alertname }}'

    - name: slack-warnings
      slack_configs:
      - api_url: '${SLACK_API_URL}'
        channel: '#platform-alerts'
        title: 'Alert: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
        username: 'AlertManager'
        icon_emoji: ':warning:'
```

#### **Automated Disaster Recovery**

```bash
#!/bin/bash
# disaster-recovery.sh - Automated disaster recovery script

set -euo pipefail

ENVIRONMENT=${1:-production}
RECOVERY_TYPE=${2:-failover}
BACKUP_TIMESTAMP=${3:-latest}

echo "🚨 Initiating disaster recovery for ${ENVIRONMENT}"
echo "Recovery type: ${RECOVERY_TYPE}"
echo "Backup timestamp: ${BACKUP_TIMESTAMP}"

# Step 1: Assess current state
echo "📊 Assessing current system state..."
kubectl get nodes --show-labels
kubectl get pods --all-namespaces | grep -v Running || true

# Step 2: Switch to disaster recovery region
if [[ "${RECOVERY_TYPE}" == "failover" ]]; then
    echo "🔄 Switching to disaster recovery region..."
    aws eks update-kubeconfig --name maintainpro-${ENVIRONMENT}-dr --region us-east-1

    # Update DNS to point to DR region
    aws route53 change-resource-record-sets \
        --hosted-zone-id Z123456789 \
        --change-batch file://dns-failover.json
fi

# Step 3: Restore database from backup
echo "💾 Restoring database from backup..."
if [[ "${BACKUP_TIMESTAMP}" == "latest" ]]; then
    LATEST_BACKUP=$(aws rds describe-db-snapshots \
        --db-instance-identifier maintainpro-${ENVIRONMENT} \
        --query 'DBSnapshots[0].DBSnapshotIdentifier' --output text)
else
    LATEST_BACKUP="${BACKUP_TIMESTAMP}"
fi

aws rds restore-db-instance-from-db-snapshot \
    --db-instance-identifier maintainpro-${ENVIRONMENT}-restored \
    --db-snapshot-identifier "${LATEST_BACKUP}" \
    --db-instance-class db.r6g.xlarge \
    --multi-az

# Step 4: Deploy application to DR environment
echo "🚀 Deploying application to disaster recovery environment..."
helm upgrade --install maintainpro-${ENVIRONMENT} ./helm/maintainpro \
    --namespace maintainpro-${ENVIRONMENT} \
    --create-namespace \
    --values ./helm/maintainpro/values-${ENVIRONMENT}-dr.yaml \
    --set database.host=maintainpro-${ENVIRONMENT}-restored.cluster-xxx.us-east-1.rds.amazonaws.com \
    --wait --timeout=900s

# Step 5: Validate disaster recovery
echo "✅ Validating disaster recovery deployment..."
sleep 60  # Wait for services to stabilize

# Health checks
curl -f "https://dr.maintainpro.com/health" || {
    echo "❌ Health check failed"
    exit 1
}

# Database connectivity check
kubectl exec -n maintainpro-${ENVIRONMENT} deployment/maintainpro-web -- \
    npm run db:check || {
    echo "❌ Database connectivity check failed"
    exit 1
}

# Run critical smoke tests
npm run test:smoke -- --baseURL="https://dr.maintainpro.com" || {
    echo "❌ Smoke tests failed"
    exit 1
}

echo "✅ Disaster recovery completed successfully"
echo "🌐 Application is now running at: https://dr.maintainpro.com"

# Step 6: Notify stakeholders
curl -X POST "${SLACK_WEBHOOK_URL}" \
    -H 'Content-type: application/json' \
    --data '{
        "text": "🚨 Disaster Recovery Completed",
        "attachments": [
            {
                "color": "good",
                "fields": [
                    {
                        "title": "Environment",
                        "value": "'${ENVIRONMENT}'",
                        "short": true
                    },
                    {
                        "title": "Recovery Type",
                        "value": "'${RECOVERY_TYPE}'",
                        "short": true
                    },
                    {
                        "title": "Status",
                        "value": "✅ Successful",
                        "short": true
                    },
                    {
                        "title": "Application URL",
                        "value": "https://dr.maintainpro.com",
                        "short": true
                    }
                ]
            }
        ]
    }'

# Create incident tracking ticket
curl -X POST "https://api.pagerduty.com/incidents" \
    -H "Authorization: Token token=${PAGERDUTY_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{
        "incident": {
            "type": "incident",
            "title": "Disaster Recovery Executed - '${ENVIRONMENT}'",
            "service": {
                "id": "'${PAGERDUTY_SERVICE_ID}'",
                "type": "service_reference"
            },
            "priority": {
                "id": "'${PAGERDUTY_PRIORITY_ID}'",
                "type": "priority_reference"
            },
            "body": {
                "type": "incident_body",
                "details": "Disaster recovery has been executed for the '${ENVIRONMENT}' environment. Recovery type: '${RECOVERY_TYPE}'. Application is now running at https://dr.maintainpro.com"
            }
        }
    }'

echo "📧 Stakeholder notifications sent"
```

## 🎯 Performance Optimization & Scaling

### **Auto-Scaling Configuration**

#### **Horizontal Pod Autoscaler (HPA)**

```yaml
# hpa-config.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: maintainpro-web-hpa
  namespace: maintainpro-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: maintainpro-web
  minReplicas: 6
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: '1000'
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: maintainpro-api-hpa
  namespace: maintainpro-production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: maintainpro-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
    - type: Object
      object:
        metric:
          name: requests_per_second
        describedObject:
          apiVersion: v1
          kind: Service
          name: maintainpro-api-service
        target:
          type: Value
          value: '500'
```

#### **Vertical Pod Autoscaler (VPA)**

```yaml
# vpa-config.yaml
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: maintainpro-web-vpa
  namespace: maintainpro-production
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: maintainpro-web
  updatePolicy:
    updateMode: 'Auto'
  resourcePolicy:
    containerPolicies:
      - containerName: web
        maxAllowed:
          cpu: '2'
          memory: '4Gi'
        minAllowed:
          cpu: '100m'
          memory: '128Mi'
        controlledResources: ['cpu', 'memory']
        controlledValues: RequestsAndLimits
```

### **Cluster Auto-Scaling**

#### **Cluster Autoscaler Configuration**

```yaml
# cluster-autoscaler.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cluster-autoscaler
  namespace: kube-system
  labels:
    app: cluster-autoscaler
spec:
  selector:
    matchLabels:
      app: cluster-autoscaler
  template:
    metadata:
      labels:
        app: cluster-autoscaler
      annotations:
        prometheus.io/scrape: 'true'
        prometheus.io/port: '8085'
    spec:
      serviceAccount: cluster-autoscaler
      containers:
        - image: k8s.gcr.io/autoscaling/cluster-autoscaler:v1.28.0
          name: cluster-autoscaler
          resources:
            limits:
              cpu: 100m
              memory: 300Mi
            requests:
              cpu: 100m
              memory: 300Mi
          command:
            - ./cluster-autoscaler
            - --v=4
            - --stderrthreshold=info
            - --cloud-provider=aws
            - --skip-nodes-with-local-storage=false
            - --expander=least-waste
            - --node-group-auto-discovery=asg:tag=k8s.io/cluster-autoscaler/enabled,k8s.io/cluster-autoscaler/maintainpro-production
            - --balance-similar-node-groups
            - --scale-down-enabled=true
            - --scale-down-delay-after-add=10m
            - --scale-down-unneeded-time=10m
            - --scale-down-utilization-threshold=0.5
            - --max-node-provision-time=15m
          env:
            - name: AWS_REGION
              value: us-west-2
          volumeMounts:
            - name: ssl-certs
              mountPath: /etc/ssl/certs/ca-certificates.crt
              readOnly: true
          imagePullPolicy: Always
      volumes:
        - name: ssl-certs
          hostPath:
            path: '/etc/ssl/certs/ca-bundle.crt'
      nodeSelector:
        kubernetes.io/arch: amd64
        node-type: system
```

## 📊 DevOps Metrics & KPIs

### **DORA Metrics Implementation**

#### **Deployment Frequency**

```yaml
deployment_frequency:
  target: 'Multiple deployments per day'
  measurement:
    - github_deployments_api
    - helm_release_tracking
    - kubernetes_deployment_events

  automation:
    - automated_deployment_tracking
    - release_notes_generation
    - deployment_success_rate_monitoring

lead_time_for_changes:
  target: '<24 hours from commit to production'
  measurement:
    - git_commit_timestamp
    - pipeline_completion_time
    - production_deployment_time

  optimization:
    - parallel_testing_execution
    - caching_strategies
    - infrastructure_provisioning_speed

change_failure_rate:
  target: '<2% of deployments cause issues'
  measurement:
    - rollback_frequency
    - incident_correlation
    - error_rate_increase_detection

  prevention:
    - comprehensive_testing
    - canary_deployments
    - automated_rollback_triggers

mean_time_to_recovery:
  target: '<15 minutes for critical issues'
  measurement:
    - incident_detection_time
    - response_time
    - resolution_time

  automation:
    - automated_alerting
    - runbook_automation
    - self_healing_systems
```

## 🏆 Conclusion

This DevOps Excellence framework establishes MaintAInPro's infrastructure and
operational practices at the level of elite technology organizations. Through
comprehensive automation, world-class monitoring, and battle-tested incident
response procedures, the platform achieves operational excellence that enables
rapid innovation while maintaining enterprise-grade reliability.

The framework provides the foundation for continuous improvement, enabling the
team to maintain operational excellence while rapidly delivering innovative
features that differentiate MaintAInPro in the competitive marketplace.

---

_This DevOps framework represents our commitment to operational excellence and
serves as the foundation for building and operating world-class infrastructure
that supports rapid innovation and enterprise-scale reliability._
