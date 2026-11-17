"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { User, Activity, AlertCircle, FileText, Briefcase, ChevronRight, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function PerfilAlunoPage() {
  const [nome, setNome] = useState("Aluno");
  const [turma, setTurma] = useState("Carregando turma...");
  const [escolaNome, setEscolaNome] = useState("Escola");
  const [horarioTrabalho, setHorarioTrabalho] = useState("Não configurado");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).single();
        if (profile) setNome(profile.nome);

        const { data: aluno } = await supabase.from("alunos").select("turma, trabalha, tipo_trabalho, trabalho_entrada, trabalho_saida, escolas(nome)").eq("user_id", user.id).single();
        if (aluno) {
          setTurma(aluno.turma || "Turma não informada");
          if (aluno.escolas && typeof aluno.escolas === 'object' && 'nome' in aluno.escolas) {
            setEscolaNome((aluno.escolas as any).nome);
          } else {
             setEscolaNome("EE Prof. Eurípedes");
          }
          if (aluno.trabalha && aluno.trabalho_entrada && aluno.trabalho_saida) {
            setHorarioTrabalho(`${String(aluno.trabalho_entrada).substring(0,5)} às ${String(aluno.trabalho_saida).substring(0,5)} (${aluno.tipo_trabalho || "Trabalho"})`);
          } else {
            setHorarioTrabalho("Clique para configurar");
          }
        }
      }
    }
    load();
  }, []);

  async function handleLogout() {
    if (confirm("Deseja realmente sair da conta?")) {
      const supabase = createClient();
      await supabase.auth.signOut();
      sessionStorage.removeItem("saat_session_active");
      window.location.href = "/login";
    }
  }

  return (
    <div className="app-shell min-h-screen bg-slate-50">
      <header className="px-4 py-4 border-b border-slate-200 bg-white sticky top-0 flex items-center justify-between">
        <h1 className="font-bold text-slate-800">Meu Perfil</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-xs transition border border-red-200"
        >
          <LogOut size={16} /> Sair
        </button>
      </header>
      
      <div className="px-4 py-6 flex flex-col gap-4 pb-24">
        <div className="flex flex-col items-center gap-3 py-5 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-700">
            {nome.charAt(0)}
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-800 text-lg">{nome}</p>
            <p className="text-slate-500 text-sm">{turma} • {escolaNome}</p>
          </div>
        </div>

        {/* Atalho para Editar Horário de Trabalho */}
        <Link
          href="/aluno/rotina"
          className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-700">
              <Briefcase size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Horário de Trabalho</p>
              <p className="text-sm font-bold text-slate-800">{horarioTrabalho}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-blue-600 font-bold">
            Editar <ChevronRight size={16} />
          </div>
        </Link>

        <button 
          onClick={handleLogout} 
          className="w-full bg-white border border-red-200 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-50 transition shadow-sm flex items-center justify-center gap-2 mt-2"
        >
          <LogOut size={20} /> Sair da conta
        </button>
      </div>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-slate-200 z-50">
        <div className="flex">
          {[
            { href: "/aluno/dashboard", label: "Painel", icon: Activity },
            { href: "/aluno/atividades", label: "Atividades", icon: FileText },
            { href: "/aluno/tutor", label: "Tutor", icon: User },
            { href: "/aluno/perfil", label: "Perfil", icon: User },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs ${item.href === "/aluno/perfil" ? "text-blue-600" : "text-slate-400"}`}>
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  );
}