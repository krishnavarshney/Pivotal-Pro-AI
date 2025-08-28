# Pivotal Pro AI: Backend Architecture & Implementation Plan

This document outlines the comprehensive backend architecture for the Pivotal Pro AI application. The design prioritizes a modular, scalable foundation while preserving 100% of the existing frontend functionality. We will transition from a mock, local-storage-based persistence layer to a robust, multi-tenant SaaS backend.

## 1. Context Synthesis

### 1.1. Application Capabilities & Domain
The application is a sophisticated Business Intelligence (BI) platform with the following core capabilities:
*   **Authentication & User Management:** User signup, login, and an admin role for managing users.
*   **Data Management:**
    *   **Data Sources:** Uploading local files (CSV, Excel) and connecting to external APIs.
    *   **Data Studio:** Applying a series of transformations (renaming, calculated fields, grouping, etc.) to cleanse and prepare data.
    *   **Data Modeler:** Defining visual relationships (joins) between different data sources.
*   **Dashboarding:**
    *   **Workspace & Pages:** Multi-page dashboard organization within workspaces.
    *   **Widget Engine:** Creating, configuring, and arranging various chart types (Bar, Line, KPI, Table, etc.) on a responsive grid.
    *   **Interactivity:** Global filters, cross-filtering, drilling down, and parameter controls.
*   **AI Integration (Gemini):**
    *   AI-powered dashboard and widget generation from natural language.
    *   Data analysis, proactive insights, anomaly detection, and "what-if" scenarios.
    *   AI Chat assistant with contextual awareness of widgets.
*   **Collaboration & Presentation:**
    *   Commenting on widgets.
    *   Creating Data Stories from widgets to form narrative presentations.
    *   Bookmarking dashboard states.
    *   Saving and reusing dashboard templates.

### 1.2. Critical User Journeys
The backend must support these key flows without breaking the client:
1.  **Onboarding:** Signup -> Upload first data source -> Create first widget.
2.  **Analysis:** Login -> Select Workspace/Page -> Add/configure widgets -> Apply filters -> Gain insights via AI.
3.  **Data Prep:** Upload/connect sources -> Model relationships in Data Modeler -> Apply transformations in Data Studio.
4.  **Presentation:** Arrange dashboard -> Create a Data Story from key widgets -> Present findings.
5.  **Administration:** Admin Login -> View Admin Dashboard -> Manage user roles.

### 1.3. Assumptions & Constraints
*   **Traffic:** Assumed low-to-medium initially, but architected for horizontal scaling. Read operations (viewing dashboards) will vastly outnumber write operations (editing).
*   **Data Volume:** Data source size can vary from kilobytes to hundreds of megabytes. Data processing logic must be efficient.
*   **Backward Compatibility:** All existing mock service contracts (`authService`, `mockApiService`) must have corresponding real API endpoints. The client-side state model in `DashboardProvider` is the primary source of truth for the required data structures. The backend must persist and serve this state.
*   **Latency:** Widget data processing should be fast (<2s for medium datasets). AI interactions are subject to model provider latency.
*   **Security:** Multi-tenancy is paramount; a user's data must be completely isolated from others.

## 2. Domain Modeling & Data Architecture

A normalized PostgreSQL database is recommended for its relational integrity, powerful query capabilities, and mature JSONB support, which is ideal for storing flexible structures like widget configurations.

