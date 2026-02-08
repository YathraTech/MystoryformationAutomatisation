import type { Metadata } from 'next';
import Image from 'next/image';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = {
  title: 'Connexion Admin - MyStoryFormation',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 p-8">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/logo-mystory.png"
            alt="MyStoryFormation"
            width={160}
            height={48}
            className="mb-4"
          />
          <h1 className="text-xl font-bold text-slate-800">
            Espace Administration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Connectez-vous pour accéder au tableau de bord
          </p>
        </div>
        <LoginForm />
      </div>
      <p className="text-center text-xs text-slate-400 mt-4">
        MyStoryFormation &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
