import { afterEach, describe, expect, it, vi } from "vitest";
import fetch, { Response } from "node-fetch";

import Client from "./client";
import type { ListPropertiesResult } from "./typings/client";
import getTokenMock from "../__mocks__/getToken.json";
import listPropertiesMock from "../__mocks__/listProperties.json";

vi.mock("node-fetch", async () => {
  return {
    ...(await vi.importActual<typeof fetch>("node-fetch")),
    default: vi.fn(),
  };
});

describe("Client", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getToken", () => {
    it("returns the fetched token", async () => {
      const resp = new Response(JSON.stringify(getTokenMock));
      resp.headers.set(
        "Link",
        `<https://mobile.funda.io/api/v2/Aanbod/ResultList/koop/amsterdam%2F%2B5km%2F?page=2&pageSize=25&compact=False>; rel="next"`
      );
      vi.mocked(fetch).mockResolvedValue(resp);
      const client = new Client({
        clientSecret: "my-secret",
      });
      const result = await client.getToken();
      expect(result).toEqual(getTokenMock);
    });

    it("uses the client secret in the POST data", async () => {
      vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(getTokenMock)));
      const client = new Client({
        clientSecret: "my-secret",
      });
      await client.getToken();
      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          body: new URLSearchParams({
            client_id: "mobile_app_android",
            client_secret: "my-secret",
            grant_type: "client_credentials",
          }),
        })
      );
    });
  });

  describe("listProperties", () => {
    it("returns the mapped list of properties", async () => {
      console.log(vi.mocked(fetch));
      vi.mocked(fetch)
        .mockResolvedValueOnce(new Response(JSON.stringify(getTokenMock)))
        .mockResolvedValueOnce(
          new Response(JSON.stringify(listPropertiesMock), {
            headers: {
              Link: `<https://mobile.funda.io/api/v2/Aanbod/ResultList/koop/amsterdam%2F%2B5km%2F?page=2&pageSize=25&compact=False>; rel="next"`,
            },
          })
        );
      const client = new Client({
        clientSecret: "my-secret",
      });
      const result = await client.listProperties();
      expect(result).toEqual<ListPropertiesResult>({
        items: [
          {
            id: 6480341,
            streetAddress: "Zuidwijck 5",
            postalCode: "7608KL",
            locality: "Almelo",
            listingPrice: 259500,
            livingArea: 128,
            plotArea: 238,
            roomCount: 5,
            images: {
              thumbnail: new URL("https://cloud.funda.nl/valentina_media/163/359/864_klein.jpg"),
              720: new URL("https://cloud.funda.nl/valentina_media/163/359/864_720x480.jpg"),
              1080: new URL("https://cloud.funda.nl/valentina_media/163/359/864_1080x720.jpg"),
              1440: new URL("https://cloud.funda.nl/valentina_media/163/359/864_1440x960.jpg"),
              2160: new URL("https://cloud.funda.nl/valentina_media/163/359/864_2160x1440.jpg"),
            },
          },
        ],
        nextPage: 2,
        totalCount: 54457,
      });
    });
  });
});
