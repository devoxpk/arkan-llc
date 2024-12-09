import React from "react";

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global error boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>An error occurred. Please try again later.</div>;
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
