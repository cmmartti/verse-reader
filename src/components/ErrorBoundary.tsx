import React from "react";

type State = { hasError: boolean; message: string | null };

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    State
> {
    public state: State = { hasError: false, message: null };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            message: error.toString(),
        };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div>
                    <h1>Error</h1>
                    <p>{this.state.message}</p>
                </div>
            );
        }

        return this.props.children;
    }
}
