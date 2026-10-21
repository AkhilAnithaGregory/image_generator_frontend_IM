type Props = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="min-h-screen w-full flex bg-[#080b12] overflow-y-auto">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
