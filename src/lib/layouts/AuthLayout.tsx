type Props = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: Props) => {
  return (
    <div className="h-screen flex bg-gray-100">
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
