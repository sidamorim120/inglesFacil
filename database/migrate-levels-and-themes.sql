-- MIGRAÇÃO: NÍVEIS DE ESTUDO E TEMAS DO CONNECTIVITY 1
-- Rodar UMA vez no SQL Editor do Supabase, junto com o deploy do código novo. Depois rodar o seed.sql.
-- Níveis: activities.difficulty (beginner | intermediate) vira activities.level; nova coluna profiles.min_level.
-- Temas: airport/hotel viram travel e restaurant vira food, em atividades, tentativas e revisões.

BEGIN;

CREATE TYPE study_level AS ENUM ('basic_1', 'basic_2', 'basic_3', 'intermediate', 'advanced');

-- Atividades: beginner -> basic_1, intermediate -> intermediate
ALTER TABLE public.activities ADD COLUMN level study_level NOT NULL DEFAULT 'basic_1';
UPDATE public.activities
SET level = CASE difficulty WHEN 'intermediate' THEN 'intermediate'::study_level ELSE 'basic_1'::study_level END;
ALTER TABLE public.activities DROP COLUMN difficulty;
DROP TYPE difficulty_level;

-- Perfis: nível liberado pelo admin (o aluno avança sozinho a partir dele)
ALTER TABLE public.profiles ADD COLUMN min_level study_level NOT NULL DEFAULT 'basic_1';

-- O aluno continua editando o próprio nome, mas não o papel nem o nível
DROP POLICY IF EXISTS "Usuários atualizam dados próprios sem mudar role" ON public.profiles;
CREATE POLICY "Usuários atualizam dados próprios sem mudar role"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Impede auto-promoção
  AND min_level = (SELECT min_level FROM public.profiles WHERE id = auth.uid()) -- Só o admin muda o nível
);

-- Temas: um por unidade do Connectivity 1
CREATE TYPE activity_theme AS ENUM (
  'introductions', 'events', 'feelings', 'people', 'food',
  'technology', 'travel', 'shopping', 'health', 'plans'
);
ALTER TABLE public.activities ALTER COLUMN category TYPE activity_theme
  USING (CASE category::text WHEN 'restaurant' THEN 'food' ELSE 'travel' END)::activity_theme;
ALTER TABLE public.attempts ALTER COLUMN category TYPE activity_theme
  USING (CASE category::text WHEN 'restaurant' THEN 'food' ELSE 'travel' END)::activity_theme;
ALTER TABLE public.review_queue ALTER COLUMN category TYPE activity_theme
  USING (CASE category::text WHEN 'restaurant' THEN 'food' ELSE 'travel' END)::activity_theme;
DROP TYPE activity_category;
ALTER TYPE activity_theme RENAME TO activity_category;

COMMIT;
