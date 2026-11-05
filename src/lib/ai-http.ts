import { NextResponse } from 'next/server';
import { GatewayError } from '@/lib/ai-policy';

export function aiJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });
}

export function aiErrorResponse(error: unknown) {
  // Never return arbitrary exception messages, upstream bodies, or URLs with keys.
  if (!(error instanceof GatewayError)) {
    return aiJson({ error: 'The AI request failed. Please retry.', code: 'provider' }, 502);
  }
  switch (error.code) {
    case 'missing_key':
      return aiJson({ error: 'Enter your provider API key in AI settings. Shared server keys are disabled.', code: error.code }, 401);
    case 'unsafe_endpoint':
      return aiJson({ error: 'Custom gateway URLs are disabled. Use the selected provider’s approved endpoint.', code: error.code }, 400);
    case 'invalid_request':
      return aiJson({ error: 'Invalid AI request. Check your settings and try again.', code: error.code }, 400);
    case 'timeout':
      return aiJson({ error: 'The AI provider timed out. Please retry.', code: error.code }, 504);
    case 'invalid_response':
      return aiJson({ error: 'The model output failed validation. Your current work has not been replaced.', code: error.code }, 502);
    case 'provider': {
      const status = [401, 403, 429].includes(error.status ?? 0) ? error.status! : 502;
      const message = status === 401 || status === 403
        ? 'The provider rejected your API key or its permissions. Check your provider account.'
        : status === 429
          ? 'The provider rate limit or quota was reached. Retry later or check your provider account.'
          : 'The AI provider request failed. Please retry.';
      return aiJson({ error: message, code: error.code }, status);
    }
  }
}
