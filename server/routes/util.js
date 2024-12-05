const encryptionKey = 0xaa;
const BUFFER_SIZE = 50;

export function generatePlaceholders(count) {
  return Array.from({ length: count }, (_, i) => `$${i + 1}`).join(", ");
}

export function decryptBuffer(buffer, key) {
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] ^= key;
  }
}

export function decodeSatelliteData(hexString) {
  if (typeof hexString !== "string") {
    throw new TypeError("Input must be a string.");
  }

  const buffer = Buffer.from(hexString, "hex");

  if (buffer.length < BUFFER_SIZE) {
    throw new Error("Buffer size is smaller than expected.");
  }

  // decryptBuffer(buffer, encryptionKey);

  const entries = [];
  let batteryPercentage = null;

  const pole_id = buffer[0];

  const day = buffer[1];
  const month = buffer[2];
  const year = buffer[3] * 100 + buffer[4];
  const date = `${String(day).padStart(2, "0")}-${String(month).padStart(
    2,
    "0"
  )}-${year}`;

  console.log("this is the pole_id:" + pole_id);

  for (let i = 5; i < BUFFER_SIZE - 1; i += 4) {
    if (i + 3 < BUFFER_SIZE - 1 && buffer[i] !== 0) {
      const tag_id = buffer[i] | (buffer[i + 1] << 8);
      console.log("this is the tag id" + tag_id);

      const hour = buffer[i + 2];
      const minute = buffer[i + 3];

      entries.push({
        pole_id,
        tag_id,
        date,
        time: `${String(hour).padStart(2, "0")}:${String(minute).padStart(
          2,
          "0"
        )}`,
      });
    }
  }

  batteryPercentage = buffer[BUFFER_SIZE - 1];
  console.log(entries.length);
  return { entries, batteryPercentage };
}
