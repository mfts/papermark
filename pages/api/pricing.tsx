// import { useEffect, useState } from "react";
// import "./App.css";

/*
    NOTE: DO NOT PUSH TO CODEBASE
    A simple page to calculate pricing based on user inputs
    Check the figma file here: https://www.figma.com/design/XSJTbBuormBLtVjFd8fhhd/Untitled?node-id=4-222&t=P7SmrYzw9fmmyL7R-1
*/

// function App() {
//   const [dataRoomsNeeded, setDataRoomsNeeded] = useState(false);
//   const [featuresNeeded, setFeaturesNeeded] = useState(false);
//   const [users, setUsers] = useState(2);
//   const [plan, setPLan] = useState("Pro");
//   const [cost, setCost] = useState(29);
//   const [billingType, setBillingType] = useState("monthly");

//   const calculatePlan = () => {
//     if (!dataRoomsNeeded) setPLan("Pro");

//     else if (!featuresNeeded) {
//       setPLan("Business");
//       if (users < 3) setUsers("3")
//     }

//     else {
//       setPLan("Data Rooms")
//       if (users < 3) setUsers("3")
//     };
//   };

//   const calculateCost = () => {
//     if (plan == "Pro") setCost(29 + 15 * (users - 2))
//     else if (plan == "Business") setCost(59 + 25 * (users - 3))
//     else setCost(99 + 35 * (users - 3))
//   };

//   useEffect(() => {
//     calculatePlan()
//     calculateCost()
//   }, [dataRoomsNeeded, featuresNeeded, users]);

//   const handleDataRoomsNeeded = (e) => {
//     if (e.target.value == "Yes") {
//       setDataRoomsNeeded(true);
//     } else {
//       setDataRoomsNeeded(false);
//       setFeaturesNeeded(false);
//     }
//   };

//   const handleFeaturesNeeded = (e) => {
//     e.target.value == "Yes"
//       ? setFeaturesNeeded(true)
//       : setFeaturesNeeded(false);
//   };

//   return (
//     <>
//       <h3 className="text-3xl font-bold underline">Do You Need Data Rooms</h3>
//       <input
//         type="button"
//         id="needDataRooms"
//         name="needDataRooms"
//         value="Yes"
//         onClick={handleDataRoomsNeeded}
//       />
//       <input
//         type="button"
//         id="needDataRooms"
//         name="needDataRooms"
//         value="No"
//         onClick={handleDataRoomsNeeded}
//       />

//       {dataRoomsNeeded && (
//         <div>
//           <h3 className="text-3xl font-bold underline">
//             Do You Need Any Of the Following features?
//           </h3>
//           <p>
//             Unlimited Data Rooms, Custom Domain for Data Rooms, NDA Agreement
//           </p>
//           <input
//             type="button"
//             id="needFeatures"
//             name="needFeatures"
//             value="Yes"
//             onClick={handleFeaturesNeeded}
//           />
//           <input
//             type="button"
//             id="needFeatures"
//             name="needFeatures"
//             value="No"
//             onClick={handleFeaturesNeeded}
//           />
//         </div>
//       )}

//       <h3>How many users</h3>
//       <label htmlFor="noOfUsers">Users</label>
//       <input
//         type="range"
//         id="noOfUsers"
//         name="noOfUsers"
//         max="30"
//         min="2"
//         defaultValue={users}
//         onChange={(e) => {
//           setUsers(e.target.value);
//         }}
//       />
//       <p>{users}</p>

//       <h2>Plan: {plan}</h2>
//       <h2>Cost: €{cost}/month</h2>
//       <p>Billed {billingType}</p>
//     </>
//   );
// }

// export default App;
