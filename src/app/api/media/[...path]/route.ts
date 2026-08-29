import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const resolvedParams = await Promise.resolve(context.params);
  const relPath = resolvedParams.path.join("/");
  const storagePath = path.join(process.cwd(), "storage", relPath);
  const storageJobsPath = path.join(process.cwd(), "storage", "jobs", relPath);
  const tmpJobsPath = path.join(process.cwd(), "tmp", "jobs", relPath);
  const tmpPath = path.join(process.cwd(), "tmp", relPath);
  const publicPath = path.join(process.cwd(), "public", "media", relPath);

  let filePath = "";
  if (fs.existsSync(storagePath) && fs.statSync(storagePath).isFile()) {
    filePath = storagePath;
  } else if (fs.existsSync(storageJobsPath) && fs.statSync(storageJobsPath).isFile()) {
    filePath = storageJobsPath;
  } else if (fs.existsSync(tmpJobsPath) && fs.statSync(tmpJobsPath).isFile()) {
    filePath = tmpJobsPath;
  } else if (fs.existsSync(tmpPath) && fs.statSync(tmpPath).isFile()) {
    filePath = tmpPath;
  } else if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
    filePath = publicPath;
  } else {
    return new Response("Media file not found", { status: 404 });
  }

  const stat = await fs.promises.stat(filePath);
  const fileSize = stat.size;
  const range = req.headers.get("range");

  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "audio/ogg",
  };
  const contentType = mimeTypes[ext] || "application/octet-stream";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const fileStream = fs.createReadStream(filePath, { start, end });
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(stream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": contentType,
      },
    });
  } else {
    const fileStream = fs.createReadStream(filePath);
    const stream = new ReadableStream({
      start(controller) {
        fileStream.on("data", (chunk) => controller.enqueue(chunk));
        fileStream.on("end", () => controller.close());
        fileStream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": contentType,
        "Accept-Ranges": "bytes",
      },
    });
  }
}
