import type { SteamdbInfo } from './steamdb-info.js';
import type { SystemRequirement } from './system-requirement.js';

export interface ProductMetadata {
  readonly minimum: SystemRequirement[];
  readonly recommended: SystemRequirement[];
  readonly steamdb: SteamdbInfo | null;
}
