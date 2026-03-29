import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface ModuleSquareProps {
    title: string;
    description: string;
    icon: LucideIcon;
    path: string;
    color: string;
    onClick?: () => void;
    className?: string; // Additional classes
    style?: React.CSSProperties; // Inline styles (useful for animation delays)
}

export function ModuleSquare({ title, description, icon: Icon, path, onClick, className = '', style }: ModuleSquareProps) {
    return (
        <Link
            to={path}
            onClick={onClick}
            style={style}
            className={`group relative flex flex-col items-center justify-center p-8 h-64 w-full 
                     bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-xl
                     hover:bg-cermat-blue-dark/90 hover:scale-[1.02] hover:border-cermat-blue-light/50
                     transition-all duration-300 shadow-xl overflow-hidden ${className}`}
        >
            {/* Decoration circle subtle background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-cermat-blue-light/20 transition-colors" />

            <div className="flex flex-col items-center text-center z-10 space-y-6">
                {/* Icon Container - Large & Outline style like reference */}
                <div className="p-4 rounded-2xl border-2 border-white/20 group-hover:border-cermat-blue-light bg-transparent transition-colors duration-300">
                    <Icon className="w-16 h-16 text-white stroke-[1.5]" />
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white tracking-wider uppercase group-hover:text-cermat-blue-light transition-colors">
                        {title}
                    </h3>
                    {/* Description is kept but made subtle, or can be hidden if strict adherence to reference is needed. 
                        Reference has NO description, only TITLE. I'll make it very subtle. */}
                    <p className="text-xs text-gray-300 font-medium max-w-[200px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 absolute bottom-4 left-0 right-0 mx-auto">
                        {description}
                    </p>
                </div>
            </div>
        </Link>
    );
}
