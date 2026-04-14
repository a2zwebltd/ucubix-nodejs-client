export interface Media {
  readonly id: string;
  readonly name: string;
  readonly fileName: string;
  readonly collectionName: string;
  readonly mimeType: string;
  readonly disk: string;
  readonly size: number;
  readonly orderColumn: number | null;
  readonly url: string;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
}
