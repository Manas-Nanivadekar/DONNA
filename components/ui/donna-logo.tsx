export function DonnaLogo({ className }: { className?: string }) {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
            >
                {/* Square */}
                <rect x="0" y="8" width="20" height="20" fill="currentColor" />
                {/* Triangle */}
                <path d="M22 8 L40 8 L22 26 Z" fill="currentColor" />
                {/* Circle */}
                <circle cx="30" cy="30" r="10" fill="currentColor" />
            </svg>
            <span className="font-serif text-3xl font-bold tracking-widest text-white">
                DONNA
            </span>
        </div>
    );
}
