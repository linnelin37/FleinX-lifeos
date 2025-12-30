// src/App.tsx
import { useEffect } from "react";
import "./App.css";

import WelcomePage from "./pages/WelcomePage";
import HomePage from "./pages/HomePage";
import VisionWizard from "./pages/VisionWizard";
import VisionDetailPage from "./pages/VisionDetailPage";
import DashboardPage from "./pages/DashboardPage";
import MonthlyBoardPage from "./pages/MonthlyBoardPage";
import GoalsPage from "./pages/GoalsPage";
import TimeBlocksPage from "./pages/TimeBlocksPage";
import RecordsPage from "./pages/RecordsPage";
import ReviewPage from "./pages/ReviewPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import SettingsPage from "./pages/SettingsPage";

import { useAppState } from "./state/useAppState";
import { getActiveVisionId } from "./lib/prefStore";

const AFTER_WELCOME_KEY = "fx_after_welcome_hash_v1";

/**
 * 极简 hash 路由
 * #/welcome          → Welcome
 * #/                → Home
 * #/vision/new       → Vision Wizard
 * #/vision/:id       → Vision Detail
 * #/dashboard        → Dashboard
 * #/months           → Monthly Board
 * #/goals            → Goals
 * #/time             → Time
 * #/records          → Records
 * #/review           → Review
 * #/settings         → 占位
 */
function getRoute() {
  const hash = window.location.hash || "#/";

  if (hash.startsWith("#/welcome")) return "welcome";
  if (hash.startsWith("#/vision/new")) return "wizard";

  if (hash.startsWith("#/vision/")) {
    const id = hash.replace("#/vision/", "").split("?")[0];
    if (id) return `vision:${id}`;
  }

  if (hash.startsWith("#/dashboard")) return "dashboard";
  if (hash.startsWith("#/months")) return "months";
  if (hash.startsWith("#/goals")) return "goals";
  if (hash.startsWith("#/time")) return "time";
  if (hash.startsWith("#/records")) return "records";
  if (hash.startsWith("#/review")) return "review";
  if (hash.startsWith("#/settings")) return "settings";

  if (hash === "" || hash === "#" || hash === "#/") return "home";
  return "home";
}

function go(hash: string) {
  window.location.hash = hash;
}

export default function App() {
  const app = useAppState();

  // 兜底：避免首次渲染空白
  const route = app.route || getRoute();

  // 初始化 activeVisionId（从 prefStore 读）
  useEffect(() => {
    const id = getActiveVisionId();
    if (id !== app.activeVisionId) app.setActiveVision(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听 hash 路由变化（✅ 空依赖，避免重复绑定）
  useEffect(() => {
    const onHashChange = () => app.setRoute(getRoute());
    window.addEventListener("hashchange", onHashChange);
    onHashChange();
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * ✅ Welcome Gate：每次“刷新/首次进入”都强制去 Welcome
   * 但会记住当时的 hash，Continue 后再回去。
   */
  useEffect(() => {
    const hash = window.location.hash || "#/";
    if (!hash.startsWith("#/welcome")) {
      sessionStorage.setItem(AFTER_WELCOME_KEY, hash);
      window.location.hash = "#/welcome";
    }
  }, []);

  // --- Welcome ---
  if (route === "welcome") {
    return (
      <WelcomePage
        onContinue={() => {
          const back = sessionStorage.getItem(AFTER_WELCOME_KEY) || "#/";
          sessionStorage.removeItem(AFTER_WELCOME_KEY);
          go(back);
        }}
      />
    );
  }

  // --- Vision Wizard ---
  if (route === "wizard") return <VisionWizard />;

  // --- Vision Detail ---
  if (route.startsWith("vision:")) {
    const id = route.slice("vision:".length);
    return (
      <VisionDetailPage
        id={id}
        onBack={() => go("#/")}
        onSetActive={(vid) => app.setActiveVision(vid)}
      />
    );
  }

  // --- Home ---
  if (route === "home") {
    return (
      <HomePage
        visions={app.visions}
        activeVisionId={app.activeVisionId}
        onCreate={() => go("#/vision/new")}
        onRefresh={app.refresh}
        onClearAll={app.clearAll}
        onDelete={app.deleteVision}
        onSetActive={(id) => app.setActiveVision(id)}
        onGo={go}
      />
    );
  }

  // --- Dashboard ---
  if (route === "dashboard") {
    return (
      <DashboardPage
        visions={app.visions}
        activeVisionId={app.activeVisionId}
        onBack={() => go("#/")}
        onGo={go}
      />
    );
  }

  // --- Monthly Board ---
  if (route === "months") {
    return (
      <MonthlyBoardPage
        visions={app.visions}
        activeVisionId={app.activeVisionId}
        onBack={() => go("#/dashboard")}
        onGo={go}
      />
    );
  }

  // --- Goals ---
  if (route === "goals") {
    return (
      <GoalsPage
        activeVisionId={app.activeVisionId}
        onBack={() => go("#/")}
      
      />
    );
  }

  // --- Time ---
  if (route === "time") {
    return (
      <TimeBlocksPage
        activeVisionId={app.activeVisionId}
        onBack={() => go("#/")}
      onOpenVision={(id: string) => go(`#/vision/${id}`)}
      />
    );
  }

  // --- Records ---
  if (route === "records") {
    return (
      <RecordsPage
        activeVisionId={app.activeVisionId}
        onBack={() => go("#/")}
      
      />
    );
  }

  // --- Review ---
  if (route === "review") {
    return (
      <ReviewPage
        activeVisionId={app.activeVisionId}
        onBack={() => go("#/")}
      
        onGo={go}
      />
    );
  }
  if (route === "settings") {
    return <SettingsPage onBack={() => go("#/")} />;
  }
  // --- 其余模块：占位 ---
  return (
    <PlaceholderPage
      title={String(route).toUpperCase()}
      subtitle="该模块将在 Active Vision 联动后开放"
      onBack={() => go("#/")}
    />
  );
}