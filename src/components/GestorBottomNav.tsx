"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, School, User, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function GestorBottomNav() {
  const pathname = usePathname();

  async function handleLogout() {
    if (confirm("Deseja realmente sair da conta?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      sessionStorage.removeItem("saat_session_active");
      window.location.href = "/login";
    }
  }

  const items = [
    { href: "/gestor/relatorios", label: "Relatórios", icon: LayoutDashboard },
    { href: "/gestor/alunos", label: "Alunos", icon: Users },
    { href: "/gestor/escola", label: "Escola", icon: School },
    { href: "/gestor/perfil", label: "Perfil", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 shadow-lg z-50">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition ${
                isActive ? "text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon size={20} className={isActive ? "text-purple-600" : "text-slate-400"} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          type="button"
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </nav>
  );
}