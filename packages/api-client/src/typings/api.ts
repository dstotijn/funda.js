export interface Foto {
  Link: string;
  Width: 720 | 1080 | 1440 | 2160;
}

export interface Line {
  Text: string;
  Css: string;
}

export interface Info {
  Line: Line[];
}

export interface List {
  Line: Line[];
}

export interface ResultListLabel {
  Type: number;
  List: List[];
  BackgroundColor: string;
  Images: string[];
}

export interface AdTemplate {
  Id: string;
  Type: number;
}

export interface AdSize {
  Width: number;
  Height: number;
}

export interface Result {
  ItemType: number;
  Foto: string;
  Fotos: Foto[];
  Info: Info[];
  Link: string;
  Products: number[];
  Branche: number;
  ResultListLabels: ResultListLabel[];
  GlobalId: number;
  NvmVestigingNr: number;
  SoortAanbod: unknown;
  Site: string;
  TemplateId: string;
  AdTemplates: AdTemplate[];
  PreferredAdType?: number;
  AdSizes: AdSize[];
  ContentUrl: string;
  AdUnit: string;
}

export interface ApiListPropertiesResult {
  Page: number;
  PageSize: number;
  Results: Result[];
  TotalCount: number;
}

export interface ApiTokenResult {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}
