import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { getLangFromUrl } from "../i18n/utils";
import { homePath } from "../i18n/routes";
import settings from "../data/settings.json";
import menuIcon from "../images/menu-open.svg";
import menuIconWhite from "../images/menu-open-white.svg";
import logo from "../images/logo.svg";
import logoWhite from "../images/logo-white.svg";

// `pathname` comes from the layout so the header renders on the server too.
// That puts the logo and menu links in the page HTML instead of only in JS.
const Header = ({ children, pathname, alternates }) => {
  const lang = getLangFromUrl({ pathname });

  const [open, setOpen] = useState(false);
  const [colorChange, setColorChange] = useState(false);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleScroll() {
    setColorChange(window.scrollY > 70);
  }
  return (
    <header
      className={`fixed top-0 inset-x-0 z-10 py-4 w-full transition-all duration-500 ${
        colorChange ? "bg-white shadow" : "bg-transparent"
      }`}
    >
      <div className="px-4 w-full sm:px-8 lg:px-12 max-w-[1400px] mx-auto">
        <div
          className={`flex items-center justify-between ${
            colorChange ? "" : "text-white"
          }`}
        >
          <a href={homePath(lang)}>
            <img
              src={colorChange ? logo.src : logoWhite.src}
              alt={settings.site_title}
              width="300"
              height="72"
              className="w-48 md:w-64 h-auto"
            />
          </a>
          <nav>
            <button
              className="xl:hidden cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <img
                src={colorChange ? menuIcon.src : menuIconWhite.src}
                alt={lang === "pl" ? "Otwórz menu" : "Open menu"}
                width="40"
                height="40"
                className="w-10"
              />
            </button>
            <Sidebar
              open={open}
              setOpen={setOpen}
              pathname={pathname}
              alternates={alternates}
            />
            {children}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
