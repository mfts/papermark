import * as React from "react";

import * as PortalPrimitive from "@radix-ui/react-portal";

const Portal = ({
  containerId,
  children,
}: {
  containerId?: string | null;
  children: React.ReactElement;
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <PortalPrimitive.Root
      container={
        containerId && mounted
          ? document.getElementById(containerId)
          : undefined
      }
    >
      {children}
    </PortalPrimitive.Root>
  );
};
Portal.displayName = PortalPrimitive.Root.displayName;

export { Portal };
