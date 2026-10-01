-- SEED DE DADOS INICIAIS: 12 ATIVIDADES PEDAGÓGICAS (PostgreSQL / Supabase)
-- Inglês Fácil: Aeroporto, Hotel e Restaurante

-- 1. LIMPEZA SEGURA (Opcional, comente se quiser manter registros existentes)
-- DELETE FROM public.questions;
-- DELETE FROM public.activities;

DO $$
DECLARE
  v_act_air1 UUID := 'a1111111-1111-4111-8111-111111111101';
  v_act_air2 UUID := 'a1111111-1111-4111-8111-111111111102';
  v_act_air3 UUID := 'a1111111-1111-4111-8111-111111111103';
  v_act_air4 UUID := 'a1111111-1111-4111-8111-111111111104';

  v_act_hot5 UUID := 'b2222222-2222-4222-8222-222222222205';
  v_act_hot6 UUID := 'b2222222-2222-4222-8222-222222222206';
  v_act_hot7 UUID := 'b2222222-2222-4222-8222-222222222207';
  v_act_hot8 UUID := 'b2222222-2222-4222-8222-222222222208';

  v_act_res9  UUID := 'c3333333-3333-4333-8333-333333333309';
  v_act_res10 UUID := 'c3333333-3333-4333-8333-333333333310';
  v_act_res11 UUID := 'c3333333-3333-4333-8333-333333333311';
  v_act_res12 UUID := 'c3333333-3333-4333-8333-333333333312';
