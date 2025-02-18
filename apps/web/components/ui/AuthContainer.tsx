import classNames from "classnames";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import { Button, Dialog, HeadSeo, DialogContent, DialogTrigger, ScrollableArea } from "@calcom/ui";
import { LogOut, Menu, MessageSquare, Share2, X } from "@calcom/ui/components/icon";

import Loader from "@components/Loader";
import Footer from "@components/auth/Footer";
import type { LinkProps } from "@components/auth/Footer";
import MicroCards from "@components/microcard";
import PriceListItem from "@components/prices/PriceListItem";
import CarouselAvatarComponentN from "@components/ui/CarouselAvatarsComponentN";
// import CarouselAvatars from "@components/ui/CarouselAvatars";
// import CarouselAvatarsComponent from "@components/ui/CarouselAvatarsComponent";
import CarouselDemo from "@components/ui/CarouselDemo";
import { SUBSCRIPTION_PRICE } from "@calcom/lib/constants";

interface Props {
  title: string;
  description: string;
  footerText?: React.ReactNode | string;
  showLogo?: boolean;
  heading?: string;
  hideFooter?: boolean;
  loading?: boolean;
}

export const footerLinks: LinkProps[] = [
  {
    name: "Benefits",
    url: "/",
    type: "modal",
    col: 3,
  },
  {
    name: "Features",
    url: "/",
    type: "modal",
    col: 3,
  },
  {
    name: "How does it work",
    url: "/",
    type: "modal",
    col: 6,
  },
  {
    name: "Use Cases",
    url: "/",
    type: "modal",
    col: 6,
  },
  {
    name: "Terms and conditions",
    url: "/",
    col: 6,
  },
  {
    name: "France AI",
    url: "/",
    picture: "/france-ai.svg",
    col: 12,
  }
];

const members = [
  {
    alt: "member1",
    id: 1,
  },
  {
    alt: "member2",
    id: 2,
  },
  {
    alt: "member3",
    id: 3,
  },
  {
    alt: "member4",
    id: 4,
  },
  {
    alt: "member5",
    id: 5,
  },
];

const pricesList = [
  {
    name: "freemium",
    features: [
      "access_to_basic_features",
      "limit_of_500_messages/month",
      "email_support_with_a_response_within_48_hours",
      "data_storage_limited_to_1_gb",
      "one_active_user_online",
    ],
    ipDevice: "",
    password: "",
  },
  {
    name: `€${SUBSCRIPTION_PRICE.LEVEL1.EUR}/month`,
    features: [
      "access_to_advanced_features",
      "limit_of_5,000_messages/month",
      "email_support_with_a_response_within_24_hours",
      "data_storage_up_to_10_gb",
      "two_active_users_online",
    ],
    ipDevice: "",
    password: "",
  },
  {
    name: `€${SUBSCRIPTION_PRICE.LEVEL2.EUR}/month`,
    features: [
      "access_to_all_premium_features",
      "limit_of_20,000_messages/month",
      "priority_support_by_email_and_chat",
      "data_storage_up_to_50_gb",
      "ten_active_users_online",
      "access_to_detailed_analyses_and_reports",
    ],
    ipDevice: "",
    password: "",
  },
  {
    name: `€${SUBSCRIPTION_PRICE.LEVEL3.EUR}/month`,
    features: [
      "unlimited_access_to_all_features",
      "limit_of_100,000_messages/month",
      "24/7_priority_support",
      "unlimited_data_storage",
      "twenty_five_active_users_online",
    ],
    ipDevice: "",
    password: "",
  },
  {
    name: "contact_us",
    features: [
      "customizable_message_volume",
      "customizable_data_storage",
      "customizable_number_of_active_bots",
      "specific_integrations_or_custom_developments",
      "access_to_customizable_detailed_analyses_and_reports",
    ],
    ipDevice: "",
    password: "",
  },
];

