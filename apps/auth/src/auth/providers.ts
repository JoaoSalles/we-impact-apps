import { googleProvider } from './google';
import type { AuthProvider } from './types';

// The client-side sign-in providers shown in the auth widget. Google is first.
// Add another provider by implementing its `mount` and appending it here.
export const providers: AuthProvider[] = [googleProvider];
