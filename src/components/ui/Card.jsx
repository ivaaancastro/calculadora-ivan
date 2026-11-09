/** Card y SectionHeader (spec-rediseno-02-c2, 6.2; PR 1). Las recetas están en cardClasses.js. */
import { cx } from './cx.js';
import { cardClass, SECTION_HEADER } from './cardClasses.js';

export function Card({ as: Tag = 'div', variant = 'grouped', pressable = false, divided = false, className, children, ...rest }) {
  return (
    <Tag className={cx(cardClass({ variant, pressable, divided }), className)} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionHeader({ as: Tag = 'div', className, children, ...rest }) {
  return (
    <Tag className={cx(SECTION_HEADER, className)} {...rest}>
      {children}
    </Tag>
  );
}
