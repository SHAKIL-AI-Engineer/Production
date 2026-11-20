import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { api } from "../lib/api";

afterEach(() => {
  mock.restoreAll();
  api.setAuthToken(null);
});

test("the API client accepts the Go API's unwrapped arrays and records", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify([{ id: "expense-1", amount: 12.5 }]), {
        headers: { "content-type": "application/json" },
      }),
  );
  const response = await api.get<{ id: string; amount: number }[]>("/expenses");
  assert.equal(response.success, true);
  assert.deepEqual(response.data, [{ id: "expense-1", amount: 12.5 }]);
});

test("a successful 204 deletion does not try to parse JSON", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(null, {
        status: 204,
        headers: { "content-type": "application/json" },
      }),
  );
  const response = await api.delete("/expenses/expense-1");
  assert.equal(response.success, true);
  assert.equal(response.data, null);
});

test("the API client forwards authentication and cancellation", async () => {
  let options: RequestInit | undefined;
  mock.method(globalThis, "fetch", async (_url: string, init: RequestInit) => {
    options = init;
    return new Response("{}", {
      headers: { "content-type": "application/json" },
    });
  });
  const controller = new AbortController();
  api.setAuthToken("test-session");
  await api.get("/productions", { signal: controller.signal });
  assert.equal(
    (options?.headers as Record<string, string>).Authorization,
    "Bearer test-session",
  );
  assert.equal(options?.signal, controller.signal);
  api.setAuthToken(null);
  await api.get("/productions");
  assert.equal(
    (options?.headers as Record<string, string>).Authorization,
    undefined,
  );
});

test("API errors preserve status and the server's actionable message", async () => {
  mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response(JSON.stringify({ error: "invalid credentials" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
  );
  await assert.rejects(
    api.post("/auth/login", {}),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "invalid credentials" &&
      "statusCode" in error &&
      error.statusCode === 401,
  );
});
