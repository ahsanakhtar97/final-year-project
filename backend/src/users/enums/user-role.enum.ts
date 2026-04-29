export enum UserRole {
  PATIENT = 'patient',
  PSYCHIATRIST = 'psychiatrist',
  PSYCHOLOGIST = 'psychologist',
}

/** Roles that represent mental-health professionals (used for filters / guards). */
export const PROFESSIONAL_ROLES = [
  UserRole.PSYCHIATRIST,
  UserRole.PSYCHOLOGIST,
] as const;

export function isProfessional(role: UserRole | string | undefined | null): boolean {
  return role === UserRole.PSYCHIATRIST || role === UserRole.PSYCHOLOGIST;
}
