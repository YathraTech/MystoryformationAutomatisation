export default function PartenaireAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-violet-50 p-4">
      {children}
    </div>
  );
}
