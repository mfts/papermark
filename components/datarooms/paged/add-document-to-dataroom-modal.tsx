import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "../../ui/dropdown-menu";
import ChevronDown from "@/components/shared/icons/chevron-down";
import useDocuments from "@/lib/swr/use-documents";
import { type DataroomDocument } from "@/lib/types";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { LinkWithViews } from "@/lib/types";

export function AddDocumentToDataRoomModal(
  {
    children,
    dataRoomDocuments,
    setDataRoomDocuments
  }: {
    children: React.ReactNode,
    dataRoomDocuments: DataroomDocument[],
    setDataRoomDocuments: (dataRooms: DataroomDocument[]) => void
  }) {
  //Current selection from drop-down meu
  const [selectedName, setSelectedName] = useState<string>("");
  const [selectedLink, setSelectedLink] = useState<{ name: string, url: string }>({ name: "", url: "" });
  //Current document title
  const [documentTitle, setDocumentTitle] = useState<string>("");
  //Messages
  const [errorMessage, setErrorMessage] = useState<string>("");
  //Modal open
  const [open, setOpen] = useState<boolean>(false);

  //Dropdown menu documents
  const { documents } = useDocuments();
  const [links, setLinks] = useState<LinkWithViews[]>([]);
  const [dropDownMenuDocuments, setDropDownMenuDocuments] = useState<DocumentWithLinksAndLinkCountAndViewCount[]>(
    documents ?
      (documents
        .filter((document =>
          !dataRoomDocuments.some((dataRoomDocument) =>
            dataRoomDocument.id === document.id))))
      : []
  )

  //Filter documents already included in data room
  useEffect(() => {
    setDropDownMenuDocuments(
      documents ?
        (documents
          .filter((document =>
            !dataRoomDocuments.some((dataRoomDocument) =>
              dataRoomDocument.id === document.id))))
        : []
    );
  }, [dataRoomDocuments]);

  //No documents / out of documents error
  useEffect(() => {
    if (dropDownMenuDocuments.length === 0) {
      if (dataRoomDocuments.length === 0) {
        setErrorMessage("No documents found, please upload a document to create a data room");
      } else {
        setErrorMessage("Out of documents, please upload a new document to add in data room");
      }
    } else {
      setErrorMessage("");
    }
  }, [dropDownMenuDocuments.length]);

  //Current selected documents and link for the document
  const handleDocumentSelection = async (currentSelectedDocument: string) => {
    //Assign current selection and default title
    setSelectedName(currentSelectedDocument);
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
  const handleDocumentInclusion = (event: any) => {
    if (selectedName === "") {
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
    const updatedropDownMenuDocuments = dropDownMenuDocuments
      .filter((dropDownMenuDocument) => !(dropDownMenuDocument.name === selectedName));

    const chosenDocument = documents?.find(obj => obj.name === selectedName);

    setDropDownMenuDocuments(updatedropDownMenuDocuments);
    setDataRoomDocuments([...dataRoomDocuments,
    {
      url: selectedLink.url,
      title: documentTitle,
      type: chosenDocument?.type || "",
      id: chosenDocument?.id || ""
    }]);

    //Reset modal's state variables
    setSelectedName("");
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
                    <span aria-hidden="true">{selectedName || 'Select a document'}</span>
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
                defaultValue={selectedName.split(".")[0]}
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