export type CountdownParts = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  expired: boolean;
  totalSeconds: number;
};

export function getCountdownParts(
  deadlineMs: number,
  nowMs: number,
): CountdownParts {
  const diff = Math.max(deadlineMs - nowMs, 0);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days: String(days).padStart(2, "0"),
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    expired: totalSeconds <= 0,
    totalSeconds,
  };
}