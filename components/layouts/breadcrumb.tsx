import Link from "next/link";
import { useRouter } from "next/router";

import { useMemo } from "react";

import { BreadcrumbComponent as DataroomBreadcrumb } from "@/components/datarooms/dataroom-breadcrumb";
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useDataroom } from "@/lib/swr/use-dataroom";
import { useDocument } from "@/lib/swr/use-document";
import { useFolderWithParents } from "@/lib/swr/use-folders";
import useViewer from "@/lib/swr/use-viewer";

const FOLDERS_TO_DISPLAY = 1; // Only show the last folder in the path

const SingleDocumentBreadcrumb = () => {
  const { document } = useDocument();
  const { folders } = useFolderWithParents({
    name: document?.folder?.path ? [document.folder.path] : [],
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/documents">Documents</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {folders && folders.length > FOLDERS_TO_DISPLAY ? (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {folders.slice(0, -1).map((folder, index) => (
                    <DropdownMenuItem key={index}>
                      <Link
                        href={`/documents/tree${folder.path}`}
                        className="w-full"
                      >
                        {folder.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/documents/tree${folders[folders.length - 1].path}`}
                  className="max-w-[200px] truncate"
                >
                  {folders[folders.length - 1].name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator key={`sep-last`} />
          </>
        ) : (
          folders?.map((folder, index) => (
            <>
              <BreadcrumbItem key={`item-${index}`}>
                <BreadcrumbLink asChild>
                  <Link
                    href={`/documents/tree${folder.path}`}
                    className="max-w-[200px] truncate"
                  >
                    {folder.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator key={`sep-${index}`} />
            </>
          ))
        )}
        {document && (
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[200px] truncate">
              {document.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const SingleDataroomBreadcrumb = ({ path }: { path: string }) => {
  const { dataroom } = useDataroom();

  const title = useMemo(() => {
    switch (path) {
      case "/datarooms/[id]/documents":
        return "Documents";
      case "/datarooms/[id]/settings":
        return "Settings";
      case "/datarooms/[id]/branding":
        return "Branding";
      case "/datarooms/[id]/permissions":
      case "/datarooms/[id]/groups":
      case "/datarooms/[id]/groups/[groupId]":
      case "/datarooms/[id]/groups/[groupId]/permissions":
      case "/datarooms/[id]/groups/[groupId]/members":
      case "/datarooms/[id]/groups/[groupId]/links":
        return "Permissions";
      case "/datarooms/[id]/analytics":
        return "Analytics";
      case "/datarooms/[id]/conversations":
        return "Conversations";
      default:
        return dataroom?.name || "Loading...";
    }
  }, [path, dataroom]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/datarooms">Datarooms</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/datarooms/${dataroom?.id}/documents`}>
              {dataroom?.name}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const SettingsBreadcrumb = () => {
  const router = useRouter();
  const path = router.pathname;

  const settingsTitle = useMemo(() => {
    switch (path) {
      case "/settings/general":
        return "General";
      case "/settings/people":
        return "People";
      case "/settings/domains":
        return "Domains";
      case "/settings/presets":
        return "Presets";
      case "/settings/billing":
        return "Billing";
      case "/settings/tokens":
        return "API Tokens";
      case "/settings/webhooks":
        return "Webhooks";
      case "/settings/incoming-webhooks":
        return "Incoming Webhooks";
      case "/settings/branding":
        return "Branding";
      default:
        return "Settings";
    }
  }, [path]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/settings/general">Settings</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{settingsTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const AccountBreadcrumb = () => {
  const router = useRouter();
  const path = router.pathname;

  const accountTitle = useMemo(() => {
    switch (path) {
      case "/account/general":
        return "General";
      case "/account/security":
        return "Security";
      default:
        return "Account";
    }
  }, [path]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/account/general">Account</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{accountTitle}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const DocumentsBreadcrumb = () => {
  const router = useRouter();
  const { name } = router.query as { name: string[] };

  const { folders } = useFolderWithParents({ name });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/documents">Documents</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {folders && folders.length > 2 ? (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1">
                  <BreadcrumbEllipsis className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {folders.slice(0, -2).map((folder, index) => (
                    <DropdownMenuItem key={index}>
                      <Link
                        href={`/documents/tree${folder.path}`}
                        className="w-full"
                      >
                        {folder.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={`/documents/tree${folders[folders.length - 2].path}`}
                  className="max-w-[200px] truncate"
                >
                  {folders[folders.length - 2].name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[200px] truncate">
                {folders[folders.length - 1].name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          folders?.map((folder, index) => (
            <>
              <BreadcrumbItem key={`item-${index}`}>
                {index === folders.length - 1 ? (
                  <BreadcrumbPage className="max-w-[200px] truncate">
                    {folder.name}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={`/documents/tree${folder.path}`}
                      className="max-w-[200px] truncate"
                    >
                      {folder.name}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < folders.length - 1 && <BreadcrumbSeparator />}
            </>
          ))
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const VisitorsBreadcrumb = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/visitors">Visitors</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const SingleVisitorBreadcrumb = () => {
  const { viewer } = useViewer();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/visitors">Visitors</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="max-w-[200px] truncate">
            {viewer?.email || "Loading..."}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

const AnalyticsBreadcrumb = () => {
  const router = useRouter();
  const { type = "links" } = router.query;

  const title = useMemo(() => {
    switch (type) {
      case "links":
        return "Links";
      case "documents":
        return "Documents";
      case "visitors":
        return "Visitors";
      case "views":
        return "Recent Visits";
      default:
        return "Analytics";
    }
  }, [type]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/dashboard?interval=7d&type=links">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{title}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export const AppBreadcrumb = () => {
  const router = useRouter();
  const path = router.pathname;
  const { id } = router.query as {
    id?: string;
  };

  const breadcrumb = useMemo(() => {
    // Analytics routes
    if (path === "/dashboard") {
      return <AnalyticsBreadcrumb />;
    }

    // Settings routes
    if (path.startsWith("/settings")) {
      return <SettingsBreadcrumb />;
    }

    // Account routes
    if (path.startsWith("/account")) {
      return <AccountBreadcrumb />;
    }

    // Root documents route
    if (path === "/documents") {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Documents</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }

    // Document tree routes
    if (path === "/documents/tree/[...name]") {
      return <DocumentsBreadcrumb />;
    }

    // Single document route
    if (path === "/documents/[id]" && id) {
      return <SingleDocumentBreadcrumb />;
    }

    // Dataroom document routes
    if (path === "/datarooms/[id]/documents" && id) {
      return <DataroomBreadcrumb />;
    }

    // Dataroom document routes
    if (path === "/datarooms/[id]/documents/[...name]" && id) {
      return <DataroomBreadcrumb />;
    }

    // Single dataroom route
    if (path.startsWith("/datarooms/[id]") && id) {
      return <SingleDataroomBreadcrumb path={path} />;
    }

    // Root datarooms route
    if (path === "/datarooms") {
      return (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Datarooms</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      );
    }

    // Root visitors route
    if (path === "/visitors") {
      return <VisitorsBreadcrumb />;
    }

    // Single visitor route
    if (path === "/visitors/[id]" && id) {
      return <SingleVisitorBreadcrumb />;
    }

    return null;
  }, [path, id]);

  return breadcrumb;
};
