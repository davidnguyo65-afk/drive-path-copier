function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function uniqueNonEmpty(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item || seen.has(item)) {
      return false;
    }

    seen.add(item);
    return true;
  });
}

function cleanName(value) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return "";
  }

  return normalized.split(",")[0].trim();
}

module.exports = {
  normalizeText,
  uniqueNonEmpty,
  cleanName
};