import { JSX } from "solid-js";

interface CardProps {
  header?: JSX.Element | string;
  children: JSX.Element;
  footer?: JSX.Element | string;
  class?: string;
}

export default function Card(props: CardProps) {
  const renderHeader = () => {
    if (!props.header) return null;
    return typeof props.header === 'string' ? (
      <div class="text-xl font-semibold text-gray-900">{props.header}</div>
    ) : props.header;
  };

  const renderFooter = () => {
    if (!props.footer) return null;
    return typeof props.footer === 'string' ? (
      <div class="text-sm text-gray-500">{props.footer}</div>
    ) : props.footer;
  };

  return (
    <div class={`bg-white rounded-lg shadow-md overflow-hidden ${props.class || ''}`}>
      {props.header && (
        <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
          {renderHeader()}
        </div>
      )}

      <div class="px-4 py-5 sm:p-6">
        {props.children}
      </div>

      {props.footer && (
        <div class="px-4 py-4 sm:px-6 border-t border-gray-200">
          {renderFooter()}
        </div>
      )}
    </div>
  );
} 