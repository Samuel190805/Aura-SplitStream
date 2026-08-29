import { MediaAsset, MediaAssetProps } from "../entities/MediaAsset";

export interface IAssetRepository {
  findById(id: string): Promise<MediaAsset | null>;
  findByJobId(jobId: string): Promise<MediaAsset[]>;
  findByUserId(userId: string, limit?: number): Promise<MediaAsset[]>;
  create(asset: MediaAsset): Promise<MediaAsset>;
  createMany(assets: MediaAsset[]): Promise<MediaAsset[]>;
  delete(id: string): Promise<void>;
}
