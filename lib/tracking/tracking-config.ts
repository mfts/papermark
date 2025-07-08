export const TRACKING_CONFIG = {
  // Interval tracking settings
  INTERVAL_TRACKING_ENABLED: true,
  INTERVAL_DURATION: 10000, // 10 seconds (in milliseconds)

  // Activity tracking settings
  ACTIVITY_TRACKING_ENABLED: true,
  INACTIVITY_THRESHOLD: 5 * 60000, // 5 minutes (in milliseconds)

  // Activity detection settings
  ACTIVITY_DETECTION_ENABLED: true,

  // Minimum duration to track (prevents very short sessions)
  MIN_TRACKING_DURATION: 1000, // 1 second (in milliseconds)
} as const;

export function getTrackingOptions(
  overrides: Partial<typeof TRACKING_CONFIG> = {},
) {
  return {
    intervalTracking:
      overrides.INTERVAL_TRACKING_ENABLED ??
      TRACKING_CONFIG.INTERVAL_TRACKING_ENABLED,
    intervalDuration:
      overrides.INTERVAL_DURATION ?? TRACKING_CONFIG.INTERVAL_DURATION,
    activityTracking:
      overrides.ACTIVITY_TRACKING_ENABLED ??
      TRACKING_CONFIG.ACTIVITY_TRACKING_ENABLED,
    inactivityThreshold:
      overrides.INACTIVITY_THRESHOLD ?? TRACKING_CONFIG.INACTIVITY_THRESHOLD,
    enableActivityDetection:
      overrides.ACTIVITY_DETECTION_ENABLED ??
      TRACKING_CONFIG.ACTIVITY_DETECTION_ENABLED,
  };
}
