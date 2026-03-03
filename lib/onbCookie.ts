// Readable cookie that middleware uses to know onboarding is done.
// Not sensitive — just a flag. httpOnly is NOT set so JS can write it.

export function setOnboardingCookie() {
  document.cookie = "onb=1; path=/; max-age=31536000; SameSite=Lax";
}

export function clearOnboardingCookie() {
  document.cookie = "onb=; path=/; max-age=0";
}
