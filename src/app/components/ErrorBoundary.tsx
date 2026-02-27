import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("[STRIDE] Screen error:", error, info.componentStack);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div className="w-12 h-12 border-2 border-[#ff6600] flex items-center justify-center mb-4">
            <span className="text-[#ff6600] font-['JetBrains_Mono',monospace] text-xl font-bold">!</span>
          </div>
          <p className="font-['JetBrains_Mono',monospace] text-white text-sm mb-1">
            SYSTEM MALFUNCTION
          </p>
          <p className="font-['JetBrains_Mono',monospace] text-white/40 text-xs mb-6">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={this.handleRetry}
            className="font-['JetBrains_Mono',monospace] text-xs bg-[#ff6600] text-black px-6 py-2 hover:bg-[#ff8833] transition-colors"
          >
            RETRY
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
