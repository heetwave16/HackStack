import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as runAgent } from "@/app/api/agents/run/route";
import { POST as generate } from "@/app/api/generate/route";
import { GET as discoverModels } from "@/app/api/ai/models/route";
import * as gateway from "@/lib/ai-gateway";
import { FALLBACK_HACKSTACK_RESULT } from "@/types/hackstack";

const cloud = vi.hoisted(() => ({
  getUserIdFromAccessToken: vi.fn(),
  persistGenerationRun: vi.fn(),
}));

vi.mock("@/lib/supabase", () => cloud);

const DEPLOYMENT_KEYS = {
  OPENROUTER_API_KEY: "deployment-openrouter-sentinel-not-a-real-key",
  OPENAI_API_KEY: "deployment-openai-sentinel-not-a-real-key",
  GEMINI_API_KEY: "deployment-gemini-sentinel-not-a-real-key",
  GOOGLE_API_KEY: "deployment-google-sentinel-not-a-real-key",
};
const CALLER_KEY = "caller-sentinel-not-a-real-api-key";
const ACCESS_TOKEN = "session-sentinel-not-an-api-key";
const RAW_PROVIDER_DETAIL = "PRIVATE_UPSTREAM_DIAGNOSTIC_DO_NOT_RETURN";
const IDEA = "A focused campus project dashboard";
const CONTEXT =
  "Keep the existing preview and pitch unchanged; update only the requested file.";
const TARGETED_PATCH = {
  files: {
    "src/app/page.tsx":
      "export default function Page() { return <main>Caller project</main>; }",
  },
};
const AGENT_OUTPUT = JSON.stringify(TARGETED_PATCH);
const LIVE_OUTPUT = {
  ...structuredClone(FALLBACK_HACKSTACK_RESULT),
  projectName: "Caller-key live project",
  tagline:
    "This content came from the caller-selected provider, not an offline fallback.",
};

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
type RouteConfig = {
  provider: string;
  model: string;
  apiKey?: unknown;
  baseUrl?: string;
};

const ROUTES = [
  {
    path: "/api/agents/run",
    handler: runAgent,
    buildBody: (config: RouteConfig): Record<string, unknown> => ({
      agent: "code",
      idea: IDEA,
      context: CONTEXT,
      ...config,
    }),
    output: AGENT_OUTPUT,
  },
  {
    path: "/api/generate",
    handler: generate,
    buildBody: ({
      model,
      ...config
    }: RouteConfig): Record<string, unknown> => ({
      idea: IDEA,
      stack: "Next.js + Node + Postgres",
      features: ["A focused dashboard"],
      modelConfig: { ...config, modelId: model },
    }),
    output: JSON.stringify(LIVE_OUTPUT),
  },
];

const fetchMock = vi.fn<typeof fetch>();

function postRequest(path: string, body: unknown, raw = false): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: raw ? String(body) : JSON.stringify(body),
  });
}

function modelsRequest(authorization?: string): Request {
  return new Request("http://localhost/api/ai/models", {
    headers:
      authorization === undefined
        ? undefined
        : { Authorization: authorization },
  });
}

function upstreamResponse(
  provider: Provider["provider"],
  output: string,
): Response {
  return Response.json(
    provider === "gemini"
      ? { candidates: [{ content: { parts: [{ text: output }] } }] }
      : { choices: [{ message: { content: output } }] },
  );
}

function sentRequest(): Request {
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [input, init] = fetchMock.mock.calls[0];
  return new Request(input, init);
}

function expectNoStore(response: Response): void {
  expect(response.headers.get("cache-control") ?? "").toMatch(/\bno-store\b/i);
}

function expectNoSecrets(text: string): void {
  for (const secret of [
    ...Object.values(DEPLOYMENT_KEYS),
    CALLER_KEY,
    ACCESS_TOKEN,
    RAW_PROVIDER_DETAIL,
  ]) {
    expect(text).not.toContain(secret);
    expect(text).not.toContain(encodeURIComponent(secret));
  }
}

function expectNoSideEffects(): void {
  expect(fetchMock).not.toHaveBeenCalled();
  expect(cloud.getUserIdFromAccessToken).not.toHaveBeenCalled();
  expect(cloud.persistGenerationRun).not.toHaveBeenCalled();
}

