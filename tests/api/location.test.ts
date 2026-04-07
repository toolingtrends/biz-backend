import express from "express";
import request from "supertest";

import locationRouter from "../../src/modules/location/location.routes";
import * as locationService from "../../src/modules/location/location.service";

jest.mock("../../src/modules/location/location.service");

const mockedService = locationService as jest.Mocked<typeof locationService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/location", locationRouter);
  return app;
}

describe("GET /api/location", () => {
  const app = buildApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("/countries", () => {
    it("returns 200 and country list from service", async () => {
      mockedService.listPublicCountries.mockResolvedValue([
        {
          id: "c1",
          name: "India",
          code: "IN",
          flag: "🇮🇳",
          cities: [{ id: "city1", name: "Mumbai", image: null }],
        },
      ] as Awaited<ReturnType<typeof locationService.listPublicCountries>>);

      const res = await request(app).get("/api/location/countries").expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe("India");
      expect(mockedService.listPublicCountries).toHaveBeenCalledTimes(1);
    });

    it("returns 500 when service throws", async () => {
      mockedService.listPublicCountries.mockRejectedValue(new Error("db down"));

      const res = await request(app).get("/api/location/countries").expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/db down/i);
    });
  });

  describe("/cities", () => {
    it("returns 200 and serialized cities", async () => {
      const created = new Date("2026-01-01T00:00:00.000Z");
      mockedService.listPublicCities.mockResolvedValue([
        {
          id: "city-1",
          name: "Berlin",
          image: null,
          countryId: "de",
          country: { id: "de", name: "Germany", code: "DE" },
          createdAt: created,
          updatedAt: created,
        },
      ] as Awaited<ReturnType<typeof locationService.listPublicCities>>);

      const res = await request(app)
        .get("/api/location/cities")
        .query({ countryId: "de" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data[0].name).toBe("Berlin");
      expect(res.body.data[0].createdAt).toBe(created.toISOString());
      expect(mockedService.listPublicCities).toHaveBeenCalledWith("de");
    });

    it("calls service with undefined countryId when query omitted", async () => {
      mockedService.listPublicCities.mockResolvedValue([]);

      await request(app).get("/api/location/cities").expect(200);

      expect(mockedService.listPublicCities).toHaveBeenCalledWith(undefined);
    });
  });
});
