import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import "./i18n";
import { useTranslation } from "react-i18next";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("dark", darkMode);
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [darkMode, i18n.language]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <button onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? t("lightMode") : t("darkMode")}
            </button>
            <button onClick={() => i18n.changeLanguage("en")}>English</button>
            <button onClick={() => i18n.changeLanguage("ar")}>العربية</button>
          </div>

          <h1 className="gradient-text text-3xl font-bold mb-6">{t("welcome")}</h1>

          <div className="flex flex-col gap-4">
            <a
              href="https://www.binance.com/referral/earn-together/refer-in-hotsummer/claim?hl=en&ref=GRO_20338_16FN0&utm_source=default"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button>{t("referral")} – Binance</button>
            </a>

            <a
              href="https://one.exnessonelink.com/a/trdqjrdq"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button>{t("referral")} – Exness</button>
            </a>

            <a
              href="https://partner.bybit.com/b/119776"
              target="_blank"
              rel="noopener noreferrer"
            >
              <button>{t("referral")} – Bybit</button>
            </a>
          </div>
        </div>

        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
