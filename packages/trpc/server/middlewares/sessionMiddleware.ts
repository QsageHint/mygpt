import type { Session } from "next-auth";

import { WEBAPP_URL } from "@calcom/lib/constants";
import { defaultAvatarSrc } from "@calcom/lib/defaultAvatarImage";
import { MembershipRole } from "@calcom/prisma/enums";
import { teamMetadataSchema, userMetadata } from "@calcom/prisma/zod-utils";

import type { Maybe } from "@trpc/server";
import { TRPCError } from "@trpc/server";

import type { TRPCContextInner } from "../createContext";
import { middleware } from "../trpc";

export async function getUserFromSession(ctx: TRPCContextInner, session: Maybe<Session>) {
  const { prisma } = ctx;
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      position: true,
      address: true,
      price: true,
      TokenPrice: {
        select: {
          price: true,
          createdDate: true,
        },
      },
      currency: true,
      experiences: true,
      educations: true,
      skills: true,
      emailVerified: true,
      bio: true,
      hasBot: true,
      botId: true,
      level: true,
      lastRewardedDate: true,
      timeZone: true,
      weekStart: true,
      startTime: true,
      endTime: true,
      defaultScheduleId: true,
      aiAdvantage: true,
      timeTokenAdvantage: true,
      bufferTime: true,
      theme: true,
      createdDate: true,
      hideBranding: true,
      avatar: true,
      twoFactorEnabled: true,
      disableImpersonation: true,
      identityProvider: true,
      brandColor: true,
      darkBrandColor: true,
      away: true,
      credentials: {
        select: {
          id: true,
          type: true,
          key: true,
          userId: true,
          appId: true,
          invalid: true,
          teamId: true,
        },
        orderBy: {
          id: "asc",
        },
      },
      selectedCalendars: {
        select: {
          externalId: true,
          integration: true,
        },
      },
      completedOnboarding: true,
      destinationCalendar: true,
      locale: true,
      timeFormat: true,
      trialEndsAt: true,
      metadata: true,
      social: true,
      role: true,
      organizationId: true,
      allowDynamicBooking: true,
      organization: {
        select: {
          id: true,
          slug: true,
          metadata: true,
          members: {
            select: { userId: true },
            where: {
              userId: session.user.id,
              OR: [{ role: MembershipRole.ADMIN }, { role: MembershipRole.OWNER }],
            },
          },
        },
      },
      apiKey: true,
      videoCloneToken: true
    },
  });

  // some hacks to make sure `username` and `email` are never inferred as `null`
  if (!user) {
    return null;
  }

  const { email, username, id } = user;
  if (!email || !id) {
    return null;
  }

  const userMetaData = userMetadata.parse(user.metadata || {});
  const orgMetadata = teamMetadataSchema.parse(user.organization?.metadata || {});
  const rawAvatar = user.avatar;
  // This helps to prevent reaching the 4MB payload limit by avoiding base64 and instead passing the avatar url
  user.avatar = rawAvatar ? `${WEBAPP_URL}/${user.username}/avatar.png` : defaultAvatarSrc({ email });
  const locale = user?.locale || ctx.locale;

  const isOrgAdmin = !!user.organization?.members.length;
  // Want to reduce the amount of data being sent
  if (isOrgAdmin && user.organization?.members) {
    user.organization.members = [];
  }
  return {
    ...user,
    organization: {
      ...user.organization,
      isOrgAdmin,
      metadata: orgMetadata,
    },
    id,
    rawAvatar,
    email,
    username,
    locale,
    defaultBookerLayouts: userMetaData?.defaultBookerLayouts || null,
  };
}

export type UserFromSession = Awaited<ReturnType<typeof getUserFromSession>>;

const getSession = async (ctx: TRPCContextInner) => {
  const { req, res } = ctx;
  const { getServerSession } = await import("@calcom/features/auth/lib/getServerSession");
  return req ? await getServerSession({ req, res }) : null;
};

const getUserSession = async (ctx: TRPCContextInner) => {
  /**
   * It is possible that the session and user have already been added to the context by a previous middleware
   * or when creating the context
   */
  const session = ctx.session || (await getSession(ctx));
  const user = session ? await getUserFromSession(ctx, session) : null;

  return { user, session };
};
const sessionMiddleware = middleware(async ({ ctx, next }) => {
  const { user, session } = await getUserSession(ctx);

  return next({
    ctx: { user, session },
  });
});

export const isAuthed = middleware(async ({ ctx, next }) => {
  const { user, session } = await getUserSession(ctx);

  if (!user || !session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  return next({
    ctx: { ...ctx, user, session },
  });
});

export const isAdminMiddleware = isAuthed.unstable_pipe(({ ctx, next }) => {
  const { user } = ctx;
  if (user?.role !== "ADMIN") {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: user } });
});

export default sessionMiddleware;
