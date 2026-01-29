export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Dashboard Header, Sidenav, and Footer will be imported here */}
      {children}
    </div>
  );
}
