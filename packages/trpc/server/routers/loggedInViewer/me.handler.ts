import type { TrpcSessionUser } from "@calcom/trpc/server/trpc";

type MeOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
};

export const meHandler = async ({ ctx }: MeOptions) => {
  const crypto = await import("crypto");
  const { user } = ctx;
  // Destructuring here only makes it more illegible
  // pick only the part we want to expose in the API

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    position: user.position,
    address: user.address,
    price: user.price,
    TokenPrice: user.TokenPrice,
    currency: user.currency,
    experiences: user.experiences,
    educations: user.educations,
    skills: user.skills,
    emailMd5: crypto.createHash("md5").update(user.email).digest("hex"),
    startTime: user.startTime,
    endTime: user.endTime,
    bufferTime: user.bufferTime,
    locale: user.locale,
    timeFormat: user.timeFormat,
    timeZone: user.timeZone,
    avatar: user.avatar,
    level: user.level,
    createdDate: user.createdDate,
    trialEndsAt: user.trialEndsAt,
    defaultScheduleId: user.defaultScheduleId,
    completedOnboarding: user.completedOnboarding,
    twoFactorEnabled: user.twoFactorEnabled,
    disableImpersonation: user.disableImpersonation,
    identityProvider: user.identityProvider,
    brandColor: user.brandColor,
    darkBrandColor: user.darkBrandColor,
    away: user.away,
    bio: user.bio,
    hasBot: user.hasBot,
    botId: user.botId,
    weekStart: user.weekStart,
    theme: user.theme,
    hideBranding: user.hideBranding,
    metadata: user.metadata,
    social: user.social,
    defaultBookerLayouts: user.defaultBookerLayouts,
    allowDynamicBooking: user.allowDynamicBooking,
    organizationId: user.organizationId,
    organization: user.organization,
    aiAdvantage: user.aiAdvantage,
    timeTokenAdvantage: user.timeTokenAdvantage,
    apiKey: user.apiKey,
    videoCloneToken: user.videoCloneToken,
  };
};
