import Image from "next/image";

export default function Logo({ size = 160 }: { size?: number }) {
  return (
    <Image src="/logo.png" alt="logo" width={size} height={size} priority />
  );
}
