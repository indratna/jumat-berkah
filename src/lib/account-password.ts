export type PasswordChangeValidationResult =
  | {
      success: true;
      data: {
        currentPassword: string;
        newPassword: string;
      };
    }
  | {
      success: false;
      errors: {
        currentPassword?: string;
        newPassword?: string;
        confirmPassword?: string;
      };
    };

export function validatePasswordChangePayload(
  payload: Record<string, unknown>,
): PasswordChangeValidationResult {
  const currentPassword = payload.currentPassword;
  const newPassword = payload.newPassword;
  const confirmPassword = payload.confirmPassword;
  const errors: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  } = {};

  if (typeof currentPassword !== "string" || currentPassword.length === 0) {
    errors.currentPassword = "Password saat ini wajib diisi.";
  }

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    errors.newPassword = "Password baru minimal 8 karakter.";
  } else if (newPassword.length > 128) {
    errors.newPassword = "Password baru maksimal 128 karakter.";
  }

  if (typeof confirmPassword !== "string" || confirmPassword.length === 0) {
    errors.confirmPassword = "Konfirmasi password wajib diisi.";
  } else if (typeof newPassword === "string" && confirmPassword !== newPassword) {
    errors.confirmPassword = "Konfirmasi password tidak sama.";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      currentPassword: currentPassword as string,
      newPassword: newPassword as string,
    },
  };
}
