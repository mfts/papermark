import { Label } from "../ui/label";
import { MultiSelect } from "../ui/multi-select-v1";

interface SelectFieldProps {
  label: string;
  options: { label: string; value: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <Label className="opacity-80">{label}</Label>
      <MultiSelect
        value={value}
        options={options}
        onValueChange={onChange}
        placeholder={placeholder}
        variant="inverted"
        animation={0}
        maxCount={3}
        className="[&_svg]:size-4"
      />
    </div>
  );
};

export default SelectField;
