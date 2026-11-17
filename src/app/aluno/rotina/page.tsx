"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, BookOpen, Briefcase, CheckCircle, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RotinaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState(false);
  const [alunoId, setAlunoId] = useState<string | null>(null);

  // Estados de formulário
  const [trabalha, setTrabalha] = useState(true);
  const [tipoTrabalho, setTipoTrabalho] = useState("Jovem Aprendiz");
  const [entradaTrabalho, setEntradaTrabalho] = useState("08:00");
  const [saidaTrabalho, setSaidaTrabalho] = useState("12:00");

  // Escola Horários Fixos
  const entradaEscola = "14:15";
  const saidaEscola = "21:15";

  useEffect(() => {
    async function carregarAluno() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("alunos").select("*").eq("user_id", user.id).single();
        if (data) {
          setAlunoId(data.id);
          setTrabalha(data.trabalha ?? true);
          setTipoTrabalho(data.tipo_trabalho || "Jovem Aprendiz");
          setEntradaTrabalho(data.trabalho_entrada ? String(data.trabalho_entrada).substring(0, 5) : "08:00");
          setSaidaTrabalho(data.trabalho_saida ? String(data.trabalho_saida).substring(0, 5) : "12:00");
        }
      }
      setLoading(false);
    }
    carregarAluno();
  }, []);

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!alunoId) return;

    setSalvando(true);
    const supabase = createClient();
    const { error } = await supabase.from("alunos").update({
      trabalha,
      tipo_trabalho: trabalha ? tipoTrabalho : null,
      trabalho_entrada: trabalha ? entradaTrabalho : null,
      trabalho_saida: trabalha ? saidaTrabalho : null,
    }).eq("id", alunoId);

    setSalvando(false);

    if (!error) {
      setMensagemSucesso(true);
      setTimeout(() => setMensagemSucesso(false), 3000);
    } else {
      alert("Erro ao salvar: " + error.message);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Carregando rotina...</div>;

  return (
    <div className="app-shell min-h-screen bg-slate-50 pb-20">
      {/* TopBar */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-slate-100">
          <ChevronRight size={20} className="text-slate-600 rotate-180" />
        </button>
        <h1 className="font-bold text-slate-800">Editar Minha Rotina</h1>
        <div className="w-8"></div>
      </header>

      <div className="px-4 py-5 flex flex-col gap-4">
        {mensagemSucesso && (
          <div className="bg-green-100 border border-green-300 text-green-800 p-3.5 rounded-2xl flex items-center gap-2 text-sm font-bold shadow-sm animate-in fade-in">
            <CheckCircle size={20} className="text-green-600" />
            Horários de trabalho atualizados com sucesso!
          </div>
        )}

        {/* Card Escola (Informativo) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen size={18} className="text-blue-600" />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-sm">Horário Escolar</span>
              <p className="text-[10px] text-slate-400">EE Prof. Eurípedes Simões de Paula</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-2xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Entrada</p>
              <p className="text-xl font-black text-slate-800">{entradaEscola}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Saída</p>
              <p className="text-xl font-black text-slate-800">{saidaEscola}</p>
            </div>
          </div>
        </div>

        {/* Formulário de Edição do Trabalho */}
        <form onSubmit={handleSalvar} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                <Briefcase size={18} className="text-amber-600" />
              </div>
              <div>
                <span className="font-bold text-slate-800 text-sm">Atividade Laboral / Trabalho</span>
                <p className="text-[10px] text-slate-400">Você exerce trabalho atualmente?</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={trabalha}
                onChange={(e) => setTrabalha(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {trabalha && (
            <div className="flex flex-col gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                  Cargo / Tipo de Trabalho
                </label>
                <input
                  type="text"
                  value={tipoTrabalho}
                  onChange={(e) => setTipoTrabalho(e.target.value)}
                  placeholder="Ex: Jovem Aprendiz, Estágio, Atendente..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={trabalha}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Entrada no Trabalho
                  </label>
                  <input
                    type="time"
                    value={entradaTrabalho}
                    onChange={(e) => setEntradaTrabalho(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={trabalha}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">
                    Saída do Trabalho
                  </label>
                  <input
                    type="time"
                    value={saidaTrabalho}
                    onChange={(e) => setSaidaTrabalho(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-center text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={trabalha}
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-amber-50 p-3 rounded-xl border border-amber-200 leading-relaxed">
                💡 <b>Dica pedagógica:</b> Seus horários de trabalho são compartilhados com o seu tutor para que ele adapte prazos e auxilie na sua permanência escolar.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <Save size={18} />
            {salvando ? "Salvando alterações..." : "Salvar Horários de Trabalho"}
          </button>
        </form>
      </div>
    </div>
  );
}