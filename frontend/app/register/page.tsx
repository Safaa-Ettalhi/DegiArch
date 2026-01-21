'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/logo';
import { authApi } from '@/lib/auth';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register({
        ...formData,
        role: 'ARCHIVE_MANAGER',
      });
      router.push('/login');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-950 dark:via-blue-950/50 dark:to-indigo-950/30 px-4 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-400/10 rounded-full blur-3xl animate-glow"></div>
      </div>

      <div className="w-full max-w-[440px] relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center mb-8 animate-float">
            <Logo size="lg" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            DigiArch
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">
            Créer un compte Responsable d&apos;Archives
          </p>
        </div>

        {/* Register Card  */}
        <Card className="border border-white/20 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl">
          <CardHeader className="space-y-2 pb-7">
            <CardTitle className="text-2xl font-bold text-center text-slate-900 dark:text-slate-50">
              Inscription
            </CardTitle>
            <CardDescription className="text-center text-slate-500 dark:text-slate-400">
              Remplissez les informations pour créer votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/50 rounded-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2.5">
                  <label htmlFor="firstName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Prénom
                  </label>
                  <Input
                    id="firstName"
                    placeholder="Jean"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-2.5">
                  <label htmlFor="lastName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nom
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Dupont"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={loading}
                    className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </div>
              
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              
              <div className="space-y-2.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="h-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/50 dark:border-slate-700/50 focus:border-blue-500 focus:ring-blue-500/20"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Minimum 6 caractères
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Inscription...
                  </span>
                ) : (
                  'Créer mon compte'
                )}
              </Button>
              
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-2">
                Déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  Se connecter
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
