export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-container-low flex relative overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary-container/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[15%] w-[50%] h-[50%] bg-secondary-container/30 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] bg-primary-container/10 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #00677e 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
