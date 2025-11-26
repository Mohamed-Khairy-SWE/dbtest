import { getBooks, getUsers, getAllLoans } from './actions/actions';
import LibraryDashboard from './components/LibraryDashboard';

export default async function Home() {
  // Fetch fresh data from the database every time the page loads/revalidates
  const users = await getUsers();
  const books = await getBooks();
  const loans = await getAllLoans();

  return (
    <main className="min-h-screen bg-gray-100">
      <LibraryDashboard 
        users={users} 
        books={books} 
        loans={loans} 
      />
    </main>
  );
}