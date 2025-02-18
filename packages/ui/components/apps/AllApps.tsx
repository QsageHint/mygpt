import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useRouter } from "next/router";
import type { UIEvent } from "react";
import { useEffect, useRef, useState } from "react";

import type { UserAdminTeams } from "@calcom/features/ee/teams/lib/getUserAdminTeams";
import { classNames } from "@calcom/lib";
import { useLocale } from "@calcom/lib/hooks/useLocale";
import type { AppFrontendPayload as App } from "@calcom/types/App";
import type { CredentialFrontendPayload as Credential } from "@calcom/types/Credential";

import { EmptyScreen } from "../empty-screen";
import { ChevronLeft, ChevronRight, Search } from "../icon";
import { AppCard } from "./AppCard";

export function useShouldShowArrows() {
  const ref = useRef<HTMLUListElement>(null);
  const [showArrowScroll, setShowArrowScroll] = useState({
    left: false,
    right: false,
  });

  useEffect(() => {
    const appCategoryList = ref.current;
    if (appCategoryList && appCategoryList.scrollWidth > appCategoryList.clientWidth) {
      setShowArrowScroll({ left: false, right: true });
    }
  }, []);

  const calculateScroll = (e: UIEvent<HTMLUListElement>) => {
    setShowArrowScroll({
      left: e.currentTarget.scrollLeft > 0,
      right:
        Math.floor(e.currentTarget.scrollWidth) - Math.floor(e.currentTarget.offsetWidth) !==
        Math.floor(e.currentTarget.scrollLeft),
    });
  };

  return { ref, calculateScroll, leftVisible: showArrowScroll.left, rightVisible: showArrowScroll.right };
}

type AllAppsPropsType = {
  apps: (App & { credentials?: Credential[] })[];
  searchText?: string;
  categories: string[];
  userAdminTeams?: UserAdminTeams;
};

interface CategoryTabProps {
  selectedCategory: string | null;
  categories: string[];
  searchText?: string;
}

function CategoryTab({ selectedCategory, categories, searchText }: CategoryTabProps) {
  const { t } = useLocale();
  const router = useRouter();
  const { ref, calculateScroll, leftVisible, rightVisible } = useShouldShowArrows();
  const handleLeft = () => {
    if (ref.current) {
      ref.current.scrollLeft -= 100;
    }
  };

  const handleRight = () => {
    if (ref.current) {
      ref.current.scrollLeft += 100;
    }
  };
  return (
    <div className="relative mb-4 flex flex-col justify-between lg:flex-row lg:items-center">
      <div>
        <h2 className="text-emphasis hidden text-base font-semibold leading-none sm:block">
          {searchText
            ? t("search")
            : t("category_apps", {
                category:
                  (selectedCategory && selectedCategory[0].toUpperCase() + selectedCategory.slice(1)) ||
                  t("all"),
              })}
        </h2>
      </div>
      <div className="mt-3 flex flex-row items-center lg:mt-0">
        {leftVisible && (
          <button onClick={handleLeft} className="mx-2 flex">
            <div className="flex h-12 w-5 items-center justify-end rounded-md bg-transparent">
              <ChevronLeft className="text-subtle h-5 w-5" />
            </div>
          </button>
        )}
        <ul
          className="no-scrollbar  flex max-w-full space-x-1 overflow-x-auto  lg:max-w-[90%]"
          onScroll={(e) => calculateScroll(e)}
          ref={ref}>
          <li
            onClick={() => {
              router.replace(router.asPath.split("?")[0], undefined, { shallow: true });
            }}
            className={classNames(
              selectedCategory === null ? "bg-emphasis text-default" : "text-emphasis bg-transparent",
              "hover:bg-emphasis justify min-w-max rounded-md px-4 py-2.5 text-sm font-medium hover:cursor-pointer md:py-3.5"
            )}>
            {t("all")}
          </li>
          {categories.map((cat, pos) => (
            <li
              key={pos}
              onClick={() => {
                if (selectedCategory === cat) {
                  router.replace(router.asPath.split("?")[0], undefined, { shallow: true });
                } else {
                  router.replace(router.asPath.split("?")[0] + `?category=${cat}`, undefined, {
                    shallow: true,
                  });
                }
              }}
              className={classNames(
                selectedCategory === cat ? "bg-emphasis text-default" : "text-emphasis bg-transparent",
                "hover:bg-emphasis rounded-md px-4 py-2.5 text-sm font-medium hover:cursor-pointer md:py-3.5"
              )}>
              {cat[0].toUpperCase() + cat.slice(1)}
            </li>
          ))}
        </ul>
        {rightVisible && (
          <button onClick={handleRight} className="mx-2 flex">
            <div className="flex h-12 w-5 items-center justify-end rounded-md bg-transparent">
              <ChevronRight className="text-subtle h-5 w-5 " />
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export function AllApps({ apps, searchText, categories, userAdminTeams }: AllAppsPropsType) {
  const router = useRouter();
  const { t } = useLocale();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [appsContainerRef, enableAnimation] = useAutoAnimate<HTMLDivElement>();

  if (searchText) {
    enableAnimation && enableAnimation(false);
  }

  useEffect(() => {
    const queryCategory =
      typeof router.query.category === "string" && categories.includes(router.query.category)
        ? router.query.category
        : null;
    setSelectedCategory(queryCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.category]);

  const filteredApps = apps
    .filter((app) =>
      selectedCategory !== null
        ? app.categories
          ? app.categories.includes(selectedCategory)
          : app.category === selectedCategory
        : true
    )
    .filter((app) => (searchText ? app.name.toLowerCase().includes(searchText.toLowerCase()) : true))
    .sort(function (a, b) {
      if (a.name < b.name) return -1;
      else if (a.name > b.name) return 1;
      return 0;
    });

  return (
    <div>
      <CategoryTab selectedCategory={selectedCategory} searchText={searchText} categories={categories} />
      {filteredApps.length ? (
        <div
          className="grid gap-3 lg:grid-cols-4 [@media(max-width:1270px)]:grid-cols-3 [@media(max-width:500px)]:grid-cols-1 [@media(max-width:730px)]:grid-cols-1"
          ref={appsContainerRef}>
          {filteredApps.map((app) => (
            <AppCard
              key={app.name}
              app={app}
              searchText={searchText}
              credentials={app.credentials}
              userAdminTeams={userAdminTeams}
            />
          ))}{" "}
        </div>
      ) : (
        <EmptyScreen
          Icon={Search}
          headline={t("no_results")}
          description={searchText ? searchText?.toString() : ""}
        />
      )}
    </div>
  );
}
