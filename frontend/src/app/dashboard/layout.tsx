import Sidebar from "@/components/sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-64 p-6">
        {children}
      </div>
    </div>
  );
}
