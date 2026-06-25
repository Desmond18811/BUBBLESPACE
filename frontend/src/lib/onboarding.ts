/**
 * Onboarding stage state machine (frontend mirror of the backend `onboardingStep`).
 *
 * The BACKEND is authoritative: every auth response (register / verify-otp / login)
 * and the profile query carry `onboardingStep` + `onboardingComplete`. We mirror the
 * current stage into sessionStorage purely so a reload resumes instantly without a
 * flash — but on every entry the real value from the server wins, so the mirror can
 * never cause us to skip a stage that didn't actually persist.
 *
 * Stages: awaiting_otp → awaiting_profile → awaiting_org → complete
 */

export type OnboardingStep = 'awaiting_otp' | 'awaiting_profile' | 'awaiting_org' | 'complete';

const STAGE_KEY = 'onboarding_stage';

/** Read the mirrored stage (instant resume hint; not authoritative). */
export const getStoredStage = (): OnboardingStep | null => {
  try { return (sessionStorage.getItem(STAGE_KEY) as OnboardingStep) || null; } catch { return null; }
};

/** Mirror the current stage (pass null/undefined to clear, e.g. on logout). */
export const setStoredStage = (step?: OnboardingStep | string | null): void => {
  try {
    if (step) sessionStorage.setItem(STAGE_KEY, step);
    else sessionStorage.removeItem(STAGE_KEY);
  } catch { /* sessionStorage unavailable — non-fatal */ }
};

export const clearStoredStage = (): void => setStoredStage(null);

/** Normalize whatever the server sent into a concrete stage. */
export const stageFromUser = (user: any): OnboardingStep => {
  if (user?.onboardingComplete) return 'complete';
  const step = user?.onboardingStep as OnboardingStep | undefined;
  if (step) return step;
  if (user?.isVerified) return 'awaiting_profile';
  return 'awaiting_otp';
};

/** The single mapping from stage → the route the user belongs on. */
export const routeForStage = (
  step?: string | null,
  onboardingComplete?: boolean,
): '/dashboard' | '/setup-profile' | '/verify-otp' => {
  if (onboardingComplete || step === 'complete') return '/dashboard';
  if (step === 'awaiting_otp') return '/verify-otp';
  // awaiting_profile / awaiting_org both finish inside the setup flow.
  return '/setup-profile';
};

/**
 * Given a user object from an auth response, mirror its stage and return the route
 * to resume at. Use this everywhere instead of duplicating routing logic.
 */
export const resumeFromUser = (user: any): '/dashboard' | '/setup-profile' | '/verify-otp' => {
  const stage = stageFromUser(user);
  setStoredStage(stage);
  return routeForStage(stage, user?.onboardingComplete);
};
