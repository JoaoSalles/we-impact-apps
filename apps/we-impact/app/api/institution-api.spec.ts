import { afterEach, describe, expect, it, vi } from "vitest";

import { listInstitutions } from "./institution-api";
import { apiFetch } from "./api";

vi.mock("./api", () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

function okResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({ items: [], pageNumber: 0, pageSize: 20, hasNext: false }),
  } as unknown as Response;
}

function calledUrl() {
  return new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
}

describe("listInstitutions", () => {
  afterEach(() => vi.clearAllMocks());

  it("applies default pageSize=20 and pageNumber=0 and omits empty filters", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listInstitutions();

    const url = calledUrl();
    expect(url.pathname.endsWith("/institutions")).toBe(true);
    expect(url.searchParams.get("pageSize")).toBe("20");
    expect(url.searchParams.get("pageNumber")).toBe("0");
    expect(url.searchParams.has("name")).toBe(false);
    expect(url.searchParams.has("city")).toBe(false);
    expect(url.searchParams.has("state")).toBe(false);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({ method: "GET" });
  });

  it("includes trimmed name, city and state filters when provided", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listInstitutions({ pageNumber: 2, name: "  Acme  ", city: "São Paulo", state: "SP" });

    const url = calledUrl();
    expect(url.searchParams.get("pageNumber")).toBe("2");
    expect(url.searchParams.get("name")).toBe("Acme");
    expect(url.searchParams.get("city")).toBe("São Paulo");
    expect(url.searchParams.get("state")).toBe("SP");
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(listInstitutions()).rejects.toThrow("500");
  });
});
