// Function to remove special characters, emojis, and separators
function cleanSpecialElements(text) {
  return text
    .replace(/\\"/g, '') // Remove escape characters
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\\/g, '') // Remove escape strings
    .replace(/["']/g, '') // Remove quotes
    .replace(/[{}()[\]]/g, '') // Remove brackets and parentheses
    .replace(/[*@#]/g, '') // Remove special characters
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1f926}-\u{1f937}]|[\u{10000}-\u{1fffd}]|[\u{1f1f2}-\u{1f1f4}]|[\u{1f1e6}-\u{1f1ff}]|[\u{1f201}-\u{1f2ff}]|[\u{FE0F}\u{FE0E}]/gu, '') // Remove emojis
    .replace(/\s*\[\s*\]\s*/g, ' ') // Remove empty brackets
    .replace(/[\|,;:]/g, ' ') // Remove separators
    .replace(/\s*[|]\s*$/, '') // Remove trailing separators
    .replace(/\s*-\s*$/, '') // Remove trailing dashes
    .replace(/\s*[.,;:]+\s*$/, '') // Remove trailing punctuation
    .replace(/\s+/g, ' ') // Remove multiple spaces
    .trim(); // Final trim
}

module.exports = {
  cleanSpecialElements
};
