// Types for health/activity device connections.
// All data is display-only by default; influencing calorie targets is opt-in.

export type ActivityProvider = "fitbit" | "strava";

export interface OAuthToken {
  accessToken: string;
  refreshToken: string;
  /** Unix timestamp in ms when the access token expires. */
  expiresAt: number;
  /** Provider user ID */
  userId?: string;
  /** Display name shown in the Connections UI */
  displayName?: string;
  profileImageUrl?: string;
}

export interface Workout {
  name: string;
  durationMinutes: number;
  /** Provider-estimated calories for this activity */
  caloriesBurned?: number;
  startTime?: string; // ISO-8601
}

export interface DailyActivitySummary {
  date: string; // YYYY-MM-DD
  provider: ActivityProvider;
  /** Total estimated calories burned (basal + active). From Fitbit caloriesOut or sum of Strava activities. */
  totalCaloriesBurned?: number;
  /** Active-only calories (above BMR). */
  activeCalories?: number;
  steps?: number;
  activeMinutes?: number;
  workouts: Workout[];
  /** Unix timestamp when this summary was fetched (for cache invalidation). */
  fetchedAt: number;
}

/** Settings for how device data may influence the calorie target. Off by default. */
export interface ActivitySettings {
  /** If true, active calories from connected devices nudge the day's calorie target. */
  adjustTargetWithActivity: boolean;
  /** Conservative fraction (0–1) of device active calories to add back. Default 0.7. */
  activityAdjustmentFraction: number;
}

export const DEFAULT_ACTIVITY_SETTINGS: ActivitySettings = {
  adjustTargetWithActivity: false,
  activityAdjustmentFraction: 0.7,
};
