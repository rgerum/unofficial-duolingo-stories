import { getLamejsModule } from "@/lib/lamejs-compat";

const DEFAULT_NORMALIZATION_TARGET_PEAK = 0.97;
const MP3_BITRATE_KBPS = 128;
const MP3_SAMPLE_BLOCK_SIZE = 1152;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function float32ToInt16Sample(sample: number) {
  const clampedSample = clamp(sample, -1, 1);
  return clampedSample < 0
    ? Math.round(clampedSample * 0x8000)
    : Math.round(clampedSample * 0x7fff);
}

function toPlainArrayBuffer(view: Uint8Array | Int8Array) {
  const arrayBuffer = new ArrayBuffer(view.byteLength);
  new Uint8Array(arrayBuffer).set(
    new Uint8Array(view.buffer, view.byteOffset, view.byteLength),
  );
  return arrayBuffer;
}

export async function decodeAudioData(arrayBuffer: ArrayBuffer) {
  const audioContext = new AudioContext({ latencyHint: "interactive" });
  try {
    return await audioContext.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    await audioContext.close();
  }
}

export async function encodeAudioBufferAsMp3(buffer: AudioBuffer) {
  const { Mp3Encoder } = await getLamejsModule();
  const sampleRate = buffer.sampleRate;
  const channelCount = Math.min(2, Math.max(1, buffer.numberOfChannels));
  const encoder = new Mp3Encoder(channelCount, sampleRate, MP3_BITRATE_KBPS);
  const channelData = Array.from({ length: channelCount }, (_, index) =>
    buffer.getChannelData(index),
  );
  const mp3Chunks: Uint8Array[] = [];

  for (
    let frameOffset = 0;
    frameOffset < buffer.length;
    frameOffset += MP3_SAMPLE_BLOCK_SIZE
  ) {
    const chunkFrameCount = Math.min(
      MP3_SAMPLE_BLOCK_SIZE,
      buffer.length - frameOffset,
    );
    const leftChunk = new Int16Array(chunkFrameCount);
    const rightChunk =
      channelCount > 1 ? new Int16Array(chunkFrameCount) : null;

    for (let chunkIndex = 0; chunkIndex < chunkFrameCount; chunkIndex += 1) {
      const sourceFrameIndex = frameOffset + chunkIndex;
      leftChunk[chunkIndex] = float32ToInt16Sample(
        channelData[0]?.[sourceFrameIndex] ?? 0,
      );
      if (rightChunk) {
        rightChunk[chunkIndex] = float32ToInt16Sample(
          channelData[1]?.[sourceFrameIndex] ?? 0,
        );
      }
    }

    const encodedChunk = rightChunk
      ? encoder.encodeBuffer(leftChunk, rightChunk)
      : encoder.encodeBuffer(leftChunk);
    if (encodedChunk.length > 0) {
      mp3Chunks.push(Uint8Array.from(encodedChunk));
    }
  }

  const flushChunk = encoder.flush();
  if (flushChunk.length > 0) {
    mp3Chunks.push(Uint8Array.from(flushChunk));
  }

  return new Blob(
    mp3Chunks.map((chunk) => toPlainArrayBuffer(chunk)),
    {
      type: "audio/mpeg",
    },
  );
}

export function normalizeAudioBufferPeak(
  buffer: AudioBuffer,
  targetPeak = DEFAULT_NORMALIZATION_TARGET_PEAK,
) {
  let peak = 0;

  for (
    let channelIndex = 0;
    channelIndex < buffer.numberOfChannels;
    channelIndex += 1
  ) {
    const channel = buffer.getChannelData(channelIndex);
    for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex += 1) {
      peak = Math.max(peak, Math.abs(channel[sampleIndex] ?? 0));
    }
  }

  if (!Number.isFinite(peak) || peak <= 0) {
    return {
      buffer,
      changed: false,
      peak: 0,
      gain: 1,
    };
  }

  const safeTargetPeak = clamp(
    Number.isFinite(targetPeak)
      ? targetPeak
      : DEFAULT_NORMALIZATION_TARGET_PEAK,
    0.01,
    0.999,
  );
  const gain = safeTargetPeak / peak;
  if (Math.abs(gain - 1) < 0.01) {
    return {
      buffer,
      changed: false,
      peak,
      gain: 1,
    };
  }

  const normalizedBuffer = new AudioBuffer({
    length: buffer.length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  });

  for (
    let channelIndex = 0;
    channelIndex < buffer.numberOfChannels;
    channelIndex += 1
  ) {
    const sourceChannel = buffer.getChannelData(channelIndex);
    const nextChannel = normalizedBuffer.getChannelData(channelIndex);
    for (
      let sampleIndex = 0;
      sampleIndex < sourceChannel.length;
      sampleIndex += 1
    ) {
      nextChannel[sampleIndex] = clamp(
        (sourceChannel[sampleIndex] ?? 0) * gain,
        -1,
        1,
      );
    }
  }

  return {
    buffer: normalizedBuffer,
    changed: true,
    peak,
    gain,
  };
}
