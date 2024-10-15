// import { useState } from "react";
// import * as SliderPrimitive from "@radix-ui/react-slider";
// import { Button } from "@/components/ui/button";
// import { useEffect } from "react";

/*
    NOTE: NOT MEAN TO BE ADDED IN CODEBASE.
    A simple page to calculate pricing based on user inputs
    Check the figma file here: https://www.figma.com/design/XSJTbBuormBLtVjFd8fhhd/Untitled?node-id=4-222&t=P7SmrYzw9fmmyL7R-1
*/

// export default function PricingPlan() {
//   const [selectedPlan, setSelectedPlan] = useState("Business");
//   const [needDataRooms, setNeedDataRooms] = useState(false);
//   const [needAdditionalFeatures, setNeedAdditionalFeatures] = useState(false);
//   const [userCount, setUserCount] = useState(2);

//   const plans = [
//     { name: "Pro", price: 29 },
//     { name: "Business", price: 59 },
//     { name: "Data Rooms", price: 99 },
//   ];

//   const calculateTotal = () => {
//     if (selectedPlan == "Pro") return 29 + 15 * (userCount - 2);
//     else if (selectedPlan == "Business") return 59 + 25 * (userCount - 3);
//     else return 99 + 35 * (userCount - 3);
//   };

//   const calculatePlan = () => {
//     if (!needDataRooms) {
//       setSelectedPlan("Pro");
//     } else if (!needAdditionalFeatures) {
//       if (userCount < 3) setUserCount(3);
//       setSelectedPlan("Business");
//     } else {
//       if (userCount < 3) setUserCount(3);
//       setSelectedPlan("Data Rooms");
//     }
//   };

//   const setPlan = (plan: string) => {
//     setSelectedPlan(plan)

//     if(plan == "Pro"){
//       setNeedDataRooms(false)
//       setNeedAdditionalFeatures(false)
//     }

//     if(plan == "Business") {
//       setNeedDataRooms(true)
//       setNeedAdditionalFeatures(false)
//     }

//     if(plan == "Data Rooms") {
//       setNeedDataRooms(true)
//       setNeedAdditionalFeatures(true)
//     }

//     if((plan == 'Business' || plan == "Data Rooms") && userCount < 3) setUserCount(3)
//   }

//   useEffect(() => {
//     calculatePlan()
//   }, [needDataRooms, needAdditionalFeatures, selectedPlan])

//   return (
//     <div className="max-w-7xl mx-auto font-sans">
//       <div className="lg:flex lg:min-h-screen">
//         <div className="lg:flex-grow p-6">
//           <h1 className="text-7xl font-normal mb-8 w-5/6">
//             Let us help you choose a plan
//           </h1>

//           <div className="bg-orange-500 text-white p-6 grid grid-cols-3 gap-4 mb-8">
//             {plans.map((plan) => (
//               <div
//                 key={plan.name}
//                 className={`p-4 rounded-xl transition-colors ${
//                   selectedPlan === plan.name
//                     ? "bg-orange-600"
//                     : "hover:bg-orange-600/50 cursor-pointer"
//                 }`}
//                 onClick={() => setPlan(plan.name)}
//               >
//                 <h2 className="text-2xl mb-2">{plan.name}</h2>
//                 <p className="text-sm">from</p>
//                 <p className="text-4xl">€{plan.price}</p>
//               </div>
//             ))}
//           </div>

//           <div className="mb-8">
//             <h2 className="text-2xl font-semibold mb-4 underline">Services</h2>
//             <div className="border p-4 mb-4">
//               <div className="flex justify-between items-center mb-2">
//                 <h3 className="font-semibold">Do you need Data Rooms?</h3>
//                 <div className="flex gap-2">
//                   <Button
//                     onClick={() => {
//                       setNeedDataRooms(true);
//                     }}
//                     className={`px-6 py-1 text-sm rounded-xl ${
//                       needDataRooms || selectedPlan === "data rooms"
//                         ? "bg-black text-white"
//                         : "bg-gray-200 text-gray-800"
//                     }`}
//                   >
//                     Yes
//                   </Button>
//                   <Button
//                     onClick={() => {
//                       setNeedDataRooms(false);
//                     }}
//                     className={`px-6 py-1 text-sm rounded-xl ${
//                       !needDataRooms && selectedPlan !== "data rooms"
//                         ? "bg-black text-white"
//                         : "bg-gray-200 text-gray-800"
//                     }`}
//                   >
//                     No
//                   </Button>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-600">
//                 Data rooms are available on business plans and above
//               </p>
//             </div>
//             <div className="border p-4 mb-4">
//               <div className="flex justify-between items-center mb-2">
//                 <h3 className="font-semibold">
//                   Do you need any of these features?
//                 </h3>
//                 <div className="flex gap-2">
//                   <Button
//                     onClick={() => setNeedAdditionalFeatures(true)}
//                     className={`px-6 py-1 text-sm rounded-xl ${
//                       needAdditionalFeatures
//                         ? "bg-black text-white"
//                         : "bg-gray-200 text-gray-800"
//                     }`}
//                     disabled={!needDataRooms}
//                   >
//                     Yes
//                   </Button>
//                   <Button
//                     onClick={() => setNeedAdditionalFeatures(false)}
//                     className={`px-6 py-1 text-sm rounded-xl ${
//                       !needAdditionalFeatures
//                         ? "bg-black text-white"
//                         : "bg-gray-200 text-gray-800"
//                     }`}
//                     disabled={!needDataRooms}
//                   >
//                     No
//                   </Button>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-600">
//                 Unlimited Data Rooms, Custom Domain for Data Rooms, NDA
//                 Agreement
//               </p>
//             </div>
//           </div>

//           <div className="mb-8">
//             <h2 className="text-lg font-normal mb-4">
//               How many users will be collaborating?
//             </h2>
//             <SliderPrimitive.Root
//               className="relative flex items-center select-none touch-none w-full h-5"
//               value={[userCount]}
//               onValueChange={(value) => setUserCount(value[0])}
//               max={20}
//               min={2}
//               step={1}
//             >
//               <SliderPrimitive.Track className="bg-gray-200 relative grow rounded-full h-1">
//                 <SliderPrimitive.Range className="absolute bg-black rounded-full h-full" />
//               </SliderPrimitive.Track>
//               <SliderPrimitive.Thumb className="block w-5 h-5 bg-black rounded-full focus:outline-none focus-visible:ring focus-visible:ring-black focus-visible:ring-opacity-75" />
//             </SliderPrimitive.Root>
//             <div className="flex justify-between mt-0 text-sm">
//               <span>2</span>
//               <span>8</span>
//               <span>12</span>
//               <span>14</span>
//               <span>20</span>
//             </div>
//             <p className="text-center mt-4">Selected: {userCount} users</p>
//           </div>
//         </div>

//         <div className="lg:w-96 lg:flex-shrink-0 bg-gray-900 text-white p-6 lg:flex lg:flex-col lg:justify-end lg:min-h-screen">
//           <div className="text-right">
//             <h2 className="text-2xl mb-2">Your total</h2>
//             <p className="text-8xl font-normal">€{calculateTotal()}</p>
//             <p className="text-sm opacity-40">/per month (billed annually)</p>
//             <p className="text-sm opacity-40 underline cursor-pointer">
//               billed monthly
//             </p>
//             <Button className="text-white px-8 py-3 mt-6 w-full">
//               Choose{" "}
//               {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}{" "}
//               Plan
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
