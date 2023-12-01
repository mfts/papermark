import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { STAGGER_CHILD_VARIANTS } from "@/lib/constants"
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useState, Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

enum Sources{
  Google = 'Google', 
  Accelerator = 'Accelerator', 
  ChatGPT = 'ChatGPT', 
  WordOfMouth = 'Word of mouth/friends', 
  Twitter = 'Twitter', 
  Linkedin = 'Linkedin', 
  Other = 'Other'
};

enum Accelerator{
  YCombinator = 'Y-Combinator', 
  Techstars = 'Techstars', 
  AngelPad = 'AngelPad', 
  SeedCamp = 'SeedCamp',
  Other = 'Other'
}

export default function ReferralSource() {

  const router = useRouter();

  const [source, setSource] = useState('Select source');
  const [other, setOther] = useState('');

  const [accelerator, setAccelerator] = useState('Select accelerator');

  return (
    <motion.div
      className="z-10"
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      <motion.div
        variants={{
          show: {
            transition: {
              staggerChildren: 0.2,
            },
          },
        }}
        initial="hidden"
        animate="show"
        className="mx-5 flex flex-col items-center space-y-10 text-center sm:mx-auto"
      >
        <motion.h1
          className="font-display text-4xl font-bold text-foreground transition-colors sm:text-5xl"
          variants={STAGGER_CHILD_VARIANTS}
        >
          Where did you hear about{" "}
          <span className="font-bold tracking-tighter">Papermark</span>
        </motion.h1>
        <motion.p
          className="max-w-md text-accent-foreground/80 transition-colors sm:text-lg"
          variants={STAGGER_CHILD_VARIANTS}
        >
          <ReferralSourceDropdown source={source} setSource={setSource} setOther={setOther} accelerator={accelerator} setAccelerator={setAccelerator}/>
        </motion.p>
        <motion.div
          variants={STAGGER_CHILD_VARIANTS}
          // className="rounded  px-10 py-2 font-medium transition-colors text-gray-900 bg-gray-100 hover:text-gray-100 hover:bg-gray-500"
        >
          <Button className="px-10 font-medium text-base"
            onClick={async () => {
                let sourceData : String;
                if(source==Sources.Other){
                  sourceData = source+" : "+other;
                }
                else if(source==Sources.Accelerator){
                  sourceData = source+" : "+accelerator;
                }
                else{
                  sourceData = source;
                }
                const response = await fetch('/api/user/save_user_referral_source',{
                  method: 'POST',
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    referralSource: sourceData,
                  })
                });
                if(response.status==200){
                  router.push({
                    pathname: "/welcome",
                    query: {
                      type: "next",
                    },
                  })
                }
              }
            }
          >
            Next
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}



function classNames(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

function ReferralSourceDropdown({source, setSource, setOther, accelerator, setAccelerator}:any){

  const referralSourcesValues = Object.values(Sources);

  return (
    <div style={{display:'flex'}}>
      <Menu as="div" className="relative inline-block text-left">
        <div>
          <Menu.Button className="inline-flex min-w-[170px] justify-center gap-x-1.5 rounded-md bg-white px-5 py-2 text-base font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            {source}
            <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
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
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {referralSourcesValues.map((value)=>(
                <Menu.Item>
                  {({ active }) => (
                    <a
                      onClick={()=>{setSource(value as Sources)}}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block px-4 py-2 text-sm'
                      )}
                    >
                      {value}
                    </a>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
      &nbsp;&nbsp;
      {source==Sources.Other && <Input placeholder="Please specify.." onChange={(e)=>{setOther(e.target.value)}}/>}
      {source==Sources.Accelerator && <AcceleratorDropdown accelerator={accelerator} setAccelerator={setAccelerator}/>}
    </div>    
  )
}

function AcceleratorDropdown({accelerator, setAccelerator}:any){

  const acceleratorValues = Object.values(Accelerator);
  
  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex min-w-[170px] justify-center gap-x-1.5 rounded-md bg-white px-5 py-2 text-base font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
          {accelerator}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
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
          <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {acceleratorValues.map((value)=>(
                <Menu.Item>
                  {({ active }) => (
                    <a
                      onClick={()=>{setAccelerator(value as Accelerator)}}
                      className={classNames(
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                        'block px-4 py-2 text-sm'
                      )}
                    >
                      {value}
                    </a>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
      </Transition>
    </Menu>
  );
}