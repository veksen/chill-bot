export const extractIdFromMention = (mention: string): string => {
  return mention.replace(/\D/g, "");
};

export const extractIdFromCustomEmoji = (emoji: string): string => {
  return emoji.replace(/^<:.+:(\d+)>$/, "$1");
};

export const isChannelMention = (maybeChannelMention: string): boolean => {
  return Boolean(maybeChannelMention.match(/^<#\d+>$/));
};

interface BaseConditionValidity {
  message: string;
}
type ValidConditionValidity = BaseConditionValidity & { valid: true };
type InvalidConditionValidity = BaseConditionValidity & { valid: false };
export type ConditionValidity = ValidConditionValidity | InvalidConditionValidity;

export const valid = (text: string): ValidConditionValidity => ({ valid: true, message: `:white_check_mark: ${text}` });
export const invalid = (text: string): InvalidConditionValidity => ({ valid: false, message: `:x: ${text}` });
