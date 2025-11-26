'use server'

import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

// --- DATA FETCHING ---

export async function getUsers() {
  const result = await pool.query('SELECT * FROM users ORDER BY name ASC');
  return result.rows;
}

export async function getBooks() {
  const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
  return result.rows;
}

export async function getAllLoans() {
  // Uses the VIEW created in the database setup
  const result = await pool.query('SELECT * FROM dashboard_loans_view');
  return result.rows;
}

// --- ACTIONS (MUTATIONS) ---

// 1. Add User (Pure SQL)
export async function addUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;

  try {
    await pool.query(
      'INSERT INTO users (name, email, role) VALUES ($1, $2, $3)',
      [name, email, role]
    );
    revalidatePath('/');
    return { success: true, message: 'User added' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// 2. Add Book (Pure SQL)
export async function addBook(formData: FormData) {
  const title = formData.get('title') as string;
  const author = formData.get('author') as string;
  const total = parseInt(formData.get('total') as string);

  try {
    // Note: We set available_copies same as total initially
    await pool.query(
      'INSERT INTO books (title, author, total_copies, available_copies) VALUES ($1, $2, $3, $3)',
      [title, author, total]
    );
    revalidatePath('/');
    return { success: true, message: 'Book added' };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

// 3. Borrow Book (Uses STORED PROCEDURE)
export async function borrowBook(userId: number, bookId: number) {
  if(!userId) return { success: false, message: "Select a user first" };
  try {
    await pool.query('CALL borrow_book_procedure($1, $2)', [userId, bookId]);
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 4. Return Book (Uses TRIGGER automatically)
export async function returnBook(loanId: number) {
  try {
    await pool.query(
      `UPDATE loans SET return_date = CURRENT_DATE, status = 'returned' WHERE id = $1`, 
      [loanId]
    );
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}