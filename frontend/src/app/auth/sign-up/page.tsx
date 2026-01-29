import { SignUp } from "@clerk/nextjs";
import Bg from "@/components/Bg";

export default function SignUpPage() {
  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center px-4">
        <SignUp />
      </div>
    </Bg>
  );
}
