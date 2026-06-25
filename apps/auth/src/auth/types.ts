// Shared auth types for the federated auth widget.

export interface GoogleIdTokenClaims {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  aud?: string;
  iss?: string;
  exp?: number;
}

export interface AuthResult {
  provider: string;
  /**
   * The Google-signed ID token (JWT). Send THIS to your backend, which verifies
   * the signature against Google's public keys before trusting any claim.
   */
  credential: string;
  /**
   * Claims decoded from the JWT *client-side, WITHOUT verifying the signature*.
   * For display only (e.g. show the user's name). NEVER trust this on the
   * backend — the backend must verify `credential` itself.
   */
  profile?: GoogleIdTokenClaims;
}

export interface AuthHandlers {
  onResult: (result: AuthResult) => void;
  onError: (error: Error) => void;
}

// Each provider knows how to render its own sign-in UI into a container and
// report back via handlers. Add a provider by implementing `mount`.
export interface AuthProvider {
  id: string;
  label: string;
  mount: (container: HTMLElement, handlers: AuthHandlers) => (() => void) | void;
}
