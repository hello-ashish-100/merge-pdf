export interface ErrorMessageProps {
  message: string | null;
}

export const ErrorMessage = ({ message }: ErrorMessageProps) => {
  if (!message) return null;

  return (
    <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
};
