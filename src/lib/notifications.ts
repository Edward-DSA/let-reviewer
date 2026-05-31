import { db, BADGE_DEFS } from './db';

/**
 * Request notification permissions and save to student profile
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    // Update local database profile settings
    await db.profile.update(1, { notificationsEnabled: granted });
    return granted;
  } catch (e) {
    console.warn('[PWA Notification] Failed to request permission:', e);
    return false;
  }
}

interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
  data?: any;
}

/**
 * Triggers a system notification through the active Service Worker registration
 * This ensures the notification displays properly on mobile/desktop even when the browser is in the background
 */
export async function sendSystemNotification(title: string, options: NotificationOptions = {}): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  
  // Check permission first
  if (Notification.permission !== 'granted') {
    const profile = await db.profile.get(1);
    if (!profile?.notificationsEnabled) {
      return false; // User disabled reminders
    }
  }

  try {
    const defaultIcon = options.icon || '/logo.png';
    const cleanOptions = {
      body: options.body,
      icon: defaultIcon,
      badge: options.badge || defaultIcon,
      tag: options.tag || 'let-reviewer-alert',
      requireInteraction: options.requireInteraction || false,
      vibrate: options.vibrate || [100, 50, 100],
      data: options.data,
    };

    // If Service Worker is active, display notification through it (required for background & mobile PWA)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, cleanOptions);
      return true;
    }

    // Fallback to standard browser notification if SW not ready
    new Notification(title, cleanOptions);
    return true;
  } catch (err) {
    console.warn('[PWA Notification] Failed to display system notification:', err);
    return false;
  }
}

/**
 * Triggers a notification on unlocking a milestone badge
 */
export async function triggerBadgeNotification(badgeId: string): Promise<boolean> {
  const badge = BADGE_DEFS[badgeId];
  if (!badge) return false;

  return sendSystemNotification('🏅 New Badge Unlocked!', {
    body: `Awesome! You earned the "${badge.name}" badge: ${badge.desc} 🔥`,
    tag: `badge-${badgeId}`,
    requireInteraction: true,
  });
}

/**
 * Checks if the student is in danger of losing their daily study streak
 * Warns them if they have a streak, haven't studied yet today, and it's evening
 */
export async function checkStreakDangerNotification(appName: string = 'LET Reviewer'): Promise<boolean> {
  try {
    const profile = await db.profile.get(1);
    if (!profile || !profile.notificationsEnabled || profile.streak <= 0) return false;

    const lastStudy = profile.lastStudyDate;
    if (!lastStudy) return false;

    const now = new Date();
    const lastDate = new Date(lastStudy);

    // If already studied today, streak is safe
    if (
      now.getFullYear() === lastDate.getFullYear() &&
      now.getMonth() === lastDate.getMonth() &&
      now.getDate() === lastDate.getDate()
    ) {
      return false;
    }

    // Streak is at risk if they haven't studied today and it's past 5 PM (17:00)
    if (now.getHours() >= 17) {
      return sendSystemNotification('🔥 Streak in Danger!', {
        body: `Don't freeze your progress! Review a category now to keep your ${profile.streak}-day study streak alive! 📚`,
        tag: 'streak-danger',
        requireInteraction: true,
      });
    }

    return false;
  } catch (err) {
    console.warn('[PWA Notification] Error checking streak danger:', err);
    return false;
  }
}

/**
 * Periodic Daily Study Reminder nudge ("it's time to review!")
 * Triggers if the last review session was more than 24 hours ago
 */
export async function checkDailyStudyNudge(appName: string = 'LET Reviewer'): Promise<boolean> {
  try {
    const profile = await db.profile.get(1);
    if (!profile || !profile.notificationsEnabled) return false;

    const lastStudy = profile.lastStudyDate;
    const hoursSince = lastStudy ? (Date.now() - lastStudy) / 3600000 : 999;

    // Send daily nudge if it has been 24 hours or longer since the last study session
    if (hoursSince >= 24) {
      return sendSystemNotification(`${appName} 📚`, {
        body: "It's time to review! Spend just 5 minutes today to keep your preparation on track. 📖",
        tag: 'daily-nudge',
      });
    }

    return false;
  } catch (err) {
    console.warn('[PWA Notification] Error checking daily nudge:', err);
    return false;
  }
}
