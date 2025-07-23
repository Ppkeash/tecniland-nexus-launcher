import { ComponentType } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Componente de orden superior que inyecta la función `navigate` de React
 * Router para poder utilizarla en componentes de clase.
 */

export const withRouter = <P extends object>(Component: ComponentType<P>) => {
  const Wrapper = (props: P) => {
    const navigate = useNavigate();

    return <Component navigate={navigate} {...props} />;
  };

  return Wrapper;
};
