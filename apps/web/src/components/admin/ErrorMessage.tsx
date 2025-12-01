interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
      <p className="text-red-400">{message}</p>
    </div>
  );
}
