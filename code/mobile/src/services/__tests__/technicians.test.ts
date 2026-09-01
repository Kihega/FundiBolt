import { fetchNearbyTechnicians } from "../technicians";

describe("fetchNearbyTechnicians", () => {
  const params = { latitude: -6.79, longitude: 39.24, token: "test-token" };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the technicians array on a successful response", async () => {
    const technicians = [
      { id: "1", fullName: "John Mwangi", specialty: "Plumbing", skills: ["Plumbing"], rating: 4.8, distanceKm: 0.4, isAvailable: true, latitude: -6.79, longitude: 39.24 },
    ];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ technicians }),
    }) as unknown as typeof fetch;

    const result = await fetchNearbyTechnicians(params);
    expect(result).toEqual(technicians);
  });

  it("falls back to an empty list when the endpoint responds with an error (e.g. 404 - not built yet)", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) }) as unknown as typeof fetch;

    const result = await fetchNearbyTechnicians(params);
    expect(result).toEqual([]);
  });

  it("falls back to an empty list on a network error instead of throwing", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch;

    await expect(fetchNearbyTechnicians(params)).resolves.toEqual([]);
  });

  it("falls back to an empty list when the response body is malformed", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ technicians: "not-an-array" }) }) as unknown as typeof fetch;

    const result = await fetchNearbyTechnicians(params);
    expect(result).toEqual([]);
  });
});
