export const HistorySideBar = () => {
  return (
    <div className="h-screen w-xl text-white bg-black border-x border-gray-700 p-4 text-start space-y-3">
      <h3 className="text-xl">Version History</h3>
      <div className="flex items-start gap-2 border border-[#82defc] rounded-md p-2">
        <img src="/1.png" alt="imga" className="w-30 object-cover rounded-sm" />
        <div>
            <span className="text-[#82defc] text-xl">Version 1 (Current)</span>
            <p className="text-md">Refine NeonBackground</p>
        </div>
      </div>
    </div>
  );
};
