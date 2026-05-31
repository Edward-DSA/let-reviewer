'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

// ── Categories ─────────────────────────────────────────────────────────────
export async function addCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const examTimerSeconds = parseInt(formData.get('examTimerSeconds') as string) || 0;
  if (name) { await prisma.category.create({ data: { name, description, examTimerSeconds } }); revalidatePath('/admin/categories'); }
}
export async function editCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const examTimerSeconds = parseInt(formData.get('examTimerSeconds') as string) || 0;
  if (id && name) { await prisma.category.update({ where: { id }, data: { name, description, examTimerSeconds } }); revalidatePath('/admin/categories'); }
}
export async function deleteCategory(formData: FormData) {
  const id = formData.get('id') as string;
  await prisma.category.delete({ where: { id } });
  revalidatePath('/admin/categories');
}

// ── Questions ──────────────────────────────────────────────────────────────
export async function addQuestion(formData: FormData) {
  const categoryId = formData.get('categoryId') as string;
  const text = formData.get('text') as string;
  const optA = formData.get('optA') as string;
  const optB = formData.get('optB') as string;
  const optC = formData.get('optC') as string;
  const optD = formData.get('optD') as string;
  const correctAnswer = formData.get('correctAnswer') as string;
  const explanation = formData.get('explanation') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const options = JSON.stringify([optA, optB, optC, optD]);
  if (text && categoryId && correctAnswer) {
    await prisma.question.create({ data: { categoryId, text, options, correctAnswer, explanation, imageUrl } });
    revalidatePath('/admin/questions');
  }
}
export async function editQuestion(formData: FormData) {
  const id = formData.get('id') as string;
  const categoryId = formData.get('categoryId') as string;
  const text = formData.get('text') as string;
  const optA = formData.get('optA') as string;
  const optB = formData.get('optB') as string;
  const optC = formData.get('optC') as string;
  const optD = formData.get('optD') as string;
  const correctAnswer = formData.get('correctAnswer') as string;
  const explanation = formData.get('explanation') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const options = JSON.stringify([optA, optB, optC, optD]);
  if (id && text && categoryId && correctAnswer) {
    await prisma.question.update({ where: { id }, data: { categoryId, text, options, correctAnswer, explanation, imageUrl } });
    revalidatePath('/admin/questions');
  }
}
export async function deleteQuestion(formData: FormData) {
  const id = formData.get('id') as string;
  await prisma.question.delete({ where: { id } });
  revalidatePath('/admin/questions');
}
export async function bulkAddQuestions(questions: any[]) {
  for (const q of questions) await prisma.question.create({ data: q });
  revalidatePath('/admin/questions');
}

// ── Users ──────────────────────────────────────────────────────────────────
export async function addUser(formData: FormData) {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;
  const role     = (formData.get('role') as string) || 'TEACHER';
  if (!username || !password) return;
  const hashed = await bcrypt.hash(password, 10);
  try {
    await prisma.user.create({ data: { username, password: hashed, role } });
  } catch { /* duplicate username */ }
  revalidatePath('/admin/users');
}
export async function deleteUser(formData: FormData) {
  const id = formData.get('id') as string;
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}
export async function resetPassword(formData: FormData) {
  const id       = formData.get('id') as string;
  const password = formData.get('password') as string;
  if (!id || !password) return;
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  revalidatePath('/admin/users');
}

// ── Settings ───────────────────────────────────────────────────────────────
export async function updateSettings(formData: FormData) {
  const appName = formData.get('appName') as string;
  const logoUrl = formData.get('logoUrl') as string;
  const examTimerStr = formData.get('examTimerSeconds') as string;
  const examTimerSeconds = parseInt(examTimerStr, 10) || 1800;
  
  if (appName) {
    await prisma.settings.upsert({
      where: { id: 'default' },
      update: { appName, logoUrl, examTimerSeconds },
      create: { id: 'default', appName, logoUrl, examTimerSeconds }
    });
    revalidatePath('/', 'layout');
  }
}

// ── Results ────────────────────────────────────────────────────────────────
export async function deleteResultAction(id: string) {
  await prisma.result.delete({ where: { id } });
  revalidatePath('/admin/results');
}

export async function toggleArchiveResultAction(id: string, isArchived: boolean) {
  await prisma.result.update({ where: { id }, data: { isArchived } });
  revalidatePath('/admin/results');
}
