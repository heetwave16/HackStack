import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GatewayError,
  generateWithGateway,
  listOpenRouterModels,
  type GatewayRequest,
} from "@/lib/ai-gateway";

const CALLER_KEY = "caller-gateway-sentinel+/=not-a-real-key";
const DEPLOYMENT_KEY = "deployment-gateway-sentinel-not-a-real-key";
const PRIVATE_DETAIL = "PRIVATE_UPSTREAM_BODY_SENTINEL";
const LEAK = `${PRIVATE_DETAIL}: ${CALLER_KEY}; ${encodeURIComponent(CALLER_KEY)}; ${DEPLOYMENT_KEY}`;
const OUTPUT = "Safe caller-generated content";
const TIMEOUT_MS = 1234;
const PROVIDERS = [
  {
    provider: "openrouter",
    model: "test/caller-model",
    baseUrl: "https://openrouter.ai/api/v1",
  },
  {
    provider: "openai-compatible",
    model: "gpt-4o-mini",
    baseUrl: "https://api.openai.com/v1",
  },
  {
    provider: "gemini",
    model: "gemini-2.5-flash",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
] as const;

type Provider = (typeof PROVIDERS)[number];

function request(
  provider: Provider,
  overrides: Partial<GatewayRequest> = {},
): GatewayRequest {
  return {
    provider: provider.provider,
    model: provider.model,
    apiKey: CALLER_KEY,
    system: "Return a focused artifact.",
    user: "Build a caller-owned project.",
    timeoutMs: TIMEOUT_MS,
    ...overrides,
  };
}

function contentBody(provider: Provider["provider"], text: string) {
  return provider === "gemini"
    ? { candidates: [{ content: { parts: [{ text }] } }] }
    : { choices: [{ message: { content: text } }] };
}

const PATHS = [
  ...PROVIDERS.map((provider) => ({
    name: provider.provider,
    url:
      provider.provider === "gemini"
        ? `${provider.baseUrl}/models/${provider.model}:generateContent`
        : `${provider.baseUrl}/chat/completions`,
    invoke: (apiKey = CALLER_KEY) =>
      generateWithGateway(request(provider, { apiKey })),
    successBody: contentBody(provider.provider, OUTPUT),
    emptyBody: contentBody(provider.provider, " \n\t "),
    expected: OUTPUT,
  })),
  {
    name: "models discovery",
    url: "https://openrouter.ai/api/v1/models",
    invoke: (apiKey = CALLER_KEY) => listOpenRouterModels(apiKey),
    successBody: {
      data: [
        {
          id: "test/public-model",
          name: "Public model",
          context_length: 16000,
          pricing: { prompt: "0", completion: "0" },
        },
      ],
    },
    emptyBody: { data: null },
    expected: [
      {
        id: "test/public-model",
        name: "Public model",
        contextLength: 16000,
        free: true,
      },
    ],
  },
];

const fetchMock = vi.fn<typeof fetch>();

async function expectGatewayError(
  pending: Promise<unknown>,
  code: GatewayError["code"],
  status?: number,
) {
  const error: unknown = await pending.then(
    () => undefined,
    (failure: unknown) => failure,
  );
  expect(error).toBeInstanceOf(GatewayError);
  const failure = error as GatewayError;
  expect(failure.code).toBe(code);
  if (status !== undefined) expect(failure.status).toBe(status);
  expect(failure.message.trim()).not.toBe("");
  // Include non-enumerable message/stack/cause, not just the serialized error response.
  const exposed = `${String(failure)}\n${JSON.stringify(failure, Object.getOwnPropertyNames(failure))}`;
  for (const secret of [
    CALLER_KEY,
    encodeURIComponent(CALLER_KEY),
    DEPLOYMENT_KEY,
    PRIVATE_DETAIL.slice(0, 8),
  ]) {
    expect(exposed).not.toContain(secret);
  }
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const name of [
    "OPENROUTER_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
  ]) {
    vi.stubEnv(name, DEPLOYMENT_KEY);
  }
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hackstack.example");
  fetchMock.mockRejectedValue(new Error("Unexpected mocked fetch"));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  try {
    expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(DEPLOYMENT_KEY);
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  }
});

