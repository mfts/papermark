import { Dispatch, SetStateAction } from "react";

interface Community1Props {
  community1: number;
  setCommunity1: Dispatch<SetStateAction<number>>;
}

export const Community1 = ({ community1, setCommunity1 }: Community1Props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCommunity1(Number(event.target.value));
  };

  const filledPercentage = (community1 / 50000) * 100;

  const styles = `
    .slider-container {
      position: relative;
      width: 100%;
    }
    .slider-label {
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      top: -20px; /* adjust as needed */
      font-size: 0.75rem; /* example size */
      color: #374151; /* example color */
    }
    input[type=range].community-counter {
      -webkit-appearance: none;
      width: 100%;
      height: 10px;
      border-radius: 5px;
      outline: none;
      background: #D1D5DB; /* Unfilled part remains light grey */
      background: linear-gradient(to right, #374151 0%, #374151 ${filledPercentage}%, #D1D5DB ${filledPercentage}%, #D1D5DB 100%);
    }
    input[type=range].community-counter::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 15px;
      width: 15px;
      border-radius: 50%;
      background: #111111; /* Thumb color */
      cursor: pointer;
    }
    input[type=range].community-counter::-moz-range-thumb {
      appearance: none;
      height: 15px;
      width: 15px;
      border-radius: 50%;
      background: #c10573; /* Thumb color */
      cursor: pointer;
    }
  `;

  return (
    <div className="slider-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <input
        className="community-counter"
        type="range"
        min="100"
        max="50000"
        step="100"
        value={community1}
        onChange={handleChange}
      />
      <div className="text-gray-500 text-xs absolute right-0 top-0 mt-[-1rem]">
        {community1} people
      </div>
    </div>
  );
};