### 2.1. ERD (Entity-Relationship Diagram)
```mermaid
erDiagram
    users {
        UUID id PK
        TEXT name NOT NULL
        TEXT email UNIQUE NOT NULL
        TEXT password_hash NOT NULL
        TEXT role NOT NULL
        TIMESTAMPTZ created_at NOT NULL
        TIMESTAMPTZ updated_at NOT NULL
    }
    workspaces {
        UUID id PK
        UUID user_id FK
        TEXT name NOT NULL
        TIMESTAMPTZ created_at NOT NULL
        TIMESTAMPTZ updated_at NOT NULL
    }
    pages {
        UUID id PK
        UUID workspace_id FK
        TEXT name NOT NULL
        JSONB layouts
        TIMESTAMPTZ created_at NOT NULL
        TIMESTAMPTZ updated_at NOT NULL
    }
    widgets {
        UUID id PK
        UUID page_id FK
        TEXT title NOT NULL
        JSONB configuration NOT NULL
        TIMESTAMPTZ created_at NOT NULL
        TIMESTAMPTZ updated_at NOT NULL
    }
    data_sources {
        UUID id PK
        UUID workspace_id FK
        TEXT name NOT NULL
        TEXT type NOT NULL
        TEXT status NOT NULL
        JSONB connection_details
        TEXT storage_ref
        JSONB fields_schema
        TIMESTAMPTZ created_at NOT NULL
        TIMESTAMPTZ updated_at NOT NULL
        TIMESTAMPTZ last_synced_at
    }
    transformations {
        UUID id PK
        UUID data_source_id FK
        INTEGER "order" NOT NULL
        TEXT type NOT NULL
        JSONB payload NOT NULL
        TIMESTAMPTZ created_at NOT NULL
    }
    relationships {
        UUID id PK
        UUID workspace_id FK
        UUID source_a_id FK
        TEXT field_a NOT NULL
        UUID source_b_id FK
        TEXT field_b NOT NULL
        TEXT type NOT NULL
    }
    parameters {
        UUID id PK
        UUID workspace_id FK
        TEXT name NOT NULL
        JSONB config NOT NULL
    }
    stories {
        UUID id PK
        UUID workspace_id FK
        TEXT title NOT NULL
        JSONB pages NOT NULL
    }
    comments {
        UUID id PK
        UUID widget_id FK
        UUID user_id FK
        JSONB position NOT NULL
        JSONB messages NOT NULL
    }
    bookmarks {
        UUID id PK
        UUID page_id FK
        TEXT name NOT NULL
        JSONB state NOT NULL
    }
    templates {
        UUID id PK
        UUID user_id FK
        TEXT name NOT NULL
        JSONB definition NOT NULL
    }

    users ||--o{ workspaces : "owns"
    workspaces ||--o{ pages : "contains"
    workspaces ||--o{ data_sources : "contains"
    workspaces ||--o{ relationships : "defines"
    workspaces ||--o{ parameters : "defines"
    workspaces ||--o{ stories : "contains"
    pages ||--o{ widgets : "contains"
    pages ||--o{ bookmarks : "has"
    widgets ||--o{ comments : "has"
    data_sources ||--o{ transformations : "has"
    users ||--o{ templates : "creates"
    users ||--o{ comments : "authors"
    relationships }|--|| data_sources : "links_a"
    relationships }|--|| data_sources : "links_b"
```

### 2.2. Database Schema (DDL)

```sql
-- extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- enums for roles and other fixed sets
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE data_source_type AS ENUM ('file', 'database', 'api', 'cloud');
CREATE TYPE data_source_status AS ENUM ('connected', 'syncing', 'error');

-- tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_workspaces_user_id ON workspaces(user_id);

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layouts JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pages_workspace_id ON pages(workspace_id);

CREATE TABLE widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    configuration JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_widgets_page_id ON widgets(page_id);

CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type data_source_type NOT NULL,
    status data_source_status NOT NULL DEFAULT 'connected',
    connection_details JSONB,
    storage_ref TEXT, -- e.g., S3/GCS object path for file-based sources
    fields_schema JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ
);
CREATE INDEX idx_data_sources_workspace_id ON data_sources(workspace_id);

CREATE TABLE transformations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
    "order" INTEGER NOT NULL,
    type TEXT NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(data_source_id, "order")
);
CREATE INDEX idx_transformations_data_source_id ON transformations(data_source_id);

-- Other tables (stories, parameters, comments, etc.) follow a similar structure.
```
*Triggers will be used to automatically update `updated_at` timestamps.*

