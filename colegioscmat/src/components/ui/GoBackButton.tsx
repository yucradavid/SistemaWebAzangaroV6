import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

export function GoBackButton() {
    const navigate = useNavigate();

    return (
        <Button
            variant="ghost"
            className="mb-4 pl-0 hover:pl-2 transition-all gap-2 text-cermat-blue-dark hover:text-cermat-blue-light hover:bg-blue-50/50"
            onClick={() => navigate('/dashboard')}
        >
            <ArrowLeft className="w-5 h-5" />
            Volver al Panel
        </Button>
    );
}
