export const MEDICATION_AGE_WEEKS = 4;

export function needsMedication(ageWeeks) {
    return Number(ageWeeks) >= MEDICATION_AGE_WEEKS;
}
