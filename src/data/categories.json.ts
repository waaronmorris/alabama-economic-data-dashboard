import FredAPI from "../services/fredAPI";

const api = new FredAPI();

interface Category {
  id: number;
  name: string;
  parent_id: number;
  notes?: string;
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

export const CATEGORIES = await loadCategories();

// print all observations
process.stdout.write(JSON.stringify(CATEGORIES));