### 2.3. Caching Strategy
*   **Layer 1 (In-Memory, short TTL):** Cache processed widget data results for high-traffic dashboards. Key: `widget:{widget_id}:params_hash`. TTL: 1-5 minutes. Invalidation on any change to the widget, source data, or filters.
*   **Layer 2 (Redis, long TTL):** Cache raw data from external API sources to avoid re-fetching. Key: `datasource:{data_source_id}:raw`. TTL: 1-24 hours, configurable. Invalidation via a "Refresh" API call.

### 2.4. File/Blob Storage
*   Use **AWS S3** or **Google Cloud Storage**.
*   **Bucket Structure:** `pivotal-pro-data-sources-{environment}`.
*   **Object Prefixing:** `/{workspace_id}/{data_source_id}/{original_filename}`. This structure supports easy data lifecycle management and workspace-level cleanup.
*   **Uploads:** The client will request a **pre-signed URL** from the backend to upload files directly to the storage bucket. This is secure and offloads bandwidth from the application server.

## 3. API Design & Service Boundaries

A **Modular Monolith** architecture is the optimal choice. It provides clear separation of concerns without the operational overhead of microservices, making it faster to develop and deploy initially.

**Modules:** `Auth`, `Users`, `Workspaces`, `DataSources`, `AI`, `Billing` (Future).

### 3.1. API Specification (OpenAPI v3.1 Expanded Snippet)

```yaml
openapi: 3.1.0
info:
  title: Pivotal Pro AI API
  version: v1
servers:
  - url: /api/v1
paths:
  /auth/login:
    post:
      summary: User Login
      # ... (as before)
  
  /workspaces/{workspaceId}/pages/{pageId}:
    get:
      summary: Get a single dashboard page with all its widgets
      # ... (as before)
    put:
      summary: Update page details (e.g., name, layouts)
      security: [BearerAuth: []]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                layouts: { type: object } # JSONB
      responses:
        '200':
          description: Updated page object

  /pages/{pageId}/widgets:
    post:
      summary: Create a new widget on a page
      security: [BearerAuth: []]
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Widget'
      responses:
        '201':
          description: The newly created widget
    
  /widgets/{widgetId}:
    put:
      summary: Update a widget's configuration
      # ... (as before)
    delete:
      summary: Delete a widget
      security: [BearerAuth: []]
      responses:
        '204':
          description: No Content
          
  /workspaces/{workspaceId}/datasources/upload-url:
    post:
      summary: Get a pre-signed URL for file upload
      security: [BearerAuth: []]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                fileName: { type: string }
                fileType: { type: string }
      responses:
        '200':
          description: Pre-signed URL and data source ID
          
  /datasources/{dataSourceId}/transformations:
    put:
      summary: Set the full transformation pipeline for a data source
      security: [BearerAuth: []]
      requestBody:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/Transformation'
      responses:
        '200':
          description: The updated data source object

  /widgets/{widgetId}/data:
    post:
      summary: Get processed data for a widget
      description: This is the core data processing endpoint.
      security: [BearerAuth: []]
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                globalFilters: { type: array }
                crossFilter: { type: object }
                # ... other context
      responses:
        '200':
          description: Processed widget data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProcessedData'

  /ai/generate-content:
    post:
      summary: Proxy request to Gemini API
      # ... (as before)

components:
  securitySchemes:
    BearerAuth: { type: http, scheme: bearer }
  schemas:
    User: { #... }
    DashboardPage: { #... }
    Widget: { #... }
    Transformation: { #... }
    ProcessedData: { #... }
```

## 4. Business Logic & Workflows

### 4.1. Data Processing Pipeline
This is the most critical workflow.
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant WorkerQueue as Queue
    participant DataProcessor as Worker
    participant Database
    participant Cache

    Client->>+API: POST /widgets/{id}/data (with filters)
    API->>Cache: Check for cached result
    alt Cache Hit
        Cache-->>-API: Return cached data
        API-->>Client: 200 OK (Processed Data)
    else Cache Miss
        API->>+WorkerQueue: Enqueue Job(widgetId, filters)
        API-->>-Client: 202 Accepted (jobId)
        Client->>API: Poll GET /jobs/{jobId}/status
        WorkerQueue->>+Worker: Dequeue Job
        Worker->>+Database: Get Widget Config
        Worker->>Database: Get Source Data, Transformations, Joins
        Database-->>-Worker: Raw Data & Config
        Worker->>Worker: Apply Transformations
        Worker->>Worker: Apply Joins (Blend)
        Worker->>Worker: Apply Filters
        Worker->>Worker: Aggregate Data
        Worker->>+Cache: Store result with TTL
        Worker->>Database: Mark job as complete
        Cache-->>-Worker: OK
        Database-->>-Worker: OK
        Worker-->>-WorkerQueue: Acknowledge Job
        API-->>Client: 200 OK (Processed Data)
    end
