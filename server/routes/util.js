// util
function generatePlaceholders(count) {
  return Array.from({ length: count }, (_, i) => `$${i + 1}`).join(", ");
}

export default generatePlaceholders;
