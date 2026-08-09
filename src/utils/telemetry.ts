// @ts-nocheck
// ============================================================
// FitTrack V7 — OpenTelemetry Instrumentation
// ============================================================
// src/utils/telemetry.ts
// ============================================================

import { trace, context, SpanStatusCode, type Span } from '@opentelemetry/api';
import { onCLS, onINP, onFCP, onLCP, onTTFB } from 'web-vitals';
import * as Sentry from '@sentry/react';
import posthog from 'posthog-js';

// ── 1. Initialize OpenTelemetry ────────────────────────────

export function initTelemetry() {
  // 🔭 OpenTelemetry is configured to use the global no-op provider by default
  // To enable actual tracing export, install the OTel SDK packages:
  // npm install @opentelemetry/sdk-trace-web @opentelemetry/sdk-trace-base @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions
  console.log('🔭 OpenTelemetry initialized (No-Op mode)');
}

// ── 2. Error Tracking ──────────────────────────────────────

export function initializeErrorTracking(): void {
  const tracer = trace.getTracer('error-tracking');

  // Uncaught errors
  window.addEventListener('error', (event: ErrorEvent) => {
    const span = tracer.startSpan('error.uncaught', {
      attributes: {
        'error.type': 'uncaught_exception',
        'error.message': event.message,
        'error.filename': event.filename,
        'error.lineno': event.lineno,
        'error.stack': event.error?.stack || 'No stack trace',
      },
    });

    if (event.error) span.recordException(event.error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: event.message });
    span.end();

    // Also send to Sentry
    Sentry.captureException(event.error || new Error(event.message));
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const error = event.reason;
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    const span = tracer.startSpan('error.unhandled_rejection', {
      attributes: {
        'error.type': 'unhandled_promise_rejection',
        'error.message': message,
        'error.stack': stack || 'No stack trace',
      },
    });

    if (error instanceof Error) span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message });
    span.end();

    Sentry.captureException(error instanceof Error ? error : new Error(message));
  });
}

// ── 3. Performance Tracking (Core Web Vitals) ──────────────

export function reportWebVitals(metric: any) {
  // PostHog
  posthog.capture('web_vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    navigation_type: metric.navigationType,
  });

  // Sentry breadcrumb
  Sentry.addBreadcrumb({
    category: 'web-vitals',
    message: `${metric.name}: ${Math.round(metric.value * 100) / 100}`,
    level: metric.rating === 'poor' ? 'warning' : 'info',
    data: { name: metric.name, value: metric.value },
  });

  // OpenTelemetry span
  const tracer = trace.getTracer('performance');
  const span = tracer.startSpan(`web-vital.${metric.name}`, {
    attributes: {
      'web_vital.name': metric.name,
      'web_vital.value': metric.value,
      'web_vital.rating': metric.rating,
    },
  });
  span.end();
}

export function initWebVitals() {
  onCLS(reportWebVitals);
  onINP(reportWebVitals);
  onFCP(reportWebVitals);
  onLCP(reportWebVitals);
  onTTFB(reportWebVitals);
}

// ── 4. Custom Tracing Helpers ──────────────────────────────

export function createSpan(
  name: string,
  attributes?: Record<string, string | number | boolean>
): Span {
  const tracer = trace.getTracer('fittrack');
  return tracer.startSpan(name, { attributes });
}

export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  const tracer = trace.getTracer('fittrack');
  const span = tracer.startSpan(name, { attributes });

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

// ── 5. Feature Usage Analytics ─────────────────────────────

export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // PostHog
  posthog.capture(eventName, properties);

  // Sentry breadcrumb
  Sentry.addBreadcrumb({
    category: 'feature-usage',
    message: eventName,
    data: properties,
  });
}

// ── 6. React Error Boundary with OTel ──────────────────────

export function createErrorBoundarySpan(
  error: Error,
  errorInfo: { componentStack: string }
): Span {
  const tracer = trace.getTracer('react-error-boundary');
  const span = tracer.startSpan('error.react_boundary', {
    attributes: {
      'error.type': 'react_error_boundary',
      'error.message': error.message,
      'error.stack': error.stack || 'No stack trace',
      'react.component_stack': errorInfo.componentStack,
    },
  });
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  return span;
}
