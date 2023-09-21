import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import { Fragment, useState } from "react";
import { Button } from "../ui/button";
import ImportFromGoogleDrive from "./google-drive";

export default function IntegrationDropdown() {
  const [uploading, setUploading] = useState<boolean>(false);

  return (
    <Menu as={"div"} className="relative grow">
      <Menu.Button as="div">
        <Button variant={"outline"} loading={uploading}>
          Import Document
          <span>
            <ChevronDownIcon
              className="ml-2 h-5 w-5 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
        </Button>
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 top-0 mt-12 w-full origin-top-left rounded-md bg-gray-100 dark:bg-secondary py-2 focus:outline-none">
          <Menu.Item>{({ active }) => <ImportFromGoogleDrive />}</Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