async function expectRejection(
  response: Response,
  status: number,
  code?: string,
): Promise<void> {
  const text = await response.text();
  expectNoSecrets(text);
  expectNoSideEffects();
  expect(response.status).toBe(status);
  const body = JSON.parse(text);
  expect(body.error).toEqual(expect.any(String));
  expect(body.error.trim()).not.toBe("");
  if (code) expect(body.code).toBe(code);
  if (code === "missing_key") {
    expect(body.error).toMatch(/api[ -]?key/i);
    expect(body.error).toMatch(/add|enter|provide|supply|your|settings/i);
  }
  expect(body).not.toHaveProperty("validation");
  expect(body).not.toHaveProperty("projectName");
  expect(body).not.toHaveProperty("patch");
  expectNoStore(response);
}

function unsafeEndpoints({ baseUrl }: Provider) {
  const { origin, hostname, pathname } = new URL(baseUrl);
  return [
    {
      label: "original arbitrary-public-host exfiltration",
      url: "https://attacker.example/collect",
    },
    { label: "HTTP downgrade", url: baseUrl.replace("https:", "http:") },
    {
      label: "lookalike host suffix",
      url: `https://${hostname}.attacker.example${pathname}`,
    },
    {
      label: "trusted host in userinfo",
      url: `https://${hostname}@attacker.example${pathname}`,
    },
    {
      label: "credentials on the trusted host",
      url: `https://attacker:password@${hostname}${pathname}`,
    },
    { label: "non-default port", url: `https://${hostname}:8443${pathname}` },
    {
      label: "explicit default port is not the exact base",
      url: `https://${hostname}:443${pathname}`,
    },
    { label: "trailing host dot", url: `https://${hostname}.${pathname}` },
    { label: "trailing path slash", url: `${baseUrl}/` },
    { label: "extra path", url: `${baseUrl}/collect` },
    {
      label: "query-string override",
      url: `${baseUrl}?forward=https://attacker.example`,
    },
    { label: "fragment override", url: `${baseUrl}#https://attacker.example` },
    {
      label: "dot-segment normalization",
      url: `${origin}/ignored/..${pathname}`,
    },
    {
      label: "encoded dot-segment normalization",
      url: `${origin}/%2e${pathname}`,
    },
    {
      label: "encoded host spelling",
      url: `https://%${hostname.charCodeAt(0).toString(16)}${hostname.slice(1)}${pathname}`,
    },
    { label: "localhost", url: `https://localhost${pathname}` },
    { label: "loopback IPv4", url: `https://127.0.0.1${pathname}` },
    { label: "loopback IPv6", url: `https://[::1]${pathname}` },
    { label: "private network", url: `https://10.0.0.1${pathname}` },
    {
      label: "cloud metadata address",
      url: `https://169.254.169.254${pathname}`,
    },
    ...PROVIDERS.filter((provider) => provider.baseUrl !== baseUrl).map(
      (provider) => ({
        label: `another provider's fixed base (${provider.provider})`,
        url: provider.baseUrl,
      }),
    ),
  ];
}

