import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-6xl font-extrabold text-red-500 mb-4">403</h1>
        <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-neutral-400 mb-8 max-w-md mx-auto">
          You do not have the required permissions to access the LiveHub Backoffice.
          This portal is strictly for authorized Agencies and Staff.
        </p>
        <Link 
          href="/auth/login"
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
