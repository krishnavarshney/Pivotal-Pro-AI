# Pivotal Pro AI - Application Documentation

## 1. Application Overview

**Pivotal Pro AI** is a next-generation business intelligence (BI) platform designed to transform raw data into actionable insights with speed and simplicity. It empowers users to upload their data, converse with a sophisticated AI assistant to generate visualizations, and build interactive, presentation-ready dashboards using a drag-and-drop interface.

The core mission of the application is to democratize data analysis, making it accessible for users regardless of their technical expertise. By integrating the power of the Google Gemini API, Pivotal Pro AI automates complex tasks, suggests insights, and provides a powerful yet intuitive environment for data exploration and storytelling.

---

## 2. Core Functionalities & Features

The application is built around a comprehensive set of features that cover the entire BI workflow, from data connection to final presentation.

### 2.1. Data Management
- **Data Sources**: Connect to data via file uploads (`.csv`, `.xlsx`, `.xls`, `.parquet`) or by configuring connections to external APIs and databases. A robust connector framework is designed for future expansion.
- **Data Studio**: A powerful ETL-like environment where users can apply a series of transformations to cleanse and prepare their data. This includes:
    - Field renaming, duplication, and deletion.
    - Data type changes.
    - Calculated fields using a rich formula engine (similar to Excel/DAX).
    - Categorical grouping (binning values based on rules).
    - Splitting and merging columns.
    - Handling null values and standardizing text.
    - AI-powered suggestions for cleaning operations.
- **Data Modeler**: A visual canvas for defining relationships (inner, left, right, full joins) between different data sources, creating a unified data model for analysis.

### 2.2. Dashboarding & Visualization
- **Workspaces & Pages**: Organize dashboards into workspaces, with support for multiple pages within each workspace for better project segmentation.
- **Widget Engine**: A versatile engine for creating visualizations. Users can build widgets manually or with AI assistance. Supported chart types include:
    - **Standard**: Bar, Line, Area, Pie, Table, KPI
    - **Advanced**: Scatter, Bubble, Treemap, Heatmap, Box Plot, Funnel, Sankey, Dual-Axis
- **Interactive Grid Layout**: Dashboards are built on a responsive grid (`react-grid-layout`) that allows users to freely drag, drop, and resize widgets.
- **Filtering & Interactivity**:
    - **Page Filters**: Apply persistent filters to all widgets on a dashboard page.
    - **Cross-Filtering**: Click on a data point in one widget to dynamically filter others.
    - **Widget-Level Filters**: Add filters specific to a single widget.
    - **Controls**: Add interactive controls like sliders and date pickers to the dashboard canvas.
- **Commenting**: A collaboration feature allowing users to drop comments directly onto widgets to start discussion threads.
- **Focus Mode**: Enlarge any widget to a full-screen modal for detailed inspection.

### 2.3. AI & Machine Learning (Gemini Integration)
- **AI-Powered Dashboard Generation**: The "Insight Starter" feature analyzes a dataset and automatically constructs a complete, multi-widget dashboard.
- **AI Chat Assistant**: A conversational interface to ask questions about the data, get summaries, and request new chart suggestions. The chat is context-aware when launched from a specific widget.
- **Insight Hub**:
    - **Proactive Insights**: The AI automatically scans the data to find and present interesting trends, anomalies, or outliers.
    - **Dashboard Analysis**: Generate a high-level summary and key takeaways from all the widgets on the current page.
- **Natural Language to Chart**: Within the widget editor, users can describe the chart they want in plain English, and the AI will configure the shelves and chart type.
- **Advanced Analysis**:
    - **AI Summary**: Generate a narrative summary for any individual widget.
    - **Anomaly Detection, Key Influencers, Clustering**: Run advanced statistical analyses on widget data.
    - **What-If Analysis**: Create and simulate scenarios to see how changing input variables might affect a target metric.
- **Predictive Studio**: A dedicated view for building and analyzing predictive models (e.g., Linear Regression) to understand drivers and forecast outcomes.

### 2.4. Presentation & Collaboration
- **Data Stories**: Weave widgets from dashboards into a linear, slide-by-slide narrative. Each page in a story can have custom AI-generated or manually written annotations.
- **Templating**:
    - Save any dashboard page as a reusable template.
    - Create new pages from a library of built-in and user-created templates.
- **Exporting**: Export dashboard views to PDF or widget data to CSV/XLSX.

### 2.5. System & User Management
- **Authentication**: Secure user signup and login system.
- **Settings**: A centralized view for users to manage:
    - **Appearance**: Switch between multiple themes (e.g., Pivotal Pro, Graphite, Synthwave) and light/dark modes. A theme customizer allows for fine-grained control over colors and fonts.
    - **AI Provider**: Configure the AI service (defaults to Gemini).
    - **Defaults**: Set default chart types and color palettes for new widgets.
