export const PW_RESET_EMAIL_KEY = 'lw_pw_reset_email';
export const PW_RESET_TOKEN_KEY = 'lw_pw_reset_token';

export function clearPasswordResetSession(): void {
  sessionStorage.removeItem(PW_RESET_EMAIL_KEY);
  sessionStorage.removeItem(PW_RESET_TOKEN_KEY);
}
