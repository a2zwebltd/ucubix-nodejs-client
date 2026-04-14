export interface Category {
  readonly id: string;
  readonly name: string;
  readonly parentId: string | null;
  readonly childIds: string[];
}
