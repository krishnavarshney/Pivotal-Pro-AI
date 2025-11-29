<p align="center">
  <img src="https://dummyimage.com/1200x260/0d1117/ffffff&text=Pivotal-Pro+AI" />
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Vite-Frontend%20Bundler-yellow?style=for-the-badge&logo=vite" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TailwindCSS-Styling-38b2ac?style=for-the-badge&logo=tailwindcss" /></a>
</p>
  <strong>A Next-Generation Business Intelligence Platform</strong>
  <br />
  <p>Turn your data into actionable insights, instantly. Upload data, converse with an AI assistant to generate visualizations, and build interactive dashboards with drag-and-drop simplicity.</p>

</div>

---

## 🚀 Key Features

Pivotal Pro AI is packed with powerful features to cover your entire BI workflow from data to decision.

-   **🤖 AI-Powered Analytics (Google Gemini)**
    -   **Insight Starter**: Let AI analyze your dataset and automatically generate a complete, multi-widget dashboard.
    -   **AI Chat Assistant**: A conversational interface to ask questions, get summaries, and request new charts.
    -   **Natural Language to Chart**: Describe the chart you want in plain English, and the AI will build it.
    -   **Advanced Analysis**: Run anomaly detection, key influencer analysis, and "what-if" scenarios on your data.
    -   **Predictive Studio**: Build and analyze predictive models like Linear Regression to forecast outcomes.

-   **📊 Intuitive Dashboarding**
    -   **Drag & Drop Canvas**: Freely arrange and resize widgets on a responsive grid.
    -   **Rich Visualization Library**: Bar, Line, Area, Pie, Table, KPI, Scatter, Bubble, Treemap, Heatmap, Sankey, and more.
    -   **Deep Interactivity**: Page-level filters, cross-filtering between widgets, and interactive controls like sliders.
    -   **Data Stories**: Weave your visualizations into a compelling, slide-by-slide narrative for presentations.

-   **🛠️ Advanced Data Preparation**
    -   **Data Studio**: An interactive ETL-like environment to clean, prepare, and transform your data with a live preview.
    -   **Calculated Fields**: A powerful formula engine (similar to Excel/DAX) to create new metrics. AI can also suggest formulas from natural language.
    -   **Data Modeler**: A visual canvas to define relationships (joins) between multiple data sources.

-   **🎨 Customizable & Collaborative**
    -   **Theming Engine**: Switch between multiple professional themes (including light/dark modes) or create your own custom theme.
    -   **Commenting**: Drop comments directly onto widgets to collaborate with your team.
    -   **Templating**: Save any dashboard as a reusable template to accelerate future work.
    -   **Command Palette**: A `Cmd/Ctrl+K` interface for lightning-fast navigation and actions.

## 💻 Tech Stack

-   **Framework**: React 19 with Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS with a custom CSS variable-based theming system
-   **UI Components**: Radix UI primitives, shadcn/ui concepts, and custom components
-   **State Management**: React Context API (`DashboardProvider` with `useReducer` and `useMemo` for performance)
-   **AI Integration**: Google Gemini API (`gemini-2.5-flash`) via a secure backend proxy
-   **Data Visualization**: ECharts, with ApexCharts & Recharts as swappable alternatives
-   **Drag & Drop**: React DnD
-   **Animation**: Framer Motion

## 🏃‍♀️ Running Locally

This project is configured to run locally using Vite.

**1. Prerequisites:**
- Node.js (v18 or later recommended)
- npm or yarn

**2. Installation:**
```bash
npm install
```

**3. Set Up Environment Variables:**
Create a `.env` file in the root of the project. You will need a Google Gemini API key.

```
# .env
API_KEY=your_gemini_api_key_here
```
> **Note:** The Vite configuration (`vite.config.ts`) uses this key in a **server-side proxy only**. It is never exposed to the client browser.

**4. Run the Development Server:**
```bash
npm run dev
```
The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## 🏛️ Project Architecture

-   **State Management**: The application's state is centralized in `src/contexts/DashboardProvider.tsx`. This provider uses a combination of `useState` and `useMemo` to manage data, UI state, and business logic, which is then made available globally via the `useDashboard` hook.
-   **AI Service Proxy**: To protect the Gemini API key, the Vite dev server includes a custom middleware that proxies all AI-related requests from the frontend. The frontend calls its own backend (`/api/gemini/generateContent`), and the middleware securely adds the API key and forwards the request to Google.
-   **Modular Structure**: The project is organized into `views` (top-level pages), `components` (reusable UI elements), `services` (API communication), `hooks`, and `utils` to maintain a clean and scalable codebase.

---

<div align="center">
  <p>Made with ❤️ and lots of data.</p>
</div>
