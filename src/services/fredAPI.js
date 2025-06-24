import { FRED_CONFIG } from "../config/config";

class FredAPI {
  constructor() {
    this.config = FRED_CONFIG;
  }

  async fetchFromFred(endpoint, params = {}) {
    const queryParams = new URLSearchParams({
      ...this.config.defaultParams,
      ...params
    });

    const response = await fetch(`${this.config.baseUrl}${endpoint}?${queryParams}`);

    if (!response.ok) {
      throw new Error(`FRED API Error: ${response.statusText}`);
    }

    return await response.json();
  }

  // Categories
  async getCategory(categoryId) {
    return this.fetchFromFred("/category", { category_id: categoryId });
  }

  async getCategoryChildren(categoryId) {
    return this.fetchFromFred("/category/children", { category_id: categoryId });
  }

  async getCategoryRelated(categoryId) {
    return this.fetchFromFred("/category/related", { category_id: categoryId });
  }

  async getCategorySeries(categoryId, params = {}) {
    return this.fetchFromFred("/category/series", {
      category_id: categoryId,
      ...params
    });
  }

  async getCategoryTags(categoryId) {
    return this.fetchFromFred("/category/tags", { category_id: categoryId });
  }

  // Series
  async getSeries(seriesId) {
    return this.fetchFromFred("/series", { series_id: seriesId });
  }

  async getSeriesObservations(seriesId, params = {}) {
    return this.fetchFromFred("/series/observations", {
      series_id: seriesId,
      ...params
    });
  }

  async getSeriesCategories(seriesId) {
    return this.fetchFromFred("/series/categories", { series_id: seriesId });
  }

  async getSeriesRelease(seriesId) {
    return this.fetchFromFred("/series/release", { series_id: seriesId });
  }

  async searchSeries(searchText, params = {}) {
    return this.fetchFromFred("/series/search", {
      search_text: searchText,
      ...params
    });
  }

  async getSeriesUpdates(params = {}) {
    return this.fetchFromFred("/series/updates", params);
  }

  async getSeriesVintageDates(seriesId) {
    return this.fetchFromFred("/series/vintagedates", { series_id: seriesId });
  }

  // Releases
  async getReleases(params = {}) {
    return this.fetchFromFred("/releases", params);
  }

  async getRelease(releaseId) {
    return this.fetchFromFred("/release", { release_id: releaseId });
  }

  async getReleaseDates(releaseId) {
    return this.fetchFromFred("/release/dates", { release_id: releaseId });
  }

  async getReleaseSeries(releaseId, params = {}) {
    return this.fetchFromFred("/release/series", {
      release_id: releaseId,
      ...params
    });
  }

  async getReleaseSources(releaseId) {
    return this.fetchFromFred("/release/sources", { release_id: releaseId });
  }

  async getReleaseTags(releaseId) {
    return this.fetchFromFred("/release/tags", { release_id: releaseId });
  }

  // Sources
  async getSources() {
    return this.fetchFromFred("/sources");
  }

  async getSource(sourceId) {
    return this.fetchFromFred("/source", { source_id: sourceId });
  }

  async getSourceReleases(sourceId) {
    return this.fetchFromFred("/source/releases", { source_id: sourceId });
  }

  // Tags
  async getTags(params = {}) {
    return this.fetchFromFred("/tags", params);
  }

  async getRelatedTags(tagNames, params = {}) {
    return this.fetchFromFred("/related_tags", {
      tag_names: tagNames,
      ...params
    });
  }

  async getTagsSeries(tagNames, params = {}) {
    return this.fetchFromFred("/tags/series", {
      tag_names: tagNames,
      ...params
    });
  }
}

export default FredAPI;
