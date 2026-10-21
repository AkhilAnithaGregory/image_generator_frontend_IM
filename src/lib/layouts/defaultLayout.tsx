import Sidebar from "@/components/common/sidebar";

type Props = {
  children: React.ReactNode;
};

const DefaultLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden bg-[#080b12]">
      <Sidebar />
      <div className="flex-1 h-full pb-14 md:pb-0 md:pl-14 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

export default DefaultLayout;
