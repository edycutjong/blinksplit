import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] py-20 px-4 text-center">
      <div className="relative mb-8">
        <div className="absolute -inset-4 rounded-full bg-linear-to-r from-primary to-accent opacity-20 blur-3xl"></div>
        <h1 className="relative text-9xl font-black bg-clip-text text-transparent bg-linear-to-br from-white to-text-secondary">
          404
        </h1>
      </div>
      
      <h2 className="mt-8 text-3xl font-bold tracking-tight text-text-primary">Lost in the Mempool</h2>
      
      <p className="mt-4 text-lg text-text-muted max-w-md mx-auto">
        We couldn&apos;t find the transaction you&apos;re looking for. It might have been dropped, moved, or never existed.
      </p>
      
      <div className="mt-10">
        <Link 
          href="/" 
          className="inline-flex items-center justify-center rounded-xl bg-primary/10 border border-primary/30 px-8 py-4 text-sm font-semibold text-primary shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:bg-primary/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all duration-300 hover:scale-105 active:scale-95"
        >
          Return to App
        </Link>
      </div>
    </div>
  );
}
