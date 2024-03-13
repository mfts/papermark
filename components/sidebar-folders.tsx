import { useRouter } from "next/router";
import { FileTree } from "./ui/nextra-filetree";

export default function SidebarFolders() {
  const router = useRouter();
  return (
    <FileTree>
      <FileTree.Folder
        name="pages"
        defaultOpen
        active={router.query.name === "pages"}
      >
        <FileTree.File name="contact.md" />
        <FileTree.File name="index.mdx" />
        <FileTree.Folder name="about">
          <FileTree.File name="legal.md" />
          <FileTree.File name="index.mdx" />
          <FileTree.Folder name="pages">
            <FileTree.File name="legal.md" />
            <FileTree.File name="index.mdx" />
            <FileTree.Folder name="pages">
              <FileTree.File name="legal.md" />
              <FileTree.File name="index.mdx" />
              <FileTree.Folder name="pages">
                <FileTree.File name="legal.md" />
                <FileTree.File name="index.mdx" />
                <FileTree.Folder name="pages">
                  <FileTree.File name="legal.md" />
                  <FileTree.File name="index.mdx" />
                </FileTree.Folder>
              </FileTree.Folder>
            </FileTree.Folder>
          </FileTree.Folder>
        </FileTree.Folder>
      </FileTree.Folder>
      <FileTree.Folder name="pages">
        <FileTree.File name="legal.md" />
        <FileTree.File name="index.mdx" />
      </FileTree.Folder>
    </FileTree>
  );
}
