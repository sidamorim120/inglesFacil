// Temas das Atividades - Inglês Fácil
// Um tema por unidade do Connectivity 1 (docs/PDF - curso), na ordem do livro.
import { ActivityCategory } from '../types';

export interface CategoryInfo {
  id: ActivityCategory;
  label: string;
  emoji: string;
  description: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'introductions', label: 'Apresentações', emoji: '👋', description: 'Cumprimentar, se apresentar e falar da profissão.' },
  { id: 'events', label: 'Eventos e Lugares', emoji: '🎟️', description: 'Convites, horários, endereços e direções.' },
  { id: 'feelings', label: 'Habilidades e Sentimentos', emoji: '💬', description: 'O que você sabe fazer, como se sente e conselhos.' },
  { id: 'people', label: 'Pessoas e Família', emoji: '👨‍👩‍👧', description: 'Família, rotina e comparar pessoas.' },
  { id: 'food', label: 'Comida e Restaurantes', emoji: '🍽️', description: 'Pedir no restaurante, pratos e quantidades.' },
  { id: 'technology', label: 'Tecnologia', emoji: '📱', description: 'Aparelhos, celular e coisas que não funcionam.' },
  { id: 'travel', label: 'Viagens', emoji: '✈️', description: 'Aeroporto, hotel e como foi a viagem.' },
  { id: 'shopping', label: 'Compras', emoji: '🛍️', description: 'Roupas, tamanhos, preços e lojas.' },
  { id: 'health', label: 'Saúde e Exercícios', emoji: '🏃', description: 'Esportes, academia, corpo e machucados.' },
  { id: 'plans', label: 'Planos e Objetivos', emoji: '🎯', description: 'Desejos, planos e o trabalho dos sonhos.' },
];

// Temas antigos (antes de 05/10) ainda gravados em dados do modo demonstração
const LEGACY: Record<string, ActivityCategory> = {
  airport: 'travel',
  hotel: 'travel',
  restaurant: 'food',
};

export const categoryInfo = (category: string): CategoryInfo =>
  CATEGORIES.find((c) => c.id === (LEGACY[category] ?? category)) ?? CATEGORIES[0];
