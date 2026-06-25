// Minimal typings for Google Identity Services (accounts.google.com/gsi/client),
// "Sign in with Google" — the ID-token flow.
export {};

interface GsiCredentialResponse {
  /** The Google-signed ID token (a JWT) to send to the backend. */
  credential: string;
  select_by?: string;
}

interface GsiIdConfiguration {
  client_id: string;
  callback: (resp: GsiCredentialResponse) => void;
  auto_select?: boolean;
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  nonce?: string;
  use_fedcm_for_prompt?: boolean;
}

interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

declare global {
  const google: {
    accounts: {
      id: {
        initialize: (config: GsiIdConfiguration) => void;
        renderButton: (parent: HTMLElement, options: GsiButtonConfiguration) => void;
        prompt: () => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