- **Admin Dashboard**: A special view for users with the `ADMIN` role to manage all users in the system (e.g., change roles, delete users) and view application-wide statistics.
- **Command Palette**: A `Cmd/Ctrl+K` interface for quick navigation and actions across the entire application.

---

## 3. Technology Stack

### 3.1. Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite with @vitejs/plugin-react
- **Styling**: Tailwind CSS with a custom theme system managed via CSS variables.
- **UI Components**: Radix UI primitives for accessibility, augmented with custom components (`Dialog`, `Popover`, `Sheet`).
- **State Management**: React Context API (primarily `DashboardProvider`).
- **UI Components**: Radix UI primitives for accessibility, augmented with custom components, with a focus on Framer Motion for animations.
- **Data Visualization**: ECharts (primary), with ApexCharts and Recharts available as alternative rendering engines.
- **Drag & Drop**: React DnD with React DnD HTML5 Backend.
- **Grid System**: `react-grid-layout`.
- **Animation**: Framer Motion.
- **Data Parsing**: PapaParse (CSV), XLSX (Excel).

### 3.2. AI Integration
- **Primary API**: Google Gemini API via the `@google/genai` SDK.
- **Models Used**:
    - `gemini-2.5-flash`: For all chat, analysis, and structured JSON generation tasks due to its excellent balance of speed, cost, and strong reasoning capabilities.
- **Interaction Method**: All Gemini API calls are proxied through a secure backend endpoint (currently mocked in `vite.config.ts`) to protect the API key. The frontend makes heavy use of the `responseSchema` feature within the Gemini API configuration. This forces the model to return valid, structured JSON, which eliminates the need for fragile string parsing and ensures predictable data structures for features like AI-generated widgets, dashboards, and advanced analyses.

### 3.3. Backend (Planned Architecture)
The application is designed to transition from a local-storage-based mock setup to a full-fledged backend service.
- **Runtime/Framework**: Node.js with NestJS
- **Database**: PostgreSQL
- **Caching/Queueing**: Redis
- **File Storage**: AWS S3 or Google Cloud Storage
- **Deployment**: Docker & Kubernetes

---

## 4. Architectural Overview

### 4.1. Frontend Architecture
The frontend follows a modern, modular React architecture.

-   **State Management**: The core of the application's state is managed in `src/contexts/DashboardProvider.tsx`. This provider centralizes all data, UI state, and business logic, making it available to the entire component tree via the `useDashboard` hook.
    -   A separate `AuthProvider` handles user authentication state.
    -   A custom hook, `useHistoryState`, provides a robust history buffer for the core `workspaces` and `transformations` state, enabling reliable undo/redo functionality for most major user actions.
    -   A custom hook, `useModalManager`, centralizes the state and open/close logic for all modals, simplifying component logic and preventing state clutter in the main provider.
-   **Component Structure**:
    -   `src/views`: Contains top-level components for each major screen/view of the app (e.g., `DashboardView`, `DataStudioView`).
    -   `src/components`: Contains reusable components, categorized into `ui` (design system), `modals`, `charts`, `common`, etc.
    -   `src/services`: Handles communication with external APIs (currently mocked, planned for backend integration).
    -   `src/hooks`: Contains reusable logic hooks like `useCopyToClipboard`, `useMediaQuery`, and the state management hooks.
    -   `src/utils`: Contains type definitions, constants, and the data processing logic pipeline (blending, filtering, aggregation).
-   **Vite Dev Server**: The `vite.config.ts` file sets up a development server that includes a custom middleware proxy. This proxy securely handles requests from the client to the Google Gemini API, abstracting away the API key from the frontend code.

### 4.2. Backend Architecture (Planned)
The backend is designed as a **Modular Monolith** using NestJS. This provides clear separation of concerns (Auth, Workspaces, DataSources, AI) without the initial complexity of microservices. The architecture is designed to be stateless and scalable.

- **Data Flow**: The client will interact with a REST API. For data-intensive operations like processing large files or running complex analyses, the API will offload the task to a worker queue (Redis-based) and the client will poll for results.
- **Database Schema**: A normalized PostgreSQL schema is planned, using UUIDs for primary keys and foreign keys to enforce relational integrity. Flexible data like widget configurations and layouts will be stored in `JSONB` columns.
- **Security**: The backend enforces multi-tenancy at the API and database query level, ensuring a user can only access their own workspace data. Authentication is handled via JWTs.

---

## 5. UI Pages & Components Breakdown

