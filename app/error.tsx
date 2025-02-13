"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <button
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => reset()}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
