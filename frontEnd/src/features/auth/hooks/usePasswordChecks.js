import { useMemo } from 'react';

const commonPasswords = new Set(['password', 'password123', 'qwerty', '123456789', 'ventureverify', 'ventureverify123', 'letmein', 'welcome123']);

export default function usePasswordChecks(password, confirmPassword, username = '', displayName = '') {
  return useMemo(() => {
    const hasInput = password.length > 0;
    const folded = password.toLocaleLowerCase();
    const normalizedUsername = username.toLocaleLowerCase();
    const normalizedName = displayName.trim().toLocaleLowerCase();
    const escapedUsername = normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchesUsername = Boolean(normalizedUsername) && (folded === normalizedUsername || new RegExp(`^${escapedUsername}\\d+$`).test(folded));
    const matchesDisplayName = normalizedName.length >= 4 && folded.includes(normalizedName);
    const isCommonPassword = commonPasswords.has(folded);
    const looksWeak = isCommonPassword || matchesUsername || matchesDisplayName;
    return {
      confirmationMatches: confirmPassword.length > 0 && password === confirmPassword,
      hasInput,
      hasMinimumLength: hasInput && password.length >= 15,
      isCommonPassword,
      isNotCommonOrSimilar: hasInput && !looksWeak,
      isValid: hasInput && password.length >= 15 && password.length <= 64 && !looksWeak,
      isWithinMaximumLength: hasInput && password.length <= 64,
      matchesDisplayName,
      matchesUsername,
      remainingMinimumCharacters: Math.max(0, 15 - password.length),
    };
  }, [confirmPassword, displayName, password, username]);
}
