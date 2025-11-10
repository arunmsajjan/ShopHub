import { useAuth } from '@getmocha/users-service/react';
import { User, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, redirectToLogin, isPending } = useAuth();

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md w-full mx-4">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-8">You need to sign in to access this feature.</p>
            
            <div className="space-y-4">
              <button
                onClick={redirectToLogin}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Sign In with Google
              </button>
              
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
