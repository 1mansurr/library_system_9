import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';

import { AuthProvider, useAuth } from './lib/auth';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './screens/Login';
import Register from './screens/Register';
import Catalog from './screens/Catalog';
import BookDetail from './screens/BookDetail';
import MyLoans from './screens/MyLoans';
import Profile from './screens/Profile';
import LibrarianDashboard from './screens/LibrarianDashboard';
import AddBook from './screens/AddBook';
import AddCopy from './screens/AddCopy';
import Overdue from './screens/Overdue';
import Members from './screens/Members';

function RootRedirect() {
  const { isAuthenticated, isLibrarian } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isLibrarian ? '/dashboard' : '/catalog'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* public */}
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* root redirect */}
            <Route path="/" element={<RootRedirect />} />

            {/* member */}
            <Route path="/catalog"   element={<ProtectedRoute role="member"><Catalog /></ProtectedRoute>} />
            <Route path="/books/:id" element={<ProtectedRoute role="member"><BookDetail /></ProtectedRoute>} />
            <Route path="/loans"     element={<ProtectedRoute role="member"><MyLoans /></ProtectedRoute>} />
            <Route path="/profile"   element={<ProtectedRoute role="member"><Profile /></ProtectedRoute>} />

            {/* librarian */}
            <Route path="/dashboard"                  element={<ProtectedRoute role="librarian"><LibrarianDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/books/new"        element={<ProtectedRoute role="librarian"><AddBook /></ProtectedRoute>} />
            <Route path="/dashboard/books/:id/copies" element={<ProtectedRoute role="librarian"><AddCopy /></ProtectedRoute>} />
            <Route path="/dashboard/overdue"          element={<ProtectedRoute role="librarian"><Overdue /></ProtectedRoute>} />
            <Route path="/dashboard/members"          element={<ProtectedRoute role="librarian"><Members /></ProtectedRoute>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
