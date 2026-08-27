import Swal, { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

/**
 * Configuración estética estilo iOS Premium para SweetAlert2.
 * Las clases .ios-swal-* estan definidas globalmente en src/styles.css
 * (el popup de SweetAlert2 se monta en <body>, fuera del componente).
 *
 * Uso:
 *   fireIosSwal({ icon: 'success', title: 'Listo', text: '...' });
 *   // o manualmente: Swal.fire({ ...IOS_SWAL_STYLES, ...opciones })
 */
export const IOS_SWAL_STYLES: SweetAlertOptions = {
  customClass: {
    popup: 'ios-swal-popup',
    title: 'ios-swal-title',
    htmlContainer: 'ios-swal-html',
    confirmButton: 'ios-swal-confirm',
    cancelButton: 'ios-swal-cancel',
    denyButton: 'ios-swal-deny',
    closeButton: 'ios-swal-close-button',
  },
};

export function fireIosSwal(options: SweetAlertOptions): Promise<SweetAlertResult> {
  return Swal.fire({ ...IOS_SWAL_STYLES, ...options } as SweetAlertOptions);
}
