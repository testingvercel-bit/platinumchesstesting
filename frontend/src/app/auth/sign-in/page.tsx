import { SignIn } from "@clerk/nextjs";
import Bg from "@/components/Bg";

export default function SignInPage() {
  return (
    <Bg>
      <div className="min-h-screen flex items-center justify-center px-4">
        <SignIn />
      </div>
    </Bg>
  );
}
