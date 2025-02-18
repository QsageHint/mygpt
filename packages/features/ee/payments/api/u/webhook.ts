import type { Prisma } from "@prisma/client";
import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import type Stripe from "stripe";

import stripe from "@calcom/app-store/stripepayment/lib/server";
import EventManager from "@calcom/core/EventManager";
import { sendScheduledEmails } from "@calcom/emails";
import { getCalEventResponses } from "@calcom/features/bookings/lib/getCalEventResponses";
import { handleConfirmation } from "@calcom/features/bookings/lib/handleConfirmation";
import { isPrismaObjOrUndefined, parseRecurringEvent } from "@calcom/lib";
import { IS_PRODUCTION } from "@calcom/lib/constants";
import { getErrorFromUnknown } from "@calcom/lib/errors";
import { HttpError as HttpCode } from "@calcom/lib/http-error";
import { getTranslation } from "@calcom/lib/server/i18n";
import { prisma, bookingMinimalSelect } from "@calcom/prisma";
import { BookingStatus } from "@calcom/prisma/enums";
import { EventTypeMetaDataSchema } from "@calcom/prisma/zod-utils";
import type { CalendarEvent } from "@calcom/types/Calendar";

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getEventType(id: number) {
  return prisma.eventType.findUnique({
    where: {
      id,
    },
    select: {
      recurringEvent: true,
      requiresConfirmation: true,
      metadata: true,
    },
  });
}

async function getBooking(bookingId: number) {
  const booking = await prisma.booking.findUnique({
    where: {
      id: bookingId,
    },
    select: {
      ...bookingMinimalSelect,
      eventType: true,
      smsReminderNumber: true,
      location: true,
      eventTypeId: true,
      userId: true,
      uid: true,
      paid: true,
      destinationCalendar: true,
      status: true,
      user: {
        select: {
          id: true,
          username: true,
          timeZone: true,
          email: true,
          name: true,
          locale: true,
          destinationCalendar: true,
        },
      },
    },
  });

  if (!booking) throw new HttpCode({ statusCode: 204, message: "No booking found" });

  type EventTypeRaw = Awaited<ReturnType<typeof getEventType>>;
  let eventTypeRaw: EventTypeRaw | null = null;
  if (booking.eventTypeId) {
    eventTypeRaw = await getEventType(booking.eventTypeId);
  }

  const eventType = { ...eventTypeRaw, metadata: EventTypeMetaDataSchema.parse(eventTypeRaw?.metadata) };

  const { user } = booking;

  if (!user) throw new HttpCode({ statusCode: 204, message: "No user found" });

  const t = await getTranslation(user.locale ?? "en", "common");
  const attendeesListPromises = booking.attendees.map(async (attendee) => {
    return {
      name: attendee.name,
      email: attendee.email,
      timeZone: attendee.timeZone,
      language: {
        translate: await getTranslation(attendee.locale ?? "en", "common"),
        locale: attendee.locale ?? "en",
      },
    };
  });

  const attendeesList = await Promise.all(attendeesListPromises);

  const evt: CalendarEvent = {
    type: booking.title,
    title: booking.title,
    description: booking.description || undefined,
    startTime: booking.startTime.toISOString(),
    endTime: booking.endTime.toISOString(),
    customInputs: isPrismaObjOrUndefined(booking.customInputs),
    organizer: {
      email: user.email,
      name: user.name!,
      timeZone: user.timeZone,
      language: { translate: t, locale: user.locale ?? "en" },
      id: user.id,
    },
    attendees: attendeesList,
    uid: booking.uid,
    destinationCalendar: booking.destinationCalendar || user.destinationCalendar,
    recurringEvent: parseRecurringEvent(eventType?.recurringEvent),
  };

  return {
    booking,
    user,
    evt,
    eventType,
  };
}

