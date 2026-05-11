import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-start">
        <div className="w-full max-w-md bg-white min-h-screen flex flex-col items-center justify-center p-8 shadow-2xl">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-5">
            <AlertTriangle size={40} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
            {this.state.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-teal-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-teal-700 transition-colors"
          >
            <RefreshCw size={16} />
            Reload App
          </button>
        </div>
      </div>
    );
  }
}
