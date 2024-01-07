import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  DocumentIcon,
  PresentationChartBarIcon,
} from "@heroicons/react/24/outline";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants";
import { AddHierarchicalDataroomModal } from "./hierarchical/add-hierarchical-dataroom-modal";
import { AddPagedDataroomModal } from "./paged/add-paged-dataroom-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FolderStructureIcon from "../shared/icons/folder-structure";
import SinglePageIcon from "../shared/icons/single-page";
export default function SelectDataroomTypeModal({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="text-foreground bg-background">
          <DialogHeader>
            <DialogDescription>
              <motion.div
                className="z-10 mx-5 flex flex-col items-center space-y-10 text-center sm:mx-auto"
                variants={{
                  hidden: { opacity: 0, scale: 0.95 },
                  show: {
                    opacity: 1,
                    scale: 1,
                    transition: {
                      staggerChildren: 0.2,
                    },
                  },
                }}
                initial="hidden"
                animate="show"
                exit="hidden"
                transition={{ duration: 0.3, type: "spring" }}
              >
                <motion.div
                  variants={STAGGER_CHILD_VARIANTS}
                  className="flex flex-col items-center space-y-10 text-center"
                >
                  <h1 className="font-display max-w-md text-3xl font-semibold transition-colors sm:text-3xl">
                    Which type of dataroom would you prefer to create?
                  </h1>
                </motion.div>
                <motion.div
                  variants={STAGGER_CHILD_VARIANTS}
                  className="grid w-full grid-cols-1 divide-y divide-border text-foreground rounded-md border border-border md:grid-cols-2 md:divide-x"
                >
                  {/* <AddHierarchicalDataroomModal>
                    <button className="flex flex-col items-center justify-center overflow-hidden p-5 space-y-5 transition-colors hover:bg-gray-200 hover:dark:bg-gray-800 md:p-10 min-h-[200px]">
                      <FolderStructureIcon className="h-auto  pointer-events-none w-16 sm:w-16" />
                      <p>Hierarchical</p>
                    </button>
                  </AddHierarchicalDataroomModal> */}
                  <AddPagedDataroomModal>
                    <button className="flex flex-col items-center justify-center overflow-hidden p-5 space-y-5 transition-colors hover:bg-gray-200 hover:dark:bg-gray-800 md:p-10 min-h-[200px]">
                      <SinglePageIcon className="h-auto  pointer-events-none w-16 sm:w-16" />
                      <p>Single-Page (Linktree)</p>
                    </button>
                  </AddPagedDataroomModal>
                </motion.div>
              </motion.div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
