/**
 * Loading Spinner Component
 * Componente de loading reutilizable
 */

'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`animate-spin rounded-full border-4 border-gray-200 ${sizeClasses[size]}`}>
        <div className="border-t-4 border-blue-600 rounded-full" />
      </div>
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}

export function PageLoading({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 space-y-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}
