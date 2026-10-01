-- PROCEDIMENTO SEGURO PARA CRIAÇÃO DO PRIMEIRO ADMINISTRADOR
-- Não inclui nenhuma senha em texto puro no código ou repositório.

-- =============================================================================
-- INSTRUÇÃO DE SEGURANÇA:
-- 1. O administrador deve primeiro criar sua conta normalmente através da tela de
--    cadastro da aplicação ou via painel do Supabase / CLI seguro com sua própria senha forte.
-- 2. Em seguida, o operador de infraestrutura/banco executa o comando abaixo
--    substituindo o parâmetro 'admin@seu-dominio.com.br' pelo e-mail verificado.
-- =============================================================================

DO $$
DECLARE
  target_email TEXT := 'admin@seu-dominio.com.br'; -- Substitua pelo e-mail do primeiro admin
  target_user_id UUID;
BEGIN
  -- Localiza o usuário cadastrado pelo e-mail
  SELECT id INTO target_user_id
  FROM public.profiles
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'Usuário com o e-mail % não foi encontrado. Realize o cadastro na aplicação primeiro.', target_email;
  ELSE
    -- Promove para o papel de administrador com status ativo
    UPDATE public.profiles
    SET role = 'admin', status = 'active', updated_at = now()
    WHERE id = target_user_id;

    RAISE NOTICE 'Sucesso: Usuário % promovido a Administrador.', target_email;
  END IF;
END $$;
