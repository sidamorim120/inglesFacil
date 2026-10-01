-- ESQUEMA DE BANCO DE DADOS E POLÍTICAS RLS (PostgreSQL / Supabase)
-- Inglês Fácil — Prática Diária para Brasileiros

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS CUSTOMIZADOS (ENUMS)
CREATE TYPE user_role AS ENUM ('student', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE activity_category AS ENUM ('airport', 'hotel', 'restaurant');
CREATE TYPE activity_modality AS ENUM ('audio', 'writing', 'mixed');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate');
CREATE TYPE exercise_type AS ENUM (
  'listening_choice',
  'dictation',
  'oral_practice',
  'fill_in_the_blanks',
  'word_reorder',
  'translation',
  'situational_response'
);

-- 3. TABELA DE PERFIS DE USUÁRIO (Vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'student',
  status user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. CONFIGURAÇÕES E ROTINA DE LEMBRETES DO USUÁRIO
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  daily_goal_minutes INTEGER NOT NULL DEFAULT 10 CHECK (daily_goal_minutes >= 5 AND daily_goal_minutes <= 60),
  audio_speed NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (audio_speed >= 0.5 AND audio_speed <= 1.5),
  auto_play_audio BOOLEAN NOT NULL DEFAULT true,
  reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  reminder_time TIME NOT NULL DEFAULT '19:30:00',
  reminder_days INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- 0=Dom ... 6=Sab
  reminder_timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. ATIVIDADES PEDAGÓGICAS (Com suporte a versão imutável)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category activity_category NOT NULL,
  modality activity_modality NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'beginner',
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. QUESTÕES E EXERCÍCIOS
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  type exercise_type NOT NULL,
  prompt_pt TEXT NOT NULL,
  prompt_en TEXT,
  audio_phrase_en TEXT,
  options JSONB, -- Formato: [{"id": "opt-1", "text": "..."}]
  correct_option_id TEXT,
  expected_answer TEXT NOT NULL,
  accepted_variations TEXT[] NOT NULL DEFAULT '{}',
  scrambled_words TEXT[] DEFAULT '{}',
  explanation_pt TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. TENTATIVAS DAS ATIVIDADES (Histórico Imutável)
CREATE TABLE IF NOT EXISTS public.attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id),
  activity_version INTEGER NOT NULL, -- Preserva versão da atividade realizada
  activity_title TEXT NOT NULL,
  category activity_category NOT NULL,
  modality activity_modality NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. RESPOSTAS INDIVIDUAIS DO ALUNO EM CADA QUESTÃO
CREATE TABLE IF NOT EXISTS public.question_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  expected_answer TEXT NOT NULL,
  explanation_pt TEXT NOT NULL,
  recorded_audio_url TEXT, -- Opcional; por padrão mantido em memória local
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. FILA DE REPETIÇÃO ESPAÇADA (1, 3 e 7 dias)
CREATE TABLE IF NOT EXISTS public.review_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  activity_id UUID NOT NULL REFERENCES public.activities(id),
  phrase_en TEXT NOT NULL,
  translation_pt TEXT NOT NULL,
  category activity_category NOT NULL,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_date TIMESTAMPTZ NOT NULL,
  last_attempt_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  total_mistakes INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, question_id)
);

-- =========================================================================
-- REGRAS DE INTEGRIDADE E TRIGGERS DE SEGURANÇA
-- =========================================================================

-- Trigger para impedir a desativação ou remoção do último administrador ativo
CREATE OR REPLACE FUNCTION public.prevent_last_active_admin_removal()
RETURNS TRIGGER AS $$
DECLARE
  active_admin_count INTEGER;
BEGIN
  -- Se o registro atual for de um admin ativo
  IF OLD.role = 'admin' AND OLD.status = 'active' THEN
    -- Verifica se está sendo excluído ou se seu status/role está sendo rebaixado
    IF (TG_OP = 'DELETE') OR (NEW.status <> 'active') OR (NEW.role <> 'admin') THEN
      SELECT COUNT(*) INTO active_admin_count
      FROM public.profiles
      WHERE role = 'admin' AND status = 'active' AND id <> OLD.id;

      IF active_admin_count < 1 THEN
        RAISE EXCEPTION 'Operação proibida: não é permitido remover ou desativar o último administrador ativo do sistema.';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_removal ON public.profiles;
CREATE TRIGGER trg_prevent_last_admin_removal
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_last_active_admin_removal();

-- Trigger para vincular novo usuário do Supabase Auth garantindo SEMPRE perfil aluno
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Aluno Iniciante'),
    NEW.email,
    'student', -- NUNCA permitir escolher perfil admin no cadastro público!
    'active'
  );

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS) - NUNCA CONFIAR NO CLIENTE
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para checar se o usuário autenticado é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- POLÍTICAS: PROFILES
CREATE POLICY "Usuários podem ver seu próprio perfil ou admins veem todos"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Usuários atualizam dados próprios sem mudar role"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Impede auto-promoção
);

CREATE POLICY "Apenas administradores gerenciam outros perfis"
ON public.profiles FOR ALL
USING (public.is_admin());

-- POLÍTICAS: ATIVIDADES
CREATE POLICY "Alunos visualizam apenas atividades publicadas"
ON public.activities FOR SELECT
USING (is_published = true OR public.is_admin());

CREATE POLICY "Apenas administradores podem criar ou alterar atividades"
ON public.activities FOR ALL
USING (public.is_admin());

-- POLÍTICAS: QUESTÕES
CREATE POLICY "Questões visíveis se a atividade for acessível"
ON public.questions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.activities a
    WHERE a.id = questions.activity_id AND (a.is_published = true OR public.is_admin())
  )
);

CREATE POLICY "Apenas administradores gerenciam questões"
ON public.questions FOR ALL
USING (public.is_admin());

-- POLÍTICAS: TENTATIVAS E SUBMISSÕES (ISOLAMENTO ESTRITO ENTRE ALUNOS)
CREATE POLICY "Alunos consultam apenas suas próprias tentativas"
ON public.attempts FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Alunos inserem apenas tentativas para si próprios"
ON public.attempts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Alunos visualizam apenas suas próprias submissões"
ON public.question_submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.attempts att
    WHERE att.id = question_submissions.attempt_id AND (att.user_id = auth.uid() OR public.is_admin())
  )
);

CREATE POLICY "Alunos inserem submissões em suas próprias tentativas"
ON public.question_submissions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.attempts att
    WHERE att.id = question_submissions.attempt_id AND att.user_id = auth.uid()
  )
);

-- POLÍTICAS: FILA DE REVISÃO ESPAÇADA
CREATE POLICY "Alunos gerenciam apenas sua própria fila de revisão"
ON public.review_queue FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLÍTICAS: CONFIGURAÇÕES DO USUÁRIO
CREATE POLICY "Alunos visualizam e editam apenas suas próprias configurações"
ON public.user_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
