/**
 * Category configuration type - matches categories.json structure
 */
export interface CategoryConfigType {
  predicate: {
    id: string;
    label: string;
    description: string;
    termId: string | null;
  };
  categories: Array<{
    id: string;
    label: string;
    name: string;
    termId: string | null;
    image?: string;
  }>;
}
