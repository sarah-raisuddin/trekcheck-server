// util
export function generatePlaceholders(count) {
  return Array.from({ length: count }, (_, i) => `$${i + 1}`).join(", ");
}

const BUFFER_SIZE = 50;

export function decodeSatelliteData(hexString) {
  if (typeof hexString !== "string") {
    throw new TypeError("The first argument must be a string");
  }

  const buffer = Buffer.from(hexString, "hex");
  const index = Math.min(buffer.length, BUFFER_SIZE);

  let entries = [];

  if (index > 0) {
    const checkpointId = buffer[0];
    const year = buffer[3] * 100 + buffer[4];
    const date = `${String(buffer[1]).padStart(2, "0")}-${String(
      buffer[2]
    ).padStart(2, "0")}-${year}`;

    for (let i = 5; i < index - 2; i += 3) {
      if (i + 2 < index - 1) {
        entries.push({
          pole_id: checkpointId,
          time: `${String(buffer[i + 1]).padStart(2, "0")}:${String(
            buffer[i + 2]
          ).padStart(2, "0")}`,
          tag_id: buffer[i],
          date: date,
        });
      }
    }
  }

  return entries;
}
