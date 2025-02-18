import type { AppMeta } from "@calcom/types/App";

import _package from "./package.json";

export const metadata = {
  name: "Microsoft Exchange 2016 Calendar",
  description: _package.description,
  installed: true,
  type: "exchange2016_calendar",
  title: "Microsoft Exchange 2016 Calendar",
  variant: "calendar",
  category: "calendar",
  categories: ["calendar"],
  label: "Exchange Calendar",
  logo: "icon.svg",
  publisher: "MyGPT.fi",
  slug: "exchange2016-calendar",
  url: "https://mygpt.fi/",
  email: "help@mygpt.fi",
  dirName: "exchange2016calendar",
} as AppMeta;

export default metadata;
