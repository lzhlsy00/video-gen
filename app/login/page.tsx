import { Suspense } from 'react';
import { Pacifico } from 'next/font/google';
import Link from 'next/link';
import LoginForm from './LoginForm';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

function LoginFormLoading() {
  return (
    <div className="p-8">
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6 animate-pulse">
        <div className="flex-1 h-9 bg-gray-300 rounded-md"></div>
        <div className="flex-1 h-9 bg-gray-300 rounded-md ml-1"></div>
      </div>
      <div className="space-y-4">
        <div className="h-20 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-20 bg-gray-200 rounded-md animate-pulse"></div>
        <div className="h-12 bg-gray-300 rounded-md animate-pulse"></div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#FFF5F2] to-[#FFE5D9] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 text-center">
          <Link href="/" className={`text-3xl text-white ${pacifico.className}`}>
            ArisVideo
          </Link>
          <p className="text-white/90 mt-2">
            Welcome to ArisVideo
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <Suspense fallback={<LoginFormLoading />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}