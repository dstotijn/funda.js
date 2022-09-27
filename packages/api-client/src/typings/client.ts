export interface Property {
  id: number;
  streetAddress: string;
  postalCode: string;
  locality: string;
  listingPrice: number;
  livingArea: number;
  plotArea: number;
  roomCount: number;
  images: {
    thumbnail: URL;
    720: URL;
    1080: URL;
    1440: URL;
    2160: URL;
  };
}

export interface ListPropertiesOptions {
  page?: number;
  pageSize?: number;
}

export interface ListPropertiesResult {
  items: Property[];
  nextPage: number | null;
  totalCount: number;
}
