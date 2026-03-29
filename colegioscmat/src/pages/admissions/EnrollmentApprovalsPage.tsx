import { EnrollmentApplicationsList } from '../../components/admissions/EnrollmentApplicationsList';
import { CheckSquare } from 'lucide-react';
import { GoBackButton } from '../../components/ui/GoBackButton';

export function EnrollmentApprovalsPage() {
  return (
    <div className="space-y-6">
      <GoBackButton />
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cermat-blue-dark/10 rounded-lg">
              <CheckSquare className="w-6 h-6 text-cermat-blue-dark" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-cermat-blue-dark">Solicitudes de Matrícula</h1>
              <p className="text-slate-600">Revisa y aprueba las solicitudes de matrícula</p>
            </div>
          </div>
        </div>
      </div>

      <EnrollmentApplicationsList />
    </div>
  );
}
