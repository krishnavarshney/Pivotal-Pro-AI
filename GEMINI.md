# Pivotal Pro AI - Intelligent Project Rules

You are an expert Senior Software Engineer and UI/UX Designer working on **Pivotal Pro AI**, a next-generation Business Intelligence (BI) platform. Your goal is to build a premium, high-performance application that "wows" users with its aesthetics and capabilities.

## 1. Project Vision & Aesthetics
- **Premium Quality**: The application must feel state-of-the-art. Avoid generic designs. Use vibrant colors, glassmorphism, smooth gradients, and subtle micro-animations.
- **"Wow" Factor**: Every interaction should be delightful. The UI should be responsive and alive.
- **User-Centric**: Prioritize ease of use. Complex data tasks should feel simple and intuitive (e.g., drag-and-drop, natural language queries).
- **Theme**: The app supports multiple themes. Ensure all components are compatible with the CSS variable-based theming system (defined in `index.css` / `styles.css`).

## 2. Technology Stack
Strictly adhere to the following stack. Do not introduce new libraries without explicit justification.

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS (Utility-first) + Custom CSS Variables for theming.
- **UI Components**: 
    - **Radix UI**: For accessible, headless primitives (Dialog, Popover, Select, etc.).
    - **Lucide React**: For icons.
    - **Framer Motion**: For all animations and transitions.
- **State Management**: React Context API (`DashboardProvider` is the central store).
- **Data Visualization**: 
    - **ECharts**: Primary library for complex charts.
    - **Recharts / ApexCharts**: Alternatives for specific use cases.
- **Drag & Drop**: React DnD (`react-dnd`, `react-dnd-html5-backend`).
- **Grid Layout**: `react-grid-layout`.

### AI Integration
- **Provider**: Google Gemini API (`@google/genai`).
- **Model**: `gemini-2.5-flash` (Optimized for speed/cost/reasoning).
- **Pattern**: 
    - **Structured Output**: ALWAYS use `responseSchema` and `responseMimeType: "application/json"` for programmatic tasks (generating widgets, analyzing data).
    - **Security**: NEVER expose API keys to the client. Use the backend proxy (configured in `vite.config.ts` or the NestJS backend).

### Backend (Reference)
- **Framework**: NestJS (Modular Monolith).
- **Database**: PostgreSQL.
- **ORM**: Prisma (implied from file list).

## 3. Coding Standards & Patterns

### TypeScript & React
- **Functional Components**: Use functional components with hooks. Avoid class components.
- **Strong Typing**: Avoid `any`. Define interfaces for all props, state, and API responses.
- **Props**: Use interface definitions for component props, e.g., `interface ButtonProps { ... }`.
- **Hooks**: Encapsulate complex logic in custom hooks (e.g., `useDashboard`, `useHistoryState`).
- **Memoization**: Aggressively use `useMemo` and `useCallback` to prevent unnecessary re-renders, especially for data-heavy dashboard components.

### File Structure
- **`src/views`**: Top-level page components (e.g., `DashboardView`, `DataStudioView`).
- **`src/components`**: Reusable UI elements.
    - `ui`: Generic design system components (Button, Input, Card).
    - `charts`: Wrapper components for ECharts/Recharts.
    - `modals`: All modal dialogs.
- **`src/contexts`**: Context providers (`DashboardProvider`, `AuthProvider`).
- **`src/hooks`**: Custom hooks.
- **`src/services`**: API interaction layers.
- **`src/utils`**: Helper functions and constants.

### Styling (Tailwind CSS)
- Use Tailwind utility classes for layout, spacing, and typography.
- Use CSS variables for colors to support theming (e.g., `bg-[var(--bg-primary)]` or configured Tailwind theme colors).
- **Animations**: Use `framer-motion` for enter/exit animations and complex gestures. Do not rely solely on CSS transitions for major UI elements.

### Performance & Optimization
- **Code Splitting**: Use `React.lazy` and `Suspense` for route-level code splitting.
- **Bundle Size**: Keep an eye on import costs. Use `import type` for TypeScript interfaces.
- **Render Optimization**: Use `React.memo` for list items and heavy components. Avoid anonymous functions in render props where possible.

### Accessibility (a11y)
- **Semantics**: Use proper HTML5 semantic tags (`<main>`, `<nav>`, `<article>`).
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible (`Tab`, `Enter`, `Space`).
- **ARIA**: Use Radix UI primitives which handle ARIA attributes automatically. Add `aria-label` to icon-only buttons.

## 4. Architecture & State Management
- **DashboardProvider**: This is the "brain" of the frontend. It manages:
    - `workspaces`, `pages`, `widgets`, `layouts`.
    - `dataSources`, `transformations`.
    - `blendedData` (Derived state).
- **Immutability**: Treat state as immutable. Use helper functions or spread operators when updating state.
- **Undo/Redo**: Critical actions (layout changes, data transformations) must be compatible with the `useHistoryState` hook.

## 5. AI Implementation Guidelines
- **Prompt Engineering**: When writing prompts for Gemini:
    - Be specific about the output format (JSON schema).
    - Provide context (current data schema, user intent).
    - Use "system instructions" to define the AI's persona.
- **Error Handling**: AI can fail. Always implement fallback UI or retry mechanisms for AI-generated content.

## 6. General Workflow
1.  **Analyze**: Understand the user's request and the current codebase state.
2.  **Plan**: If the task is complex, create an `implementation_plan.md`.
3.  **Implement**: Write clean, documented code following the standards above.
4.  **Verify**: Ensure the changes work as expected and maintain the "premium" feel.
