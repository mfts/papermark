import { useLayoutEffect, useState } from "react";

import * as Portal from "@radix-ui/react-portal";

export default ({
  containerId,
  children,
}: {
  containerId?: string | null;
  children: React.ReactElement;
}) => {
  const [mounted, setMounted] = useState(false);
  useLayoutEffect(() => setMounted(true), []);

  return (
    <Portal.Root
      container={
        containerId && mounted
          ? document.getElementById(containerId)
          : undefined
      }
    >
      {children}
    </Portal.Root>
  );
};
