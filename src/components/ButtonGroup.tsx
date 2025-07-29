import { JSX, children } from "solid-js";
import Button from "./Button";

interface ButtonGroupProps {
  children: JSX.Element;
  class?: string;
}

export default function ButtonGroup(props: ButtonGroupProps) {
  const buttons = children(() => props.children);
  
  return (
    <div 
      class={`inline-flex rounded-md shadow-sm ${props.class || ''}`}
      role="group"
    >
      {buttons()}
    </div>
  );
} 