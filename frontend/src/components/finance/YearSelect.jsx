import { currentStartYear } from "../../utils/finance";

// The year picker: next school year back to four years ago.
const YearSelect = ({ value, onChange }) => {
  const years = Array.from({ length: 6 }, (_, i) => currentStartYear() + 1 - i);
  return (
    <select className="input-field !w-auto" value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {years.map((y) => (
        <option key={y} value={y}>{y}-{y + 1}</option>
      ))}
    </select>
  );
};

export default YearSelect;
