const ASSIGNMENT_VIEW_PATH = "/mod/assign/view.php";

export const getQueryParamValue = (url: string, key: string): string | null => {
  if (!url) return null;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = url.match(new RegExp(`[?&]${escapedKey}=([^&]+)`));
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
};

export const parseAssignmentIdFromMoodleUrl = (
  url: string,
): string | null => {
  if (!url || !url.includes(ASSIGNMENT_VIEW_PATH)) return null;
  return getQueryParamValue(url, "id");
};
