import { Spinner } from "@/components/ui/spinner";

/*
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

 */

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex min-h-[calc(100vh-300px)] flex-col">
      <div className="mb-[-75px] text-center text-[30px]">Loading</div>
      <Spinner />
    </div>
  );
}
