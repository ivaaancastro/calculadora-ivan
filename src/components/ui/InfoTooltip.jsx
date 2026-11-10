/** InfoTooltip (spec-rediseno-02-c2, 6.2; PR 7). La receta está en infoTooltipClasses.js. */
import { HelpCircle } from 'lucide-react';
import { INFO_TOOLTIP as C } from './infoTooltipClasses.js';

/** Icono de ayuda con una burbuja de texto encima. */
export function InfoTooltip({ text }) {
  return (
    <div className={C.root}>
      <HelpCircle size={11} className={C.icon} />
      <div className={C.bubble}>
        {text}
        <div className={C.arrow}></div>
      </div>
    </div>
  );
}
