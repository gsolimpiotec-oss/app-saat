"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, BookOpen, Clock, Briefcase, GraduationCap, TrendingUp, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { GestorBottomNav } from "@/components/GestorBottomNav";

export default function DetalhesAlunoGestorPage({ params }: { params: { id: string } }) {
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<any[]>([]);
  const [faltas, setFaltas] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<any[]>([]);

  useEffect(() => {
    async function carregar() {
      const supabase = createClient();
      
      const { data: a } = await supabase
        .from("alunos")
        .select("*, profiles!alunos_user_id_fkey(nome)")
        .eq("id", params.id)
        .single();
        
      if (a) {
        setAluno(a);
        
        const { data: n } = await supabase.from("notas").select("*").eq("aluno_id", a.id);
        if (n) setNotas(n);
        
        const { data: f } = await supabase.from("faltas").select("*").eq("aluno_id", a.id).order("data", { ascending: false });
        if (f) setFaltas(f);

        const { data: p } = await supabase.from("presencas").select("*").eq("aluno_id", a.id).order("data", { ascending: false });
        if (p) setPresencas(p);
      }
      setLoading(false);
    }
    carregar();
  }, [params.id]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Carregando dados do aluno...</div>;
  if (!aluno) return <div className="p-8 text-center text-red-500 font-bold">Aluno não encontrado.</div>;

  // Cálculos de Resumo
  let somaNotas = 0;
  let qtdNotas = 0;
  notas.forEach(n => {
    if (n.b1 !== null && n.b1 !== "") { somaNotas += Number(n.b1); qtdNotas++; }
    if (n.b2 !== null && n.b2 !== "") { somaNotas += Number(n.b2); qtdNotas++; }
    if (n.b3 !== null && n.b3 !== "") { somaNotas += Number(n.b3); qtdNotas++; }
    if (n.b4 !== null && n.b4 !== "") { somaNotas += Number(n.b4); qtdNotas++; }
  });
  const mediaGeral = qtdNotas > 0 ? (somaNotas / qtdNotas) : 0;
  const totalFaltas = faltas.length;

  // Análise de Atrasos / Fora do Raio nas presenças
  const foraDoRaioCount = presencas.filter(p => p.dentro_do_raio === false).length;

  // Parecer / Resumo do Aluno
  let situacaoRisco = "Normal";
  let situacaoCor = "text-green-700 bg-green-100 border-green-200";
  let parecerTexto = "";

  if (totalFaltas > 5 || (mediaGeral > 0 && mediaGeral < 5)) {
    situacaoRisco = "Em Risco de Evasão";
    situacaoCor = "text-red-700 bg-red-100 border-red-200";
    parecerTexto = `O aluno apresenta índice crítico com ${totalFaltas} falta(s) e média geral ${mediaGeral > 0 ? mediaGeral.toFixed(1) : "sem notas suficientes"}. Há necessidade de intervenção imediata do tutor para conciliar a rotina de trabalho (${aluno.tipo_trabalho || "trabalho"}) com os estudos.`;
  } else if (totalFaltas >= 2 || (mediaGeral > 0 && mediaGeral < 6) || foraDoRaioCount > 0) {
    situacaoRisco = "Atenção Pedagógica";
    situacaoCor = "text-amber-800 bg-amber-100 border-amber-200";
    parecerTexto = `O aluno está em estado de atenção. Acumula ${totalFaltas} falta(s) e média ${mediaGeral.toFixed(1)}. Recomenda-se acompanhamento semanal das atividades e reforço escolar.`;
  } else {
    situacaoRisco = "Desempenho Regular / Bom";
    situacaoCor = "text-green-700 bg-green-100 border-green-200";
    parecerTexto = `O aluno mantém bom equilíbrio entre trabalho e escola. Frequência regular (${totalFaltas} faltas) e rendimento satisfatório nas disciplinas avaliadas.`;
  }

  return (
    <div className="app-shell min-h-screen bg-slate-50 pb-28">
      {/* Header */}
      <header className="bg-purple-700 px-4 pt-6 pb-6 sticky top-0 z-10 shadow-md flex items-center gap-3 text-white">
        <Link href="/gestor/alunos" className="p-1 rounded-full hover:bg-purple-600 transition">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">Dossiê do Aluno</h1>
          <p className="text-xs text-purple-200">Visão Geral da Gestão Escolar</p>
        </div>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {/* Card Principal do Aluno */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl font-black text-purple-700 flex-shrink-0">
            {aluno.profiles?.nome?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 truncate">{aluno.profiles?.nome}</h2>
            <p className="text-xs text-slate-500">{aluno.turma} • RA: {aluno.ra}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${situacaoCor}`}>
                {situacaoRisco}
              </span>
            </div>
          </div>
        </div>

        {/* Parecer / Diagnóstico do Aluno */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
            <GraduationCap size={20} />
            <span>Diagnóstico do Aluno Trabalhador</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
            {parecerTexto}
          </p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Média Geral</p>
            <p className="text-xl font-black text-blue-600 mt-0.5">
              {qtdNotas > 0 ? mediaGeral.toFixed(1) : "-"}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Faltas</p>
            <p className="text-xl font-black text-red-600 mt-0.5">{totalFaltas}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Trabalho</p>
            <p className="text-xs font-bold text-slate-700 mt-1 truncate">
              {aluno.trabalha ? (aluno.tipo_trabalho || "Sim") : "Não"}
            </p>
          </div>
        </div>

        {/* Rotina de Trabalho */}
        {aluno.trabalha && (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Briefcase size={20} className="text-purple-300" />
              </div>
              <div>
                <p className="text-xs text-slate-300">Horário de Trabalho</p>
                <p className="text-sm font-bold">
                  {aluno.trabalho_entrada ? String(aluno.trabalho_entrada).substring(0, 5) : "--:--"} às {aluno.trabalho_saida ? String(aluno.trabalho_saida).substring(0, 5) : "--:--"}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-purple-500/30 text-purple-200 border border-purple-400/30 font-bold px-2 py-1 rounded-lg">
              Conciliação
            </span>
          </div>
        )}

        {/* Quadro de Notas por Matéria */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen size={18} className="text-purple-600" />
              Boletim e Matérias
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{notas.length} cadastradas</span>
          </div>

          {notas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
              Nenhuma disciplina ou nota lançada ainda.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {notas.map((n) => {
                let s = 0; let q = 0;
                if (n.b1 !== null && n.b1 !== "") { s += Number(n.b1); q++; }
                if (n.b2 !== null && n.b2 !== "") { s += Number(n.b2); q++; }
                if (n.b3 !== null && n.b3 !== "") { s += Number(n.b3); q++; }
                if (n.b4 !== null && n.b4 !== "") { s += Number(n.b4); q++; }
                const med = q > 0 ? (s / q).toFixed(1) : "-";

                return (
                  <div key={n.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 text-sm">{n.materia}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">Média: <b className="text-slate-800 font-black">{med}</b></span>
                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">Total: {s.toFixed(1)}</span>
                      </div>
                    </div>
                    {/* Bimestres */}
                    <div className="grid grid-cols-4 gap-1 text-center pt-1 border-t border-slate-200/60">
                      <div className="text-[10px] text-slate-500">1º: <b className="text-slate-700">{n.b1 ?? "-"}</b></div>
                      <div className="text-[10px] text-slate-500">2º: <b className="text-slate-700">{n.b2 ?? "-"}</b></div>
                      <div className="text-[10px] text-slate-500">3º: <b className="text-slate-700">{n.b3 ?? "-"}</b></div>
                      <div className="text-[10px] text-slate-500">4º: <b className="text-slate-700">{n.b4 ?? "-"}</b></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Histórico Recente de Faltas */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
            <Clock size={18} className="text-red-500" />
            Registro de Faltas ({totalFaltas})
          </h3>
          {faltas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl">
              Nenhuma falta registrada. Excelente assiduidade!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {faltas.slice(0, 5).map(f => (
                <div key={f.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-700">{f.materia}</p>
                    <p className="text-[10px] text-slate-400">{new Date(f.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.justificativa ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-600"}`}>
                    {f.justificativa ? "Justificada" : "Não Justificada"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <GestorBottomNav />
    </div>
  );
}