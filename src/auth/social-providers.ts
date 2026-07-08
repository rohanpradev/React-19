import { serverEnv } from "@/config/server-env";

export type { SocialProviderAvailability, SocialProviderId } from "@/config/server-env";

export const socialProviderAvailability = serverEnv.socialProviderAvailability;
export const configuredSocialProviders = serverEnv.auth.socialProviders;
