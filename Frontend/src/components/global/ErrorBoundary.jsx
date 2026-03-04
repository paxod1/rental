import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Clear all cookies
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        }

        // Clear local and session storage
        localStorage.clear();
        sessionStorage.clear();

        // Redirect to login after a short delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 100);
    }

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    textAlign: 'center',
                    padding: '20px'
                }}>
                    <h1 style={{ color: '#ef4444' }}>Something went wrong</h1>
                    <p>Redirecting you to the login page to fix the issue...</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
