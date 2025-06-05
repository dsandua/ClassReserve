export const formatTimeRange = (time: string): string => {
  // Remove seconds from time string if present
  const formattedTime = time.substring(0, 5);
  return formattedTime;
};