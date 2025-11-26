'use client'

import { useState, useEffect } from 'react';
import { borrowBook, returnBook, addUser, addBook } from '../actions/actions';

// Define types for our data
type User = { id: number; name: string; role: string; email: string };
type Book = { id: number; title: string; author: string; available_copies: number; total_copies: number };
type Loan = { loan_id: number; student_name: string; book_title: string; due_date: string; status: string; potential_fine: string };

interface DashboardProps {
  users: User[];
  books: Book[];
  loans: Loan[];
}

export default function LibraryDashboard({ users, books, loans }: DashboardProps) {
  const [currentUserId, setCurrentUserId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'borrow' | 'admin'>('borrow');
  
  // 1. Load the saved user from localStorage on initial mount
  useEffect(() => {
    const savedUser = localStorage.getItem('library_current_user');
    if (savedUser) {
      setCurrentUserId(Number(savedUser));
    }
  }, []);

  // 2. Handle User Selection & Persistence
  const handleUserChange = (userId: string) => {
    setCurrentUserId(Number(userId));
    if (userId) {
      localStorage.setItem('library_current_user', userId);
    } else {
      localStorage.removeItem('library_current_user');
    }
  };

  // Helper to handle actions and show alerts
  async function handleBorrow(bookId: number) {
    if (!currentUserId) {
      alert("Please select a user at the top first!");
      return;
    }
    const res = await borrowBook(Number(currentUserId), bookId);
    if (!res.success) alert(res.message);
  }

  // Get the current user object
  const currentUser = users.find(u => u.id === Number(currentUserId));

  // 3. Filter Loans: Show ONLY the current user's loans if a user is selected
  // If no user is selected (Admin view), show all loans.
  const displayedLoans = currentUserId 
    ? loans.filter(loan => loan.student_name === currentUser?.name)
    : loans;

  return (
    <div className="max-w-6xl mx-auto bg-white min-h-screen shadow-xl flex flex-col">
      
      {/* --- TOP BAR: USER SWITCHER --- */}
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">🏫 Smart Library</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">Acting as:</span>
          <select 
            value={currentUserId} 
            onChange={(e) => handleUserChange(e.target.value)}
            className="text-black px-3 py-1 rounded border-none outline-none"
          >
            <option value="">-- Select User (Admin View) --</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="flex border-b">
        <button 
          onClick={() => setActiveTab('borrow')}
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'borrow' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          📚 Borrow & Return
        </button>
        <button 
          onClick={() => setActiveTab('admin')}
          className={`flex-1 py-4 text-center font-semibold ${activeTab === 'admin' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          ⚙️ Admin Panel
        </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="p-6 bg-gray-50 flex-grow">
        
        {/* TAB 1: BORROWING */}
        {activeTab === 'borrow' && (
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Column 1: Available Books */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-gray-700 mb-4">Available Books</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {books.map((book) => (
                  <div key={book.id} className="bg-white p-4 rounded-lg shadow border border-gray-100 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">{book.title}</h3>
                      <p className="text-gray-500 text-sm">{book.author}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${book.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          Stock: {book.available_copies} / {book.total_copies}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleBorrow(book.id)}
                      disabled={book.available_copies === 0}
                      className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {book.available_copies === 0 ? 'Out of Stock' : 'Borrow Book'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Active Loans View (FILTERED) */}
            <div className="bg-white p-4 rounded-lg shadow h-fit">
              <h2 className="text-xl font-bold text-gray-700 mb-4">
                {currentUserId ? `Loans for ${currentUser?.name}` : 'All Active Loans'}
              </h2>
              
              {displayedLoans.length === 0 ? (
                 <p className="text-gray-400 italic text-center py-4">
                   {currentUserId ? 'No active loans for this user.' : 'No active loans found.'}
                 </p>
              ) : (
                <div className="space-y-3">
                  {displayedLoans.map((loan) => (
                    <div key={loan.loan_id} className={`p-3 rounded border-l-4 ${Number(loan.potential_fine) > 0 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-gray-50'}`}>
                      <div className="font-semibold text-gray-800">{loan.book_title}</div>
                      
                      {/* Only show user name if we are viewing ALL loans */}
                      {!currentUserId && (
                        <div className="text-sm text-gray-600">User: {loan.student_name}</div>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-1">Due: {new Date(loan.due_date).toLocaleDateString()}</div>
                      
                      {Number(loan.potential_fine) > 0 && (
                        <div className="mt-1 text-xs font-bold text-red-600">
                          OVERDUE FINE: ${loan.potential_fine}
                        </div>
                      )}

                      <button 
                        onClick={async () => {
                          await returnBook(loan.loan_id);
                        }}
                        className="mt-2 text-xs bg-gray-800 text-white px-3 py-1 rounded hover:bg-black w-full"
                      >
                        Return Book
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ADMIN PANEL */}
        {activeTab === 'admin' && (
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Form 1: Add User */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-bold border-b pb-2 mb-4">Add New User</h3>
              <form action={async (formData) => {
                await addUser(formData);
                (document.getElementById('user-form') as HTMLFormElement).reset();
              }} id="user-form" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input name="name" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input name="email" type="email" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select name="role" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Create User</button>
              </form>
            </div>

            {/* Form 2: Add Book */}
            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-bold border-b pb-2 mb-4">Add New Book</h3>
              <form action={async (formData) => {
                await addBook(formData);
                (document.getElementById('book-form') as HTMLFormElement).reset();
              }} id="book-form" className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Book Title</label>
                  <input name="title" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <input name="author" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Copies</label>
                  <input name="total" type="number" min="1" defaultValue="1" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none" />
                </div>
                <button className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Add Book to Library</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}