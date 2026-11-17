"use client";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutHeaderButton() {
  async function handleLogout() {
    if (confirm("Deseja realmente sair da conta?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      sessionStorage.removeItem("saat_session_active");
      window.location.href = "/login";
    }
  }

  return (
    <button
      onClick={handleLogout}
      type="button"
      title="Sair da Conta"
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs transition border border-red-200 shadow-sm"
    >
      <LogOut size={16} />
      <span>Sair</span>
    </button>
  );
}