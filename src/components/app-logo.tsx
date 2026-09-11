import Image from 'next/image';
import config from '@/config';

type AppLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** School logo from `public/bgless.png`. */
export function AppLogo({ size = 48, className = '', priority = false }: AppLogoProps) {
  return (
    <Image
      src="/bgless.png"
      alt={`${config.appName} logo`}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
