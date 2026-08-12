import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createCampaign,
  createCampaignTarget,
  createSupporter,
  deleteCampaignTarget,
  getCampaign,
  getSupporter,
  listCampaignTargets,
  listSupporterCampaigns,
  listSupporters,
  updateCampaign,
  updateSupporter,
} from "./supporter-api";
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

describe("getSupporter", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "1",
        name: "Acme Corp",
        createdAt: "2026-01-01T00:00:00Z",
      }),
    } as unknown as Response;
  }

  it("GETs /supporters/{id} with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await getSupporter("1");

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters/1")).toBe(true);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(getSupporter("1")).rejects.toThrow("404");
  });
});

describe("updateSupporter", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
  }

  it("PUTs the values to /supporters/{id} as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await updateSupporter("1", { name: "Acme Corp Updated" });

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters/1")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "PUT", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Acme Corp Updated" });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(updateSupporter("1", { name: "X" })).rejects.toThrow("400");
  });
});

describe("listSupporterCampaigns", () => {
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

    await listSupporterCampaigns("1");

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters/1/campaigns")).toBe(true);
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

    await listSupporterCampaigns("1", { pageNumber: 2, name: "  Water  " });

    const url = calledUrl();
    expect(url.searchParams.get("pageNumber")).toBe("2");
    expect(url.searchParams.get("name")).toBe("Water");
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(listSupporterCampaigns("1")).rejects.toThrow("500");
  });
});

describe("createCampaign", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 201, json: async () => ({}) } as unknown as Response;
  }

  it("POSTs the values to /supporters/{id}/campaigns as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await createCampaign("1", { name: "Clean Water" });

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters/1/campaigns")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Clean Water" });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(createCampaign("1", { name: "X" })).rejects.toThrow("400");
  });
});

describe("getCampaign", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "c1",
        supporterId: "1",
        name: "Clean Water",
        description: "desc",
        status: true,
      }),
    } as unknown as Response;
  }

  it("GETs /supporters/{id}/campaigns/{campaignId} with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await getCampaign("1", "c1");

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters/1/campaigns/c1")).toBe(true);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(getCampaign("1", "c1")).rejects.toThrow("404");
  });
});

describe("updateCampaign", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
  }

  it("PUTs the values to /supporters/{id}/campaigns/{campaignId} as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await updateCampaign("1", "c1", { name: "Fresh Water", status: false });

    const url = calledUrl();
    expect(url.pathname.endsWith("/supporters/1/campaigns/c1")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "PUT", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({
      name: "Fresh Water",
      status: false,
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(updateCampaign("1", "c1", { name: "X" })).rejects.toThrow("400");
  });
});

describe("listCampaignTargets", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({ items: [], pageNumber: 0, pageSize: 20, hasNext: false }),
    } as unknown as Response;
  }

  it("applies default pageSize=20 and pageNumber=0", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listCampaignTargets("c1");

    const url = calledUrl();
    expect(url.pathname.endsWith("/campaigns/c1/targets")).toBe(true);
    expect(url.searchParams.get("pageSize")).toBe("20");
    expect(url.searchParams.get("pageNumber")).toBe("0");
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
  });

  it("includes the requested page when provided", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await listCampaignTargets("c1", { pageNumber: 2 });

    const url = calledUrl();
    expect(url.searchParams.get("pageNumber")).toBe("2");
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 500 } as Response);

    await expect(listCampaignTargets("c1")).rejects.toThrow("500");
  });
});

describe("createCampaignTarget", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 201, json: async () => ({}) } as unknown as Response;
  }

  it("POSTs { projectId } to /campaigns/{id}/targets as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await createCampaignTarget("c1", "p1");

    const url = calledUrl();
    expect(url.pathname.endsWith("/campaigns/c1/targets")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({ projectId: "p1" });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(createCampaignTarget("c1", "p1")).rejects.toThrow("400");
  });
});

describe("deleteCampaignTarget", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 204, json: async () => ({}) } as unknown as Response;
  }

  it("DELETEs /campaigns/{id}/targets/{projectId} with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await deleteCampaignTarget("c1", "p1");

    const url = calledUrl();
    expect(url.pathname.endsWith("/campaigns/c1/targets/p1")).toBe(true);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(deleteCampaignTarget("c1", "p1")).rejects.toThrow("404");
  });
});
