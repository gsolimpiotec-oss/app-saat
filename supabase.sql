-- =======================================================
-- SAAT - Script Completo de Criação do Banco de Dados
-- =======================================================

-- 1. Tabela de Escolas
CREATE TABLE IF NOT EXISTS public.escolas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  endereco TEXT,
  lat DECIMAL,
  lng DECIMAL,
  raio_metros INT DEFAULT 100,
  horario_entrada TIME,
  horario_saida TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('aluno','tutor','gestor')) DEFAULT 'aluno',
  nome TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Alunos
CREATE TABLE IF NOT EXISTS public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  escola_id UUID REFERENCES public.escolas(id),
  tutor_id UUID REFERENCES public.profiles(id),
  ra TEXT UNIQUE NOT NULL,
  turma TEXT NOT NULL,
  trabalha BOOLEAN DEFAULT false,
  tipo_trabalho TEXT,
  dias_trabalho TEXT[],
  trabalho_entrada TIME,
  trabalho_saida TIME,
  situacao TEXT CHECK (situacao IN ('normal', 'atencao', 'risco')) DEFAULT 'normal',
  faltas_total INT DEFAULT 0,
  atividades_pendentes INT DEFAULT 0,
  media DECIMAL DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Faltas
CREATE TABLE IF NOT EXISTS public.faltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  materia TEXT NOT NULL,
  data DATE NOT NULL,
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Atividades
CREATE TABLE IF NOT EXISTS public.atividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  materia TEXT NOT NULL,
  tipo TEXT NOT NULL,
  data DATE NOT NULL,
  status TEXT CHECK (status IN ('pendente', 'concluida')) DEFAULT 'pendente',
  conteudo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Presenças (Geolocalização)
CREATE TABLE IF NOT EXISTS public.presencas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  escola_id UUID REFERENCES public.escolas(id),
  data DATE NOT NULL,
  confirmada_em TIMESTAMP WITH TIME ZONE,
  lat_aluno DECIMAL,
  lng_aluno DECIMAL,
  dentro_do_raio BOOLEAN,
  status TEXT CHECK (status IN ('confirmada', 'ausente', 'justificada')) DEFAULT 'ausente',
  justificativa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Notas
CREATE TABLE IF NOT EXISTS public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID REFERENCES public.alunos(id) ON DELETE CASCADE,
  materia TEXT NOT NULL,
  b1 DECIMAL,
  b2 DECIMAL,
  b3 DECIMAL,
  b4 DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Tabela de Mensagens (Chat Tutor x Aluno)
CREATE TABLE IF NOT EXISTS public.mensagens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remetente_id UUID REFERENCES public.profiles(id),
  destinatario_id UUID REFERENCES public.profiles(id),
  texto TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- =======================================================
-- Configurações de Segurança (Row Level Security - RLS)
-- =======================================================

ALTER TABLE public.escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faltas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Abertas para Funcionamento Total do TCC
DROP POLICY IF EXISTS "Acesso total escolas" ON public.escolas;
CREATE POLICY "Acesso total escolas" ON public.escolas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total profiles" ON public.profiles;
CREATE POLICY "Acesso total profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total alunos" ON public.alunos;
CREATE POLICY "Acesso total alunos" ON public.alunos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total faltas" ON public.faltas;
CREATE POLICY "Acesso total faltas" ON public.faltas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total atividades" ON public.atividades;
CREATE POLICY "Acesso total atividades" ON public.atividades FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total presencas" ON public.presencas;
CREATE POLICY "Acesso total presencas" ON public.presencas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total notas" ON public.notas;
CREATE POLICY "Acesso total notas" ON public.notas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total mensagens" ON public.mensagens;
CREATE POLICY "Acesso total mensagens" ON public.mensagens FOR ALL USING (true) WITH CHECK (true);

-- =======================================================
-- Trigger para criar perfil automaticamente no cadastro
-- =======================================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'nome', 'Usuário'), COALESCE(new.raw_user_meta_data->>'role', 'aluno'))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =======================================================
-- Inserir Escola Padrão Real (Jardim Lucélia)
-- =======================================================
INSERT INTO public.escolas (nome, endereco, lat, lng, raio_metros, horario_entrada, horario_saida)
VALUES (
  'EE Professor Eurípedes Simões de Paula',
  'R. Maria Pape, 30 - Jardim Lucélia',
  -23.7613199,
  -46.6735803,
  100,
  '14:15',
  '21:15'
);