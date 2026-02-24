import Header from "./Header";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-gray-50 pb-16 sm:pb-0">
            <Header />
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
            <BottomNav />
        </div>
    );
}