### 5.1. Main Views (`src/views`)
- **`AuthView`**: The entry point for unauthenticated users, featuring a dynamic login/signup form.
- **`MainView`**: The main application layout for authenticated users, which includes the `AppSidebar` and renders the current active view.
- **`DashboardView`**: The core dashboarding canvas where users interact with widgets on a grid.
- **`DashboardHomeView`**: A landing page that displays all available dashboards as cards for easy navigation.
- **`DataExplorerView`**: A spreadsheet-like interface for viewing, sorting, and filtering raw data.
- **`DataStudioView`**: An interactive ETL environment for applying data transformations.
- **`DataModelerView`**: A visual canvas for creating joins between data sources.
- **`DataStoryView`**: A presentation-focused view for creating and viewing data stories.
- **`PredictiveStudioView`**: An interface for building, running, and analyzing machine learning models.
- **`DataSourcesView`**: A dashboard for managing all connected data sources.
- **`AdminView`**: A restricted area for administrators to manage users and view system stats.
- **`SettingsView`**: A page for users to configure application settings.
- **`TemplateLibraryView`**: A gallery for browsing and selecting dashboard templates.

### 5.2. Key Modals (`src/components/modals`)
- **`WidgetEditorModal`**: A full-screen sheet/modal for creating and configuring widgets. It's the central hub for visualization building, featuring panels for data selection, AI prompts, and detailed configuration.
- **`AiAssistantModal` / `InsightHub`**: A modal where users can get proactive AI insights or request a full dashboard analysis.
- **`ChatModal`**: A conversational AI interface for asking questions about data.
- **`CommandPaletteModal`**: A quick-action menu (Cmd/Ctrl+K) for searching and navigating the app.
- **`FilterConfigModal`**: Allows users to define conditions for a filter pill.
- **`AddFieldModal`**: A multi-step modal for creating calculated or categorical fields.
- **`DataLineageModal`**: Visualizes the flow of data from the source to a specific widget.

---

## 6. Setup & Deployment

The application is configured to run locally using Vite.

1.  **Installation**: Run `npm install` to install all dependencies listed in `package.json`.
2.  **Environment Variables**: Create a `.env` file in the root directory and add your Gemini API key:
    ```
    API_KEY=your_gemini_api_key_here
    ```
    The Vite configuration (`vite.config.ts`) is set up to load this key and use it in the server-side proxy, ensuring it is never exposed to the client browser.
3.  **Running Locally**: Run `npm run dev` to start the Vite development server.

---

## 7. AI Services Integration (`aiService.ts`)

This service acts as the primary interface between the application and the Gemini API (via the backend proxy).

- **Structured Output**: A key architectural pattern is the heavy use of `responseMimeType: "application/json"` and `responseSchema` in API calls. This forces the Gemini model to return valid, structured JSON, which eliminates the need for fragile string parsing on the frontend and ensures predictable data structures for features like AI-generated widgets, dashboards, and advanced analyses.
- **Core Functions**:
    - `getChatResponse`: Handles general conversation and chart generation requests from the chat modal.
    - `generateAiDashboard`: Takes a data schema and sample, and returns a complete dashboard configuration (widgets, layout, calculated fields).
    - `getAiAdvancedAnalysis`: Performs complex statistical analyses and returns structured results.
    - `runPredictiveModel`: Builds and evaluates a machine learning model, returning a detailed report.
    - `getAiFormulaSuggestion`: Translates natural language into a valid formula for calculated fields.

---

## 8. State Management (`DashboardProvider.tsx`)

The `DashboardProvider` is the "brain" of the application.

- **Centralized State**: It holds all major state variables, including `workspaces`, `dataSources`, `transformations`, `relationships`, `widgets`, `layouts`, `stories`, and more.
- **Derived State**: It uses `useMemo` hooks to efficiently compute derived data. The most important is `blendedData`, which applies all transformations and relationships to the raw data sources, creating the final dataset used for all visualizations.
- **Action Dispatchers**: It exposes a comprehensive set of functions to mutate the state (e.g., `saveWidget`, `addTransformation`, `setRelationships`). This keeps state logic co-located and predictable.
- **Undo/Redo**: It leverages the `useHistoryState` custom hook to provide a history of the `workspaces` and `transformations` state, enabling undo/redo functionality for most major user actions.
- **Persistence**: In the current implementation, it uses `useEffect` and `localStorage` to persist the application state between sessions. This is designed to be replaced by API calls to the real backend.
- **Modal Management**: It utilizes the `useModalManager` hook to centralize the open/close state and associated logic for all modals in the application, which keeps the main provider clean and focused on core business logic.
