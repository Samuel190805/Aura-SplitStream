import { IJobRepository } from "@/domain/repositories/IJobRepository";
import { IAssetRepository } from "@/domain/repositories/IAssetRepository";

export class GetJobStatusUseCase {
  constructor(
    private jobRepo: IJobRepository,
    private assetRepo: IAssetRepository
  ) {}

  async execute(jobId: string) {
    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      return null;
    }

    const assets = await this.assetRepo.findByJobId(jobId);
    const json = job.toJSON();
    json.mediaAssets = assets.map((a) => a.toJSON());
    return json;
  }
}
