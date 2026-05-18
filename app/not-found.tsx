import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral text-primary p-4">
      <div className="max-w-md text-center space-y-6">
        <h1 className="text-9xl font-black text-white tracking-widest">404</h1>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-2">
          <h2 className="text-xl font-bold text-white">Page introuvable</h2>
          <p className="text-sm text-neutral-400">
            Désolé, la page que vous recherchez n&apos;existe pas ou a été
            déplacée.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-neutral bg-white rounded-xl hover:bg-neutral-200 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-neutral text-center"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
