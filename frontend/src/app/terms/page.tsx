import type { Metadata } from "next";
import Link from "next/link";
import Bg from "@/components/Bg";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description: "Terms and Conditions for PlatinumChess.",
};

export default function TermsPage() {
  return (
    <Bg>
      <div className="px-4 md:px-0 w-[min(92vw,800px)] mx-auto py-12 text-neutral-200">
        <div className="mb-8">
          <Link href="/" className="text-sm text-neutral-400 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">Terms and Conditions</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Account & Eligibility</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
              <li>
                <strong className="text-neutral-100">Age Requirements:</strong> Users under 18 must have parental or guardian consent. Platinum Chess may request proof of age or consent at any time.
              </li>
              <li>
                <strong className="text-neutral-100">Registration:</strong> Users must register an account to access the platform and are responsible for all activity under that account.
              </li>
              <li>
                <strong className="text-neutral-100">Security:</strong> Login credentials must be kept confidential; sharing accounts is strictly prohibited.
              </li>
              <li>
                <strong className="text-neutral-100">Accuracy:</strong> Users must provide accurate information during registration and keep it updated.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Fees and Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
              <li>
                <strong className="text-neutral-100">Verification Fee:</strong> A fee is required for account registration.
              </li>
              <li>
                <strong className="text-neutral-100">Refund Policy:</strong> This fee is <strong className="text-white">non-refundable</strong>, regardless of whether the account is used, suspended, terminated, or voluntarily closed.
              </li>
              <li>
                <strong className="text-neutral-100">Payment Scope:</strong> This verification fee is the only payment required by the platform.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">User Conduct and Fair Play</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
              <li>
                <strong className="text-neutral-100">Prohibited Behavior:</strong> Cheating, hacking, using bots/scripts, manipulating gameplay, and exploiting vulnerabilities are strictly forbidden.
              </li>
              <li>
                <strong className="text-neutral-100">Interactions:</strong> Harassment, unsportsmanlike behavior, and disrupting other users&apos; experiences are prohibited.
              </li>
              <li>
                <strong className="text-neutral-100">Disciplinary Actions:</strong> Platinum Chess may investigate suspicious behavior and issue warnings, temporary suspensions, or permanent account bans.
              </li>
              <li>
                <strong className="text-neutral-100">Appeals:</strong> Users can appeal account actions within <strong className="text-white">7 days</strong>, though the platform&apos;s decisions are final.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Legal and Data Policies</h2>
            <ul className="list-disc pl-5 space-y-2 text-neutral-300">
              <li>
                <strong className="text-neutral-100">Governing Law:</strong> These terms are governed by the laws of <strong className="text-white">South Africa</strong>.
              </li>
              <li>
                <strong className="text-neutral-100">Data Rights:</strong> Users can request the deletion of personal data in accordance with South African law.
              </li>
              <li>
                <strong className="text-neutral-100">Liability:</strong> The platform is provided &quot;as is,&quot; and Platinum Chess is not liable for technical failures, hacking incidents, or disputes between users.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </Bg>
  );
}
