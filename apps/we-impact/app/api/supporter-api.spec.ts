import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupporter, listSupporters } from "./supporter-api";
import { apiFetch } from "./api";

vi.mock("./api", () => ({
  apiFetch: vi.fn(),
}));

const mockedFetch = vi.mocked(apiFetch);

function calledUrl() {
  return new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
}

describe("listSupporters", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({ items: [], pageNumber: 0, pageSize: 20, hasNext: false }),
    } as unknown as Response;
  }

  it("applies default pageSize=20 and pageNumber=0 and omits an empty name filter", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listSupporters();

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters")).toBe(true);
    expect(url.searchParams.get("pageSize")).toBe("20");
    expect(url.searchParams.get("pageNumber")).toBe("0");
    expect(url.searchParams.has("name")).toBe(false);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
  });

  it("includes a trimmed name filter and requested page when provided", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listSupporters({ pageNumber: 2, name: "  Acme  " });

    const url = calledUrl();
    expect(url.searchParams.get("pageNumber")).toBe("2");
    expect(url.searchParams.get("name")).toBe("Acme");
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(listSupporters()).rejects.toThrow("500");
  });
});

describe("createSupporter", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 201, json: async () => ({}) } as unknown as Response;
  }

  it("POSTs the values to /supporters as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await createSupporter({ name: "Acme Corp", document: "12.345.678/0001-90" });

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Acme Corp",
      document: "12.345.678/0001-90",
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(createSupporter({ name: "X" })).rejects.toThrow("400");
  });
});
