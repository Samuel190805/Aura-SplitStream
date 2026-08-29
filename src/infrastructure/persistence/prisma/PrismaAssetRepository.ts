import { prisma } from "@/lib/db";
import { IAssetRepository } from "@/domain/repositories/IAssetRepository";
import { MediaAsset, MediaAssetKind } from "@/domain/entities/MediaAsset";

export class PrismaAssetRepository implements IAssetRepository {
  async findById(id: string): Promise<MediaAsset | null> {
    const raw = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!raw) return null;
    return this.toEntity(raw);
  }

  async findByJobId(jobId: string): Promise<MediaAsset[]> {
    const records = await prisma.mediaAsset.findMany({
      where: { jobId },
      orderBy: { createdAt: "asc" },
    });
    return records.map((r) => this.toEntity(r));
  }

  async findByUserId(userId: string, limit = 50): Promise<MediaAsset[]> {
    const records = await prisma.mediaAsset.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return records.map((r) => this.toEntity(r));
  }

  async create(asset: MediaAsset): Promise<MediaAsset> {
    await prisma.mediaAsset.create({
      data: {
        id: asset.id,
        jobId: asset.props.jobId,
        userId: asset.props.userId,
        name: asset.name,
        kind: asset.kind,
        filePath: asset.filePath,
        mimeType: asset.props.mimeType,
        format: asset.format,
        codec: asset.props.codec,
        duration: asset.duration,
        sizeBytes: asset.props.sizeBytes,
        waveformData: asset.waveformData
          ? JSON.stringify(asset.waveformData)
          : null,
        metadata: asset.props.metadata
          ? JSON.stringify(asset.props.metadata)
          : null,
        createdAt: asset.props.createdAt,
      },
    });
    return asset;
  }

  async createMany(assets: MediaAsset[]): Promise<MediaAsset[]> {
    for (const asset of assets) {
      await this.create(asset);
    }
    return assets;
  }

  async delete(id: string): Promise<void> {
    await prisma.mediaAsset.delete({ where: { id } });
  }

  private toEntity(raw: any): MediaAsset {
    return new MediaAsset({
      id: raw.id,
      jobId: raw.jobId,
      userId: raw.userId,
      name: raw.name,
      kind: raw.kind as MediaAssetKind,
      filePath: raw.filePath,
      mimeType: raw.mimeType,
      format: raw.format,
      codec: raw.codec,
      duration: raw.duration,
      sizeBytes: raw.sizeBytes,
      waveformData: raw.waveformData ? JSON.parse(raw.waveformData) : null,
      metadata: raw.metadata ? JSON.parse(raw.metadata) : null,
      createdAt: raw.createdAt,
    });
  }
}
