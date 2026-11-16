import { useEffect } from "react";
import menuIconClose from "../images/menu-close.svg";
import { getLangFromUrl, useTranslations } from "../i18n/utils";
import { languages } from "../i18n/ui";
import { homePath, isActive, pagePath } from "../i18n/routes";

// The blog has no pages yet. Add "blog" back here once it does.
const items = ["about", "countries", "trips", "contact"];

const Sidebar = ({ open = false, setOpen, pathname, alternates }) => {
  const lang = getLangFromUrl({ pathname });
  const t = useTranslations(lang);
  useEffect(() => {
    open
      ? document.body.classList.add("overflow-hidden")
      : document.body.classList.remove("overflow-hidden");
  }, [open]);
  return (
    <div className="relative">
      <div
        className={`fixed top-0 right-0 w-[350px] overflow-y-auto max-w-full bg-white text-gray-950 overflow- h-screen z-[999] transition-transform ease-in-out duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setOpen(false);
              }}
            >
              <img
                src={menuIconClose.src}
                alt={lang === "pl" ? "Zamknij menu" : "Close menu"}
                width="40"
                height="40"
                className="w-10"
              />
            </button>
          </div>
          <div className="mt-8 mb-16">
            <ul className="flex flex-col gap-4">
              {items.map((key) => (
                <li key={key}>
                  <a
                    href={pagePath(lang, key)}
                    className={`font-medium tracking-wide drop-shadow-sm ${
                      isActive(pathname, pagePath(lang, key))
                        ? "text-rose-500"
                        : ""
                    }`}
                  >
                    {t(`nav.${key}`)}
                  </a>
                </li>
              ))}
              {Object.entries(languages).map(([language, label]) => (
                <li
                  key={language}
                  className={language === lang ? "hidden" : "mt-8 font-medium"}
                >
                  <a
                    href={alternates?.[language] ?? homePath(language)}
                    hrefLang={language}
                    lang={language}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div
        onClick={() => setOpen(false)}
        className={`w-full h-full fixed bg-black z-10 top-0 transition-opacity duration-100 left-0 ${
          open ? "translate-x-0 opacity-80" : "translate-x-full opacity-100"
        }`}
      ></div>
    </div>
  );
};

export default Sidebar;