export default function AuthContainer(props: React.PropsWithChildren<Props>) {
  const { t } = useLocale();
  const [toggleFlag, setToggleFlag] = useState(false);
  const [isOpen, setIsOpen] = useState(false)
  const handleToggleNav = () => {
    setToggleFlag(!toggleFlag);
  };
  useEffect(() => {
    const handleResize = () => {
      setToggleFlag(false);
    };
    setToggleFlag(false);

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  return (
    <div className="to-darkemphasis bg-auth bg-gradient-to-b from-gray-100">
      {toggleFlag ? (
        <div className="z-50 !h-screen !w-full bg-white py-4 transition delay-150 ease-in-out">
          <div className="flex justify-between mb-auto ">
            <div className="flex-col ms-6">
              {props.showLogo && (
                <Image src="/my-gpt-logo.svg" width={130} height={20} className="left-0" alt="logo" />
              )}
            </div>
            <div className="flex-col text-secondary">
              <div className="flex flex-row gap-8">
                <div className="flex-col ">
                  <div className="flex flex-row gap-1">
                    <Button
                      onClick={() => handleToggleNav()}
                      StartIcon={X}
                      variant="icon"
                      size="lg"
                      color="minimal"
                      className="!p-none text-secondary  border-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-center h-full align-center ">
            <div className="flex flex-col self-center">
              <div className="flex flex-col gap-8 text-secondary">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="icon"
                      size="lg"
                      color="secondary"
                      onClick={() => setIsOpen(true)}
                      className="self-center w-12 h-10 mr-1 text-xl bg-transparent border-0 p-none text-secondary">
                      Prices
                    </Button>
                  </DialogTrigger>
                  <DialogContent
                    className="flex flex-row to-emphasis bg-gradient-to-b from-gray-100"
                    size="xl"
                    Icon={X}
                    title={t("")}>
                    <div className="flex-row mt-5 ">
                      <ScrollableArea className="grid h-[600px] gap-5  sm:grid-cols-1 md:h-full md:grid-cols-5">
                        {pricesList.map((priceItem, index) => {
                          return <PriceListItem key={index} priceItem={priceItem} disabled={index === 4} handleClick={() => { window.localStorage.setItem("price-type", `${index}`); setIsOpen(false) }} />;
                        })}
                      </ScrollableArea>
                    </div>
                  </DialogContent>
                </Dialog>
                <div className="flex flex-row ">
                  <div className="flex flex-row gap-1">
                    <LogOut className="flex-col w-10 h-12" />
                    <div className="flex flex-col">
                      <Link onClick={() => handleToggleNav()} href="/auth/login" className="flex-row text-md">
                        {t("sign_in")}
                      </Link>
                      <Link onClick={() => { handleToggleNav(); window.localStorage.setItem("price-type", "-1") }} href="/signup" className="flex-row text-md" >
                        {t("sign_up")}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // <div className="bg-[url('/imgpsh_fullsize_anim.png')] bg-cover bg-no-repeat md:grid lg:!max-h-screen lg:grid-rows-[_80px_1fr_1fr_1fr_1fr_1fr_0px]">
        <div className="relative min-h-[880px] md:grid lg:!max-h-screen lg:grid-rows-[_80px_1fr_1fr_1fr_1fr_1fr_0px]">
          <div className="flex flex-row md:row-span-1">
            <div className="flex flex-col justify-center flex-1 pt-4 ms-6 sm:px-6 md:mx-6 lg:px-4">
              <HeadSeo title={props.title} description={props.description} />
              <div className="flex justify-between mb-auto ">
                <div className="flex-col">
                  {props.showLogo && (
                    <Image src="/my-gpt-logo.svg" width={178} height={30} className="left-0" alt="logo" />
                  )}
                </div>
                <div className="flex-col text-secondary">
                  <div className="flex flex-row gap-8">
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="icon"
                          size="lg"
                          color="secondary"
                          aria-label={t("delete")}
                          onClick={() => setIsOpen(true)}
                          className="hidden mr-1 bg-transparent border-0 p-none text-secondary sm:inline">
                          Prices
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="to-emphasis bg-gradient-to-b from-gray-100"
                        size="xl"
                        Icon={X}
                        title={t("")}>
                        <div className="flex-row mt-5 ">
                          <ScrollableArea className="grid h-[600px] gap-5  sm:grid-cols-1 md:h-full md:grid-cols-5">
                            {pricesList.map((priceItem, index) => {
                              return <PriceListItem key={index} priceItem={priceItem} disabled={index === 4} handleClick={() => { window.localStorage.setItem("price-type", `${index}`); setIsOpen(false) }} />;
                            })}
                          </ScrollableArea>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <div className="flex-col hidden md:contents">
                      <div className="flex flex-row gap-1">
                        <LogOut className="flex-col w-6 h-8" />
                        <div className="flex flex-col">
                          <Link href="/auth/login" className="flex-row text-xs">
                            {t("sign_in")}
                          </Link>
                          <Link href="/signup" className="flex-row text-xs" onClick={() => { window.localStorage.setItem("price-type", "-1") }}>
                            {t("sign_up")}
                          </Link>
                        </div>
                      </div>{/*  */}
                    </div>
                    <div className="flex-col contents md:hidden">
                      <Button
                        onClick={() => handleToggleNav()}
                        StartIcon={Menu}
                        variant="icon"
                        size="lg"
                        color="minimal"
                        className="!p-none text-secondary  border-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid lg:row-span-4 lg:grid-cols-[minmax(500px,_1fr)_1fr] lg:grid-rows-3 ">
            <div className="row-start-1 mx-auto h-fit lg:col-span-1 lg:row-span-1 lg:mx-4">
              <div
                className={classNames(
                  props.showLogo ? "" : "",
                  "flex-row sm:mx-2 sm:w-full sm:max-w-[100%] md:mt-14 md:flex-col"
                )}>
                {props.heading && (
                  <h2 className="mx-6 mt-6 font-sans text-3xl font-medium leading-normal text-center text-emphasis line-height-2 sm:max-w-md md:text-4xl lg:mx-4 lg:mt-0 lg:text-left">
                    {t("empower_with_ai_reveal")}
                  </h2>
                )}
                {props.loading && (
                  <div className="absolute z-50 flex items-center w-full h-screen ">
                    <Loader />
                  </div>
                )}
                <div className="mb-auto mt-8 sm:mx-1  sm:w-[100%] sm:max-w-lg  md:flex-col xl:w-[95%]">
                  <div className="px-2 pt-5 mx-2 sm:px-4 ">{props.children}</div>
                </div>
              </div>
            </div>
            <div className="order-last row-end-5 mx-auto my-4 lg:col-start-1 lg:row-start-3 lg:mx-10 lg:mb-0">
              <CarouselDemo />
              <div className="flex flex-row sm:justify-center lg:justify-normal">
                <p className="mx-3 my-8 break-words text-center text-gray-500 sm:w-full sm:max-w-md  md:mt-5 lg:w-[70%] lg:max-w-[70%] lg:text-left">
                  {t("your_artifitial_footer")}
                </p>
              </div>
            </div>
            <div className=" mx-2 flex h-fit flex-1 flex-col justify-center sm:px-6 lg:row-span-3 lg:mx-0 lg:w-[90%] lg:justify-start">
              <div className="mx-auto my-6 h-[60vh] flex-row md:my-0">
                <div className="w-full h-full">
                  <MicroCards />
                </div>
              </div>
              <div className="mt-4 md:mx-auto md:my-4 lg:mt-2 ">
                <div className="mx-auto ">
                  {/* <CarouselAvatars /> */}
                  <CarouselAvatarComponentN />
                </div>
              </div>
              <div className="justify-center mx-auto my-4 font-sans font-medium text-gray-500 flew-row md:my-4 ">
                {t("more_than_25k_experts_use_myqpt")}
              </div>
            </div>
          </div>
          {!props.hideFooter ? (
            <div className="flex flex-row order-last mt-auto ">
              <Footer items={footerLinks} authPage />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
