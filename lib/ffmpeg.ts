import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import ffmpeg from "fluent-ffmpeg";
import type { Caption } from "./pipeline";

type TempPaths = { workDir: string; paths: string[] };

// Creates a temporary working directory and tracks created paths for cleanup.
function createTempWorkspace(): TempPaths {
  const workDir = join(tmpdir(), "buymemaybe", randomUUID());
  mkdirSync(workDir, { recursive: true });
  return { workDir, paths: [] };
}

// Writes a buffer to a unique temp file and returns its path.
function writeTempFile(ws: TempPaths, filename: string, bytes: Buffer): string {
  const p = join(ws.workDir, filename);
  writeFileSync(p, bytes);
  ws.paths.push(p);
  return p;
}

// Writes an SRT subtitle file from caption timings and returns the file path.
function writeCaptionsSrt(ws: TempPaths, captions: Caption[]): string {
  const toSrtTime = (ms: number) => {
    const clamped = Math.max(0, Math.floor(ms));
    const hh = Math.floor(clamped / 3_600_000);
    const mm = Math.floor((clamped % 3_600_000) / 60_000);
    const ss = Math.floor((clamped % 60_000) / 1000);
    const ms3 = clamped % 1000;
    const pad = (n: number, w: number) => n.toString().padStart(w, "0");
    return `${pad(hh, 2)}:${pad(mm, 2)}:${pad(ss, 2)},${pad(ms3, 3)}`;
  };

  const srt =
    captions
      .filter((c) => c.text?.trim())
      .map((c, idx) => {
        const start = toSrtTime(c.startMs);
        const end = toSrtTime(c.endMs);
        return `${idx + 1}\n${start} --> ${end}\n${c.text.trim()}\n`;
      })
      .join("\n") + "\n";

  const p = join(ws.workDir, "captions.srt");
  writeFileSync(p, srt, "utf8");
  ws.paths.push(p);
  return p;
}

// Runs a fluent-ffmpeg command and resolves once the output file is written.
function runFfmpeg(cmd: ffmpeg.FfmpegCommand): Promise<void> {
  return new Promise((resolve, reject) => {
    cmd.on("error", (err, _stdout, stderr) => {
      reject(new Error(`${err.message}\n\nffmpeg stderr:\n${stderr}`));
    });
    cmd.on("end", () => resolve());
    cmd.run();
  });
}

// Ensures the input video is 1:1 square at 1080×1080, scaling and padding as needed.
export async function ensureSquare1080(videoBytes: Buffer): Promise<Buffer> {
  const ws = createTempWorkspace();
  try {
    const inPath = writeTempFile(ws, "in.mp4", videoBytes);
    const outPath = join(ws.workDir, "square.mp4");
    ws.paths.push(outPath);

    const vf =
      "scale=1080:1080:force_original_aspect_ratio=decrease," +
      "pad=1080:1080:(ow-iw)/2:(oh-ih)/2:color=black";

    await runFfmpeg(
      ffmpeg(inPath)
        .outputOptions([
          "-movflags +faststart",
          "-pix_fmt yuv420p",
          "-r 30",
        ])
        .videoFilters(vf)
        .noAudio()
        .output(outPath),
    );

    return readFileSync(outPath);
  } finally {
    rmSync(ws.workDir, { recursive: true, force: true });
  }
}

// Muxes an mp3 voiceover onto a silent mp4, transcoding audio to AAC for web playback.
export async function muxVoiceover(videoBytes: Buffer, mp3Bytes: Buffer): Promise<Buffer> {
  const ws = createTempWorkspace();
  try {
    const videoPath = writeTempFile(ws, "video.mp4", videoBytes);
    const audioPath = writeTempFile(ws, "audio.mp3", mp3Bytes);
    const outPath = join(ws.workDir, "muxed.mp4");
    ws.paths.push(outPath);

    await runFfmpeg(
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          "-c:v copy",
          "-c:a aac",
          "-b:a 192k",
          "-shortest",
          "-movflags +faststart",
        ])
        .output(outPath),
    );

    return readFileSync(outPath);
  } finally {
    rmSync(ws.workDir, { recursive: true, force: true });
  }
}

// Burns small lower-third captions into the video using an SRT subtitle filter.
export async function burnCaptions(videoBytes: Buffer, captions: Caption[]): Promise<Buffer> {
  const ws = createTempWorkspace();
  try {
    const inPath = writeTempFile(ws, "in.mp4", videoBytes);
    const srtPath = writeCaptionsSrt(ws, captions);
    const outPath = join(ws.workDir, "captioned.mp4");
    ws.paths.push(outPath);

    const safeSrtPath = srtPath.replaceAll("\\", "/").replaceAll(":", "\\:");
    const style =
      "FontName=Arial,FontSize=20,PrimaryColour=&H00F0F0F0,OutlineColour=&H80000000," +
      "BackColour=&H60000000,Bold=0,Outline=1,Shadow=0,Alignment=2,MarginV=36";
    const vf = `subtitles='${safeSrtPath}':force_style='${style}'`;

    await runFfmpeg(
      ffmpeg(inPath)
        .outputOptions(["-movflags +faststart", "-pix_fmt yuv420p", "-r 30"])
        .videoFilters(vf)
        .audioCodec("copy")
        .output(outPath),
    );

    return readFileSync(outPath);
  } finally {
    rmSync(ws.workDir, { recursive: true, force: true });
  }
}

// Produces a final 1:1 square mp4 by normalizing aspect, muxing voiceover, and burning captions.
export async function makeFinalVideo(params: {
  rawVideoMp4: Buffer;
  voiceMp3: Buffer;
  captions: Caption[];
}): Promise<Buffer> {
  const square = await ensureSquare1080(params.rawVideoMp4);
  const withAudio = await muxVoiceover(square, params.voiceMp3);
  return burnCaptions(withAudio, params.captions);
}

