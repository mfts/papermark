import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { useRouter } from "next/router";
import { Dispatch } from "react";
import { ActionType } from "./state-management";
import useDocuments from "@/lib/swr/use-documents";
import { useEffect } from "react";
import { LinkWithViews, DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ChevronDown from "@/components/shared/icons/chevron-down";
import { toast } from "sonner";
import { useTeam } from "@/context/team-context";

export default function AddFileModal({
  children,
  updateFolderDirectory,
  parentFolderId,
}: {
  children: React.ReactNode,
  updateFolderDirectory: Dispatch<ActionType>,
  parentFolderId: string,
}) {
  //Current selection from drop-down meu
  const [selectedDocumentName, setSelectedDocumentName] = useState<string>("");
  const [selectedLink, setSelectedLink] = useState<{ name: string, url: string }>({ name: "", url: "" });
  const [loading, setLoading] = useState<boolean>(false);
  //Current document title
  const [documentTitle, setDocumentTitle] = useState<string>("");
  //Messages
  const [errorMessage, setErrorMessage] = useState<string>("");
  //Modal open
  const [open, setOpen] = useState<boolean>(false);

  //Dropdown menu documents
  const { documents } = useDocuments();
  const router = useRouter();
  const teamInfo = useTeam();
  const [links, setLinks] = useState<LinkWithViews[]>([]);
  const [dropDownMenuDocuments, setDropDownMenuDocuments] = useState<DocumentWithLinksAndLinkCountAndViewCount[]>([])
  useEffect(() => { setDropDownMenuDocuments(documents ? documents : []) }, [documents])

  //No documents / out of documents error
  useEffect(() => {
    if (dropDownMenuDocuments.length === 0) {
      setErrorMessage("No documents found, please upload a document to create a data room");
    } else {
      setErrorMessage("");
    }
  }, [dropDownMenuDocuments.length]);

  //Current selected documents and link for the document
  const handleDocumentSelection = async (currentSelectedDocument: string) => {
    //Assign current selection and default title
    setSelectedDocumentName(currentSelectedDocument);
    setDocumentTitle(currentSelectedDocument.split(".")[0]);
    const id: string = documents?.find(obj => obj.name === currentSelectedDocument)?.id || "";
    //Fetch links related to documents
    const response = await fetch(`/api/documents/${encodeURIComponent(id)}/links`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setLinks(data);
    setSelectedLink({
      name: data[0].name, url: createURL(data[0])
    })
  };

  //Includes documents into data room
  const handleDocumentInclusion = async (event: any) => {
    if (selectedDocumentName === "") {
      setErrorMessage("Please select a document");
      return;
    }
    if (selectedLink.url === "") {
      setErrorMessage("Please select a link");
      return;
    }
    if (documentTitle === "") {
      setErrorMessage("Title cannot be blank");
      return;
    }

    setLoading(true);
    const { dataroomId, path } = router.query as { dataroomId: string, path: string[] };
    const body = { 
      fileName: documentTitle, 
      dataroomId, 
      parentFolderId: path[path.length - 1], 
      url: selectedLink.url, 
      teamId: teamInfo?.currentTeam?.id 
    }
    const response = await fetch(`/api/datarooms/hierarchical/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      setLoading(false);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setLoading(false);
    const file = (await response.json()).file;
    //Update folder directory locally
    updateFolderDirectory({ type: "CREATE FILE", parentFolderId: path[path.length - 1], file });

    toast.success("File included successfully");
    //Reset modal's state variables
    setSelectedDocumentName("");
    setSelectedLink({ name: "", url: "" });
    setDocumentTitle("");
    setLinks([]);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="text-foreground bg-background">
        <DialogHeader>
          <DialogTitle>Add document to data room</DialogTitle>
          <DialogDescription>
            <div className="border-b border-border py-2  mt-3">
              <p className="mb-1 text-sm text-muted-foreground font-bold mb-3">
                Select Document
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  {/* Display the currently selected name */}
                  <span className="flex items-center w-full justify-between">
                    <span aria-hidden="true">{selectedDocumentName || 'Select a document'}</span>
                    <ChevronDown
                      className="ml-2 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </span>

                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[526px]" align="start" loop={true} >
                  {dropDownMenuDocuments.map((document) => (
                    <DropdownMenuItem
                      key={document.name}
                      onSelect={() => { handleDocumentSelection(document.name) }}
                      className="hover:bg-gray-200 hover:dark:bg-muted"
                    >
                      {document.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
            <div className="border-b border-border py-2  mt-3">
              <p className="mb-1 text-sm text-muted-foreground font-bold mb-3">
                Select Link
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <span className="flex items-center w-full justify-between">
                    <span aria-hidden="true">{
                      selectedLink.url ?
                        (selectedLink.name ? `${selectedLink.name}: ${selectedLink.url}` : selectedLink.url)
                        : 'Select a link'}</span>
                    <ChevronDown
                      className="ml-2 h-5 w-5 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </span>

                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[526px]" align="start" loop={true} >
                  {links &&
                    links.map((link) => (
                      <DropdownMenuItem
                        key={link.name}
                        onSelect={() => {
                          setSelectedLink({
                            name: link.name || "", url: createURL(link)
                          })
                        }}
                        className="hover:bg-gray-200 hover:dark:bg-muted"
                      >
                        {link.name ? `${link.name}: ` : ""}
                        {createURL(link)}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
            <div className="border-b border-border py-2  mt-3">
              <p className="mb-1 text-sm text-muted-foreground font-bold mb-3">
                Title for document
              </p>
              <Input
                className="mb-3"
                placeholder={"Title to display from data room..."}
                defaultValue={selectedDocumentName.split(".")[0]}
                onChange={(e) => { setDocumentTitle(e.target.value) }}></Input>
            </div>
            <p className="mb-1 text-sm font-red text-muted-foreground font-bold mb-1 mt-2">
              {errorMessage ? <p className="text-red-500">{errorMessage}</p> : <br />}
            </p>
            <div className="flex justify-center">
              <Button
                type="button"
                className="w-full lg:w-1/2 mt-3"
                disabled={dropDownMenuDocuments.length ? false : true}
                loading={loading}
                onClick={handleDocumentInclusion}
              >
                Add Document
              </Button>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

function createURL(link: LinkWithViews) {
  return link.domainId
    ? `https://${link.domainSlug}/${link.slug}`
    : `https://${process.env.NEXT_PUBLIC_ROOT_DOMAIN}/view/${link.id}` || "";
}