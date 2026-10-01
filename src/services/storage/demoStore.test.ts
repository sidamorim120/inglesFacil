import { describe, it, expect, beforeEach } from 'vitest';
import { DemoStore } from './demoStore';
import { User, Attempt } from '../../types';

describe('DemoStore - Autorização, Segurança e Repetição Espaçada', () => {
  beforeEach(() => {
    // Configura um mock simples de localStorage para testes
    const storage: Record<string, string> = {};
    global.localStorage = {
      getItem: (key: string) => storage[key] || null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      },
      removeItem: (key: string) => {
        delete storage[key];
      },
      clear: () => {
        for (const k in storage) delete storage[k];
      },
      length: 0,
      key: () => null,
    };
    DemoStore.init();
  });

  it('deve atribuir obrigatoriamente o papel "student" em qualquer cadastro público', () => {
    const res = DemoStore.register('Novo Aluno Teste', 'novo.aluno@teste.com');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('student');
  });

  it('deve filtrar atividades não publicadas para usuários com papel aluno', () => {
    const studentActs = DemoStore.getActivities('student');
    const allPublished = studentActs.every((a) => a.isPublished);
    expect(allPublished).toBe(true);
  });

  it('deve aplicar isolamento estrito: aluno não pode consultar tentativas de outro aluno', () => {
    const requesterStudent: User = {
      id: 'aluno-x',
      name: 'Aluno X',
      email: 'x@test.com',
      role: 'student',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Aluno X tentando consultar dados do Carlos
    const attempts = DemoStore.getStudentAttempts('user-carlos-student', requesterStudent);
    expect(attempts).toHaveLength(0);
  });

  it('deve impedir a desativação do último administrador ativo do sistema', () => {
    // Tenta desativar o admin do seed (user-helena-admin)
    const result = DemoStore.toggleUserStatus('user-helena-admin', 'admin');
    expect(result.success).toBe(false);
    expect(result.error).toContain('último administrador ativo');
  });

  it('deve avançar intervalo de repetição espaçada em caso de acerto (1 -> 3 -> 7 dias)', () => {
    const res1 = DemoStore.processReviewAnswer('rev-01', true);
    expect(res1.success).toBe(true);
    expect(res1.intervalDays).toBe(3);

    const res2 = DemoStore.processReviewAnswer('rev-01', true);
    expect(res2.success).toBe(true);
    expect(res2.intervalDays).toBe(7);
  });

  it('deve resetar o intervalo para 1 dia se o aluno errar a frase', () => {
    // Primeiro avança para 3 dias
    DemoStore.processReviewAnswer('rev-01', true);
    // Em seguida erra
    const resError = DemoStore.processReviewAnswer('rev-01', false);
    expect(resError.success).toBe(true);
    expect(resError.intervalDays).toBe(1);
  });
});