async function handlePaymentSuccess(event: Stripe.Event) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const payment = await prisma.payment.findFirst({
    where: {
      externalId: paymentIntent.id,
    },
    select: {
      id: true,
      bookingId: true,
      walletId: true,
      subscriptionId: true,
    },
  });

  console.log(paymentIntent);
  // if (!payment?.bookingId) {
  //   console.log(JSON.stringify(paymentIntent), JSON.stringify(payment));
  // }
  // if (!payment?.bookingId) throw new HttpCode({ statusCode: 204, message: "Payment not found" });

  if (payment?.bookingId) {
    const booking = await prisma.booking.findUnique({
      where: {
        id: payment.bookingId,
      },
      select: {
        ...bookingMinimalSelect,
        eventType: true,
        smsReminderNumber: true,
        location: true,
        eventTypeId: true,
        userId: true,
        uid: true,
        paid: true,
        destinationCalendar: true,
        status: true,
        responses: true,
        user: {
          select: {
            id: true,
            username: true,
            credentials: true,
            timeZone: true,
            email: true,
            name: true,
            locale: true,
            destinationCalendar: true,
          },
        },
      },
    });

    if (!booking) throw new HttpCode({ statusCode: 204, message: "No booking found" });

    type EventTypeRaw = Awaited<ReturnType<typeof getEventType>>;
    let eventTypeRaw: EventTypeRaw | null = null;
    if (booking.eventTypeId) {
      eventTypeRaw = await getEventType(booking.eventTypeId);
    }

    const { user: userWithCredentials } = booking;

    if (!userWithCredentials) throw new HttpCode({ statusCode: 204, message: "No user found" });

    const { credentials, ...user } = userWithCredentials;

    // checking booker has enough timetokens
    const length = (booking.endTime.getTime() - booking.startTime.getTime()) / 60000; // minutes
    const amount = Math.ceil(length / 5);

    // let email;
    // if (booking.responses && booking.responses.hasOwnProperty('email')) {
    //   email = booking.responses.email;
    // } else throw new Error("No booker found");

    const { email } = booking.responses as {
      email?: string;
      name?: string;
    };

    const booker = await prisma.user.findFirst({
      where: {
        email: email,
      },
      select: {
        id: true,
      },
    });

    if (!booker) throw new HttpCode({ statusCode: 204, message: "No booker found" });

    const wallet = await prisma.timeTokensWallet.findFirst({
      where: {
        emitterId: user.id,
        ownerId: booker.id,
      },
      select: {
        id: true,
        amount: true,
      },
    });

    if (!wallet) throw new HttpCode({ statusCode: 204, message: "No wallet found" });

    if (amount > wallet.amount) {
      const updateWallet = prisma.timeTokensWallet.update({
        where: {
          id: wallet.id,
        },
        data: {
          amount: {
            decrement: wallet.amount,
          },
        },
      });

      const updateUser = prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          tokens: {
            decrement: amount - wallet.amount,
          },
        },
      });

      await prisma.$transaction([updateWallet, updateUser]);
    }

    const t = await getTranslation(user.locale ?? "en", "common");
    const attendeesListPromises = booking.attendees.map(async (attendee) => {
      return {
        name: attendee.name,
        email: attendee.email,
        timeZone: attendee.timeZone,
        language: {
          translate: await getTranslation(attendee.locale ?? "en", "common"),
          locale: attendee.locale ?? "en",
        },
      };
    });

    const attendeesList = await Promise.all(attendeesListPromises);

    const evt: CalendarEvent = {
      type: booking.title,
      title: booking.title,
      description: booking.description || undefined,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      customInputs: isPrismaObjOrUndefined(booking.customInputs),
      ...getCalEventResponses({
        booking: booking,
        bookingFields: booking.eventType?.bookingFields || null,
      }),
      organizer: {
        email: user.email,
        name: user.name!,
        timeZone: user.timeZone,
        language: { translate: t, locale: user.locale ?? "en" },
      },
      attendees: attendeesList,
      location: booking.location,
      uid: booking.uid,
      destinationCalendar: booking.destinationCalendar || user.destinationCalendar,
      recurringEvent: parseRecurringEvent(eventTypeRaw?.recurringEvent),
    };

    if (booking.location) evt.location = booking.location;

    const bookingData: Prisma.BookingUpdateInput = {
      paid: true,
      status: BookingStatus.ACCEPTED,
    };

    const isConfirmed = booking.status === BookingStatus.ACCEPTED;
    if (isConfirmed) {
      const eventManager = new EventManager(userWithCredentials);
      const scheduleResult = await eventManager.create(evt);
      bookingData.references = { create: scheduleResult.referencesToCreate };
    }

    if (eventTypeRaw?.requiresConfirmation) {
      delete bookingData.status;
    }

    const paymentUpdate = prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        success: true,
      },
    });

    const bookingUpdate = prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: bookingData,
    });

    await prisma.$transaction([paymentUpdate, bookingUpdate]);

    if (!isConfirmed && !eventTypeRaw?.requiresConfirmation) {
      await handleConfirmation({
        user: userWithCredentials,
        evt,
        prisma,
        bookingId: booking.id,
        booking,
        paid: true,
      });
    } else {
      await sendScheduledEmails({ ...evt });
    }

    throw new HttpCode({
      statusCode: 200,
      message: `Booking with id '${booking.id}' was paid and confirmed.`,
    });
  } else if (payment?.walletId) {
    const wallet = await prisma.timeTokensTransaction.update({
      where: {
        id: payment?.walletId,
      },
      data: {
        paid: true,
      },
      select: {
        emitterId: true,
        ownerId: true,
        amount: true,
      },
    });
    console.log(wallet, "=== wallet ===");

    if (!wallet) throw new HttpCode({ statusCode: 204, message: "TimeTokensWallet not found" });

    const tokensWallet = await prisma.timeTokensWallet.findFirst({
      where: {
        emitterId: wallet.emitterId,
        ownerId: wallet.ownerId,
      },
      select: {
        id: true,
      },
    });

    if (!tokensWallet) throw new HttpCode({ statusCode: 204, message: "TimeTokensWallet not found" });

    const updateWallet = prisma.timeTokensWallet.update({
      where: {
        id: tokensWallet.id,
      },
      data: {
        amount: {
          increment: wallet.amount,
        },
      },
    });

    const updateTokens = prisma.user.update({
      where: {
        id: wallet.emitterId,
      },
      data: {
        tokens: {
          decrement: wallet.amount,
        },
      },
    });

    const transaction = await prisma.$transaction([updateWallet, updateTokens]);
  } else if (payment?.subscriptionId) {
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: payment?.subscriptionId,
      },
      data: {
        paid: true,
      },
      select: {
        userId: true,
        level: true,
      },
    });

    if (!updatedSubscription) throw new Error("Subscription not found");

    await prisma.user.update({
      where: {
        id: updatedSubscription.userId,
      },
      data: {
        level: updatedSubscription.level,
      },
    });
  } else throw new HttpCode({ statusCode: 204, message: "Payment and Transaction not found" });
}

