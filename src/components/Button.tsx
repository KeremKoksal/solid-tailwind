import { JSX, splitProps } from "solid-js";

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'white' | 'circular' | 'rounded';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonShape = 'default' | 'circular' | 'rounded';

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  leadingIcon?: () => JSX.Element;
  trailingIcon?: () => JSX.Element;
  fullWidth?: boolean;
  isGrouped?: boolean;
  groupPosition?: 'first' | 'middle' | 'last' | 'single';
}

const variantStyles = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600',
  secondary: 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
  soft: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
  white: 'bg-white text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
  circular: 'bg-purple-600 text-white hover:bg-purple-500 focus-visible:outline-purple-600',
  rounded: 'bg-purple-600 text-white hover:bg-purple-500 focus-visible:outline-purple-600',
};

const sizeStyles = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-base',
};

const paddingStyles = {
  default: {
    xs: 'px-2 py-1',
    sm: 'px-2 py-1',
    md: 'px-2.5 py-1.5',
    lg: 'px-3 py-2',
    xl: 'px-3.5 py-2.5',
  },
  rounded: {
    xs: 'px-3 py-1',
    sm: 'px-3.5 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-5 py-2.5',
    xl: 'px-6 py-3',
  },
  circular: {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
    xl: 'p-3',
  },
};

const shapeStyles = {
  default: 'rounded-md',
  circular: 'rounded-full',
  rounded: 'rounded-full',
};

const iconSizeStyles = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
};

function getGroupedBorderRadius(position: ButtonProps['groupPosition']) {
  switch (position) {
    case 'first':
      return 'rounded-l-md';
    case 'last':
      return 'rounded-r-md';
    case 'middle':
      return 'rounded-none';
    case 'single':
    default:
      return 'rounded-md';
  }
}

export default function Button(props: ButtonProps) {
  const [local, buttonProps] = splitProps(props, [
    'variant',
    'size',
    'shape',
    'leadingIcon',
    'trailingIcon',
    'fullWidth',
    'isGrouped',
    'groupPosition',
    'class',
    'children'
  ]);

  const variant = local.variant || 'primary';
  const size = local.size || 'md';
  const shape = local.shape || 'default';
  const iconSize = iconSizeStyles[size];

  const isCircular = shape === 'circular';
  const showOnlyIcon = isCircular && (local.leadingIcon || local.trailingIcon) && !local.children;

  return (
    <button
      {...buttonProps}
      class={`
        inline-flex items-center justify-center ${!showOnlyIcon ? 'gap-x-2' : ''} font-semibold
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${paddingStyles[shape][size]}
        ${local.isGrouped ? '-ml-px' : shapeStyles[shape]}
        ${local.fullWidth ? 'w-full' : ''}
        ${local.class || ''}
      `}
    >
      {local.leadingIcon && (
        <span class={`inline-flex ${showOnlyIcon ? iconSize : iconSizeStyles[size]}`}>
          {local.leadingIcon()}
        </span>
      )}
      {(!isCircular || !showOnlyIcon) && local.children}
      {local.trailingIcon && !showOnlyIcon && (
        <span class={`inline-flex ${iconSizeStyles[size]}`}>
          {local.trailingIcon()}
        </span>
      )}
    </button>
  );
} 