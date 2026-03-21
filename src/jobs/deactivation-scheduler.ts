import { processDueAccountDeactivations } from "../modules/admin/account-deactivation/account-deactivation.service";

/**
 * Runs on startup and every hour to set isActive=false when deactivateEffectiveAt has passed.
 */
export function startDeactivationScheduler(): void {
  const tick = () => {
    processDueAccountDeactivations()
      .then((n) => {
        if (n > 0) {
          // eslint-disable-next-line no-console
          console.log(`[account-deactivation] Applied ${n} scheduled closure(s)`);
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("[account-deactivation] Scheduler error:", err);
      });
  };

  tick();
  setInterval(tick, 60 * 60 * 1000);
}