describe.each(PATHS)("direct gateway: $name", (path) => {
  it("uses the fixed destination with redirects disabled, no cache, and no ambient credentials", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(path.successBody));
    await expect(path.invoke()).resolves.toEqual(path.expected);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, options] = fetchMock.mock.calls[0];
    expect(String(input)).toBe(path.url);
    expect(options).toMatchObject({
      redirect: "error",
      cache: "no-store",
      credentials: "omit",
    });
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    const headers = new Headers(options?.headers);
    expect(
      headers.get(path.name === "gemini" ? "x-goog-api-key" : "authorization"),
    ).toBe(path.name === "gemini" ? CALLER_KEY : `Bearer ${CALLER_KEY}`);
    expect(String(input)).not.toContain(CALLER_KEY);
    expect(String(input)).not.toContain(encodeURIComponent(CALLER_KEY));
    expect(options?.body ?? "").not.toContain(CALLER_KEY);
  });

  it.each([302, 307, 308])(
    "rejects a mocked %i without following Location or making a second fetch",
    async (status) => {
      fetchMock.mockImplementation(async () => Response.json(path.successBody));
      fetchMock.mockResolvedValueOnce(
        new Response(LEAK, {
          status,
          headers: {
            Location: `https://attacker.example/collect?key=${encodeURIComponent(CALLER_KEY)}`,
          },
        }),
      );
      await expectGatewayError(path.invoke(), "provider", status);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("sanitizes invalid shapes, empty content/body, and non-JSON responses", async () => {
    const responses = [
      Response.json({ error: { message: LEAK } }),
      Response.json(path.emptyBody),
      new Response(""),
      new Response(LEAK),
    ];
    for (const response of responses) {
      fetchMock.mockClear();
      fetchMock.mockResolvedValueOnce(response);
      await expectGatewayError(path.invoke(), "invalid_response");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it("turns a rejected fetch containing raw/encoded keys into a sanitized GatewayError", async () => {
    fetchMock.mockRejectedValueOnce(
      new Error(
        `Fetch failed at https://attacker.example/?key=${encodeURIComponent(CALLER_KEY)}: ${LEAK}`,
      ),
    );
    await expectGatewayError(path.invoke(), "provider");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("passes a deadline signal and sanitizes both timeout and abort failures", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout");
    for (const name of ["TimeoutError", "AbortError"]) {
      fetchMock.mockClear();
      timeout.mockClear();
      const controller = new AbortController();
      timeout.mockReturnValue(controller.signal);
      fetchMock.mockImplementation((_input, options) => {
        expect(options?.signal).toBe(controller.signal);
        return new Promise<Response>((_resolve, reject) => {
          controller.signal.addEventListener(
            "abort",
            () => reject(controller.signal.reason),
            { once: true },
          );
        });
      });
      const pending = path.invoke();
      controller.abort(new DOMException(LEAK, name));
      await expectGatewayError(pending, "timeout");
      expect(timeout).toHaveBeenCalledTimes(1);
      expect(timeout).toHaveBeenCalledWith(
        path.name === "models discovery" ? expect.any(Number) : TIMEOUT_MS,
      );
      expect(fetchMock).toHaveBeenCalledTimes(1);
    }
  });

  it.each(["TimeoutError", "AbortError"])(
    "preserves a %s while reading the response body as a timeout",
    async (name) => {
      const response = Response.json(path.successBody);
      vi.spyOn(response, "json").mockRejectedValueOnce(
        new DOMException(LEAK, name),
      );
      fetchMock.mockResolvedValueOnce(response);
      await expectGatewayError(path.invoke(), "timeout");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    },
  );

  it("rejects an API key containing an internal newline before fetch", async () => {
    await expectGatewayError(
      path.invoke(`${CALLER_KEY}\nInjected-Header: value`),
      "invalid_request",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("direct gateway endpoint and Gemini credential isolation", () => {
  it.each(PROVIDERS)(
    "rejects a mismatched base for $provider without trusting a direct caller",
    async (provider) => {
      const other = PROVIDERS.find(
        (candidate) => candidate.provider !== provider.provider,
      )!;
      await expectGatewayError(
        generateWithGateway(request(provider, { baseUrl: other.baseUrl })),
        "unsafe_endpoint",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it.each([
    "gemini-2.5-flash?key=attacker&alt=sse#fragment",
    "//attacker.example/models/pwn?key=attacker",
    "https://attacker.example/collect?forward=1",
    "../../models/other:generateContent?key=stolen",
    "..%2f..%2fcollect?key=stolen",
  ])(
    "encodes hostile Gemini model %j as one path component and keeps the key out of the URL",
    async (model) => {
      const gemini = PROVIDERS[2];
      fetchMock.mockResolvedValueOnce(
        Response.json(contentBody("gemini", OUTPUT)),
      );
      await expect(
        generateWithGateway(request(gemini, { model })),
      ).resolves.toBe(OUTPUT);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [input, options] = fetchMock.mock.calls[0];
      const url = new URL(String(input));
      expect(url.origin).toBe("https://generativelanguage.googleapis.com");
      expect(url.pathname).toBe(
        `/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      );
      expect(url.search).toBe("");
      expect(url.hash).toBe("");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
      expect(url.href).not.toContain(CALLER_KEY);
      expect(url.href).not.toContain(encodeURIComponent(CALLER_KEY));
      expect(new Headers(options?.headers).get("x-goog-api-key")).toBe(
        CALLER_KEY,
      );
      expect(options?.body ?? "").not.toContain(CALLER_KEY);
    },
  );
});
