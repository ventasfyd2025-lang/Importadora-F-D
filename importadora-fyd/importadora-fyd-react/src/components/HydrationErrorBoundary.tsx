'use client';

import { Component, ReactNode } from 'react';

interface HydrationErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface HydrationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export default class HydrationErrorBoundary extends Component<
  HydrationErrorBoundaryProps,
  HydrationErrorBoundaryState
> {
  constructor(props: HydrationErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): HydrationErrorBoundaryState {
    // Detectar errores de hidratación específicamente
    if (error.message?.includes('Hydration') ||
        error.message?.includes('hydration') ||
        error.message?.includes('server HTML') ||
        error.message?.includes('client rendered')) {
      return { hasError: true, error };
    }
    return { hasError: false };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Log solo errores de hidratación
    if (error.message?.includes('Hydration') || error.message?.includes('hydration')) {
      console.warn('Hydration error caught:', error.message);
      // Forzar re-render del lado del cliente
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 0);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}