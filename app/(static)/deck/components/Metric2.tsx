import { Dispatch, SetStateAction } from "react";

interface Metric2Props {
  metric2: number;
  setMetric2: Dispatch<SetStateAction<number>>;
}

export const Metric2 = ({ metric2, setMetric2 }: Metric2Props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMetric2(Number(event.target.value));
  };

  const styles = `
    input[type=range].guest-counter{
      appearance: none;
      width: 100%;
      height: 10px;
      border-radius: 5px;
      outline: none;
      transition: background 0.5s;
      background: linear-gradient(to right, #374151 0%, #374151 ${
        (metric2 / 50000) * 100
      }%, #D1D5DB ${(metric2 / 50000) * 100}%, #D1D5DB 100%);
    }
    input[type=range].guest-counter::-webkit-slider-thumb {
      appearance: none;
      height: 15px;
      width: 15px;
      border-radius: 50%;
      background: #111111; /* Thumb color */
      cursor: pointer;
    }
    input[type=range].guest-counter::-moz-range-thumb {
      appearance: none;
      height: 15px;
      width: 15px;
      border-radius: 50%;
      background: #c10573; 
      cursor: pointer;
    }
  `;

  return (
    <div className="slider-container">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <input
        className="guest-counter"
        type="range"
        min="100"
        max="50000"
        step="100"
        value={metric2}
        onChange={handleChange}
      />
      <div className="text-gray-500 text-xs absolute right-0 top-0 mt-[-1rem]">
        {metric2} users{" "}
      </div>
    </div>
  );
};
