"use client";
import { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { calcDistanceMeters } from "@/lib/utils";
import { Escola } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface PresencaPopupProps {
  escola: Escola;
}

export function PresencaPopup({ escola }: PresencaPopupProps) {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "atrasado" | "error">("idle");
  const [distancia, setDistancia] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [isAtrasado, setIsAtrasado] = useState(false);

  const horarioEntrada = escola.horario_entrada ? escola.horario_entrada.substring(0, 5) : "14:15";
  const horarioSaida = escola.horario_saida ? escola.horario_saida.substring(0, 5) : "21:15";

  useEffect(() => {
    const dataHoje = new Date().toISOString().split("T")[0];
    const jaApareceuHoje = localStorage.getItem("popup_visto_" + dataHoje);

    if (!jaApareceuHoje) {
      const agora = new Date();
      const horaAtual = agora.getHours();
      const minutoAtual = agora.getMinutes();
      
      const [hEntrada, mEntrada] = horarioEntrada.split(":").map(Number);
      const minutosAtual = horaAtual * 60 + minutoAtual;
      const minutosEntrada = hEntrada * 60 + mEntrada;

      // Se já passou do horário de entrada
      if (minutosAtual >= minutosEntrada) {
        setIsAtrasado(minutosAtual > minutosEntrada + 15); // Atraso se passar de 15 minutos da entrada
        const t = setTimeout(() => setShow(true), 1500);
        return () => clearTimeout(t);
      }
    }
  }, [horarioEntrada]);

  function marcarComoVisto() {
    const dataHoje = new Date().toISOString().split("T")[0];
    localStorage.setItem("popup_visto_" + dataHoje, "true");
  }

  async function confirmarPresenca() {
    setStatus("loading");
    setMsg("Obtendo sua localização via GPS...");

    if (!navigator.geolocation) {
      setStatus("error");
      setMsg("Geolocalização não suportada no seu dispositivo.");
      marcarComoVisto();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latAluno = pos.coords.latitude;
        const lngAluno = pos.coords.longitude;
        
        const latEscola = escola.lat || -23.7613199;
        const lngEscola = escola.lng || -46.6735803;
        const raio = escola.raio_metros || 100;

        const dist = calcDistanceMeters(latEscola, lngEscola, latAluno, lngAluno);
        setDistancia(Math.round(dist));

        const agora = new Date();
        const horaMinutoAtual = agora.getHours() * 60 + agora.getMinutes();
        const [hEntrada, mEntrada] = horarioEntrada.split(":").map(Number);
        const minutosEntrada = hEntrada * 60 + mEntrada;
        
        // Se registrou presença após 15 minutos da entrada = ATRASO
        const atrasado = horaMinutoAtual > minutosEntrada + 15;

        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (dist <= raio) {
          if (atrasado) {
            setStatus("atrasado");
            setMsg("Presença confirmada, mas com registro de Atraso!");
          } else {
            setStatus("success");
            setMsg("Presença pontual confirmada com sucesso!");
          }
          
          if (session?.user) {
            const { data: alunoInfo } = await supabase.from("alunos").select("id").eq("user_id", session.user.id).single();
            if (alunoInfo) {
              await supabase.from("presencas").insert({
                aluno_id: alunoInfo.id,
                escola_id: escola.id,
                data: new Date().toISOString().split("T")[0],
                status: atrasado ? "atrasado" : "confirmada",
                lat_aluno: latAluno,
                lng_aluno: lngAluno,
                dentro_do_raio: true,
                confirmada_em: new Date().toISOString()
              });
            }
          }
          
          marcarComoVisto();
          setTimeout(() => setShow(false), 3000);
        } else {
          // Fora do raio: NÃO LANÇA FALTA IMEDIATAMENTE! Apenas avisa que está fora da escola
          setStatus("error");
          setMsg("Você está fora do perímetro da escola (" + Math.round(dist) + "m). Aproxime-se para validar!");
          
          if (session?.user) {
            const { data: alunoInfo } = await supabase.from("alunos").select("id").eq("user_id", session.user.id).single();
            if (alunoInfo) {
              await supabase.from("presencas").insert({
                aluno_id: alunoInfo.id,
                escola_id: escola.id,
                data: new Date().toISOString().split("T")[0],
                status: "tentativa_fora",
                lat_aluno: latAluno,
                lng_aluno: lngAluno,
                dentro_do_raio: false,
                confirmada_em: new Date().toISOString()
              });
            }
          }
        }
      },
      (err) => {
        setStatus("error");
        setMsg(err.message === "User denied Geolocation" 
          ? "Você negou o acesso à localização." 
          : "Não foi possível verificar sua localização.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function fecharPopup() {
    marcarComoVisto();
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="bg-blue-600 p-6 flex flex-col items-center text-center text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
            <MapPin size={32} />
          </div>
          <h2 className="font-black text-xl">Validação de Presença</h2>
          <p className="text-xs text-blue-100 mt-1">Horário de Entrada: {horarioEntrada}</p>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {status === "idle" && (
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-4">
                Confirme sua presença dentro do raio da escola ({escola.raio_metros || 100}m) para validar a frequência de hoje.
              </p>
              <button
                onClick={confirmarPresenca}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
              >
                Confirmar Presença (GPS)
              </button>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">{msg}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-2">
              <CheckCircle className="text-green-500 mx-auto mb-2" size={48} />
              <p className="text-sm font-bold text-green-700">{msg}</p>
              <p className="text-xs text-slate-400 mt-1">Distância: {distancia}m da escola</p>
            </div>
          )}

          {status === "atrasado" && (
            <div className="text-center py-2">
              <Clock className="text-amber-500 mx-auto mb-2" size={48} />
              <p className="text-sm font-bold text-amber-700">{msg}</p>
              <p className="text-xs text-slate-500 mt-1">Presença confirmada após o horário com registro de atraso.</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-2">
              <AlertTriangle className="text-amber-500 mx-auto mb-2" size={48} />
              <p className="text-sm font-bold text-slate-800">{msg}</p>
              <p className="text-xs text-slate-500 mt-2">
                Faltas só são registradas se ao final do dia você não tiver marcado presença.
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={confirmarPresenca}
                  className="flex-1 bg-blue-600 text-white text-xs font-bold py-3 rounded-xl hover:bg-blue-700 transition"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={fecharPopup}
                  className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold py-3 rounded-xl hover:bg-slate-200 transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}