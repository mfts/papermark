import { Dispatch, Fragment, SetStateAction } from "react";

import { Menu, Transition } from "@headlessui/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

interface DropDownProps {
  options: string[];
  option: string;
  setOption: Dispatch<SetStateAction<string>>;
}

export default function DropDown({
  options,
  option,
  setOption,
}: DropDownProps) {
  return (
    <Menu as="div" className="relative block w-full text-left">
      <div>
        <Menu.Button className="inline-flex w-full items-center justify-between rounded-md border border-black bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none">
          {option}
          <ChevronDownIcon
            className="-mr-1 ml-2 h-5 w-5 ui-open:hidden"
            aria-hidden="true"
          />
          <ChevronUpIcon
            className="-mr-1 ml-2 hidden h-5 w-5 ui-open:block"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="absolute left-0 z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          key={option}
        >
          <div className="">
            {options.map((optionItem) => (
              <Menu.Item key={optionItem}>
                {({ active }) => (
                  <button
                    onClick={() => setOption(optionItem)}
                    className={classNames(
                      active ? "bg-gray-100 text-gray-900" : "text-gray-700",
                      option === optionItem ? "bg-gray-200" : "",
                      "flex w-full items-center justify-between space-x-2 px-4 py-2 text-left text-sm",
                    )}
                  >
                    <span>{optionItem}</span>
                    {option === optionItem ? (
                      <CheckIcon className="text-bold h-4 w-4" />
                    ) : null}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
