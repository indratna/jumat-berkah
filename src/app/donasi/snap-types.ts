export type DonationPaymentHandoff = {
  redirectUrl: string;
  snapToken: string;
};

export type SnapCallbackKind = "success" | "pending" | "error" | "close";

export type SnapPayOptions = {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
};

export type SnapWindow = Window & {
  snap?: {
    pay: (token: string, options?: SnapPayOptions) => void;
  };
};
