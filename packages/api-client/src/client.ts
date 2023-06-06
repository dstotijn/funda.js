import fetch from "node-fetch";

import type { ListPropertiesOptions, ListPropertiesResult } from "./typings/client.js";
import type { ApiListPropertiesResult, ApiTokenResult } from "./typings/api.js";

const mobileBaseUrl = "https://mobile.funda.io/api/v2";
const accountsBaseUrl = "https://accounts.funda.io";
const userAgent = "okhttp/4.9.0";

export interface ClientOptions {
  clientSecret: string;
  fetch?: typeof fetch;
  mobileBaseUrl?: string;
  accountsBaseUrl?: string;
  userAgent?: string;
}

export default class Client {
  private readonly clientSecret: string;
  private readonly fetch: typeof fetch;
  private readonly mobileBaseUrl: string;
  private readonly accountsBaseUrl: string;
  private readonly userAgent: string;
  private apiTokenResult?: ApiTokenResult;

  constructor(opts: ClientOptions) {
    this.clientSecret = opts.clientSecret;
    this.fetch = opts.fetch ?? fetch;
    this.mobileBaseUrl = opts.mobileBaseUrl ?? mobileBaseUrl;
    this.accountsBaseUrl = opts.accountsBaseUrl ?? accountsBaseUrl;
    this.userAgent = opts.userAgent ?? userAgent;
  }

  async getToken(): Promise<ApiTokenResult> {
    // TODO: Check if token is about to expire.
    if (this.apiTokenResult) {
      return this.apiTokenResult;
    }

    const formData = new URLSearchParams();
    formData.set("client_id", "mobile_app_android");
    formData.set("client_secret", this.clientSecret);
    formData.set("grant_type", "client_credentials");

    const resp = await this.fetch(`${this.accountsBaseUrl}/connect/token`, {
      method: "POST",
      headers: {
        ["Accept"]: "application/json",
        ["Authorization"]: "Bearer null",
        ["Userconsent"]: "hide_ads",
        ["Accept-Language"]: "nl-NL",
      },
      body: formData,
    });

    if (!resp.ok) {
      throw new Error(`Unexpected response: ${resp.status} ${resp.statusText}`);
    }

    const result = (await resp.json()) as ApiTokenResult;
    this.apiTokenResult = result;

    return result;
  }

  async listProperties(opts?: ListPropertiesOptions): Promise<ListPropertiesResult> {
    const tokenResult = await this.getToken();
    const urlParams = new URLSearchParams({
      page: `${opts?.page ?? 1}`,
      pageSize: `${opts?.pageSize ?? 25}`,
    });
    const url = `${this.mobileBaseUrl}/Aanbod/ResultList/koop/heel-nederland/?${urlParams.toString()}`;
    const resp = await this.fetch(url, {
      headers: {
        ["User-Agent"]: this.userAgent,
        ["Userconsent"]: "show_ads",
        ["Accept-Language"]: "nl-NL",
        ["Accept"]: "application/json",
        ["Authorization"]: `Bearer ${tokenResult.access_token}`,
      },
    });

    if (!resp.ok) {
      throw new Error(`Unexpected response: ${resp.status} ${resp.statusText}`);
    }

    const result = (await resp.json()) as ApiListPropertiesResult;

    let nextPage: number | null = null;
    const link = /<(.+)>/.exec(resp.headers.get("Link") || "");
    if (link) {
      const nextURL = new URL(link[1]);
      nextPage = Number(nextURL.searchParams.get("page"));
    }

    // Promoted properties have some missing data in list results, so we skip
    // them. They *should* appear elsewhere in the total result set (although
    // likely on a different page) as regular properties.
    const nonPromotedResults = result.Results.filter((result) => result.ItemType === 1);

    return {
      items: nonPromotedResults.map((result) => {
        try {
          return {
            id: result.GlobalId,
            streetAddress: result.Info[0].Line[0].Text,
            postalCode: result.Info[1].Line[0].Text.substring(0, 4) + result.Info[1].Line[0].Text.substring(5, 7),
            locality: result.Info[1].Line[0].Text.substring(9),
            listingPrice: Number(result.Info[3]?.Line[0].Text.replace(/[.€\s]/g, "")) || 0,
            livingArea: Number(/^(\d+)/.exec(result.Info[2].Line[0].Text)?.[1]) || 0,
            plotArea: Number(/\/ (\d+)/.exec(result.Info[2].Line[0].Text)?.[1]) || 0,
            roomCount: Number(/• (\d+) kamer/.exec(result.Info[2].Line[0].Text)?.[1]) || 0,
            images: result.Foto
              ? {
                  thumbnail: new URL(result.Foto),
                  720: Client.newOptionalURL(result.Fotos.find((image) => image.Width === 720)?.Link),
                  1080: Client.newOptionalURL(result.Fotos.find((image) => image.Width === 1080)?.Link),
                  1440: Client.newOptionalURL(result.Fotos.find((image) => image.Width === 1440)?.Link),
                  2160: Client.newOptionalURL(result.Fotos.find((image) => image.Width === 2160)?.Link),
                }
              : undefined,
          };
        } catch (err) {
          console.log(JSON.stringify(result));
          throw err;
        }
      }),
      nextPage,
      totalCount: result.TotalCount,
    };
  }

  private static newOptionalURL(input?: string): URL | undefined {
    return input ? new URL(input) : undefined;
  }
}
