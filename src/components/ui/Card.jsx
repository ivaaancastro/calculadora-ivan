import React from 'react';

/**
 * Card — Una sola receta de card del sistema de diseño.
 * Una caja, fondo un paso fuera de la página, hairline 1px, padding generoso.
 * linked: si tiene enlace, levanta 2px en hover (motion layer).
 * nolift: si no tiene enlace, no se mueve.
 */
export const Card = ({
  children,
  className = '',
  linked = false,
  nolift = false,
  ...props
}) => {
  return (
    <div
      className={`card ${linked ? '' : 'card--nolift'} ${nolift ? 'card--nolift' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardBody = ({ children, className = '' }) => (
  <div className={`card__body ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`card__title ${className}`}>{children}</h3>
);

export const CardText = ({ children, className = '' }) => (
  <p className={`card__text ${className}`}>{children}</p>
);
