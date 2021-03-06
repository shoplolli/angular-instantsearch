import {isPlatformBrowser} from '@angular/common';
import {
  AfterViewInit,
  Component,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  VERSION as AngularVersion,
} from '@angular/core';
import {AlgoliaSearchHelper} from 'algoliasearch-helper';

import * as algoliasearchProxy from 'algoliasearch/lite';
import instantsearch from 'instantsearch.js/es';

import {Widget} from '../base-widget';
import {VERSION} from '../version';

const algoliasearch = algoliasearchProxy.default || algoliasearchProxy;

export type SearchRequest = {
  indexName: string;
  params: SearchRequestParameters;
};

export type SearchForFacetValuesRequest = {
  indexName: string;
  params: SearchForFacetValuesRequestParameters;
};

// Documentation: https://www.algolia.com/doc/api-reference/search-api-parameters/
export type SearchParameters = {
  // Attributes
  attributesToRetrieve?: string[];
  restrictSearchableAttributes?: string[];

  // Filtering
  filters?: string;
  facetFilters?: string[];
  optionalFilters?: string[];
  numericFilters?: string[];
  sumOrFiltersScores?: boolean;

  // Faceting
  facets?: string[];
  maxValuesPerFacet?: number;
  facetingAfterDistinct?: boolean;
  sortFacetValuesBy?: string;

  // Highlighting / Snippeting
  attributesToHighlight?: string[];
  attributesToSnippet?: string[];
  highlightPreTag?: string;
  highlightPostTag?: string;
  snippetEllipsisText?: string;
  restrictHighlightAndSnippetArrays?: boolean;

  // Pagination
  page?: number;
  hitsPerPage?: number;
  offset?: number;
  length?: number;

  // Typos
  minWordSizefor1Typo?: number;
  minWordSizefor2Typos?: number;
  typoTolerance?: string | boolean;
  allowTyposOnNumericTokens?: boolean;
  ignorePlurals?: boolean | string[];
  disableTypoToleranceOnAttributes?: string[];

  // Geo-Search
  aroundLatLng?: string;
  aroundLatLngViaIP?: boolean;
  aroundRadius?: number | 'all';
  aroundPrecision?: number;
  minimumAroundRadius?: number;
  insideBoundingBox?: GeoRectangle | GeoRectangle[];
  insidePolygon?: GeoPolygon | GeoPolygon[];

  // Query Strategy
  queryType?: string;
  removeWordsIfNoResults?: string;
  advancedSyntax?: boolean;
  optionalWords?: string | string[];
  removeStopWords?: boolean | string[];
  disableExactOnAttributes?: string[];
  exactOnSingleWordQuery?: string;
  alternativesAsExact?: string[];

  // Query Rules
  enableRules?: boolean;
  ruleContexts?: string[];

  // Advanced
  minProximity?: number;
  responseFields?: string[];
  maxFacetHits?: number;
  percentileComputation?: boolean;
  distinct?: number | boolean;
  getRankingInfo?: boolean;
  clickAnalytics?: boolean;
  analytics?: boolean;
  analyticsTags?: string[];
  synonyms?: boolean;
  replaceSynonymsInHighlight?: boolean;
};

export interface SearchRequestParameters extends SearchParameters {
  query: string;
}

export interface SearchForFacetValuesRequestParameters
  extends SearchParameters {
  facetQuery: string;
  facetName: string;
}

export type GeoRectangle = [number, number, number, number];
export type GeoPolygon = [number, number, number, number, number, number];

export type FacetSortByStringOptions =
  | 'count'
  | 'count:asc'
  | 'count:desc'
  | 'name'
  | 'name:asc'
  | 'name:desc'
  | 'isRefined';

// Documentation: https://www.algolia.com/doc/rest-api/search/?language=javascript#search-multiple-indexes
export type SearchResponse = {
  hits: Hit[];
  page?: number;
  nbHits?: number;
  nbPages?: number;
  hitsPerPage?: number;
  processingTimeMS?: number;
  query?: string;
  params?: string;
  index?: string;
};

type HitAttributeHighlightResult = {
  value: string;
  matchLevel: 'none' | 'partial' | 'full';
  matchedWords: string[];
  fullyHighlighted?: boolean;
};

type HitHighlightResult = {
  [attribute: string]:
    | HitAttributeHighlightResult
    | HitAttributeHighlightResult[]
    | HitHighlightResult;
};

type HitAttributeSnippetResult = Pick<HitAttributeHighlightResult,
  'value' | 'matchLevel'
>;

type HitSnippetResult = {
  [attribute: string]:
    | HitAttributeSnippetResult
    | HitAttributeSnippetResult[]
    | HitSnippetResult;
};

