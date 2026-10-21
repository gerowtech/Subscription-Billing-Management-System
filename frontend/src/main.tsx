import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

type BoundaryState = { error: Error | null };
class AppErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { error: null };
  static getDerivedStateFromError(error: Error): BoundaryState { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("StrafeMC frontend render error:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 900, margin: "48px auto", padding: 24, color: "#e2e8f0", background: "#111827", borderRadius: 12 }}>
        <h1 style={{ color: "#f87171", marginTop: 0 }}>StrafeMC could not render this page</h1>
        <p>The app encountered a frontend error instead of showing a blank page.</p>
        <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", padding: 16, background: "#030712", borderRadius: 8 }}>{this.state.error.message}{this.state.error.stack ? `\n\n${this.state.error.stack}` : ""}</pre>
        <button style={{ padding: "10px 16px", borderRadius: 8, cursor: "pointer" }} onClick={() => window.location.reload()}>Reload page</button>
      </main>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppErrorBoundary><App /></AppErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);
