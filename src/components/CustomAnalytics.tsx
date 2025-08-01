import { FC, useEffect } from 'react';

/**
 * Componente CustomAnalytics
 * Este componente não faz nada quando hospedado no Render para evitar erros 404
 * Caso você queira implementar analytics no Render, você pode adicionar aqui
 */
const CustomAnalytics: FC = () => {
  useEffect(() => {
    // Verificar se estamos hospedados no Vercel
    const isVercel = window.location.hostname.includes('vercel.app');
    
    // Se estiver hospedado no Vercel, então podemos carregar o script do Analytics do Vercel
    if (isVercel) {
      // Aqui você poderia dinamicamente carregar o script do Vercel Analytics
      // Mas como não estamos no Vercel, não fazemos nada
    }
    
    // Se quiser implementar outra solução de analytics como Google Analytics ou Plausible
    // você pode adicionar o código aqui
  }, []);
  
  return null; // Este componente não renderiza nada visualmente
};

export default CustomAnalytics; 