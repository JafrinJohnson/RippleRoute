import Link from "next/link";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-2xl font-black mb-4">
        404
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">Page Not Found / பக்கம் கிடைக்கவில்லை</h2>
      <p className="text-sm text-muted max-w-md mb-6">
        The requested routing node or control view does not exist in the KovaiSwift network.
      </p>
      <Link href="/">
        <Button variant="primary" size="md" className="btn-hover">
          Return to Mission Control
        </Button>
      </Link>
    </div>
  );
}