// const handleSetupSuccess = async (event: Stripe.Event) => {
//   const setupIntent = event.data.object as Stripe.SetupIntent;
//   const payment = await prisma.payment.findFirst({
//     where: {
//       externalId: setupIntent.id,
//     },
//   });

//   if (!payment?.data || !payment?.id) throw new HttpCode({ statusCode: 204, message: "Payment not found" });

//   if (payment?.bookingId) {
//     const { booking, user, evt, eventType } = await getBooking(payment.bookingId);

//     const bookingData: Prisma.BookingUpdateInput = {
//       paid: true,
//     };

//     const userWithCredentials = await prisma.user.findUnique({
//       where: {
//         id: user.id,
//       },
//       select: {
//         id: true,
//         username: true,
//         timeZone: true,
//         email: true,
//         name: true,
//         locale: true,
//         destinationCalendar: true,
//         credentials: true,
//       },
//     });

//     if (!userWithCredentials) throw new HttpCode({ statusCode: 204, message: "No user found" });

//     let requiresConfirmation = eventType?.requiresConfirmation;
//     const rcThreshold = eventType?.metadata?.requiresConfirmationThreshold;
//     if (rcThreshold) {
//       if (dayjs(dayjs(booking.startTime).utc().format()).diff(dayjs(), rcThreshold.unit) > rcThreshold.time) {
//         requiresConfirmation = false;
//       }
//     }

//     if (!requiresConfirmation) {
//       const eventManager = new EventManager(userWithCredentials);
//       const scheduleResult = await eventManager.create(evt);
//       bookingData.references = { create: scheduleResult.referencesToCreate };
//       bookingData.status = BookingStatus.ACCEPTED;
//     }

//     await prisma.payment.update({
//       where: {
//         id: payment.id,
//       },
//       data: {
//         data: {
//           ...(payment.data as Prisma.JsonObject),
//           setupIntent: setupIntent as unknown as Prisma.JsonObject,
//         },
//         booking: {
//           update: {
//             ...bookingData,
//           },
//         },
//       },
//     });

//     // If the card information was already captured in the same customer. Delete the previous payment method

//     if (!requiresConfirmation) {
//       await handleConfirmation({
//         user: userWithCredentials,
//         evt,
//         prisma,
//         bookingId: booking.id,
//         booking,
//         paid: true,
//       });
//     } else {
//       await sendOrganizerRequestEmail({ ...evt });
//       await sendAttendeeRequestEmail({ ...evt }, evt.attendees[0]);
//     }
//   }
// };

type WebhookHandler = (event: Stripe.Event) => Promise<void>;

const webhookHandlers: Record<string, WebhookHandler | undefined> = {
  "payment_intent.succeeded": handlePaymentSuccess,
  "application_fee.created": handlePaymentSuccess,
  // "setup_intent.succeeded": handleSetupSuccess,
};

/**
 * @deprecated
 * We need to create a PaymentManager in `@calcom/core`
 * to prevent circular dependencies on App Store migration
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      throw new HttpCode({ statusCode: 405, message: "Method Not Allowed" });
    }
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      throw new HttpCode({ statusCode: 400, message: "Missing stripe-signature" });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET_U) {
      throw new HttpCode({ statusCode: 500, message: "Missing process.env.STRIPE_WEBHOOK_SECRET_U" });
    }
    const requestBuffer = await buffer(req);
    const payload = requestBuffer.toString();

    const event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET_U);

    // if (!event.account) {
    //   throw new HttpCode({ statusCode: 202, message: "Incoming connected account" });
    // }

    const handler = webhookHandlers[event.type];
    if (handler) {
      await handler(event);
    } else {
      /** Not really an error, just letting Stripe know that the webhook was received but unhandled */
      throw new HttpCode({
        statusCode: 202,
        message: `Unhandled Stripe Webhook event type ${event.type}`,
      });
    }
  } catch (_err) {
    const err = getErrorFromUnknown(_err);
    console.error(`Webhook Error: ${err.message}`);
    res.status(err.statusCode ?? 500).send({
      message: err.message,
      stack: IS_PRODUCTION ? undefined : err.stack,
    });
    return;
  }

  // Return a response to acknowledge receipt of the event
  res.json({ received: true });
}
