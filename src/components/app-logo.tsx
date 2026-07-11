import Image from 'next/image';
import config from '@/config';

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** School logo from `public/logo.png` (shared with mobile `assets/logo.png`). */
export function AppLogo({ size = 48, className = '', priority = false }: AppLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={`${config.appName} logo`}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
