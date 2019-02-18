export const extractRoleId = (roleMention: string): string => {
  return roleMention.replace(/\D/g, "");
};