export type Hit = {
  [attribute: string]: any;
  objectID: string;
  _highlightResult?: HitHighlightResult;
  _snippetResult?: HitSnippetResult;
  _rankingInfo?: {
    promoted: boolean;
    nbTypos: number;
    firstMatchedWord: number;
    proximityDistance?: number;
    geoDistance: number;
    geoPrecision?: number;
    nbExactWords: number;
    words: number;
    filters: number;
    userScore: number;
    matchedGeoLocation?: {
      lat: number;
      lng: number;
      distance: number;
    };
  };
  _distinctSeqID?: number;
  __position: number;
  __queryID?: string;
};

// Documentation: https://www.algolia.com/doc/rest-api/search/?language=javascript#search-for-facet-values
export type SearchForFacetValuesResponse = {
  value: string;
  highlighted?: string;
  count?: number;
};

export type SearchClient = {
  addAlgoliaAgent?: (agent: string) => void;
  search: (requests: SearchRequest[]) => Promise<{ results: SearchResponse[] }>;
  searchForFacetValues?: (
    requests: SearchForFacetValuesRequest[]
  ) => Promise<{ facetHits: SearchForFacetValuesResponse[] }[]>;
};

export type InstantSearchConfig = {
  searchClient: SearchClient;
  indexName: string;

  numberLocale?: string;
  searchFunction?: (helper: AlgoliaSearchHelper) => void;
  searchParameters?: SearchParameters | void;
  urlSync?:
    | boolean
    | {
    mapping?: object;
    threshold?: number;
    trackedParameters?: string[];
    useHash?: boolean;
    getHistoryState?: () => object;
  };
  routing?:
    | boolean
    | {
    router?: {
      onUpdate: (cb: (object) => void) => void;
      read: () => object;
      write: (routeState: object) => void;
      createURL: (routeState: object) => string;
      dispose: () => void;
    };
    stateMapping?: {
      stateToRoute(object): object;
      routeToState(object): object;
    };
  };
};

export class InstantSearchInstance {
  public start: () => void;

  public addWidget: (widget: Widget) => void;
  public addWidgets: (widgets: Widget[]) => void;

  public removeWidget: (widget: Widget) => void;
  public removeWidgets: (widgets: Widget[]) => void;

  // EventEmmiter
  public on: (eventName: string, callback: Function) => void;
  public removeListener: (eventName: string, callback: Function) => void;

  public helper: {
    lastResults: Object;
    state: Object;
  };

  public refresh: () => void;
  public dispose: () => void;
}

@Component({
  selector: 'ais-instantsearch',
  template: `<ng-content></ng-content>`,
})
export class NgAisInstantSearch implements AfterViewInit, OnInit, OnDestroy {
  @Input() public config: InstantSearchConfig;
  @Input() public instanceName: string = 'default';

  @Output()
  change: EventEmitter<{ results: {}; state: {} }> = new EventEmitter<{
    results: {};
    state: {};
  }>();

  public instantSearchInstance: InstantSearchInstance;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  public ngOnInit() {
    this.createInstantSearchInstance(this.config);
  }

  public ngAfterViewInit() {
    this.instantSearchInstance.start();
  }

  public ngOnDestroy() {
    if (this.instantSearchInstance) {
      this.instantSearchInstance.removeListener('render', this.onRender);
      this.instantSearchInstance.dispose();
    }
  }

  public createInstantSearchInstance(config: InstantSearchConfig) {
    // add default searchParameters with highlighting config
    if (!config.searchParameters) config.searchParameters = {};
    Object.assign(config.searchParameters, {
      highlightPreTag: '__ais-highlight__',
      highlightPostTag: '__/ais-highlight__',
    });

    // remove URLSync widget if on SSR
    if (!isPlatformBrowser(this.platformId)) {
      if (typeof config.urlSync !== 'undefined') delete config.urlSync;
      if (typeof config.routing !== 'undefined') delete config.routing;
    }

    if (typeof config.searchClient.addAlgoliaAgent === 'function') {
      config.searchClient.addAlgoliaAgent(`angular (${AngularVersion.full})`);
      config.searchClient.addAlgoliaAgent(`angular-instantsearch (${VERSION})`);
    }

    this.instantSearchInstance = instantsearch(config);
    this.instantSearchInstance.on('render', this.onRender);
  }

  public addWidget(widget: Widget) {
    if (this.instantSearchInstance) {
      this.instantSearchInstance.addWidget(widget);
    }
  }

  public removeWidget(widget: Widget) {
    if (this.instantSearchInstance) {
      this.instantSearchInstance.removeWidget(widget);
    }
  }

  public refresh() {
    this.instantSearchInstance.refresh();
  }

  onRender = () => {
    this.change.emit({
      results: this.instantSearchInstance.helper.lastResults,
      state: this.instantSearchInstance.helper.state,
    });
  };
}
