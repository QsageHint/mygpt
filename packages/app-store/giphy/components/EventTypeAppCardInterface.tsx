import { useAppContextWithSchema } from "@calcom/app-store/EventTypeAppContext";
import AppCard from "@calcom/app-store/_components/AppCard";
import useIsAppEnabled from "@calcom/app-store/_utils/useIsAppEnabled";
import { SelectGifInput } from "@calcom/app-store/giphy/components";
import type { EventTypeAppCardComponent } from "@calcom/app-store/types";
import { useLocale } from "@calcom/lib/hooks/useLocale";

import type { appDataSchema } from "../zod";

const EventTypeAppCard: EventTypeAppCardComponent = function EventTypeAppCard({ app, eventType }) {
  const [getAppData, setAppData, LockedIcon, disabled] = useAppContextWithSchema<typeof appDataSchema>();
  const thankYouPage = getAppData("thankYouPage");
  const { enabled: showGifSelection, updateEnabled: setShowGifSelection } = useIsAppEnabled(app);

  const { t } = useLocale();

  return (
    <AppCard
      setAppData={setAppData}
      app={app}
      description={t("confirmation_page_gif")}
      disableSwitch={disabled}
      LockedIcon={LockedIcon}
      switchOnClick={(e: any) => {
        setShowGifSelection(e);
      }}
      switchChecked={showGifSelection}
      teamId={eventType.team?.id || undefined}>
      {showGifSelection && (
        <SelectGifInput
          defaultValue={thankYouPage}
          disabled={disabled}
          onChange={(url: string) => {
            setAppData("thankYouPage", url);
          }}
        />
      )}
    </AppCard>
  );
};

export default EventTypeAppCard;
