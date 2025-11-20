import { cn } from "@/lib/utils";
import CountUp from "react-countup";
type AnimateNumbersProps = {
  targetNumber: number;
  duration: number;
  title: string;
  className?: string;
};

export default function AnimateNumbers({
  targetNumber,
  duration,
  title,
  className,
}: AnimateNumbersProps) {
  return (
    <div className="flex-1">
      <h3 className="text-3xl font-bold mb-4">{title}</h3>
      <div
        className={cn(
          "text-5xl font-bold flex items-center gap-2 h-[250px] justify-center bg-gray-300 rounded-md",
          className
        )}
      >
        <CountUp
          start={0}
          prefix="&#8377; "
          decimals={2}
          end={targetNumber}
          duration={duration}
          useEasing
        />
      </div>
    </div>
  );
}
