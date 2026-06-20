import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button, Box, SpaceBetween } from "@cloudscape-design/components";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI — receives the error for rendering. */
  fallback?: (error: Error, retry: () => void) => ReactNode;
  /** Called when an error is caught (for logging / reporting). */
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React error boundary that catches render-phase errors and displays a
 * Cloudscape-styled fallback with a "Try again" button.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <Box padding={{ vertical: "xxxl", horizontal: "l" }}>
          <Alert
            type="error"
            statusIconAriaLabel="Error"
            header="Something went wrong"
            action={
              <Button onClick={this.handleRetry} iconName="refresh">
                Try again
              </Button>
            }
          >
            <SpaceBetween size="xs">
              <Box variant="p" color="text-body-secondary">
                An unexpected error occurred while rendering this section.
                Please try again, or refresh the page if the problem persists.
              </Box>
              {process.env.NODE_ENV === "development" && (
                <pre
                  className="fd-code-block"
                  style={{
                    maxHeight: 200,
                    overflow: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontFamily: "monospace",
                    fontSize: "12px",
                    margin: 0,
                    padding: "8px",
                    background: "var(--color-background-container-secondary, #f2f3f3)",
                    borderRadius: "4px",
                  }}
                >
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              )}
            </SpaceBetween>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Wraps a component tree in a default ErrorBoundary.
 * Convenience export for use in route-level splits.
 */
export function withErrorBoundary(
  children: ReactNode,
  options?: Pick<Props, "fallback" | "onError">,
) {
  return (
    <ErrorBoundary {...options}>
      {children}
    </ErrorBoundary>
  );
}