BEGIN

  -- ATIVIDADE 1: Aeroporto 1
  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_air1, 1, 'Chegando ao Aeroporto: Escuta e Frases Chave', 'Aprenda a reconhecer instruções básicas sonoras na chegada ao aeroporto internacional.', 'airport', 'audio', 'beginner', 5, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, audio_phrase_en, expected_answer, accepted_variations, options, correct_option_id, explanation_pt, sort_order)
  VALUES
  (v_act_air1, 'listening_choice', 'Ouça o áudio e selecione o significado correto da frase anunciada:', 'Please have your passport and boarding pass ready.', 'Por favor, tenha seu passaporte e cartão de embarque em mãos.', ARRAY['Por favor tenha seu passaporte e cartao de embarque em maos'], '[{"id": "opt-1", "text": "Por favor, tenha seu passaporte e cartão de embarque em mãos."}, {"id": "opt-2", "text": "Por favor, dirija-se à esteira de bagagens número cinco."}, {"id": "opt-3", "text": "Seu voo está atrasado em trinta minutos."}, {"id": "opt-4", "text": "Apresente sua carteira de motorista na entrada."}]'::jsonb, 'opt-1', '"Boarding pass" é o cartão de embarque. "Ready" significa pronto ou em mãos para apresentar.', 1),
  (v_act_air1, 'dictation', 'Ouça atentamente a frase e digite o que você escutou em inglês:', 'Where is terminal two?', 'Where is terminal two?', ARRAY['Where is terminal 2?', 'Where is terminal two', 'Where is terminal 2'], NULL, NULL, 'A pergunta "Where is...?" significa "Onde fica...?" ou "Onde é...?". Muito usada em viagens.', 2);

  -- ATIVIDADE 2: Aeroporto 2
  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_air2, 1, 'Mostrando seu Passaporte e Cartão de Embarque', 'Pratique a escrita e organização de frases para interagir no controle de segurança e imigração.', 'airport', 'writing', 'beginner', 6, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, expected_answer, accepted_variations, scrambled_words, explanation_pt, sort_order)
  VALUES
  (v_act_air2, 'fill_in_the_blanks', 'Complete a frase com a palavra correta para dizer "Aqui está meu passaporte":\n"Here is my _______."', 'passport', ARRAY['passport.'], '{}', '"Here is my passport" é a forma mais educada e direta de entregar o documento ao oficial.', 1),
  (v_act_air2, 'word_reorder', 'Organize as palavras abaixo para formar a frase em inglês:', 'Here is your boarding pass', ARRAY['Here is your boarding pass.'], ARRAY['is', 'your', 'Here', 'boarding', 'pass'], 'Estrutura: "Here is" (Aqui está) + "your" (seu/sua) + objeto.', 2);

  -- ATIVIDADE 3: Aeroporto 3
  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_air3, 1, 'Encontrando o Portão de Embarque (Gate)', 'Compreensão de áudio sobre informações de voo e numeração de portões.', 'airport', 'audio', 'beginner', 5, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, audio_phrase_en, expected_answer, accepted_variations, options, correct_option_id, explanation_pt, sort_order)
  VALUES
  (v_act_air3, 'listening_choice', 'Ouça o anúncio e indique qual é o portão de embarque correto:', 'Flight 304 is boarding at gate 15.', 'O voo 304 está embarcando no portão 15.', '{}', '[{"id": "opt-1", "text": "O voo 304 está embarcando no portão 15."}, {"id": "opt-2", "text": "O voo 304 foi cancelado no portão 50."}, {"id": "opt-3", "text": "O voo 403 está pousando na pista 15."}, {"id": "opt-4", "text": "O voo 304 mudou para o portão 5."}]'::jsonb, 'opt-1', 'Atenção aos números em inglês: "fifteen" (15) tem o som no final diferente de "fifty" (50).', 1),
  (v_act_air3, 'dictation', 'Ouça o áudio e digite o que você ouviu:', 'Is this the flight to London?', 'Is this the flight to London?', ARRAY['Is this the flight to London', 'is this the flight to london'], NULL, NULL, 'Em perguntas com o verbo To Be, o verbo vem antes: "Is this...?" (Isto/Este é...?).', 2);

  -- ATIVIDADE 4: Aeroporto 4
  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_air4, 1, 'Alfândega e Bagagem: Diálogo Prático', 'Responda a perguntas comuns sobre o motivo da viagem e quantidade de malas.', 'airport', 'mixed', 'beginner', 7, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, audio_phrase_en, expected_answer, accepted_variations, explanation_pt, sort_order)
  VALUES
  (v_act_air4, 'oral_practice', 'Ouça a frase em inglês e grave sua repetição em voz alta para treinar sua pronúncia:', 'I am here on vacation.', 'I am here on vacation.', ARRAY['I''m here on vacation.', 'I am here on vacation'], '"On vacation" significa "de férias". Nos EUA usa-se vacation; no Reino Unido é comum holiday.', 1),
  (v_act_air4, 'situational_response', 'O oficial da alfândega pergunta: "How many bags do you have?" (Quantas malas você tem?). Responda que você tem uma mala:', NULL, 'I have one bag, please.', ARRAY['I have one bag', 'I have one suitcase', 'One bag', 'Just one bag', 'Only one bag'], '"Bag" ou "suitcase" significam mala. Para uma mala: "one bag" ou "just one bag".', 2);

  -- ATIVIDADES 5 a 8: Hotel
  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_hot5, 1, 'Check-in no Hotel: Escuta Atenta', 'Entenda as instruções da recepção ao chegar ao seu hotel.', 'hotel', 'audio', 'beginner', 5, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, audio_phrase_en, expected_answer, accepted_variations, options, correct_option_id, explanation_pt, sort_order)
  VALUES
  (v_act_hot5, 'listening_choice', 'Ouça a recepcionista e escolha o significado do que ela disse:', 'Welcome! Do you have a reservation?', 'Bem-vindo! Você tem uma reserva?', '{}', '[{"id": "opt-1", "text": "Bem-vindo! Você tem uma reserva?"}, {"id": "opt-2", "text": "Boa tarde! O café da manhã é gratuito?"}, {"id": "opt-3", "text": "Olá! Seu quarto ainda não está limpo."}, {"id": "opt-4", "text": "Por favor, assine este documento de saída."}]'::jsonb, 'opt-1', '"Reservation" é reserva. "Do you have...?" é a pergunta clássica: "Você tem...?".', 1),
  (v_act_hot5, 'dictation', 'Digite em inglês a frase dita pelo recepcionista:', 'Your room is on the third floor.', 'Your room is on the third floor.', ARRAY['Your room is on the 3rd floor.', 'Your room is on the third floor'], NULL, NULL, '"Third floor" é o terceiro andar. Em inglês usa-se a preposição "on" para andares de edifícios.', 2);

  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_hot6, 1, 'Pedindo a Senha do Wi-Fi e Toalhas Extras', 'Escreva solicitações comuns que você precisará fazer durante sua estadia.', 'hotel', 'writing', 'beginner', 6, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, expected_answer, accepted_variations, explanation_pt, sort_order)
  VALUES
  (v_act_hot6, 'translation', 'Traduza para o inglês de forma educada: "Qual é a senha do Wi-Fi?"', 'What is the Wi-Fi password?', ARRAY['What''s the Wi-Fi password?', 'What is the wifi password?', 'What''s the wifi password?'], '"Password" é a senha. "Wi-Fi" pronuncia-se "uai-fai" em inglês.', 1),
  (v_act_hot6, 'fill_in_the_blanks', 'Complete a frase para pedir toalhas adicionais:\n"Could I have extra _______, please?" (toalhas)', 'towels', ARRAY['towels.'], '"Towel" é toalha. Plural "towels". "Could I have...?" é muito simpático e educado.', 2);

  -- ATIVIDADES 9 a 12: Restaurante
  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_res9, 1, 'Pedindo uma Mesa para Dois', 'Treine a audição para entender o recepcionista (host) do restaurante.', 'restaurant', 'audio', 'beginner', 5, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, audio_phrase_en, expected_answer, accepted_variations, options, correct_option_id, explanation_pt, sort_order)
  VALUES
  (v_act_res9, 'listening_choice', 'Ouça o recepcionista do restaurante e marque a tradução correta:', 'Table for two? Right this way, please.', 'Mesa para dois? Por aqui, por favor.', '{}', '[{"id": "opt-1", "text": "Mesa para dois? Por aqui, por favor."}, {"id": "opt-2", "text": "Temos apenas mesas para quatro pessoas."}, {"id": "opt-3", "text": "O restaurante está lotado no momento."}, {"id": "opt-4", "text": "Deseja ver o cardápio de bebidas?"}]'::jsonb, 'opt-1', '"Right this way" é a expressão usada para conduzir você ("por aqui" ou "siga-me").', 1),
  (v_act_res9, 'dictation', 'Ouça a frase em inglês e digite o que escutou:', 'Can we have a menu, please?', 'Can we have a menu, please?', ARRAY['Can we have a menu please?', 'Can we have the menu, please?'], NULL, NULL, '"Menu" pronuncia-se "mén-iu". "Can we have...?" é "Pode nos trazer...?".', 2);

  INSERT INTO public.activities (id, version, title, description, category, modality, difficulty, estimated_minutes, is_published)
  VALUES (v_act_res10, 1, 'Pedindo um Café e Água sem Gás', 'Aprenda a fazer pedidos básicos e pedir água da maneira que você deseja.', 'restaurant', 'writing', 'beginner', 5, true)
  ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true;

  INSERT INTO public.questions (activity_id, type, prompt_pt, expected_answer, accepted_variations, explanation_pt, sort_order)
  VALUES
  (v_act_res10, 'situational_response', 'O garçom chega e diz "What can I get for you?". Peça um café com leite, por favor:', 'A coffee with milk, please.', ARRAY['Coffee with milk, please', 'Coffee with milk', 'I would like a coffee with milk, please', 'I''d like a coffee with milk, please'], '"Coffee with milk" é café com leite. "I would like" ou o item seguido de "please" é muito educado.', 1),
  (v_act_res10, 'fill_in_the_blanks', 'Complete com a palavra que significa água sem gás:\n"Still _______, please."', 'water', ARRAY['water.'], '"Still water" é água sem gás; "Sparkling water" é água com gás.', 2);

  RAISE NOTICE 'Seed das 12 atividades pedagógicas concluído com sucesso!';
END $$;
