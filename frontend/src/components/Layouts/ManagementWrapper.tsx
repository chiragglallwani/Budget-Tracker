import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type ManagementWrapperProps = {
  onClick: () => void;
  title: string;
  buttonText: string;
  children: React.ReactNode;
};
export default function ManagementWrapper({
  onClick,
  title,
  buttonText,
  children,
}: ManagementWrapperProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold">{title}</h3>
        <Button variant="theme" onClick={onClick}>
          <Plus className="h-4 w-4" />
          {buttonText}
        </Button>
      </div>
      {children}
    </div>
  );
}
