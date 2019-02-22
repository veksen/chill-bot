export const extractRoleId = (roleMention: string): string => {
  return roleMention.replace(/\D/g, "");
};

interface BaseConditionValidity {
  message: string;
}
type ValidConditionValidity = BaseConditionValidity & { valid: true };
type InvalidConditionValidity = BaseConditionValidity & { valid: false };
export type ConditionValidity = ValidConditionValidity | InvalidConditionValidity;

export const valid = (text: string): ValidConditionValidity => ({ valid: true, message: `:white_check_mark: ${text}` });
export const invalid = (text: string): InvalidConditionValidity => ({ valid: false, message: `:x: ${text}` });
