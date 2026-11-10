/**
 * Helper formatters to ensure native HTML <select> dropdown menus
 * and option popups never overflow outside mobile display viewports (<375px).
 */

export const truncateOption = (text: string, maxLen: number = 28): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
};

export const formatCourseOption = (
  title: string,
  code?: string,
  maxTitleLen: number = 26
): string => {
  if (!title) return '';
  const codePrefix = code ? `[${code}] ` : '';
  const truncatedTitle = truncateOption(title, maxTitleLen);
  return `${codePrefix}${truncatedTitle}`;
};

export const formatUserOption = (
  fullName: string,
  identifier?: string,
  maxNameLen: number = 22
): string => {
  if (!fullName) return '';
  const shortName = truncateOption(fullName, maxNameLen);
  if (!identifier) return shortName;
  const shortId = truncateOption(identifier, 14);
  return `${shortName} (${shortId})`;
};

