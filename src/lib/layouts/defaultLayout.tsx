import Sidebar from "@/components/common/sidebar";

type Props = {
  children: React.ReactNode;
};

const DefaultLayout = ({ children }: Props) => {
  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="pl-16 flex-1 h-full">{children}</div>
    </div>
  );
};

export default DefaultLayout;
