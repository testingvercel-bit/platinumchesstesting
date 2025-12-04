export default function Bg({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#111111]">
      {children}
    </div>
  );
}
