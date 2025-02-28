import FredAPI from "../services/fredAPI";

const api = new FredAPI();

interface Category {
  id: number;
  name: string;
  parent_id: number;
  notes?: string;
}

interface CategorySeries {
  id: string;
  realtime_start: string;
  realtime_end: string;
  title: string;
  observation_start: string;
  observation_end: string;
  frequency: string;
  frequency_short: string;
  units: string;
  units_short: string;
  seasonal_adjustment: string;
  seasonal_adjustment_short: string;
  last_updated: string;
  popularity: number;
  group_popularity: number;
  notes: string;
  category_id: number;
  category_name: string;
}

async function loadCategories(): Promise<Category[]> {
  // Root category ID for FRED is 0
  const response = await api.getCategoryChildren(0);

  // Map the response to a more usable format
  return response.categories.map((category: any) => ({
    id: category.id,
    name: category.name,
    parent_id: category.parent_id,
    notes: category.notes
  }));
}

async function loadCategorySeries(category: Category): Promise<CategorySeries[]> {
  // Root category ID for FRED is 0
  const response = await api.getCategorySeries(category.id);

  return response.seriess
    .map((series: any) => ({
      id: series.id,
      realtime_start: series.realtime_start,
      realtime_end: series.realtime_end,
      title: series.title,
      observation_start: series.observation_start,
      observation_end: series.observation_end,
      frequency: series.frequency,
      frequency_short: series.frequency_short,
      units: series.units,
      units_short: series.units_short,
      seasonal_adjustment: series.seasonal_adjustment,
      seasonal_adjustment_short: series.seasonal_adjustment_short,
      last_updated: series.last_updated,
      popularity: series.popularity,
      group_popularity: series.group_popularity,
      category_id: category.id,
      category_name: category.name,
      notes: series.notes
    }))
    .filter((series: CategorySeries) => !series.title.includes("DISCONTINUED"));
}

const CATEGORIES = await loadCategories();
const CATEGORY_SERIES = await loadCategorySeries(CATEGORIES[2]);

// print all observations
process.stdout.write(JSON.stringify(CATEGORY_SERIES));
