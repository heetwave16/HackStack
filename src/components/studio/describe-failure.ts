export class GenerationError extends Error {
  readonly status: number | null;

  constructor(status: number | null, message: string) {
    super(message);
    this.name = 'GenerationError';
    this.status = status;
  }
}

export async function readApiError(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null);
  if (typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string') {
    return body.error;
  }
  return `status ${response.status}`;
}

export function describeFailure(error: unknown): string {
  if (error instanceof GenerationError && error.status !== null) {
    switch (error.status) {
      case 400:
        return `the request was rejected (${error.message})`;
      case 401:
      case 403:
        return 'the API key was rejected by the provider';
      case 429:
        return 'the provider quota or rate limit is used up';
      case 502:
        return error.message === 'model output failed validation'
          ? 'the model answered, but its output failed validation'
          : 'the provider call failed or timed out';
      case 503:
        return 'no API key is set on the server and none was entered';
      default:
        return `the generation service returned status ${error.status}`;
    }
  }
  if (error instanceof GenerationError) return error.message;
  if (error instanceof TypeError) return 'the network connection failed';
  return 'of an unexpected error';
}
