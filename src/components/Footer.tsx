
import { Link } from 'react-router-dom'
import { LogoIcon } from './Logo'

const Footer = () => {
  return (
    <footer className="w-full py-stack-lg bg-background border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-margin-desktop w-full max-w-container-max mx-auto gap-stack-md">
        <div className="flex flex-col items-center md:items-start gap-stack-sm">
          <Link to="/" className="flex items-center gap-2 group">
            <LogoIcon size={24} className="transition-transform duration-300 group-hover:scale-105" />
            <span className="font-headline-md text-headline-md font-bold text-white tracking-tighter">
              Crowdfund<span className="text-[#84cc16]">X</span>
            </span>
          </Link>
          <p className="font-label-md text-label-md text-on-surface-variant">
            © 2024 CrowdfundX. Powered by Stellar.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-stack-md font-body-md text-body-md">
          <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#docs">
            Documentation
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#privacy">
            Privacy Policy
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#terms">
            Terms of Service
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#explorer">
            Stellar Explorer
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
