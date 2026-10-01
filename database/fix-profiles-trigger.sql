-- CORREÇÃO: VINCULAR auth.users -> public.profiles
-- O schema.sql definia handle_new_user_registration() mas nunca criava o trigger,
-- então usuários cadastrados no Supabase Auth ficavam sem perfil e não conseguiam entrar.
-- Executar uma vez no SQL Editor do Supabase.

-- 1. Torna a função idempotente (não falha se o perfil já existir)
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
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Cria o trigger que faltava
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- 3. Cria perfis para os usuários que já foram cadastrados sem perfil
INSERT INTO public.profiles (id, name, email, role, status)
SELECT u.id,
       COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
       u.email,
       'student',
       'active'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.user_settings (user_id)
SELECT p.id
FROM public.profiles p
LEFT JOIN public.user_settings s ON s.user_id = p.id
WHERE s.user_id IS NULL;

-- 4. (Opcional) Confirma e-mails pendentes dos usuários já cadastrados.
-- A confirmação por e-mail está ATIVA no projeto; sem confirmar, o login retorna "Email not confirmed".
-- UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- 5. Conferência
SELECT u.email, u.email_confirmed_at IS NOT NULL AS email_confirmado, p.role, p.status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at;
