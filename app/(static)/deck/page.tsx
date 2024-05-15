"use client"; // Ensures this component is rendered on the client side

import { useEffect, useRef, useState } from "react";
import { Company } from "./components/Company";
import { Description } from "./components/Description";
import { Problem } from "./components/Problem";
import { Solution } from "./components/Solution";
import { BudgetCounter } from "./components/BudgetCounter";
import { Mrr } from "./components/Mrr";
import { Metric2 } from "./components/Metric2";
import { Users } from "./components/Users";
import { Community1 } from "./components/Community1";
import { Community } from "./components/Community";
import { Special2 } from "./components/Special2";
import { Special1 } from "./components/Special1";
import { Email } from "./components/Email";
import LoadingDots from "@/components/ui/loading-dots";

const DeckPage = () => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<string>("");
  const [media, setMedia] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [budget, setBudget] = useState<number>(100);
  const [solution, setSolution] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [problem, setProblem] = useState<string>("");
  const [users, setUsers] = useState<string>("");
  const [mrr, setMrr] = useState<string>("");
  const [metric2, setMetric2] = useState(100);
  const [community1, setCommunity1] = useState(100);
  const [community, setCommunity] = useState<string>("");
  const [special1, setSpecial1] = useState<string>("");
  const [special2, setSpecial2] = useState<string>("");

  // State to control the step of the form
  const [step, setStep] = useState(1);

  // Function to handle the Next button click
  const handleNextClick = () => {
    if (step < 5) {
      setStep(step + 1);
    }
  };

  const handlePreviousClick = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const setItem = (key: string, value: string) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "set", key, value },
      "https://shared.papermark.io",
    );
  };

  const saveData = () => {
    setLoading(true);
    setItem(
      "sharedKey",
      JSON.stringify({
        company,
        email,
        description,
        problem,
        solution,
        mrr,
        users,
        metric2,
        budget,
        community,
        community1,
        special1,
        special2,
      }),
    );

    setTimeout(() => {
      setLoading(false);

      window.location.href = "https://deck.papermark.io/loading";
    }, 2000);
  };

  // useEffect(() => {
  //   // Example usage
  //   const exampleData = JSON.stringify({
  //     company: "Papermark",
  //     email: "test@test.com",
  //     description:
  //       "Papermark is a platform that helps you create and share beautiful pitch decks.",
  //     problem:
  //       "Creating pitch decks is time-consuming and requires design skills.",
  //     solution:
  //       "Papermark provides a simple drag-and-drop interface to create beautiful pitch decks.",
  //     mrr: "10,000",
  //     users: "100",
  //     metric2: "10",
  //     budget: "10,000",
  //     community: "Papermark Community",
  //     community1: "Papermark Community",
  //     special1: "Special 1",
  //     special2: "Special 2",
  //   });
  //   setItem("sharedKey", exampleData);
  // }, []);

  return (
    <>
      <iframe
        ref={iframeRef}
        src="https://shared.papermark.io"
        style={{
          width: 0,
          height: 0,
          border: "none",
          position: "absolute",
        }}
      />
      <div>
        <section className="py-10 lg:py-36 bg-white">
          {/* bg-[url('/image1.svg')] */}
          <div className="px-4 0">
            <div className="max-w-5xl mx-auto ">
              <div className="w-full mx-auto ">
                <div className="flex flex-col md:flex-row w-full md:space-x-20 ">
                  <div className="flex flex-col w-full  md:w-1/2 mt-4 md:mt-0 ">
                    <h1 className="text-5xl md:text-7xl text-balance">
                      Pitch Deck AI Generator
                    </h1>

                    <p className="text-2xl mt-2 text-balance max-w-3xl">
                      Instantly create pitch deck and share via trackable link
                    </p>

                    <p className="text-sm mt-2 text-balance max-w-3xl text-gray-500">
                      Inspired by the coolest
                      <button
                        className="ml-2 bg-gray-100 text-black px-2 py-1 rounded-3xl hover:bg-gray-200"
                        onClick={() =>
                          window.open(
                            "https://midday.ai/pitch",
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        Midday Deck
                      </button>
                    </p>

                    {/* <h2 className="text-lg font-normal mt-3 mb-4 text-pink-600">
                      Deck example link
                      <br />
                    </h2> */}

                    {/* <Accordion sections={sections} /> */}
                    {/* <div className="my-4">
                      <Link
                        href={"/"}
                        className="bg-pink-600 font-medium text-xs rounded-md w-full text-pink-700 px-4 py-2 hover:bg-purple-400 disabled:bg-purple-500 bg-opacity-20"
                      >
                        See wedding plan example
                      </Link>
                    </div> */}
                  </div>

                  <div className="flex flex-col w-full md:w-1/2 mt-4 md:mt-0 ">
                    <div className="bg-white p-4 md:p-6 shadow rounded-lg">
                      <p className="text-sm my-2 mx-1 font-normal text-balance max-w-3xl">
                        Fill quick steps in 1 minute
                      </p>
                      {/* Fields and buttons based on the step */}
                      <div className="flex justify-between w-full">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <div
                            key={index}
                            className={`w-1/4 h-2 mx-1 rounded-full overflow-hidden ${
                              index < step ? "bg-orange-500" : "bg-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      {step === 1 && (
                        <>
                          <h3 className="mt-6 font-semibold text-gray-700 text-base">
                            What is your startup name?
                          </h3>

                          <div className="w-full my-1  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <Company
                                  company={company}
                                  setCompany={setCompany}
                                />
                              </div>
                            </div>
                          </div>
                          <h3 className="mt-4  py-1 font-semibold text-gray-700 text-base">
                            What is one line description?
                          </h3>
                          <div className="w-full my-1  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <Description
                                  description={description}
                                  setDescription={setDescription}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="my-4">
                            <button
                              onClick={handleNextClick}
                              className="bg-black text-base rounded-md w-full text-white px-4 py-2 hover:bg-orange-600"
                            >
                              To step 2 →
                            </button>
                          </div>
                        </>
                      )}
                      {step === 2 && (
                        <>
                          <div className="w-full mt-6 mx-auto">
                            <h3 className="text-sm my-1 font-semibold text-gray-700">
                              What problem you solve?
                            </h3>

                            <div className="w-full my-1 mx-auto">
                              <div className="flex justify-between space-x-2">
                                <div className="grow">
                                  <Problem
                                    problem={problem}
                                    setProblem={setProblem}
                                  />
                                </div>
                              </div>
                            </div>

                            <h3 className="text-sm mt-4 py-1 font-semibold text-gray-700">
                              How this solutions helps to solve the problem?
                            </h3>

                            <Solution
                              solution={solution}
                              setSolution={setSolution}
                            />
                          </div>

                          <div className="my-4">
                            <button
                              onClick={handleNextClick}
                              className="bg-black text-base rounded-md w-full text-white px-4 py-2 hover:bg-orange-600"
                            >
                              To step 3
                            </button>
                          </div>
                        </>
                      )}
                      {step === 3 && (
                        <>
                          <h3 className="text-sm  mt-4  py-1 font-semibold text-gray-700">
                            What are your current metrics?
                          </h3>
                          <h3 className="text-xs  mt-1  py-1 font-normal text-gray-500">
                            Revenue/MRR
                          </h3>
                          <div className="w-full  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <BudgetCounter
                                  budget={budget}
                                  setBudget={setBudget}
                                />
                              </div>
                            </div>
                          </div>
                          <div className=" ">
                            {" "}
                            <Mrr mrr={mrr} setMrr={setMrr} />
                          </div>

                          <h3 className="text-xs  mt-4  py-1 font-normal text-gray-500">
                            Users
                          </h3>
                          <div className="w-full  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <Metric2
                                  metric2={metric2}
                                  setMetric2={setMetric2}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="w-full  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <Users users={users} setUsers={setUsers} />
                              </div>
                            </div>
                          </div>
                          <div className="my-4">
                            <button
                              onClick={handleNextClick}
                              className="bg-black text-base rounded-md w-full text-white px-4 py-2 hover:bg-orange-600"
                            >
                              To step 3 →
                            </button>
                          </div>
                        </>
                      )}
                      {step === 4 && (
                        <>
                          <h3 className="text-sm  mt-4  py-1 font-semibold text-gray-700">
                            Two more please
                          </h3>
                          <h3 className="text-xs  mt-1  py-1 font-normal text-gray-500">
                            Community
                          </h3>

                          <div className="w-full mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <Community1
                                  community1={community1}
                                  setCommunity1={setCommunity1}
                                />
                              </div>
                            </div>
                          </div>
                          <div>
                            {" "}
                            <Community
                              community={community}
                              setCommunity={setCommunity}
                            />
                          </div>

                          <h3 className="text-xs  mt-4  py-1 font-normal text-gray-500">
                            Your core metric specific to your businness
                          </h3>
                          <div className="w-full  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="w-1/3 pr-2">
                                {/* This div takes 1/3 of the space */}
                                <Special2
                                  special2={special2}
                                  setSpecial2={setSpecial2}
                                />
                              </div>
                              <div className="w-2/3 ">
                                {" "}
                                {/* This div takes 2/3 of the space */}
                                <Special1
                                  special1={special1}
                                  setSpecial1={setSpecial1}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="my-4">
                            <button
                              onClick={handleNextClick}
                              className="bg-black text-base rounded-md w-full text-white px-4 py-2 hover:bg-orange-600"
                            >
                              To last step →
                            </button>
                          </div>
                        </>
                      )}
                      {step === 5 && (
                        <>
                          <h3 className="mt-6 font-semibold text-gray-700 text-base">
                            What email to contact on the deck? (we not saving
                            your email)
                          </h3>

                          <div className="w-full my-1  mx-auto">
                            <div className="flex justify-between space-x-2">
                              <div className="grow">
                                <Email email={email} setEmail={setEmail} />
                              </div>
                            </div>
                          </div>
                          {/* <button onClick={handlePreviousClick} className="...">
                            Previous
                          </button> */}
                          <div className="my-4">
                            <button
                              disabled={loading}
                              onClick={saveData}
                              className="bg-black text-base rounded-md w-full text-white px-4 py-2 hover:bg-orange-600"
                            >
                              {loading && <LoadingDots color="white" />}
                              {!loading && `Get my pitch deck`}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default DeckPage;
