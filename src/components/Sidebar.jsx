import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ isAdmin = false }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = isAdmin
    ? [
        { path: "/admin", icon: "dashboard", label: "Dashboard Overview" },
        { path: "/admin/users", icon: "group", label: "User Management" },
        { path: "/admin/chats", icon: "forum", label: "Chat Logs" },
        { path: "/admin/logs", icon: "list_alt", label: "System Logs" },
      ]
    : [
        { path: "/chat", icon: "add_comment", label: "New Chat" },
        { path: "/chat/history", icon: "history", label: "History" },
      ];

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col p-4 gap-y-2 bg-[var(--color-surface-container-low)] w-64 border-r border-[var(--color-outline-variant)]/10 z-50 transition-colors duration-300">
      <div className="mb-8 px-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] flex items-center justify-center text-[var(--color-on-primary)] shadow-lg">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
        <div>
          <h1 className="font-headline font-extrabold text-[var(--color-primary)] text-lg leading-tight">
            Ashwi AI
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] font-semibold">
            {isAdmin ? "Admin Console" : "Cognitive Sanctuary"}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== "/admin" &&
              item.path !== "/chat" &&
              location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-label text-sm font-medium transition-all duration-300 ${
                isActive
                  ? "bg-[var(--color-surface-container-high)] text-[var(--color-primary)] shadow-sm translate-x-1"
                  : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]/50"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-4">
        {!isAdmin && null}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-lg overflow-hidden relative">
            <div className="relative z-10">
              <p className="text-xs font-semibold text-white/80 mb-1">
                SYSTEM HEALTH
              </p>
              <p className="text-sm font-bold mb-3">All Systems Normal</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-20">
              <span className="material-symbols-outlined text-6xl">
                verified_user
              </span>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-[var(--color-outline-variant)]/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded-lg text-sm transition-colors font-label font-medium"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
