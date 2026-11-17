"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, AlertTriangle, BookOpen, Clock, Briefcase, GraduationCap, TrendingUp, CheckCircle, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DetalhesAlunoTutorPage({ params }: { params: { id: string } }) {
  const [aluno, setAluno] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<any[]>([]);
  const [faltas, setFaltas] = useState<any[]>([]);
  const [presencas, setPresencas] = useState<any[]>([]);

  useEffect(() => {
    async function carregarAluno() {
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
    carregarAluno();
  }, [params.id]);

  if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Carregando detalhes do aluno...</div>;
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

  // Análise de Presenças / Cerca Virtual / Atrasos
  const presencasForaRaio = presencas.filter(p => p.dentro_do_raio === false).length;
  const presencasConfirmadas = presencas.filter(p => p.status === "confirmada").length;

  // Parecer / Resumo Pedagógico do Tutor
  let statusPedagogico = "Acompanhamento Regular";
  let statusBadgeCor = "text-green-700 bg-green-100 border-green-200";
  let parecerTutor = "";

  if (totalFaltas > 5 || (mediaGeral > 0 && mediaGeral < 5)) {
    statusPedagogico = "Prioridade Alta / Risco de Evasão";
    statusBadgeCor = "text-red-700 bg-red-100 border-red-200";
    parecerTutor = `Atenção Crítica: O aluno acumulou ${totalFaltas} falta(s) e sua média geral está em ${mediaGeral > 0 ? mediaGeral.toFixed(1) : "0.0"}. Como ele trabalha (${aluno.tipo_trabalho || "Jornada laboral"}), a sobrecarga pode estar afetando sua permanência escolar. Recomendamos agendar mentoria no chat e flexibilizar prazos de entregas.`;
  } else if (totalFaltas >= 2 || (mediaGeral > 0 && mediaGeral < 6) || presencasForaRaio > 0) {
    statusPedagogico = "Atenção Pedagógica Necessária";
    statusBadgeCor = "text-amber-800 bg-amber-100 border-amber-200";
    parecerTutor = `Estado de Alerta: Aluno com ${totalFaltas} falta(s) e média ${mediaGeral.toFixed(1)}. Apresenta sinais pontuais de dificuldade na conciliação trabalho-escola. Monitore o cumprimento das atividades para evitar acúmulo de notas baixas no bimestre.`;
  } else {
    statusPedagogico = "Desempenho Estável e Positivo";
    statusBadgeCor = "text-green-700 bg-green-100 border-green-200";
    parecerTutor = `Excelente conciliação: O aluno demonstra comprometimento satisfatório, assiduidade controlada (${totalFaltas} faltas) e rendimento pedagógico favorável. Continue incentivando a rotina de estudos.`;
  }

  return (
    <div className="app-shell min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-indigo-600 px-4 pt-6 pb-6 sticky top-0 z-10 shadow-md flex items-center gap-3 text-white">
        <Link href="/tutor/alunos" className="p-1 rounded-full hover:bg-indigo-500 transition">
          <ChevronLeft size={24} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">Dossiê Pedagógico do Aluno</h1>
          <p className="text-xs text-indigo-200">Painel do Tutor Escolar</p>
        </div>
      </header>

      <div className="p-4 flex flex-col gap-4">
        {/* Identificação */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-700 flex-shrink-0">
            {aluno.profiles?.nome?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 truncate">{aluno.profiles?.nome}</h2>
            <p className="text-xs text-slate-500">{aluno.turma} • RA: {aluno.ra}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${statusBadgeCor}`}>
                {statusPedagogico}
              </span>
            </div>
          </div>
        </div>

        {/* Parecer do Tutor */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
            <GraduationCap size={20} />
            <span>Parecer e Análise do Tutor</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/50 p-3.5 rounded-2xl border border-indigo-100">
            {parecerTutor}
          </p>
        </div>

        {/* Quadro Resumo em Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Média Geral</p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">
              {qtdNotas > 0 ? mediaGeral.toFixed(1) : "-"}
            </p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Faltas Totais</p>
            <p className="text-xl font-black text-red-600 mt-0.5">{totalFaltas}</p>
          </div>
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-[10px] uppercase font-bold text-slate-400">Presenças GPS</p>
            <p className="text-xl font-black text-green-600 mt-0.5">{presencasConfirmadas}</p>
          </div>
        </div>

        {/* Informações de Trabalho e Jornada */}
        {aluno.trabalha && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">{aluno.tipo_trabalho || "Aluno Trabalhador"}</p>
                <p className="text-[11px] text-slate-500">
                  Turno: {aluno.trabalho_entrada ? String(aluno.trabalho_entrada).substring(0, 5) : "--:--"} às {aluno.trabalho_saida ? String(aluno.trabalho_saida).substring(0, 5) : "--:--"}
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Trabalhador
            </span>
          </div>
        )}

        {/* Boletim Completo por Disciplina */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600" />
              Notas e Matérias do Aluno
            </h3>
            <span className="text-xs text-slate-400 font-semibold">{notas.length} matérias</span>
          </div>

          {notas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6 bg-slate-50 rounded-2xl">
              Nenhuma nota lançada pelo aluno no boletim.
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
                        <span className="text-xs text-slate-500">Média: <b className="text-indigo-700 font-black">{med}</b></span>
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

        {/* Faltas Recentes */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 mb-3">
            <Clock size={18} className="text-red-500" />
            Histórico de Ausências ({totalFaltas})
          </h3>
          {faltas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-2xl">
              Nenhuma falta registrada no sistema.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {faltas.map(f => (
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
    </div>
  );
}