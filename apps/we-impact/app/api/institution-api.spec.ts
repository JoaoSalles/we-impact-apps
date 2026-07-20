import { afterEach, describe, expect, it, vi } from "vitest";

import { createProject, getInstitution, getProject, listInstitutions, updateInstitution, updateProject } from "./institution-api";
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

describe("getInstitution", () => {
  afterEach(() => vi.clearAllMocks());

  function detailResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "abc",
        name: "Acme",
        type: "NGO",
        street: "1 Main St",
        city: "Rio",
        state: "RJ",
        postalCode: "20000-000",
        walletAccountIds: ["w1", "w2"],
      }),
    } as unknown as Response;
  }

  it("GETs the institution by id with credentials and returns its details", async () => {
    mockedFetch.mockResolvedValue(detailResponse());

    const institution = await getInstitution("abc");

    const url = new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
    expect(url.pathname.endsWith("/abc")).toBe(true);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
    expect(institution).toMatchObject({
      id: "abc",
      postalCode: "20000-000",
      walletAccountIds: ["w1", "w2"],
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(getInstitution("missing")).rejects.toThrow("404");
  });
});

describe("updateInstitution", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
    } as unknown as Response;
  }

  it("PUTs the values to the institution by id as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await updateInstitution("abc", { name: "Acme", city: "Rio" });

    const url = new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
    expect(url.pathname.endsWith("/institutions/abc")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({
      method: "PUT",
      credentials: "include",
    });
    expect(JSON.parse(String(init?.body))).toEqual({ name: "Acme", city: "Rio" });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(updateInstitution("abc", { name: "Acme" })).rejects.toThrow("400");
  });
});

describe("createProject", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 201, json: async () => ({}) } as unknown as Response;
  }

  it("POSTs the values to the institution's projects as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await createProject("abc", { title: "Clean Water", goal: 1000, description: "desc" });

    const url = new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
    expect(url.pathname.endsWith("/institutions/abc/projects")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({
      title: "Clean Water",
      goal: 1000,
      description: "desc",
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(createProject("abc", { title: "X" })).rejects.toThrow("400");
  });
});

describe("getProject", () => {
  afterEach(() => vi.clearAllMocks());

  function projectResponse() {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        id: "p1",
        institutionId: "abc",
        title: "Clean Water",
        goal: 1000,
        description: "desc",
        status: true,
        currentGoal: 250,
      }),
    } as unknown as Response;
  }

  it("GETs the project by ids with credentials and returns it", async () => {
    mockedFetch.mockResolvedValue(projectResponse());

    const project = await getProject("abc", "p1");

    const url = new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
    expect(url.pathname.endsWith("/institutions/abc/projects/p1")).toBe(true);
    expect(mockedFetch.mock.calls[0][1]).toMatchObject({
      method: "GET",
      credentials: "include",
    });
    expect(project).toMatchObject({ id: "p1", title: "Clean Water", currentGoal: 250 });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 404 } as Response);

    await expect(getProject("abc", "missing")).rejects.toThrow("404");
  });
});

describe("updateProject", () => {
  afterEach(() => vi.clearAllMocks());

  function okResponse() {
    return { ok: true, status: 200, json: async () => ({}) } as unknown as Response;
  }

  it("PUTs the values to the project by ids as JSON with credentials", async () => {
    mockedFetch.mockResolvedValue(okResponse());

    await updateProject("abc", "p1", { title: "Clean Water", goal: 2000, status: false });

    const url = new URL(String(mockedFetch.mock.calls[0][0]), "http://test.local");
    expect(url.pathname.endsWith("/institutions/abc/projects/p1")).toBe(true);
    const init = mockedFetch.mock.calls[0][1];
    expect(init).toMatchObject({ method: "PUT", credentials: "include" });
    expect(JSON.parse(String(init?.body))).toEqual({
      title: "Clean Water",
      goal: 2000,
      status: false,
    });
  });

  it("throws when the response is not ok", async () => {
    mockedFetch.mockResolvedValue({ ok: false, status: 400 } as Response);

    await expect(updateProject("abc", "p1", { title: "X" })).rejects.toThrow("400");
  });
});
