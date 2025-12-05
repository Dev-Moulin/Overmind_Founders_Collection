import categoriesConfig from '../../../../packages/shared/src/data/categories.json';

interface Category {
  id: string;
  label: string;
  name: string;
  termId: string | null;
}

/**
 * Get category display name from category label
 * Handles both old format (OFC:animal) and new format (Animal)
 */
export function getCategoryName(categoryLabel: string): string {
  // Handle old OFC: prefix format for backwards compatibility
  const cleanLabel = categoryLabel.replace('OFC:', '');

  const categories = categoriesConfig.categories as Category[];

  // Try to find by exact label match first (new format: "Animal")
  const categoryByLabel = categories.find((c) => c.label === cleanLabel);
  if (categoryByLabel) return categoryByLabel.label;

  // Try to find by id (old format: "animal")
  const categoryById = categories.find((c) => c.id === cleanLabel.toLowerCase());
  if (categoryById) return categoryById.label;

  // Return as-is if not found
  return cleanLabel;
}
