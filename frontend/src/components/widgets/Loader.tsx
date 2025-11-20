import { Spinner } from "@/components/ui/spinner";

export const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <Spinner />
    </div>
  );
};