```

## 5. Security, Privacy & Compliance

*   **Authentication:** JWTs with a short expiry (15 mins) and a long-lived refresh token (7 days) stored in an `httpOnly` cookie.
*   **Authorization:** Middleware will enforce tenancy and roles. Every database query that accesses tenant data **MUST** include a `WHERE workspace_id = :current_workspace_id` clause.
*   **Secrets Management:** Use AWS Secrets Manager or HashiCorp Vault for database credentials and the `GEMINI_API_KEY`.
*   **Audit Logging:** A dedicated `audit_logs` table will record critical events (login, data source creation/deletion, user role change).
*   **Rate Limiting:** Apply strict rate limits on `/auth` endpoints and general limits on all other API endpoints.

## 6. Performance & Scalability

*   **Database:** Use read replicas for PostgreSQL to serve dashboard read traffic. Use `pgBouncer` for connection pooling. All foreign keys and frequently queried columns will be indexed.
*   **Application:** The backend service will be stateless and packaged in a Docker container, ready for horizontal scaling via Kubernetes or a service like AWS Fargate.
*   **Asynchronous Processing:** As shown in the diagram, a queue system (e.g., BullMQ, RabbitMQ) is essential for handling long-running data transformations and AI analysis without blocking the main API.

## 7. Observability & Operations

*   **Logging:** Use a structured logger (like Pino) outputting JSON. Include `correlationId`, `workspaceId`, and `userId` in every log.
*   **Metrics:** Instrument the application with Prometheus client to expose RED metrics (Rate, Errors, Duration) for every API endpoint and background job.
*   **Tracing:** Implement OpenTelemetry for distributed tracing across the API, database, and any worker services.
*   **Alerting:** Configure alerts in Prometheus/Grafana for high error rates (>1%), high latency (p99 > 1s), and queue saturation.
*   **Disaster Recovery:** Regular, automated point-in-time recovery (PITR) backups of the PostgreSQL database. RTO/RPO targets: 1 hour / 5 minutes.

## 8. CI/CD & Environments

*   **Environments:** `development` (local Docker Compose), `staging` (near-production replica), `production`.
*   **CI (GitHub Actions):** On every push, run linting, unit tests, security scans (SAST, dependency check), and build Docker image.
*   **CD (Spinnaker/ArgoCD):**
    1.  Deploy to `staging` automatically on merge to `main`.
    2.  Run E2E tests against `staging`.
    3.  Promote to `production` via a manual approval step using a blue-green deployment strategy.
    4.  Database migrations (using a tool like `node-pg-migrate`) run as a separate, gated step before application deployment.

## 9. Future Enhancements

*   **Real-time Collaboration:** Implement WebSocket-based features for real-time dashboard editing and live comment updates, similar to Google Docs.
*   **Scheduled Refreshes & Alerting:** Allow users to schedule automatic data source refreshes and set up alerts based on data thresholds (e.g., "Alert me when sales drop below $1000").
*   **Row-Level Security (RLS):** Implement RLS in PostgreSQL to enforce data access policies at the database level, allowing different users to see different slices of the same data source.
*   **Expanded Connector Library:** Add native connectors for popular data warehouses like Snowflake, BigQuery, and Databricks.
*   **Public API:** Expose a secure, rate-limited public API for programmatic dashboard creation, data source management, and embedding.
*   **Versioning & Rollbacks:** Implement a versioning system for dashboards and data transformations, allowing users to view history and revert to previous states.

## 10. Technology Choices

*   **Runtime/Framework:** **Node.js with NestJS**. It provides excellent structure, dependency injection, and uses TypeScript, aligning perfectly with the frontend stack for shared types and developer ergonomics.
*   **Database:** **PostgreSQL**. Its maturity, support for relational data, and powerful JSONB features make it the best fit. Row-Level Security (RLS) can provide an additional layer of tenancy enforcement.
*   **Cache/Queue:** **Redis**. For its speed and versatility in handling both simple caching and queueing.
*   **Infrastructure:** **Docker + Kubernetes on AWS/GCP**. Provides the most flexible and scalable foundation for a growing SaaS application.

## 11. Backward-Compatible Refactor Plan

This plan transitions from the current mock implementation to the real backend without disrupting frontend development.

1.  **Phase 1: Authentication & Workspaces:**
    *   Implement the `/auth` and `/users` endpoints.
    *   Refactor `AuthProvider.tsx` and `authService.ts` to call the real backend instead of using `localStorage`.
    *   Implement the core `/workspaces` and `/pages` GET endpoints.
    *   Refactor `DashboardProvider` to fetch its initial state from these endpoints instead of `localStorage`. At this point, the app will be read-only from the backend.
    *   **Goal:** Users can log in and see their saved (empty) workspaces.

2.  **Phase 2: State Persistence:**
    *   Implement the `PUT`, `POST`, `DELETE` endpoints for all core entities (workspaces, pages, widgets, etc.).
    *   Incrementally refactor each state-mutating function in `DashboardProvider` (e.g., `saveWidget`, `addPage`) to make an API call and update its local state from the response. Use optimistic UI updates where appropriate.
    *   **Goal:** All user actions are persisted to the backend and restored on page load. `localStorage` is now only used for non-critical UI state.

3.  **Phase 3: Data & AI Services:**
    *   Implement the data source upload flow with pre-signed URLs.
    *   Create the backend data processing service to handle transformations and blending. Refactor `mockApiService.ts` to call this new endpoint.
    *   Implement the `/ai/*` endpoints to securely proxy requests to Gemini. Refactor `aiService.ts` to use these backend endpoints, removing the Vite proxy.
    *   **Goal:** The application is fully functional with all data and AI operations handled by the backend.

## 12. Test Strategy

*   **Unit Tests (Jest):** For all business logic, data transformation functions, and utility services.
*   **Integration Tests (Jest + Supertest):** For API endpoints, testing against a real database running in a Docker container.
*   **E2E Tests (Cypress/Playwright):** To cover the critical user journeys identified in section 1.2. These tests will run against the `staging` environment in the CI/CD pipeline.

## 13. 90-Day Implementation Roadmap

*   **Days 1-20 (Sprint 1-2): Foundational Setup & Auth**
    *   Setup IaC (Terraform), K8s cluster, PostgreSQL instance.
    *   Implement CI/CD pipeline for the backend.
    *   Build and deploy the `Auth` and `Users` modules.
    *   Refactor frontend auth (`Phase 1`).
    *   **Risk:** Underestimating IaC complexity. **Mitigation:** Start with managed services (e.g., RDS, GKE/EKS).

*   **Days 21-50 (Sprint 3-5): Core Persistence**
    *   Implement database schemas and APIs for all core entities (Workspaces, Pages, Widgets, etc.).
    *   Refactor the frontend `DashboardProvider` to persist all state changes (`Phase 2`).
    *   **Risk:** Mismatched data contracts between frontend/backend. **Mitigation:** Use shared TypeScript types/interfaces.

*   **Days 51-90 (Sprint 6-9): Data & AI Pipelines**
    *   Implement the data source upload and processing pipeline.
    *   Build out the AI proxy service.
    *   Refactor frontend services to use the new backend pipelines (`Phase 3`).
    *   Implement comprehensive logging, monitoring, and alerting.
    *   Conduct initial performance testing and database query optimization.
    *   **Risk:** Data processing performance for large files. **Mitigation:** Offload to async workers early.
