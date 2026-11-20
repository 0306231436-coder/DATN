import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
