// Public records dataset for content.js
// Keep entries strictly tied to verifiable public records.
// Name matches are heuristic only and do not prove identity.
//
// Entry schema:
// {
//   name: string,                    // Person name as written in source
//   category: "Epstein files",       // Display category
//   sources: string[],               // One or more official source URLs
//   notes?: string                   // Optional neutral context
// }
//
// IMPORTANT:
// - Do not include unsourced names.
// - Prefer official records (DOJ/court documents).
// - Keep wording neutral and non-accusatory.

(function initPublicRecordsDataset(globalScope) {
  const DATASET = {
    datasetName: 'Epstein Public Records',
    datasetVersion: '1.0.0',
    generatedAt: null,
    records: [
      // Add records below.
      // Example:
      // {
      //   name: "First Last",
      //   category: "Epstein files",
      //   sources: [
      //     "https://www.justice.gov/...",
      //     "https://storage.courtlistener.com/...pdf"
      //   ],
      //   notes: "Optional neutral note"
      // }
    ]
  };

  function isValidEntry(entry) {
    if (!entry || typeof entry !== 'object') return false;
    if (typeof entry.name !== 'string' || !entry.name.trim()) return false;
    if (typeof entry.category !== 'string' || !entry.category.trim()) return false;
    if (!Array.isArray(entry.sources) || entry.sources.length === 0) return false;
    for (let i = 0; i < entry.sources.length; i += 1) {
      const src = entry.sources[i];
      if (typeof src !== 'string' || !/^https?:\/\//i.test(src)) return false;
    }
    if (entry.notes != null && typeof entry.notes !== 'string') return false;
    return true;
  }

  const validRecords = [];
  for (let i = 0; i < DATASET.records.length; i += 1) {
    const entry = DATASET.records[i];
    if (isValidEntry(entry)) validRecords.push(entry);
  }

  globalScope.LINKED_PUBLIC_RECORDS = validRecords;
  globalScope.LINKED_PUBLIC_RECORDS_META = {
    datasetName: DATASET.datasetName,
    datasetVersion: DATASET.datasetVersion,
    generatedAt: DATASET.generatedAt,
    totalRecords: validRecords.length
  };
})(window);