beforeEach(() => {
  vi.resetAllMocks();
  for (const [name, value] of Object.entries(DEPLOYMENT_KEYS))
    vi.stubEnv(name, value);
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://hackstack.example");
  // Even an unexpected provider call is intercepted: this suite never uses the real network.
  fetchMock.mockRejectedValue(
    new Error(
      "Unexpected mocked fetch: request should have been rejected locally",
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  cloud.getUserIdFromAccessToken.mockResolvedValue("test-user-id");
  cloud.persistGenerationRun.mockResolvedValue(undefined);
});

afterEach(() => {
  try {
    // Deployment credentials must never reach an outbound request or a persisted run, even on a failing assertion.
    for (const key of Object.values(DEPLOYMENT_KEYS)) {
      expect(JSON.stringify(fetchMock.mock.calls)).not.toContain(key);
      expect(
        JSON.stringify(cloud.persistGenerationRun.mock.calls),
      ).not.toContain(key);
    }
  } finally {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    vi.resetAllMocks();
  }
});

describe.each(ROUTES)("$path credential boundary", (route) => {
  describe.each(PROVIDERS)("$provider", (provider) => {
    it.each([
      { label: "omitted", apiKey: undefined },
      { label: "empty", apiKey: "" },
      { label: "whitespace-only", apiKey: " \t\r\n " },
    ])(
      "rejects an $label caller key despite deployment credentials",
      async ({ apiKey }) => {
        const response = await route.handler(
          postRequest(route.path, route.buildBody({ ...provider, apiKey })),
        );
        await expectRejection(response, 401, "missing_key");
      },
    );

    it("rejects a missing caller key without an offline fallback when deployment keys are unset", async () => {
      for (const name of Object.keys(DEPLOYMENT_KEYS))
        vi.stubEnv(name, undefined);
      const response = await route.handler(
        postRequest(route.path, route.buildBody({ ...provider, apiKey: "" })),
      );
      await expectRejection(response, 401, "missing_key");
    });

    it.each(unsafeEndpoints(provider))(
      "rejects $label before fetch, auth lookup, or persistence",
      async ({ url }) => {
        const response = await route.handler(
          postRequest(
            route.path,
            route.buildBody({
              ...provider,
              apiKey: CALLER_KEY,
              baseUrl: url,
            }),
          ),
        );
        await expectRejection(response, 400, "unsafe_endpoint");
      },
    );

    it.each([
      { label: "the provider default", explicitBase: false },
      { label: "the exact fixed provider base", explicitBase: true },
    ])(
      "uses only the caller key with $label and preserves live output",
      async ({ explicitBase }) => {
        fetchMock.mockImplementation(async () =>
          upstreamResponse(provider.provider, route.output),
        );
        const response = await route.handler(
          postRequest(
            route.path,
            route.buildBody({
              ...provider,
              baseUrl: explicitBase ? provider.baseUrl : undefined,
              apiKey: ` \t${CALLER_KEY}\n `,
            }),
          ),
        );
        const text = await response.text();
        expectNoSecrets(text);
        expect(response.status).toBe(200);
        const body = JSON.parse(text);
        if (route.path === "/api/agents/run") {
          expect(body).toEqual({
            agent: "code",
            output: AGENT_OUTPUT,
            patch: TARGETED_PATCH,
          });
          expect(body.patch).not.toHaveProperty("livePreview");
          expect(body.patch).not.toHaveProperty("pitchSlides");
          expect(cloud.getUserIdFromAccessToken).not.toHaveBeenCalled();
          expect(cloud.persistGenerationRun).not.toHaveBeenCalled();
        } else {
          expect(body.projectName).toBe(LIVE_OUTPUT.projectName);
          expect(body.codebase).toEqual(LIVE_OUTPUT.codebase);
          expect(body.previewApp).toEqual(LIVE_OUTPUT.previewApp);
          expect(body.validation).toMatchObject({
            usedFallback: false,
            modelUsed: provider.model,
          });
          expect(cloud.getUserIdFromAccessToken).toHaveBeenCalledTimes(1);
          expect(cloud.getUserIdFromAccessToken).toHaveBeenCalledWith(
            ACCESS_TOKEN,
          );
          expect(cloud.persistGenerationRun).toHaveBeenCalledTimes(1);
          expect(cloud.persistGenerationRun).toHaveBeenCalledWith(
            expect.objectContaining({
              output: body,
              source: "live",
              userId: "test-user-id",
            }),
          );
        }
        const outbound = sentRequest();
        const url = new URL(outbound.url);
        const base = new URL(provider.baseUrl);
        expect(outbound.method).toBe("POST");
        expect(url.origin).toBe(base.origin);
        if (provider.provider === "gemini") {
          expect(url.pathname).toBe(
            `${base.pathname}/models/${provider.model}:generateContent`,
          );
          expect(
            outbound.headers.get("x-goog-api-key") ??
              url.searchParams.get("key"),
          ).toBe(CALLER_KEY);
        } else {
          expect(url.pathname).toBe(`${base.pathname}/chat/completions`);
          expect(outbound.headers.get("authorization")).toBe(
            `Bearer ${CALLER_KEY}`,
          );
        }
        const outboundBody = await outbound.text();
        expect(outboundBody).toContain(IDEA);
        expect(outboundBody).not.toContain(CALLER_KEY);
        if (route.path === "/api/agents/run")
          expect(outboundBody).toContain(CONTEXT);
        expectNoStore(response);
      },
    );

    it.each(["json", "text", "network"] as const)(
      "sanitizes %s upstream failures instead of returning raw details or keys",
      async (kind) => {
        const detail = `${RAW_PROVIDER_DETAIL}: ${CALLER_KEY}; ${
          DEPLOYMENT_KEYS[
            provider.provider === "gemini"
              ? "GEMINI_API_KEY"
              : provider.provider === "openrouter"
                ? "OPENROUTER_API_KEY"
                : "OPENAI_API_KEY"
          ]
        }`;
        fetchMock.mockImplementation(async () => {
          if (kind === "network")
            throw new Error(
              `Network failure at https://attacker.example/?key=${CALLER_KEY}: ${detail}`,
            );
          return kind === "json"
            ? Response.json({ error: { message: detail } }, { status: 503 })
            : new Response(detail, { status: 503 });
        });
        const response = await route.handler(
          postRequest(
            route.path,
            route.buildBody({ ...provider, apiKey: CALLER_KEY }),
          ),
        );
        const text = await response.text();
        expectNoSecrets(text);
        const body = JSON.parse(text);
        // A genuine generation failure may retain the existing offline fallback; its reason must also be sanitized.
        if (route.path === "/api/generate" && response.status === 200) {
          expect(body.validation).toMatchObject({
            usedFallback: true,
            fallbackReason: expect.any(String),
          });
          expect(body.validation.fallbackReason.trim()).not.toBe("");
        } else {
          expect(response.status).toBe(502);
          expect(body.error).toEqual(expect.any(String));
          expect(body.error.trim()).not.toBe("");
        }
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expectNoStore(response);
      },
    );
  });

  it("blocks the original deployment-key exfiltration attempt with no caller key", async () => {
    const response = await route.handler(
      postRequest(
        route.path,
        route.buildBody({
          provider: "openrouter",
          model: "openrouter/free",
          apiKey: "",
          baseUrl: "https://attacker.example/collect",
        }),
      ),
    );
    await expectRejection(response, 400, "unsafe_endpoint");
  });

  it("requires a caller key when optional provider configuration is omitted", async () => {
    const body =
      route.path === "/api/agents/run"
        ? { agent: "code", idea: IDEA }
        : { idea: IDEA };
    const response = await route.handler(postRequest(route.path, body));
    await expectRejection(response, 401, "missing_key");
  });

  it.each(["", "{", '{"idea":', "not JSON"])(
    "rejects malformed JSON %j without side effects",
    async (raw) => {
      const response = await route.handler(postRequest(route.path, raw, true));
      await expectRejection(response, 400);
    },
  );

  const validConfig = { ...PROVIDERS[0], apiKey: CALLER_KEY };
  it.each([
    { label: "null", body: null },
    { label: "an array", body: [] },
    { label: "missing required fields", body: {} },
    {
      label: "a blank idea",
      body: { ...route.buildBody(validConfig), idea: " \t " },
    },
    {
      label: "an oversized idea",
      body: { ...route.buildBody(validConfig), idea: "x".repeat(2001) },
    },
    {
      label: "a non-string idea",
      body: { ...route.buildBody(validConfig), idea: 42 },
    },
    {
      label: "an unsupported provider",
      body: route.buildBody({ ...validConfig, provider: "unsupported" }),
    },
    {
      label: "a blank model",
      body: route.buildBody({ ...validConfig, model: " " }),
    },
    {
      label: "a non-string API key",
      body: route.buildBody({ ...validConfig, apiKey: 123 }),
    },
    {
      label: "a syntactically invalid URL",
      body: route.buildBody({ ...validConfig, baseUrl: "not a URL" }),
    },
    ...(route.path === "/api/agents/run"
      ? [
          {
            label: "an unknown agent",
            body: { ...route.buildBody(validConfig), agent: "unknown" },
          },
        ]
      : [
          {
            label: "non-array features",
            body: { ...route.buildBody(validConfig), features: "dashboard" },
          },
        ]),
  ])(
    "rejects $label without network, auth lookup, or persistence",
    async ({ body }) => {
      const response = await route.handler(postRequest(route.path, body));
      await expectRejection(response, 400);
    },
  );
});

const MODEL_METADATA = {
  data: [
    {
      id: "test/public-model",
      name: "Public model",
      context_length: 128000,
      pricing: { prompt: "0", completion: "0" },
    },
    { id: "test/too-small", context_length: 1000 },
  ],
};
const EXPECTED_MODELS = [
  {
    id: "test/public-model",
    name: "Public model",
    contextLength: 128000,
    free: true,
  },
];

describe("/api/ai/models credential boundary", () => {
  it("uses listOpenRouterModels('') and public metadata when Authorization is absent, never a deployment key", async () => {
    const listModels = vi.spyOn(gateway, "listOpenRouterModels"); // Call through to the real gateway.
    fetchMock.mockResolvedValueOnce(Response.json(MODEL_METADATA));
    const response = await discoverModels(modelsRequest());
    const text = await response.text();
    expectNoSecrets(text);
    expect(listModels).toHaveBeenCalledTimes(1);
    expect(listModels).toHaveBeenCalledWith("");
    expect(response.status).toBe(200);
    expect(JSON.parse(text)).toEqual({ models: EXPECTED_MODELS });
    const outbound = sentRequest();
    expect(outbound.url).toBe("https://openrouter.ai/api/v1/models");
    expect(outbound.method).toBe("GET");
    expect(outbound.headers.has("authorization")).toBe(false);
    expect(cloud.getUserIdFromAccessToken).not.toHaveBeenCalled();
    expect(cloud.persistGenerationRun).not.toHaveBeenCalled();
    expectNoStore(response);
  });

  it.each(["Bearer", "bEaReR"])(
    "forwards only the caller key from a valid %s header",
    async (scheme) => {
      const listModels = vi.spyOn(gateway, "listOpenRouterModels");
      fetchMock.mockResolvedValueOnce(Response.json(MODEL_METADATA));
      const response = await discoverModels(
        modelsRequest(`${scheme} ${CALLER_KEY}`),
      );
      const text = await response.text();
      expectNoSecrets(text);
      expect(response.status).toBe(200);
      expect(JSON.parse(text)).toEqual({ models: EXPECTED_MODELS });
      expect(listModels).toHaveBeenCalledTimes(1);
      expect(listModels).toHaveBeenCalledWith(CALLER_KEY);
      const outbound = sentRequest();
      expect(outbound.url).toBe("https://openrouter.ai/api/v1/models");
      expect(outbound.headers.get("authorization")).toBe(
        `Bearer ${CALLER_KEY}`,
      );
      expect(cloud.getUserIdFromAccessToken).not.toHaveBeenCalled();
      expect(cloud.persistGenerationRun).not.toHaveBeenCalled();
      expectNoStore(response);
    },
  );

  it.each([
    `Basic ${CALLER_KEY}`,
    `Token ${CALLER_KEY}`,
    `Digest ${CALLER_KEY}`,
    CALLER_KEY,
    "Bearer",
    "Bearer ",
    `Bearer ${CALLER_KEY} extra-token`,
  ])(
    "rejects malformed Authorization %j before fetching metadata",
    async (authorization) => {
      const response = await discoverModels(modelsRequest(authorization));
      await expectRejection(response, 400);
    },
  );

  it.each(["json", "text", "network"] as const)(
    "sanitizes %s model-discovery failures",
    async (kind) => {
      const detail = `${RAW_PROVIDER_DETAIL}: ${CALLER_KEY}; ${DEPLOYMENT_KEYS.OPENROUTER_API_KEY}`;
      fetchMock.mockImplementation(async () => {
        if (kind === "network") throw new Error(detail);
        return kind === "json"
          ? Response.json({ error: { message: detail } }, { status: 503 })
          : new Response(detail, { status: 503 });
      });
      const response = await discoverModels(
        modelsRequest(`Bearer ${CALLER_KEY}`),
      );
      const text = await response.text();
      expectNoSecrets(text);
      expect(response.status).toBe(502);
      const body = JSON.parse(text);
      expect(body.error).toEqual(expect.any(String));
      expect(body.error.trim()).not.toBe("");
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(cloud.getUserIdFromAccessToken).not.toHaveBeenCalled();
      expect(cloud.persistGenerationRun).not.toHaveBeenCalled();
      expectNoStore(response);
    },
  );
});
