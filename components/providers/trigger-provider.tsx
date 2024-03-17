import { TriggerProvider } from "@trigger.dev/react";

export const TriggerCustomProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  if (!process.env.NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY) {
    return <>{children}</>;
  }

  return (
    <TriggerProvider
      publicApiKey={process.env.NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY}
    >
      {children}
    </TriggerProvider>
  );
};
